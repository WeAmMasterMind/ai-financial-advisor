/**
 * Goals Controller
 * Sprint 11-12: Financial goals management
 */

const asyncHandler = require('express-async-handler');
const { query, transaction } = require('../config/database');

// Get all goals for user
const getGoals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, type, sort = 'priority' } = req.query;

  let sql = `
    SELECT 
      g.*,
      CASE 
        WHEN g.target_amount > 0 
        THEN ROUND((g.current_amount / g.target_amount * 100)::numeric, 1)
        ELSE 0 
      END as progress_percent,
      CASE
        WHEN g.monthly_contribution > 0 AND g.target_amount > g.current_amount
        THEN CEIL((g.target_amount - g.current_amount) / g.monthly_contribution)
        ELSE NULL
      END as months_to_goal,
      (
        SELECT COUNT(*) FROM goal_contributions gc 
        WHERE gc.goal_id = g.id
      ) as contribution_count,
      (
        SELECT SUM(gc.amount) FROM goal_contributions gc 
        WHERE gc.goal_id = g.id 
        AND gc.contribution_date >= DATE_TRUNC('month', CURRENT_DATE)
      ) as contributions_this_month
    FROM financial_goals g
    WHERE g.user_id = $1
  `;

  const params = [userId];
  let paramIndex = 2;

  if (status === 'active') {
    sql += ` AND g.is_completed = false`;
  } else if (status === 'completed') {
    sql += ` AND g.is_completed = true`;
  }

  if (type) {
    sql += ` AND g.goal_type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  // Sorting
  const sortOptions = {
    priority: 'g.priority DESC, g.created_at DESC',
    date: 'g.target_date ASC NULLS LAST',
    progress: 'progress_percent DESC',
    amount: 'g.target_amount DESC',
    created: 'g.created_at DESC'
  };

  sql += ` ORDER BY ${sortOptions[sort] || sortOptions.priority}`;

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows
  });
});

// Get single goal with details
const getGoal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const goalResult = await query(
    `SELECT 
      g.*,
      CASE 
        WHEN g.target_amount > 0 
        THEN ROUND((g.current_amount / g.target_amount * 100)::numeric, 1)
        ELSE 0 
      END as progress_percent
    FROM financial_goals g
    WHERE g.id = $1 AND g.user_id = $2`,
    [id, userId]
  );

  if (goalResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  // Get contribution history
  const contributionsResult = await query(
    `SELECT * FROM goal_contributions 
     WHERE goal_id = $1 
     ORDER BY contribution_date DESC 
     LIMIT 50`,
    [id]
  );

  // Get monthly contribution totals
  const monthlyTotals = await query(
    `SELECT 
      DATE_TRUNC('month', contribution_date) as month,
      SUM(amount) as total
    FROM goal_contributions
    WHERE goal_id = $1
    GROUP BY DATE_TRUNC('month', contribution_date)
    ORDER BY month DESC
    LIMIT 12`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...goalResult.rows[0],
      contributions: contributionsResult.rows,
      monthlyTotals: monthlyTotals.rows
    }
  });
});

// Create new goal
const createGoal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    goalType,
    targetAmount,
    currentAmount = 0,
    targetDate,
    priority = 5,
    monthlyContribution = 0,
    icon = 'target',
    color = '#3B82F6',
    notes
  } = req.body;

  if (!name || !goalType || !targetAmount) {
    return res.status(400).json({
      success: false,
      message: 'Name, goal type, and target amount are required'
    });
  }

  const result = await query(
    `INSERT INTO financial_goals (
      user_id, name, goal_type, target_amount, current_amount,
      target_date, priority, monthly_contribution, icon, color, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [userId, name, goalType, targetAmount, currentAmount, 
     targetDate, priority, monthlyContribution, icon, color, notes]
  );

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: result.rows[0]
  });
});

// Update goal
const updateGoal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const {
    name,
    goalType,
    targetAmount,
    currentAmount,
    targetDate,
    priority,
    monthlyContribution,
    icon,
    color,
    notes
  } = req.body;

  const result = await query(
    `UPDATE financial_goals SET
      name = COALESCE($1, name),
      goal_type = COALESCE($2, goal_type),
      target_amount = COALESCE($3, target_amount),
      current_amount = COALESCE($4, current_amount),
      target_date = COALESCE($5, target_date),
      priority = COALESCE($6, priority),
      monthly_contribution = COALESCE($7, monthly_contribution),
      icon = COALESCE($8, icon),
      color = COALESCE($9, color),
      notes = COALESCE($10, notes),
      updated_at = NOW()
    WHERE id = $11 AND user_id = $12
    RETURNING *`,
    [name, goalType, targetAmount, currentAmount, targetDate,
     priority, monthlyContribution, icon, color, notes, id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  res.json({
    success: true,
    message: 'Goal updated successfully',
    data: result.rows[0]
  });
});

// Delete goal
const deleteGoal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

