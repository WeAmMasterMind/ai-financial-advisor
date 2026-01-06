/**
 * Tax Controller
 * Sprint 11-12: Tax optimization recommendations (informational only)
 */

const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const {
  identifyTaxLossHarvestingOpportunities,
  suggestTaxEfficientAlternatives,
  calculateCapitalGains,
  estimateQuarterlyTax,
  getTaxRecommendations
} = require('../services/calculations/taxOptimization');

// Get tax-loss harvesting opportunities
const getTaxLossHarvesting = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user's holdings with current prices
  const holdingsResult = await query(
    `SELECT 
      h.*,
      a.name,
      a.asset_type
    FROM holdings h
    JOIN portfolios p ON h.portfolio_id = p.id
    LEFT JOIN assets a ON h.symbol = a.symbol
    WHERE p.user_id = $1`,
    [userId]
  );

  const opportunities = identifyTaxLossHarvestingOpportunities(holdingsResult.rows);

  res.json({
    success: true,
    data: opportunities,
    disclaimer: 'This information is for educational purposes only. Consult a tax professional before making decisions.'
  });
});

// Get capital gains breakdown
const getCapitalGains = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const holdingsResult = await query(
    `SELECT 
      h.*,
      a.name,
      a.asset_type
    FROM holdings h
    JOIN portfolios p ON h.portfolio_id = p.id
    LEFT JOIN assets a ON h.symbol = a.symbol
    WHERE p.user_id = $1`,
    [userId]
  );

  const gains = calculateCapitalGains(holdingsResult.rows);

  res.json({
    success: true,
    data: gains,
    disclaimer: 'This is an estimate. Consult a tax professional for accurate calculations.'
  });
});

// Get tax-efficient fund suggestions
const getTaxEfficientAlternatives = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const holdingsResult = await query(
    `SELECT 
      h.*,
      a.name,
      a.expense_ratio
    FROM holdings h
    JOIN portfolios p ON h.portfolio_id = p.id
    LEFT JOIN assets a ON h.symbol = a.symbol
    WHERE p.user_id = $1`,
    [userId]
  );

  const suggestions = suggestTaxEfficientAlternatives(holdingsResult.rows);

  res.json({
    success: true,
    data: suggestions
  });
});

// Estimate quarterly tax payment
const getQuarterlyEstimate = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { estimatedIncome, withholding, filingStatus } = req.query;

  // If no income provided, try to estimate from transactions
  let income = parseFloat(estimatedIncome);
  
  if (!income) {
    const incomeResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1 
         AND type = 'income'
         AND date >= DATE_TRUNC('year', CURRENT_DATE)`,
      [userId]
    );
    
    // Annualize based on current month
    const currentMonth = new Date().getMonth() + 1;
    income = (parseFloat(incomeResult.rows[0].total) / currentMonth) * 12;
  }

  const estimate = estimateQuarterlyTax(
    income,
    parseFloat(withholding) || 0,
    filingStatus || 'single'
  );

  res.json({
    success: true,
    data: estimate
  });
});

// Get all tax recommendations
const getAllRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get holdings
  const holdingsResult = await query(
    `SELECT 
      h.*,
      a.name,
      a.expense_ratio
    FROM holdings h
    JOIN portfolios p ON h.portfolio_id = p.id
    LEFT JOIN assets a ON h.symbol = a.symbol
    WHERE p.user_id = $1`,
    [userId]
  );

  // Get income estimate
  const incomeResult = await query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE user_id = $1 
       AND type = 'income'
       AND date >= DATE_TRUNC('year', CURRENT_DATE)`,
    [userId]
  );

  const currentMonth = new Date().getMonth() + 1;
  const annualizedIncome = (parseFloat(incomeResult.rows[0].total) / currentMonth) * 12;

  const recommendations = getTaxRecommendations({
    holdings: holdingsResult.rows,
    income: annualizedIncome,
    contributions: {} // Could be extended to track contribution status
  });

  // Also get the other data
  const harvestingOpps = identifyTaxLossHarvestingOpportunities(holdingsResult.rows);
  const capitalGains = calculateCapitalGains(holdingsResult.rows);

  res.json({
    success: true,
    data: {
      recommendations,
      harvestingOpportunities: harvestingOpps.slice(0, 5),
      capitalGainsSummary: {
        shortTermNet: capitalGains.shortTerm.net,
        longTermNet: capitalGains.longTerm.net,
        totalNet: capitalGains.total.net
      },
      estimatedAnnualIncome: annualizedIncome
    },
    disclaimer: 'This information is for educational purposes only. Consult a qualified tax professional for personalized advice.'
  });
});

module.exports = {
  getTaxLossHarvesting,
  getCapitalGains,
  getTaxEfficientAlternatives,
  getQuarterlyEstimate,
  getAllRecommendations
};
