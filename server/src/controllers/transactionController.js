const asyncHandler = require('express-async-handler');
const { query, transaction } = require('../config/database');

// Get all transactions for user with filters
const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    type, 
    category, 
    startDate, 
    endDate, 
    limit = 50, 
    offset = 0,
    sortBy = 'date',
    sortOrder = 'DESC'
  } = req.query;

  let sql = 'SELECT * FROM transactions WHERE user_id = $1';
  const params = [userId];
  let paramIndex = 2;

  // Add filters
  if (type) {
    sql += ` AND type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  if (category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (startDate) {
    sql += ` AND date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND date <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  // Add sorting
  const validSortFields = ['date', 'amount', 'category'];
  const validSortOrders = ['ASC', 'DESC'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
  const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  
  sql += ` ORDER BY ${sortField} ${order}`;

  // Add pagination
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  // Get total count for pagination
  let countSql = 'SELECT COUNT(*) FROM transactions WHERE user_id = $1';
  const countParams = [userId];
  let countParamIndex = 2;

  if (type) {
    countSql += ` AND type = $${countParamIndex}`;
    countParams.push(type);
    countParamIndex++;
  }
  if (category) {
    countSql += ` AND category = $${countParamIndex}`;
    countParams.push(category);
    countParamIndex++;
  }
  if (startDate) {
    countSql += ` AND date >= $${countParamIndex}`;
    countParams.push(startDate);
    countParamIndex++;
  }
  if (endDate) {
    countSql += ` AND date <= $${countParamIndex}`;
    countParams.push(endDate);
  }

  const countResult = await query(countSql, countParams);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].count)
    }
  });
});

// Get single transaction
const getTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// Create transaction
const createTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date, type, amount, category, description, merchant } = req.body;

  // Validation
  if (!date || !type || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Date, type, and amount are required'
    });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Type must be either "income" or "expense"'
    });
  }

  const result = await query(
    `INSERT INTO transactions (user_id, date, type, amount, category, description, merchant)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, date, type, amount, category, description, merchant]
  );

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: result.rows[0]
  });
});

// Update transaction
const updateTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { date, type, amount, category, description, merchant } = req.body;

  const result = await query(
    `UPDATE transactions 
     SET date = COALESCE($1, date),
         type = COALESCE($2, type),
         amount = COALESCE($3, amount),
         category = COALESCE($4, category),
         description = COALESCE($5, description),
         merchant = COALESCE($6, merchant),
         updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [date, type, amount, category, description, merchant, id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    message: 'Transaction updated successfully',
    data: result.rows[0]
  });
});

// Delete transaction
const deleteTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    message: 'Transaction deleted successfully'
  });
});

// Get transaction statistics
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const start = startDate || currentMonth;
  const end = endDate || new Date().toISOString();

  // Get totals by type
  const totals = await query(
    `SELECT 
       type,
       COUNT(*) as transaction_count,
       SUM(amount) as total_amount
     FROM transactions
     WHERE user_id = $1 AND date >= $2 AND date <= $3
     GROUP BY type`,
    [userId, start, end]
  );

  // Get spending by category
  const byCategory = await query(
    `SELECT 
       category,
       COUNT(*) as count,
       SUM(amount) as total
     FROM transactions
     WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date <= $3
     GROUP BY category
     ORDER BY total DESC`,
    [userId, start, end]
  );

  // Get recent trends (last 6 months)
  const trends = await query(
    `SELECT 
       DATE_TRUNC('month', date) as month,
       type,
       SUM(amount) as total
     FROM transactions
     WHERE user_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
     GROUP BY DATE_TRUNC('month', date), type
     ORDER BY month ASC`,
    [userId]
  );

  // Get top merchants
  const topMerchants = await query(
    `SELECT 
       merchant,
       COUNT(*) as transaction_count,
       SUM(amount) as total_spent
     FROM transactions
     WHERE user_id = $1 AND type = 'expense' AND merchant IS NOT NULL AND date >= $2 AND date <= $3
     GROUP BY merchant
     ORDER BY total_spent DESC
     LIMIT 5`,
    [userId, start, end]
  );

  const income = totals.rows.find(t => t.type === 'income')?.total_amount || 0;
  const expenses = totals.rows.find(t => t.type === 'expense')?.total_amount || 0;

  res.json({
    success: true,
    data: {
      period: { start, end },
      summary: {
        totalIncome: parseFloat(income),
        totalExpenses: parseFloat(expenses),
        netCashFlow: parseFloat(income) - parseFloat(expenses),
        transactionCount: totals.rows.reduce((sum, t) => sum + parseInt(t.transaction_count), 0)
      },
      byCategory: byCategory.rows.map(c => ({
        category: c.category,
        count: parseInt(c.count),
        total: parseFloat(c.total)
      })),
      trends: trends.rows.map(t => ({
        month: t.month,
        type: t.type,
        total: parseFloat(t.total)
      })),
      topMerchants: topMerchants.rows.map(m => ({
        merchant: m.merchant,
        transactionCount: parseInt(m.transaction_count),
        totalSpent: parseFloat(m.total_spent)
      }))
    }
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStats
};