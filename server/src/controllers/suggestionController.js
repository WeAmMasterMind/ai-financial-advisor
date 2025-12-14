const asyncHandler = require('express-async-handler');
const suggestionEngine = require('../services/suggestionEngine');
const { pool } = require('../config/database');

// @desc    Generate investment suggestions
// @route   POST /api/suggestions/generate
// @access  Private
const generateSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await suggestionEngine.generateSuggestions(req.user.id);
  res.json(suggestions);
});

// @desc    Get user's suggestions
// @route   GET /api/suggestions
// @access  Private
const getSuggestions = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const suggestions = await suggestionEngine.getSuggestions(req.user.id, status);
  res.json(suggestions);
});

// @desc    Update suggestion status
// @route   PATCH /api/suggestions/:id
// @access  Private
const updateSuggestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['viewed', 'accepted', 'dismissed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  await suggestionEngine.updateSuggestionStatus(id, req.user.id, status);
  res.json({ message: 'Suggestion updated' });
});

// @desc    Get suggestion history
// @route   GET /api/suggestions/history
// @access  Private
const getSuggestionHistory = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, a.name, a.asset_type
    FROM investment_suggestions s
    LEFT JOIN assets a ON s.symbol = a.symbol
    WHERE s.user_id = $1 AND s.status != 'pending'
    ORDER BY s.updated_at DESC
    LIMIT 50
  `, [req.user.id]);

  res.json(result.rows);
});

module.exports = {
  generateSuggestions,
  getSuggestions,
  updateSuggestion,
  getSuggestionHistory
};