// Add contribution to goal
const addContribution = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount, contributionDate, notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid contribution amount is required'
    });
  }

  // Verify goal belongs to user
  const goalCheck = await query(
    'SELECT id FROM financial_goals WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (goalCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  const result = await query(
    `INSERT INTO goal_contributions (goal_id, user_id, amount, contribution_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, userId, amount, contributionDate || new Date(), notes]
  );

  // Get updated goal
  const updatedGoal = await query(
    `SELECT *, 
      CASE WHEN target_amount > 0 
        THEN ROUND((current_amount / target_amount * 100)::numeric, 1)
        ELSE 0 
      END as progress_percent
    FROM financial_goals WHERE id = $1`,
    [id]
  );

  res.status(201).json({
    success: true,
    message: 'Contribution added successfully',
    data: {
      contribution: result.rows[0],
      goal: updatedGoal.rows[0]
    }
  });
});

// Get goal summary/overview
const getGoalsSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const summary = await query(
    `SELECT
      COUNT(*) FILTER (WHERE is_completed = false) as active_goals,
      COUNT(*) FILTER (WHERE is_completed = true) as completed_goals,
      COALESCE(SUM(target_amount) FILTER (WHERE is_completed = false), 0) as total_target,
      COALESCE(SUM(current_amount) FILTER (WHERE is_completed = false), 0) as total_saved,
      COALESCE(SUM(monthly_contribution) FILTER (WHERE is_completed = false), 0) as total_monthly_contribution,
      CASE 
        WHEN SUM(target_amount) FILTER (WHERE is_completed = false) > 0
        THEN ROUND((SUM(current_amount) FILTER (WHERE is_completed = false) / 
             SUM(target_amount) FILTER (WHERE is_completed = false) * 100)::numeric, 1)
        ELSE 0
      END as overall_progress
    FROM financial_goals
    WHERE user_id = $1`,
    [userId]
  );

  // Get goals by type
  const byType = await query(
    `SELECT 
      goal_type,
      COUNT(*) as count,
      SUM(target_amount) as total_target,
      SUM(current_amount) as total_current
    FROM financial_goals
    WHERE user_id = $1 AND is_completed = false
    GROUP BY goal_type
    ORDER BY total_target DESC`,
    [userId]
  );

  // Get recent contributions
  const recentContributions = await query(
    `SELECT 
      gc.*,
      g.name as goal_name,
      g.goal_type,
      g.color
    FROM goal_contributions gc
    JOIN financial_goals g ON gc.goal_id = g.id
    WHERE gc.user_id = $1
    ORDER BY gc.contribution_date DESC
    LIMIT 10`,
    [userId]
  );

  // Get closest to completion
  const closestToCompletion = await query(
    `SELECT 
      *,
      ROUND((current_amount / target_amount * 100)::numeric, 1) as progress_percent
    FROM financial_goals
    WHERE user_id = $1 
      AND is_completed = false 
      AND target_amount > 0
    ORDER BY (current_amount / target_amount) DESC
    LIMIT 3`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      summary: summary.rows[0],
      byType: byType.rows,
      recentContributions: recentContributions.rows,
      closestToCompletion: closestToCompletion.rows
    }
  });
});

// Calculate goal projections
const getGoalProjection = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { monthlyAmount } = req.query;

  const goal = await query(
    'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (goal.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  const g = goal.rows[0];
  const monthly = parseFloat(monthlyAmount) || parseFloat(g.monthly_contribution) || 0;
  const remaining = parseFloat(g.target_amount) - parseFloat(g.current_amount);

  let projection = {
    currentAmount: parseFloat(g.current_amount),
    targetAmount: parseFloat(g.target_amount),
    remaining,
    monthlyContribution: monthly,
    monthsToGoal: null,
    projectedDate: null,
    onTrack: null
  };

  if (monthly > 0 && remaining > 0) {
    const months = Math.ceil(remaining / monthly);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + months);

    projection.monthsToGoal = months;
    projection.projectedDate = projectedDate;

    if (g.target_date) {
      const targetDate = new Date(g.target_date);
      projection.onTrack = projectedDate <= targetDate;
      projection.monthsAhead = Math.floor(
        (targetDate - projectedDate) / (1000 * 60 * 60 * 24 * 30)
      );
    }
  }

  // Generate monthly projection data for chart
  const projectionData = [];
  let runningTotal = parseFloat(g.current_amount);
  const today = new Date();

  for (let i = 0; i <= 24 && runningTotal < parseFloat(g.target_amount); i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + i);
    
    projectionData.push({
      month: date.toISOString().slice(0, 7),
      projected: Math.min(runningTotal, parseFloat(g.target_amount)),
      target: parseFloat(g.target_amount)
    });

    runningTotal += monthly;
  }

  projection.chartData = projectionData;

  res.json({
    success: true,
    data: projection
  });
});

module.exports = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getGoalsSummary,
  getGoalProjection
};
