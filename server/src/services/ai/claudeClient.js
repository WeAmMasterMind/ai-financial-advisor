/**
 * Claude AI Client
 * Sprint 7-8: Anthropic API wrapper with streaming support
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const MODEL_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2048,
  temperature: 0.7
};

/**
 * Send a message to Claude and get a complete response
 */
const sendMessage = async (systemPrompt, messages, options = {}) => {
  try {
    const response = await anthropic.messages.create({
      model: options.model || MODEL_CONFIG.model,
      max_tokens: options.maxTokens || MODEL_CONFIG.maxTokens,
      temperature: options.temperature || MODEL_CONFIG.temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    return {
      success: true,
      content: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      stopReason: response.stop_reason
    };
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      success: false,
      error: error.message,
      code: error.status || 500
    };
  }
};

/**
 * Stream a message response from Claude
 */
async function* streamMessage(systemPrompt, messages, options = {}) {
  try {
    const stream = anthropic.messages.stream({
      model: options.model || MODEL_CONFIG.model,
      max_tokens: options.maxTokens || MODEL_CONFIG.maxTokens,
      temperature: options.temperature || MODEL_CONFIG.temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    yield { type: 'start', messageId: Date.now().toString() };

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const text = event.delta?.text || '';
        fullContent += text;
        yield { type: 'delta', content: text };
      } else if (event.type === 'message_start') {
        inputTokens = event.message?.usage?.input_tokens || 0;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage?.output_tokens || 0;
      }
    }

    yield {
      type: 'done',
      content: fullContent,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      }
    };

  } catch (error) {
    console.error('Claude streaming error:', error);
    yield {
      type: 'error',
      error: error.message,
      code: error.status || 500
    };
  }
}

/**
 * Express SSE handler for streaming responses
 */
const createSSEHandler = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  return {
    send: (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    sendText: (text) => {
      res.write(`data: ${JSON.stringify({ type: 'delta', content: text })}\n\n`);
    },
    end: () => {
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    },
    error: (message) => {
      res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  };
};

/**
 * Stream chat completion to an SSE response
 */
const streamToSSE = async (res, systemPrompt, messages, options = {}) => {
  const sse = createSSEHandler(res);
  let fullContent = '';
  let usage = {};

  try {
    for await (const chunk of streamMessage(systemPrompt, messages, options)) {
      switch (chunk.type) {
        case 'start':
          sse.send('start', { messageId: chunk.messageId });
          break;
        case 'delta':
          sse.sendText(chunk.content);
          fullContent += chunk.content;
          break;
        case 'done':
          usage = chunk.usage;
          sse.send('done', { usage: chunk.usage });
          break;
        case 'error':
          sse.error(chunk.error);
          return { success: false, error: chunk.error };
      }
    }

    sse.end();
    return { 
      success: true, 
      content: fullContent, 
      usage 
    };

  } catch (error) {
    sse.error(error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a short title for a conversation
 */
const generateTitle = async (firstMessage) => {
  try {
    const response = await anthropic.messages.create({
      model: MODEL_CONFIG.model,
      max_tokens: 30,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Generate a short title (3-6 words) for a financial conversation that starts with: "${firstMessage.substring(0, 200)}"\n\nRespond with ONLY the title, no quotes or explanation.`
      }]
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Title generation error:', error);
    return firstMessage.substring(0, 40) + (firstMessage.length > 40 ? '...' : '');
  }
};

/**
 * Check if Anthropic API is configured and working
 */
const healthCheck = async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { healthy: false, error: 'ANTHROPIC_API_KEY not configured' };
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL_CONFIG.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return { healthy: true, model: MODEL_CONFIG.model };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

module.exports = {
  sendMessage,
  streamMessage,
  streamToSSE,
  createSSEHandler,
  generateTitle,
  healthCheck,
  MODEL_CONFIG
};