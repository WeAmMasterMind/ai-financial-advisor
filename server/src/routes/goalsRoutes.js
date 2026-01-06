/**
 * Goals Routes
 * Sprint 11-12: Financial goals API endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getGoalsSummary,
  getGoalProjection
} = require('../controllers/goalsController');

// All routes require authentication
router.use(protect);

// Summary/overview
router.get('/summary', getGoalsSummary);

// CRUD operations
router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .get(getGoal)
  .put(updateGoal)
  .delete(deleteGoal);

// Goal-specific actions
router.post('/:id/contributions', addContribution);
router.get('/:id/projection', getGoalProjection);

module.exports = router;
