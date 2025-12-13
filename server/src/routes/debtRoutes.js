/**
 * Debt Routes
 * API endpoints for debt management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  recordPayment,
  getPayments,
  getDebtSummary,
  calculateSnowball,
  calculateAvalanche,
  compareStrategies,
  getStrategy,
  saveStrategy
} = require('../controllers/debtController');

// All routes require authentication
router.use(protect);

// Debt CRUD
router.get('/', getDebts);
router.get('/summary', getDebtSummary);
router.get('/strategy', getStrategy);
router.get('/:id', getDebtById);
router.post('/', createDebt);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);

// Payment tracking
router.get('/:id/payments', getPayments);
router.post('/:id/payments', recordPayment);

// Strategy calculators
router.post('/calculate/snowball', calculateSnowball);
router.post('/calculate/avalanche', calculateAvalanche);
router.post('/calculate/compare', compareStrategies);
router.post('/strategy', saveStrategy);
router.put('/strategy', saveStrategy);

module.exports = router;