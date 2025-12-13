/**
 * Portfolio Controller
 * Handles all portfolio and holdings operations
 */

const { pool } = require('../config/database');
const {
  getRecommendedAllocation,
  calculateCurrentAllocation,
  generateRebalancePlan,
  calculatePerformance,
  ASSET_CLASSES
} = require('../utils/portfolioAllocations');

/**
 * Get all portfolios for user
 */
const getPortfolios = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT p.*, 
              COALESCE(SUM(h.quantity * COALESCE(h.current_price, h.purchase_price)), 0) as calculated_value,
              COUNT(h.id) as holdings_count
       FROM portfolios p
       LEFT JOIN holdings h ON p.id = h.portfolio_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.is_primary DESC, p.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolios'
    });
  }
};

/**
 * Get single portfolio with holdings
 */
const getPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const portfolio = await pool.query(
      `SELECT * FROM portfolios WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (portfolio.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const holdings = await pool.query(
      `SELECT * FROM holdings WHERE portfolio_id = $1 ORDER BY asset_class, symbol`,
      [id]
    );

    // Safely calculate performance
    let performance = {
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercent: 0,
      holdings: []
    };

    try {
      if (holdings.rows && holdings.rows.length > 0) {
        performance = calculatePerformance(holdings.rows);
      }
    } catch (perfError) {
      console.error('Performance calculation error:', perfError);
    }

    res.json({
      success: true,
      data: {
        ...portfolio.rows[0],
        holdings: performance.holdings || holdings.rows || [],
        performance: {
          totalValue: performance.totalValue || 0,
          totalCost: performance.totalCost || 0,
          totalGain: performance.totalGain || 0,
          totalGainPercent: performance.totalGainPercent || 0
        }
      }
    });
  } catch (error) {
    console.error('Get portfolio by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio'
    });
  }
};

/**
 * Create new portfolio
 */
const createPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      portfolio_name,
      portfolio_type,
      risk_level,
      target_allocation,
      is_primary
    } = req.body;

    if (!portfolio_name) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio name is required'
      });
    }

    // If setting as primary, unset other primaries
    if (is_primary) {
      await pool.query(
        `UPDATE portfolios SET is_primary = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO portfolios 
       (user_id, portfolio_name, portfolio_type, risk_level, target_allocation, is_primary, current_value)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING *`,
      [
        userId,
        portfolio_name,
        portfolio_type || 'brokerage',
        risk_level || 'moderate',
        JSON.stringify(target_allocation || {}),
        is_primary || false
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portfolio'
    });
  }
};

/**
 * Update portfolio
 */
const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verify ownership
    const existing = await pool.query(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // If setting as primary, unset others
    if (updates.is_primary) {
      await pool.query(
        `UPDATE portfolios SET is_primary = false WHERE user_id = $1 AND id != $2`,
        [userId, id]
      );
    }

    const allowedFields = ['portfolio_name', 'portfolio_type', 'risk_level', 'target_allocation', 'is_primary'];
    const setClauses = [];
    const values = [id, userId];
    let paramIndex = 3;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'target_allocation') {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(JSON.stringify(updates[field]));
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(updates[field]);
        }
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
      `UPDATE portfolios 
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update portfolio'
    });
  }
};

/**
 * Delete portfolio
 */
const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM portfolios WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete portfolio'
    });
  }
};

/**
 * Add holding to portfolio
 */
const addHolding = async (req, res) => {
  try {
    const { id } = req.params; // portfolio_id
    const userId = req.user.id;
    const {
      asset_type,
      asset_class,
      symbol,
      name,
      quantity,
      purchase_price,
      current_price,
      purchase_date
    } = req.body;

    // Verify portfolio ownership
    const portfolio = await pool.query(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (portfolio.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const result = await pool.query(
      `INSERT INTO holdings 
       (portfolio_id, asset_type, asset_class, symbol, name, quantity, purchase_price, current_price, purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        asset_type || 'stock',
        asset_class || 'us_stocks',
        symbol?.toUpperCase() || null,
        name || null,
        quantity || 0,
        purchase_price || 0,
        current_price || purchase_price || 0,
        purchase_date || new Date()
      ]
    );

    // Update portfolio current_value
    await updatePortfolioValue(id);

    res.status(201).json({
      success: true,
      message: 'Holding added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add holding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add holding'
    });
  }
};

/**
 * Update holding
 */
const updateHolding = async (req, res) => {
  try {
    const { id } = req.params; // holding_id
    const userId = req.user.id;
    const updates = req.body;

    // Verify ownership through portfolio
    const holding = await pool.query(
      `SELECT h.*, p.user_id 
       FROM holdings h 
       JOIN portfolios p ON h.portfolio_id = p.id 
       WHERE h.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (holding.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found'
      });
    }

    const allowedFields = ['asset_type', 'asset_class', 'symbol', 'name', 'quantity', 'purchase_price', 'current_price', 'purchase_date'];
    const setClauses = [];
    const values = [id];
    let paramIndex = 2;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(field === 'symbol' ? updates[field]?.toUpperCase() : updates[field]);
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
      `UPDATE holdings 
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      values
    );

    // Update portfolio value
    await updatePortfolioValue(holding.rows[0].portfolio_id);

    res.json({
      success: true,
      message: 'Holding updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update holding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update holding'
    });
  }
};

/**
 * Delete holding
 */
const deleteHolding = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership and get portfolio_id
    const holding = await pool.query(
      `SELECT h.portfolio_id, p.user_id 
       FROM holdings h 
       JOIN portfolios p ON h.portfolio_id = p.id 
       WHERE h.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (holding.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found'
      });
    }

    const portfolioId = holding.rows[0].portfolio_id;

    await pool.query('DELETE FROM holdings WHERE id = $1', [id]);

    // Update portfolio value
    await updatePortfolioValue(portfolioId);

    res.json({
      success: true,
      message: 'Holding deleted successfully'
    });
  } catch (error) {
    console.error('Delete holding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete holding'
    });
  }
};

