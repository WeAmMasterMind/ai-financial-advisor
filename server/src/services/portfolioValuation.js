const { pool } = require('../config/database');
const marketDataService = require('./marketDataService');

class PortfolioValuation {

  // ============================================
  // LIVE PORTFOLIO VALUATION
  // ============================================

  async getPortfolioWithLivePrices(portfolioId) {
    // Get holdings
    const holdingsResult = await pool.query(`
      SELECT h.*, a.name, a.asset_type, a.sector
      FROM holdings h
      LEFT JOIN assets a ON h.symbol = a.symbol
      WHERE h.portfolio_id = $1
    `, [portfolioId]);

    const holdings = holdingsResult.rows;
    
    if (holdings.length === 0) {
      return {
        holdings: [],
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0
      };
    }

    // Get live prices for all symbols
    const symbols = holdings.map(h => h.symbol);
    const prices = await marketDataService.getBatchQuotes(symbols);

    // Calculate values
    let totalValue = 0;
    let totalCost = 0;

    const enrichedHoldings = holdings.map(holding => {
      const quote = prices[holding.symbol];
      const currentPrice = quote?.price || holding.current_price || holding.purchase_price;
      const value = holding.quantity * currentPrice;
      const cost = holding.quantity * holding.purchase_price;
      const gain = value - cost;
      const gainPercent = cost > 0 ? ((gain / cost) * 100) : 0;

      totalValue += value;
      totalCost += cost;

      return {
        ...holding,
        currentPrice,
        value,
        cost,
        gain,
        gainPercent,
        dayChange: quote?.change || 0,
        dayChangePercent: quote?.changePercent || 0,
        priceUpdatedAt: quote?.timestamp || holding.last_price_update
      };
    });

    // Update holdings with current prices
    await this.updateHoldingsPrices(enrichedHoldings);

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? ((totalGain / totalCost) * 100) : 0;

    return {
      holdings: enrichedHoldings,
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent
    };
  }

  async updateHoldingsPrices(holdings) {
    for (const holding of holdings) {
      await pool.query(`
        UPDATE holdings
        SET current_price = $1, last_price_update = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [holding.currentPrice, holding.id]);
    }
  }

  // ============================================
  // PERFORMANCE TRACKING
  // ============================================

  async calculatePerformance(portfolioId, period = '1M') {
    const periodDays = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'YTD': this.getDaysFromYearStart(),
      'ALL': 9999
    };

    const days = periodDays[period] || 30;

    // Get snapshots
    const snapshots = await pool.query(`
      SELECT date, total_value, day_change, day_change_percent
      FROM portfolio_snapshots
      WHERE portfolio_id = $1
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `, [portfolioId]);

    if (snapshots.rows.length < 2) {
      return {
        period,
        startValue: 0,
        endValue: 0,
        absoluteChange: 0,
        percentChange: 0,
        dataPoints: []
      };
    }

    const startValue = parseFloat(snapshots.rows[0].total_value);
    const endValue = parseFloat(snapshots.rows[snapshots.rows.length - 1].total_value);
    const absoluteChange = endValue - startValue;
    const percentChange = startValue > 0 ? ((absoluteChange / startValue) * 100) : 0;

    return {
      period,
      startValue,
      endValue,
      absoluteChange,
      percentChange,
      dataPoints: snapshots.rows.map(s => ({
        date: s.date,
        value: parseFloat(s.total_value)
      }))
    };
  }

  getDaysFromYearStart() {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return Math.floor((now - yearStart) / (1000 * 60 * 60 * 24));
  }

  // ============================================
  // SNAPSHOT CREATION
  // ============================================

  async createDailySnapshot(portfolioId) {
    const valuation = await this.getPortfolioWithLivePrices(portfolioId);
    
    // Get yesterday's snapshot for day change calculation
    const yesterdayResult = await pool.query(`
      SELECT total_value FROM portfolio_snapshots
      WHERE portfolio_id = $1
      ORDER BY date DESC
      LIMIT 1
    `, [portfolioId]);

    const yesterdayValue = yesterdayResult.rows[0]?.total_value || valuation.totalCost;
    const dayChange = valuation.totalValue - parseFloat(yesterdayValue);
    const dayChangePercent = yesterdayValue > 0 
      ? ((dayChange / parseFloat(yesterdayValue)) * 100) 
      : 0;

    // Insert or update today's snapshot
    await pool.query(`
      INSERT INTO portfolio_snapshots 
      (portfolio_id, date, total_value, total_cost, day_change, day_change_percent, holdings_snapshot)
      VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
      ON CONFLICT (portfolio_id, date) DO UPDATE SET
        total_value = EXCLUDED.total_value,
        day_change = EXCLUDED.day_change,
        day_change_percent = EXCLUDED.day_change_percent,
        holdings_snapshot = EXCLUDED.holdings_snapshot
    `, [
      portfolioId,
      valuation.totalValue,
      valuation.totalCost,
      dayChange,
      dayChangePercent,
      JSON.stringify(valuation.holdings.map(h => ({
        symbol: h.symbol,
        quantity: h.quantity,
        price: h.currentPrice,
        value: h.value
      })))
    ]);

    return {
      date: new Date().toISOString().split('T')[0],
      totalValue: valuation.totalValue,
      dayChange,
      dayChangePercent
    };
  }

  // ============================================
  // ALLOCATION BREAKDOWN
  // ============================================

  async getAllocationBreakdown(portfolioId) {
    const valuation = await this.getPortfolioWithLivePrices(portfolioId);
    
    const byAssetType = {};
    const bySector = {};
    const bySymbol = {};

    for (const holding of valuation.holdings) {
      const assetType = holding.asset_type || holding.asset_class || 'Other';
      const sector = holding.sector || 'Other';
      
      // By asset type
      if (!byAssetType[assetType]) {
        byAssetType[assetType] = { value: 0, percentage: 0 };
      }
      byAssetType[assetType].value += holding.value;

      // By sector
      if (!bySector[sector]) {
        bySector[sector] = { value: 0, percentage: 0 };
      }
      bySector[sector].value += holding.value;

      // By symbol
      bySymbol[holding.symbol] = {
        name: holding.name || holding.symbol,
        value: holding.value,
        percentage: 0
      };
    }

    // Calculate percentages
    const totalValue = valuation.totalValue;
    
    Object.keys(byAssetType).forEach(key => {
      byAssetType[key].percentage = totalValue > 0 
        ? (byAssetType[key].value / totalValue) * 100 
        : 0;
    });

    Object.keys(bySector).forEach(key => {
      bySector[key].percentage = totalValue > 0 
        ? (bySector[key].value / totalValue) * 100 
        : 0;
    });

    Object.keys(bySymbol).forEach(key => {
      bySymbol[key].percentage = totalValue > 0 
        ? (bySymbol[key].value / totalValue) * 100 
        : 0;
    });

    return {
      totalValue,
      byAssetType,
      bySector,
      bySymbol
    };
  }
}

module.exports = new PortfolioValuation();