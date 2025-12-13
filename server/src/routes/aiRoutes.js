/**
 * AI Routes
 * Sprint 7-8: API endpoints for AI chat functionality
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { quotaMiddleware } = require('../services/ai/rateLimiter');
const {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  updateConversation,
  chat,
  chatSimple,
  getContext,
  getQuota
} = require('../controllers/aiController');

// All routes require authentication
router.use(protect);

// Conversation Management
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.patch('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

// Chat Endpoints
router.post('/chat', quotaMiddleware, chat);
router.post('/chat/simple', quotaMiddleware, chatSimple);

// Context & Quota
router.get('/context', getContext);
router.get('/quota', getQuota);

module.exports = router;