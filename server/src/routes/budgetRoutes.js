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

router.use(protect);

// Category routes FIRST (before /:id catches everything)
router.get('/categories/all', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Budget routes AFTER
router.get('/current', getCurrentBudget);
router.get('/summary', getBudgetSummary);
router.get('/', getBudgets);
router.post('/', createBudget);
router.get('/:id', getBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;