const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pool } = require('../config/database');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user profile
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        profile: profileResult.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, age, riskTolerance, incomeStability, lifeStage } = req.body;

    // Update user basic info
    if (firstName || lastName) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), updated_at = NOW() WHERE id = $3',
        [firstName, lastName, userId]
      );
    }

    // Update or insert profile
    if (age || riskTolerance || incomeStability || lifeStage) {
      await pool.query(`
        INSERT INTO user_profiles (user_id, age, risk_tolerance, income_stability, life_stage)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE SET
          age = COALESCE($2, user_profiles.age),
          risk_tolerance = COALESCE($3, user_profiles.risk_tolerance),
          income_stability = COALESCE($4, user_profiles.income_stability),
          life_stage = COALESCE($5, user_profiles.life_stage),
          updated_at = NOW()
      `, [userId, age, riskTolerance, incomeStability, lifeStage]);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's budget summary
    const budgetResult = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY month DESC LIMIT 1',
      [userId]
    );

    // Get user's portfolio summary
    const portfolioResult = await pool.query(
      'SELECT * FROM portfolios WHERE user_id = $1 AND is_primary = true',
      [userId]
    );

    // Get recent transactions count
    const transactionResult = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        currentBudget: budgetResult.rows[0] || null,
        primaryPortfolio: portfolioResult.rows[0] || null,
        transactionCount: parseInt(transactionResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;