const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateSuggestions,
  getSuggestions,
  updateSuggestion,
  getSuggestionHistory
} = require('../controllers/suggestionController');

router.use(protect);

router.post('/generate', generateSuggestions);
router.get('/', getSuggestions);
router.get('/history', getSuggestionHistory);
router.patch('/:id', updateSuggestion);

module.exports = router;