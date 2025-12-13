/**
 * Debt Controller
 * Handles all debt management operations
 */

const { pool } = require('../config/database');
const { 
  generatePayoffSchedule, 
  compareStrategies, 
  getDebtSummary 
} = require('../utils/debtStrategies');
const { 
  generateAmortizationSchedule,
  calculateMonthsToPayoff 
} = require('../utils/financialCalculations');

/**
 * Get all debts for authenticated user
 */
const getDebts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, debt_name, debt_type, original_balance, current_balance, 
              interest_rate, minimum_payment, due_date, is_active, 
              created_at, updated_at
       FROM debts 
       WHERE user_id = $1 AND is_active = true
       ORDER BY current_balance DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch debts' 
    });
  }
};

/**
 * Get single debt by ID
 */
const getDebtById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM debts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Debt not found' 
      });
    }
    
    // Get payment history
    const payments = await pool.query(
      `SELECT * FROM debt_payments 
       WHERE debt_id = $1 
       ORDER BY payment_date DESC 
       LIMIT 50`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        payments: payments.rows
      }
    });
  } catch (error) {
    console.error('Get debt by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch debt' 
    });
  }
};

/**
 * Create new debt
 */
const createDebt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      debt_name, 
      debt_type, 
      original_balance, 
      current_balance, 
      interest_rate, 
      minimum_payment, 
      due_date 
    } = req.body;
    
    // Validation
    if (!debt_name || !current_balance || interest_rate === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Debt name, current balance, and interest rate are required' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO debts 
       (user_id, debt_name, debt_type, original_balance, current_balance, 
        interest_rate, minimum_payment, due_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [
        userId, 
        debt_name, 
        debt_type || 'other',
        original_balance || current_balance,
        current_balance,
        interest_rate,
        minimum_payment || 0,
        due_date || 1
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Debt created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create debt error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create debt' 
    });
  }
};

/**
 * Update debt
 */
const updateDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    // Verify ownership
    const existing = await pool.query(
      'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Debt not found' 
      });
    }
    
    // Build dynamic update query
    const allowedFields = [
      'debt_name', 'debt_type', 'original_balance', 'current_balance',
      'interest_rate', 'minimum_payment', 'due_date', 'is_active'
    ];
    
    const setClauses = [];
    const values = [id, userId];
    let paramIndex = 3;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }
    
    const result = await pool.query(
      `UPDATE debts 
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      values
    );
    
    res.json({
      success: true,
      message: 'Debt updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update debt error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update debt' 
    });
  }
};

/**
 * Delete debt (soft delete)
 */
const deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE debts 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Debt not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Debt deleted successfully'
    });
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete debt' 
    });
  }
};

/**
 * Record a payment
 */
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params; // debt_id
    const userId = req.user.id;
    const { amount, payment_date, notes } = req.body;
    
    // Verify debt ownership
    const debt = await pool.query(
      'SELECT * FROM debts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (debt.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Debt not found' 
      });
    }
    
    const debtData = debt.rows[0];
    const monthlyInterest = (parseFloat(debtData.current_balance) * 
                            (parseFloat(debtData.interest_rate) / 100 / 12));
    const interestPaid = Math.min(amount, monthlyInterest);
    const principalPaid = amount - interestPaid;
    const newBalance = Math.max(0, parseFloat(debtData.current_balance) - principalPaid);
    const isExtra = amount > parseFloat(debtData.minimum_payment);
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Record payment
      const paymentResult = await client.query(
        `INSERT INTO debt_payments 
         (debt_id, payment_date, amount, principal_paid, interest_paid, 
          balance_after, is_extra, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id,
          payment_date || new Date(),
          amount,
          Math.round(principalPaid * 100) / 100,
          Math.round(interestPaid * 100) / 100,
          Math.round(newBalance * 100) / 100,
          isExtra,
          notes || null
        ]
      );
      
      // Update debt balance
      await client.query(
        `UPDATE debts 
         SET current_balance = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [Math.round(newBalance * 100) / 100, id]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          payment: paymentResult.rows[0],
          newBalance: Math.round(newBalance * 100) / 100
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record payment' 
    });
  }
};

/**
 * Get payment history for a debt
 */
const getPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify ownership
    const debt = await pool.query(
      'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (debt.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Debt not found' 
      });
    }
    
    const result = await pool.query(
      `SELECT * FROM debt_payments 
       WHERE debt_id = $1 
       ORDER BY payment_date DESC`,
      [id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payments' 
    });
  }
};

/**
 * Get debt summary overview
 */
const getDebtSummaryController = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM debts WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    const summary = getDebtSummary(result.rows, 0);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get debt summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate summary' 
    });
  }
};

/**
 * Calculate snowball payoff schedule
 */
const calculateSnowball = async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthlyExtra = 0 } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM debts WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    const schedule = generatePayoffSchedule(result.rows, monthlyExtra, 'snowball');
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Calculate snowball error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate snowball strategy' 
    });
  }
};

/**
 * Calculate avalanche payoff schedule
 */
const calculateAvalanche = async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthlyExtra = 0 } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM debts WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    const schedule = generatePayoffSchedule(result.rows, monthlyExtra, 'avalanche');
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Calculate avalanche error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate avalanche strategy' 
    });
  }
};

/**
 * Compare both strategies
 */
const compareStrategiesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthlyExtra = 0 } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM debts WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No active debts found',
          snowball: null,
          avalanche: null,
          comparison: null
        }
      });
    }
    
    const comparison = compareStrategies(result.rows, monthlyExtra);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Compare strategies error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compare strategies' 
    });
  }
};

/**
 * Get current saved strategy
 */
const getStrategy = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM debt_strategies 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Get strategy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch strategy' 
    });
  }
};

/**
 * Save chosen strategy
 */
const saveStrategy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      strategy_type, 
      monthly_extra, 
      projected_payoff_date, 
      total_interest_saved,
      strategy_details 
    } = req.body;
    
    // Upsert strategy
    const result = await pool.query(
      `INSERT INTO debt_strategies 
       (user_id, strategy_type, monthly_extra, projected_payoff_date, 
        total_interest_saved, strategy_details)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         strategy_type = $2,
         monthly_extra = $3,
         projected_payoff_date = $4,
         total_interest_saved = $5,
         strategy_details = $6,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        strategy_type,
        monthly_extra || 0,
        projected_payoff_date,
        total_interest_saved || 0,
        JSON.stringify(strategy_details || {})
      ]
    );
    
    res.json({
      success: true,
      message: 'Strategy saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Save strategy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save strategy' 
    });
  }
};

module.exports = {
  getDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  recordPayment,
  getPayments,
  getDebtSummary: getDebtSummaryController,
  calculateSnowball,
  calculateAvalanche,
  compareStrategies: compareStrategiesController,
  getStrategy,
  saveStrategy
};