const asyncHandler = require('express-async-handler');
const { query, transaction } = require('../config/database');

// Get all budgets for user
const getBudgets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { year } = req.query;

  let sql = `
    SELECT b.*, 
           COALESCE(
             (SELECT SUM(t.amount) FROM transactions t 
              WHERE t.user_id = b.user_id 
              AND DATE_TRUNC('month', t.date) = b.month
              AND t.type = 'expense'), 0
           ) as actual_spent
    FROM budgets b
    WHERE b.user_id = $1
  `;
  const params = [userId];

  if (year) {
    sql += ` AND EXTRACT(YEAR FROM b.month) = $2`;
    params.push(year);
  }

  sql += ` ORDER BY b.month DESC`;

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows
  });
});

// Get current month budget
const getCurrentBudget = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

  const budgetResult = await query(
    `SELECT b.*,
            COALESCE(
              (SELECT SUM(t.amount) FROM transactions t 
               WHERE t.user_id = b.user_id 
               AND DATE_TRUNC('month', t.date) = b.month
               AND t.type = 'expense'), 0
            ) as actual_spent
     FROM budgets b
     WHERE b.user_id = $1 AND b.month = $2`,
    [userId, currentMonth]
  );

  // Get categories with spending
  const categoriesResult = await query(
    `SELECT sc.*,
            COALESCE(
              (SELECT SUM(t.amount) FROM transactions t 
               WHERE t.user_id = sc.user_id 
               AND t.category = sc.category_name
               AND DATE_TRUNC('month', t.date) = $2
               AND t.type = 'expense'), 0
            ) as spent
     FROM spending_categories sc
     WHERE sc.user_id = $1
     ORDER BY sc.monthly_limit DESC`,
    [userId, currentMonth]
  );

  res.json({
    success: true,
    data: {
      budget: budgetResult.rows[0] || null,
      categories: categoriesResult.rows,
      month: currentMonth
    }
  });
});

// Get single budget
const getBudget = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    `SELECT b.*,
            COALESCE(
              (SELECT SUM(t.amount) FROM transactions t 
               WHERE t.user_id = b.user_id 
               AND DATE_TRUNC('month', t.date) = b.month
               AND t.type = 'expense'), 0
            ) as actual_spent
     FROM budgets b
     WHERE b.id = $1 AND b.user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// Create budget
const createBudget = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { month, monthlyIncome, plannedExpenses, savingsGoal } = req.body;

  // Check if budget already exists for this month
  const existing = await query(
    'SELECT id FROM budgets WHERE user_id = $1 AND month = $2',
    [userId, month]
  );

  if (existing.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Budget already exists for this month'
    });
  }

  const result = await query(
    `INSERT INTO budgets (user_id, month, monthly_income, planned_expenses, savings_goal)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, month, monthlyIncome, JSON.stringify(plannedExpenses || {}), savingsGoal]
  );

  res.status(201).json({
    success: true,
    message: 'Budget created successfully',
    data: result.rows[0]
  });
});

// Update budget
const updateBudget = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { monthlyIncome, plannedExpenses, savingsGoal } = req.body;

  const result = await query(
    `UPDATE budgets 
     SET monthly_income = COALESCE($1, monthly_income),
         planned_expenses = COALESCE($2, planned_expenses),
         savings_goal = COALESCE($3, savings_goal),
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [monthlyIncome, JSON.stringify(plannedExpenses), savingsGoal, id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  res.json({
    success: true,
    message: 'Budget updated successfully',
    data: result.rows[0]
  });
});

// Delete budget
const deleteBudget = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  res.json({
    success: true,
    message: 'Budget deleted successfully'
  });
});

// Get spending categories
const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT * FROM spending_categories 
     WHERE user_id = $1 
     ORDER BY monthly_limit DESC`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows
  });
});

// Create category
const createCategory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { categoryName, monthlyLimit, color } = req.body;

  // Check if category exists
  const existing = await query(
    'SELECT id FROM spending_categories WHERE user_id = $1 AND LOWER(category_name) = LOWER($2)',
    [userId, categoryName]
  );

  if (existing.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Category already exists'
    });
  }

  const result = await query(
    `INSERT INTO spending_categories (user_id, category_name, monthly_limit, color)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, categoryName, monthlyLimit || 0, color || '#3B82F6']
  );

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: result.rows[0]
  });
});

// Update category
const updateCategory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { categoryName, monthlyLimit, color } = req.body;

  const result = await query(
    `UPDATE spending_categories 
     SET category_name = COALESCE($1, category_name),
         monthly_limit = COALESCE($2, monthly_limit),
         color = COALESCE($3, color),
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [categoryName, monthlyLimit, color, id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: result.rows[0]
  });
});

// Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM spending_categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Get budget summary/analytics
const getBudgetSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

  // Get current month stats
  const currentStats = await query(
    `SELECT 
       b.monthly_income,
       b.savings_goal,
       COALESCE(
         (SELECT SUM(t.amount) FROM transactions t 
          WHERE t.user_id = $1 
          AND DATE_TRUNC('month', t.date) = $2
          AND t.type = 'expense'), 0
       ) as total_spent,
       COALESCE(
         (SELECT SUM(t.amount) FROM transactions t 
          WHERE t.user_id = $1 
          AND DATE_TRUNC('month', t.date) = $2
          AND t.type = 'income'), 0
       ) as total_income
     FROM budgets b
     WHERE b.user_id = $1 AND b.month = $2`,
    [userId, currentMonth]
  );

  // Get spending by category
  const categorySpending = await query(
    `SELECT 
       sc.category_name,
       sc.monthly_limit,
       sc.color,
       COALESCE(
         (SELECT SUM(t.amount) FROM transactions t 
          WHERE t.user_id = $1 
          AND t.category = sc.category_name
          AND DATE_TRUNC('month', t.date) = $2
          AND t.type = 'expense'), 0
       ) as spent
     FROM spending_categories sc
     WHERE sc.user_id = $1
     ORDER BY sc.monthly_limit DESC`,
    [userId, currentMonth]
  );

  // Get last 6 months trend
  const trend = await query(
    `SELECT 
       DATE_TRUNC('month', t.date) as month,
       SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
       SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income
     FROM transactions t
     WHERE t.user_id = $1 
     AND t.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
     GROUP BY DATE_TRUNC('month', t.date)
     ORDER BY month ASC`,
    [userId]
  );

  const stats = currentStats.rows[0] || {};

  res.json({
    success: true,
    data: {
      currentMonth: {
        income: parseFloat(stats.monthly_income || stats.total_income || 0),
        spent: parseFloat(stats.total_spent || 0),
        savingsGoal: parseFloat(stats.savings_goal || 0),
        remaining: parseFloat(stats.monthly_income || 0) - parseFloat(stats.total_spent || 0)
      },
      categoryBreakdown: categorySpending.rows.map(c => ({
        ...c,
        monthly_limit: parseFloat(c.monthly_limit),
        spent: parseFloat(c.spent),
        percentage: c.monthly_limit > 0 ? (parseFloat(c.spent) / parseFloat(c.monthly_limit) * 100) : 0
      })),
      trend: trend.rows.map(t => ({
        month: t.month,
        expenses: parseFloat(t.expenses),
        income: parseFloat(t.income)
      }))
    }
  });
});

module.exports = {
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
};