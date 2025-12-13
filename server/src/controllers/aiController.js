/**
 * AI Controller
 * Sprint 7-8: Route handlers for AI chat functionality
 */

const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { buildUserContext, createContextSnapshot } = require('../services/ai/contextBuilder');
const { getSystemPrompt, formatFinancialContext } = require('../services/ai/promptTemplates');
const { streamToSSE, generateTitle, sendMessage } = require('../services/ai/claudeClient');
const { incrementUsage, getUsageStats } = require('../services/ai/rateLimiter');

/**
 * GET /api/ai/conversations
 */
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT id, title, message_count, last_message_at, created_at, updated_at
     FROM ai_conversations 
     WHERE user_id = $1 
     ORDER BY updated_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM ai_conversations WHERE user_id = $1`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      conversations: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    }
  });
});

/**
 * POST /api/ai/conversations
 */
const createConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title = 'New Conversation' } = req.body;

  const result = await query(
    `INSERT INTO ai_conversations (user_id, title)
     VALUES ($1, $2)
     RETURNING id, title, message_count, created_at`,
    [userId, title]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * GET /api/ai/conversations/:id
 */
const getConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const convResult = await query(
    `SELECT id, title, message_count, last_message_at, created_at
     FROM ai_conversations 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (convResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  const messagesResult = await query(
    `SELECT id, role, content, tokens_used, created_at
     FROM ai_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...convResult.rows[0],
      messages: messagesResult.rows
    }
  });
});

/**
 * DELETE /api/ai/conversations/:id
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    `DELETE FROM ai_conversations 
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  res.json({
    success: true,
    message: 'Conversation deleted'
  });
});

/**
 * PATCH /api/ai/conversations/:id
 */
const updateConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }

  const result = await query(
    `UPDATE ai_conversations 
     SET title = $1
     WHERE id = $2 AND user_id = $3
     RETURNING id, title, updated_at`,
    [title, id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * POST /api/ai/chat
 * Send a message and stream the AI response
 */
const chat = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversationId, message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  let convId = conversationId;
  let isNewConversation = false;

  if (!convId) {
    const convResult = await query(
      `INSERT INTO ai_conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, 'New Conversation']
    );
    convId = convResult.rows[0].id;
    isNewConversation = true;
  } else {
    const convCheck = await query(
      `SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [convId, userId]
    );
    if (convCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
  }

  const context = await buildUserContext(userId);
  const contextSnapshot = createContextSnapshot(context);

  const historyResult = await query(
    `SELECT role, content FROM ai_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC
     LIMIT 20`,
    [convId]
  );

  const systemPrompt = getSystemPrompt({
    user: context.user,
    financialHealth: context.financialHealth,
    hasCompletedQuestionnaire: !!context.questionnaire?.completed_at
  });

  const messages = [];
  
  if (historyResult.rows.length === 0) {
    const financialContext = formatFinancialContext(context);
    messages.push({
      role: 'user',
      content: `[Financial Context]\n${financialContext}\n\n[User Message]\n${message}`
    });
  } else {
    messages.push(...historyResult.rows);
    messages.push({ role: 'user', content: message });
  }

  await query(
    `INSERT INTO ai_messages (conversation_id, role, content, context_snapshot)
     VALUES ($1, 'user', $2, $3)`,
    [convId, message, contextSnapshot]
  );

  const streamResult = await streamToSSE(res, systemPrompt, messages);

  if (streamResult.success) {
    await query(
      `INSERT INTO ai_messages (conversation_id, role, content, tokens_used)
       VALUES ($1, 'assistant', $2, $3)`,
      [convId, streamResult.content, streamResult.usage?.totalTokens || 0]
    );

    await incrementUsage(userId, streamResult.usage?.totalTokens || 0);

    if (isNewConversation && message.length > 5) {
      const title = await generateTitle(message);
      await query(
        `UPDATE ai_conversations SET title = $1 WHERE id = $2`,
        [title, convId]
      );
    }
  }
});

/**
 * GET /api/ai/context
 */
const getContext = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const context = await buildUserContext(userId);
  const formattedContext = formatFinancialContext(context);

  res.json({
    success: true,
    data: {
      raw: context,
      formatted: formattedContext,
      snapshot: createContextSnapshot(context)
    }
  });
});

/**
 * GET /api/ai/quota
 */
const getQuota = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const stats = await getUsageStats(userId);

  res.json({
    success: true,
    data: stats
  });
});

/**
 * POST /api/ai/chat/simple
 * Non-streaming chat endpoint
 */
const chatSimple = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversationId, message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  let convId = conversationId;

  if (!convId) {
    const convResult = await query(
      `INSERT INTO ai_conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, 'New Conversation']
    );
    convId = convResult.rows[0].id;
  }

  const context = await buildUserContext(userId);
  const contextSnapshot = createContextSnapshot(context);

  const historyResult = await query(
    `SELECT role, content FROM ai_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC
     LIMIT 20`,
    [convId]
  );

  const systemPrompt = getSystemPrompt({
    user: context.user,
    financialHealth: context.financialHealth,
    hasCompletedQuestionnaire: !!context.questionnaire?.completed_at
  });

  const messages = [];
  if (historyResult.rows.length === 0) {
    const financialContext = formatFinancialContext(context);
    messages.push({
      role: 'user',
      content: `[Financial Context]\n${financialContext}\n\n[User Message]\n${message}`
    });
  } else {
    messages.push(...historyResult.rows);
    messages.push({ role: 'user', content: message });
  }

  await query(
    `INSERT INTO ai_messages (conversation_id, role, content, context_snapshot)
     VALUES ($1, 'user', $2, $3)`,
    [convId, message, contextSnapshot]
  );

  const response = await sendMessage(systemPrompt, messages);

  if (!response.success) {
    return res.status(500).json({
      success: false,
      message: 'AI request failed',
      error: response.error
    });
  }

  await query(
    `INSERT INTO ai_messages (conversation_id, role, content, tokens_used)
     VALUES ($1, 'assistant', $2, $3)`,
    [convId, response.content, response.usage?.totalTokens || 0]
  );

  await incrementUsage(userId, response.usage?.totalTokens || 0);

  res.json({
    success: true,
    data: {
      conversationId: convId,
      message: {
        role: 'assistant',
        content: response.content
      },
      usage: response.usage
    }
  });
});

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  updateConversation,
  chat,
  chatSimple,
  getContext,
  getQuota
};