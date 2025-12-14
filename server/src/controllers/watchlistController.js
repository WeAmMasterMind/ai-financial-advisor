const asyncHandler = require('express-async-handler');
const { pool } = require('../config/database');
const marketDataService = require('../services/marketDataService');

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT w.*, a.name, a.asset_type, a.sector
    FROM watchlist w
    LEFT JOIN assets a ON w.symbol = a.symbol
    WHERE w.user_id = $1
    ORDER BY w.added_at DESC
  `, [req.user.id]);

  const symbols = result.rows.map(w => w.symbol);
  const prices = symbols.length > 0 
    ? await marketDataService.getBatchQuotes(symbols)
    : {};

  const watchlistWithPrices = result.rows.map(item => ({
    ...item,
    currentPrice: prices[item.symbol]?.price || null,
    dayChange: prices[item.symbol]?.change || null,
    dayChangePercent: prices[item.symbol]?.changePercent || null
  }));

  res.json(watchlistWithPrices);
});

// @desc    Add to watchlist
// @route   POST /api/watchlist
// @access  Private
const addToWatchlist = asyncHandler(async (req, res) => {
  const { symbol, notes, targetBuyPrice } = req.body;

  if (!symbol) {
    res.status(400);
    throw new Error('Symbol is required');
  }

  const assetInfo = await marketDataService.getAssetInfo(symbol);

  const result = await pool.query(`
    INSERT INTO watchlist (user_id, symbol, asset_type, notes, target_buy_price)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      notes = EXCLUDED.notes,
      target_buy_price = EXCLUDED.target_buy_price
    RETURNING *
  `, [req.user.id, symbol.toUpperCase(), assetInfo?.asset_type || 'stock', notes, targetBuyPrice]);

  res.status(201).json(result.rows[0]);
});

// @desc    Remove from watchlist
// @route   DELETE /api/watchlist/:symbol
// @access  Private
const removeFromWatchlist = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  await pool.query(
    'DELETE FROM watchlist WHERE user_id = $1 AND symbol = $2',
    [req.user.id, symbol.toUpperCase()]
  );

  res.json({ message: 'Removed from watchlist' });
});

// @desc    Update watchlist item
// @route   PATCH /api/watchlist/:symbol
// @access  Private
const updateWatchlistItem = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { notes, targetBuyPrice } = req.body;

  const result = await pool.query(`
    UPDATE watchlist
    SET notes = COALESCE($1, notes),
        target_buy_price = COALESCE($2, target_buy_price)
    WHERE user_id = $3 AND symbol = $4
    RETURNING *
  `, [notes, targetBuyPrice, req.user.id, symbol.toUpperCase()]);

  if (result.rows.length === 0) {
    res.status(404);
    throw new Error('Watchlist item not found');
  }

  res.json(result.rows[0]);
});

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem
};