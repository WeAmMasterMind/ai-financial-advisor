/**
 * AI Services Module Index
 * Sprint 7-8: Export all AI-related services
 */

const contextBuilder = require('./contextBuilder');
const claudeClient = require('./claudeClient');
const promptTemplates = require('./promptTemplates');
const rateLimiter = require('./rateLimiter');

module.exports = {
  // Context Builder
  buildUserContext: contextBuilder.buildUserContext,
  createContextSnapshot: contextBuilder.createContextSnapshot,
  getMinimalContext: contextBuilder.getMinimalContext,

  // Claude Client
  sendMessage: claudeClient.sendMessage,
  streamMessage: claudeClient.streamMessage,
  streamToSSE: claudeClient.streamToSSE,
  generateTitle: claudeClient.generateTitle,
  healthCheck: claudeClient.healthCheck,

  // Prompt Templates
  getSystemPrompt: promptTemplates.getSystemPrompt,
  formatFinancialContext: promptTemplates.formatFinancialContext,
  ADVISOR_PERSONA: promptTemplates.ADVISOR_PERSONA,

  // Rate Limiter
  checkQuota: rateLimiter.checkQuota,
  incrementUsage: rateLimiter.incrementUsage,
  getUsageStats: rateLimiter.getUsageStats,
  quotaMiddleware: rateLimiter.quotaMiddleware,
  LIMITS: rateLimiter.LIMITS
};