/**
 * Update holding price
 */
const updateHoldingPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { current_price } = req.body;

    const holding = await pool.query(
      `SELECT h.portfolio_id, p.user_id 
       FROM holdings h 
       JOIN portfolios p ON h.portfolio_id = p.id 
       WHERE h.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (holding.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found'
      });
    }

    const result = await pool.query(
      `UPDATE holdings 
       SET current_price = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [current_price, id]
    );

    await updatePortfolioValue(holding.rows[0].portfolio_id);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update holding price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price'
    });
  }
};

/**
 * Get allocation analysis for portfolio
 */
const getAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const portfolio = await pool.query(
      `SELECT * FROM portfolios WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (portfolio.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const holdings = await pool.query(
      `SELECT * FROM holdings WHERE portfolio_id = $1`,
      [id]
    );

    const { allocation: currentAllocation, totalValue } = calculateCurrentAllocation(holdings.rows);
    const targetAllocation = portfolio.rows[0].target_allocation || {};

    res.json({
      success: true,
      data: {
        currentAllocation,
        targetAllocation,
        totalValue,
        assetClasses: ASSET_CLASSES
      }
    });
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate allocation'
    });
  }
};

/**
 * Get rebalancing recommendations
 */
const getRebalancePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { threshold = 5 } = req.body;

    const portfolio = await pool.query(
      `SELECT * FROM portfolios WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (portfolio.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const holdings = await pool.query(
      `SELECT * FROM holdings WHERE portfolio_id = $1`,
      [id]
    );

    const targetAllocation = portfolio.rows[0].target_allocation || {};
    const plan = generateRebalancePlan(holdings.rows, targetAllocation, threshold);

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get rebalance plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rebalance plan'
    });
  }
};

/**
 * Get portfolio performance
 */
const getPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const portfolio = await pool.query(
      `SELECT * FROM portfolios WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (portfolio.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const holdings = await pool.query(
      `SELECT * FROM holdings WHERE portfolio_id = $1`,
      [id]
    );

    const performance = calculatePerformance(holdings.rows);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate performance'
    });
  }
};

/**
 * Get recommended portfolio based on user's risk profile
 */
const getRecommendedPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's questionnaire data
    const questionnaire = await pool.query(
      `SELECT * FROM financial_questionnaire 
       WHERE user_id = $1 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [userId]
    );

    const profile = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    let riskScore = 5; // Default moderate
    let age = 30;
    let investmentHorizon = 'long';

    if (questionnaire.rows.length > 0) {
      const data = questionnaire.rows[0].questions_json;
      riskScore = data.riskScore || data.risk_score || 5;
    }

    if (profile.rows.length > 0) {
      age = profile.rows[0].age || 30;
      investmentHorizon = profile.rows[0].investment_horizon || 'long';
    }

    const recommendation = getRecommendedAllocation(riskScore, age, investmentHorizon);

    res.json({
      success: true,
      data: {
        ...recommendation,
        userProfile: {
          riskScore,
          age,
          investmentHorizon
        }
      }
    });
  } catch (error) {
    console.error('Get recommended portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};

/**
 * Helper: Update portfolio's current_value
 */
async function updatePortfolioValue(portfolioId) {
  try {
    await pool.query(
      `UPDATE portfolios 
       SET current_value = (
         SELECT COALESCE(SUM(quantity * COALESCE(current_price, purchase_price)), 0)
         FROM holdings WHERE portfolio_id = $1
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [portfolioId]
    );
  } catch (error) {
    console.error('Update portfolio value error:', error);
  }
}

module.exports = {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  updateHoldingPrice,
  getAllocation,
  getRebalancePlan,
  getPerformance,
  getRecommendedPortfolio
};