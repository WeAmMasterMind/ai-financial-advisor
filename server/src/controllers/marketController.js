const asyncHandler = require('express-async-handler');
const marketDataService = require('../services/marketDataService');
const portfolioValuation = require('../services/portfolioValuation');
const { pool } = require('../config/database');

// @desc    Get quote for a symbol
// @route   GET /api/market/quote/:symbol
// @access  Private
const getQuote = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  
  const quote = await marketDataService.getQuote(symbol);
  
  if (!quote) {
    res.status(404);
    throw new Error(`Quote not found for symbol: ${symbol}`);
  }

  res.json(quote);
});

// @desc    Get batch quotes
// @route   POST /api/market/quotes
// @access  Private
const getBatchQuotes = asyncHandler(async (req, res) => {
  const { symbols } = req.body;
  
  if (!symbols || !Array.isArray(symbols)) {
    res.status(400);
    throw new Error('Symbols array is required');
  }

  const quotes = await marketDataService.getBatchQuotes(symbols);
  res.json(quotes);
});

// @desc    Get historical prices
// @route   GET /api/market/history/:symbol
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { period } = req.query; // compact or full
  
  const history = await marketDataService.getHistoricalPrices(
    symbol, 
    period === 'full' ? 'full' : 'compact'
  );

  res.json({
    symbol: symbol.toUpperCase(),
    dataPoints: history.length,
    prices: history
  });
});

// @desc    Search assets
// @route   GET /api/market/search
// @access  Private
const searchAssets = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 1) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const results = await marketDataService.searchAssets(q);
  res.json(results);
});

// @desc    Get asset details
// @route   GET /api/market/asset/:symbol
// @access  Private
const getAssetDetails = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  
  const [assetInfo, quote, history] = await Promise.all([
    marketDataService.getAssetInfo(symbol),
    marketDataService.getQuote(symbol),
    marketDataService.getStoredPriceHistory(symbol, 30)
  ]);

  res.json({
    ...assetInfo,
    quote,
    recentPrices: history
  });
});

// @desc    Get all available assets (for browsing)
// @route   GET /api/market/assets
// @access  Private
const getAllAssets = asyncHandler(async (req, res) => {
  const { type, sector, risk, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT symbol, name, asset_type, sector, risk_level, description
    FROM assets
    WHERE is_active = true
  `;
  const params = [];
  let paramCount = 0;

  if (type) {
    paramCount++;
    query += ` AND asset_type = $${paramCount}`;
    params.push(type);
  }

  if (sector) {
    paramCount++;
    query += ` AND sector = $${paramCount}`;
    params.push(sector);
  }

  if (risk) {
    paramCount++;
    query += ` AND risk_level = $${paramCount}`;
    params.push(parseInt(risk));
  }

  query += ` ORDER BY name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(parseInt(limit), offset);

  const result = await pool.query(query, params);

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM assets WHERE is_active = true'
  );

  res.json({
    assets: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count)
    }
  });
});

// @desc    Get portfolio with live prices
// @route   GET /api/market/portfolio/:portfolioId/live
// @access  Private
const getPortfolioLive = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  
  // Verify ownership
  const portfolio = await pool.query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
    [portfolioId, req.user.id]
  );

  if (portfolio.rows.length === 0) {
    res.status(404);
    throw new Error('Portfolio not found');
  }

  const valuation = await portfolioValuation.getPortfolioWithLivePrices(portfolioId);
  
  res.json({
    portfolio: portfolio.rows[0],
    ...valuation
  });
});

// @desc    Get portfolio performance
// @route   GET /api/market/portfolio/:portfolioId/performance
// @access  Private
const getPortfolioPerformance = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const { period = '1M' } = req.query;
  
  // Verify ownership
  const portfolio = await pool.query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
    [portfolioId, req.user.id]
  );

  if (portfolio.rows.length === 0) {
    res.status(404);
    throw new Error('Portfolio not found');
  }

  const performance = await portfolioValuation.calculatePerformance(portfolioId, period);
  
  res.json(performance);
});

// @desc    Get portfolio allocation breakdown
// @route   GET /api/market/portfolio/:portfolioId/allocation
// @access  Private
const getPortfolioAllocation = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  
  // Verify ownership
  const portfolio = await pool.query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
    [portfolioId, req.user.id]
  );

  if (portfolio.rows.length === 0) {
    res.status(404);
    throw new Error('Portfolio not found');
  }

  const allocation = await portfolioValuation.getAllocationBreakdown(portfolioId);
  
  res.json(allocation);
});

// @desc    Trigger portfolio snapshot (for testing/manual)
// @route   POST /api/market/portfolio/:portfolioId/snapshot
// @access  Private
const createSnapshot = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  
  const snapshot = await portfolioValuation.createDailySnapshot(portfolioId);
  
  res.json(snapshot);
});

module.exports = {
  getQuote,
  getBatchQuotes,
  getHistory,
  searchAssets,
  getAssetDetails,
  getAllAssets,
  getPortfolioLive,
  getPortfolioPerformance,
  getPortfolioAllocation,
  createSnapshot
};