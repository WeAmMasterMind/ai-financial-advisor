const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getQuote,
  getBatchQuotes,
  getHistory,
  searchAssets,
  getAssetDetails,
  getAllAssets,
  getPortfolioLive,
  getPortfolioPerformance,
  getPortfolioAllocation,
  createSnapshot
} = require('../controllers/marketController');

// All routes require authentication
router.use(protect);

// Price data
router.get('/quote/:symbol', getQuote);
router.post('/quotes', getBatchQuotes);
router.get('/history/:symbol', getHistory);

// Asset discovery
router.get('/search', searchAssets);
router.get('/assets', getAllAssets);
router.get('/asset/:symbol', getAssetDetails);

// Portfolio integration
router.get('/portfolio/:portfolioId/live', getPortfolioLive);
router.get('/portfolio/:portfolioId/performance', getPortfolioPerformance);
router.get('/portfolio/:portfolioId/allocation', getPortfolioAllocation);
router.post('/portfolio/:portfolioId/snapshot', createSnapshot);

module.exports = router;