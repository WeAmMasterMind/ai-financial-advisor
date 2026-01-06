/**
 * Tax Routes
 * Sprint 11-12: Tax optimization API endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTaxLossHarvesting,
  getCapitalGains,
  getTaxEfficientAlternatives,
  getQuarterlyEstimate,
  getAllRecommendations
} = require('../controllers/taxController');

// All routes require authentication
router.use(protect);

// Tax recommendations overview
router.get('/recommendations', getAllRecommendations);

// Tax-loss harvesting opportunities
router.get('/harvesting', getTaxLossHarvesting);

// Capital gains breakdown
router.get('/capital-gains', getCapitalGains);

// Tax-efficient fund alternatives
router.get('/efficient-funds', getTaxEfficientAlternatives);

// Quarterly tax estimate
router.get('/quarterly-estimate', getQuarterlyEstimate);

module.exports = router;
