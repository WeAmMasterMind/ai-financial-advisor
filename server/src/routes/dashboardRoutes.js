/**
 * Dashboard Routes
 * API endpoints for dashboard data aggregation
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardSummary,
  getQuickStats
} = require('../controllers/dashboardController');

// All routes require authentication
router.use(protect);

// GET /api/dashboard - Full dashboard summary
router.get('/', getDashboardSummary);

// GET /api/dashboard/quick-stats - Lightweight stats for header
router.get('/quick-stats', getQuickStats);

module.exports = router;
