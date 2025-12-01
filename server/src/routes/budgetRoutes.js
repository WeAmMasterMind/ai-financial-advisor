const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBudgets,
  getCurrentBudget,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBudgetSummary
} = require('../controllers/budgetController');

// All routes are protected
router.use(protect);

// Budget routes
router.get('/', getBudgets);
router.get('/current', getCurrentBudget);
router.get('/summary', getBudgetSummary);
router.get('/:id', getBudget);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

// Category routes
router.get('/categories/all', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;