/**
 * Analytics Routes
 * Sprint 11-12: Advanced analytics API endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardAnalytics,
  getSpendingTrends,
  getNetWorthHistory,
  recordNetWorthSnapshot,
  getHealthHistory,
  recordHealthSnapshot,
  getIncomeExpenseAnalysis,
  getCrossModuleInsights
} = require('../controllers/analyticsController');

// All routes require authentication
router.use(protect);

// Dashboard overview
router.get('/dashboard', getDashboardAnalytics);

// Spending analysis
router.get('/spending-trends', getSpendingTrends);
router.get('/income-expense', getIncomeExpenseAnalysis);

// Net worth tracking
router.get('/net-worth', getNetWorthHistory);
router.post('/net-worth/snapshot', recordNetWorthSnapshot);

// Financial health tracking
router.get('/health-history', getHealthHistory);
router.post('/health/snapshot', recordHealthSnapshot);

// Cross-module insights
router.get('/insights', getCrossModuleInsights);

module.exports = router;
