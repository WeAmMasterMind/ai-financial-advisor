/**
 * Portfolio Routes
 * API endpoints for portfolio management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  updateHoldingPrice,
  getAllocation,
  getRebalancePlan,
  getPerformance,
  getRecommendedPortfolio
} = require('../controllers/portfolioController');

// All routes require authentication
router.use(protect);

// Portfolio CRUD
router.get('/', getPortfolios);
router.get('/recommended', getRecommendedPortfolio);
router.get('/:id', getPortfolioById);
router.post('/', createPortfolio);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);

// Holdings management
router.post('/:id/holdings', addHolding);
router.get('/:id/allocation', getAllocation);
router.post('/:id/rebalance', getRebalancePlan);
router.get('/:id/performance', getPerformance);

// Individual holding operations
router.put('/holdings/:id', updateHolding);
router.delete('/holdings/:id', deleteHolding);
router.put('/holdings/:id/price', updateHoldingPrice);

module.exports = router;