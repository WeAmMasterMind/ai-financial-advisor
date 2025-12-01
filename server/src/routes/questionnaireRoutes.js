const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  saveProgress,
  getStatus,
  completeQuestionnaire,
  getResults
} = require('../controllers/questionnaireController');

// All routes are protected
router.use(protect);

// Get questionnaire status and saved responses
router.get('/status', getStatus);

// Save progress (auto-save after each step)
router.post('/save', saveProgress);

// Complete questionnaire and calculate scores
router.post('/complete', completeQuestionnaire);

// Get results (after completion)
router.get('/results', getResults);

module.exports = router;