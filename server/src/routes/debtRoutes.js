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

// Strategy calculators
router.get('/calculator', getDebtSummary);
router.post('/calculator/payments', (req, res) => {
  res.status(400).json({ success: false, message: 'Invalid debt ID' });
});
router.post('/calculate/snowball', calculateSnowball);
router.post('/calculate/avalanche', calculateAvalanche);
router.post('/calculate/compare', compareStrategies);


// Summary and strategy
router.get('/summary', getDebtSummary);
router.get('/strategy', getStrategy);
router.post('/strategy', saveStrategy);
router.put('/strategy', saveStrategy);

// Debt CRUD
router.get('/', getDebts);
router.post('/', createDebt);
router.get('/:id', getDebtById);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);

// Payment tracking
router.get('/:id/payments', getPayments);
router.post('/:id/payments', recordPayment);

module.exports = router;