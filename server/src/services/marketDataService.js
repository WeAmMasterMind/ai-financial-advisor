const axios = require('axios');
const { getRedisClient } = require('../config/redis');
const { pool } = require('../config/database');

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const CACHE_TTL = parseInt(process.env.MARKET_CACHE_TTL) || 900; // 15 minutes

class MarketDataService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  }

  // ============================================
  // PRICE FETCHING
  // ============================================

  async getQuote(symbol) {
    const cacheKey = `quote:${symbol.toUpperCase()}`;
    
    try {
      // Check Redis cache first
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Fetch from Alpha Vantage
      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey
        }
      });

      const data = response.data['Global Quote'];
      
      if (!data || Object.keys(data).length === 0) {
        // Try crypto endpoint if stock not found
        return await this.getCryptoQuote(symbol);
      }

      const quote = {
        symbol: data['01. symbol'],
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent']?.replace('%', '')),
        volume: parseInt(data['06. volume']),
        latestTradingDay: data['07. latest trading day'],
        previousClose: parseFloat(data['08. previous close']),
        open: parseFloat(data['02. open']),
        high: parseFloat(data['03. high']),
        low: parseFloat(data['04. low']),
        timestamp: new Date().toISOString()
      };

      // Cache the result
      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(quote));
      }

      // Update market_prices table
      await this.updateMarketPrice(quote);

      return quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      
      // Try to get from database as fallback
      return await this.getStoredPrice(symbol);
    }
  }

  async getCryptoQuote(symbol) {
    const cacheKey = `crypto:${symbol.toUpperCase()}`;
    
    try {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: symbol.toUpperCase(),
          to_currency: 'USD',
          apikey: this.apiKey
        }
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      
      if (!data) {
        throw new Error(`No data found for crypto ${symbol}`);
      }

      const quote = {
        symbol: data['1. From_Currency Code'],
        price: parseFloat(data['5. Exchange Rate']),
        change: 0,
        changePercent: 0,
        timestamp: data['6. Last Refreshed'],
        isCrypto: true
      };

      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(quote));
      }

      return quote;
    } catch (error) {
      console.error(`Error fetching crypto quote for ${symbol}:`, error.message);
      return null;
    }
  }

  async getBatchQuotes(symbols) {
    const quotes = {};
    
    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(symbol => this.getQuote(symbol))
      );
      
      batch.forEach((symbol, index) => {
        if (results[index]) {
          quotes[symbol] = results[index];
        }
      });

      // Rate limiting delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return quotes;
  }

  // ============================================
  // HISTORICAL DATA
  // ============================================

  async getHistoricalPrices(symbol, outputSize = 'compact') {
    const cacheKey = `history:${symbol.toUpperCase()}:${outputSize}`;
    
    try {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: {
          function: 'TIME_SERIES_DAILY_ADJUSTED',
          symbol: symbol.toUpperCase(),
          outputsize: outputSize, // 'compact' = 100 days, 'full' = 20+ years
          apikey: this.apiKey
        }
      });

      const timeSeries = response.data['Time Series (Daily)'];
      
      if (!timeSeries) {
        throw new Error(`No historical data for ${symbol}`);
      }

      const prices = Object.entries(timeSeries).map(([date, data]) => ({
        date,
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        adjustedClose: parseFloat(data['5. adjusted close']),
        volume: parseInt(data['6. volume'])
      }));

      // Sort by date ascending
      prices.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Cache for 1 hour
      if (redis) {
        await redis.setEx(cacheKey, 3600, JSON.stringify(prices));
      }

      // Store in database
      await this.storePriceHistory(symbol, prices);

      return prices;
    } catch (error) {
      console.error(`Error fetching history for ${symbol}:`, error.message);
      
      // Fallback to database
      return await this.getStoredPriceHistory(symbol);
    }
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  async updateMarketPrice(quote) {
    try {
      await pool.query(`
        INSERT INTO market_prices (symbol, price, volume, day_change, day_change_percent, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (symbol) DO UPDATE SET
          price = EXCLUDED.price,
          volume = EXCLUDED.volume,
          day_change = EXCLUDED.day_change,
          day_change_percent = EXCLUDED.day_change_percent,
          updated_at = CURRENT_TIMESTAMP
      `, [quote.symbol, quote.price, quote.volume, quote.change, quote.changePercent]);
    } catch (error) {
      console.error('Error updating market price:', error.message);
    }
  }

  async getStoredPrice(symbol) {
    try {
      const result = await pool.query(
        'SELECT * FROM market_prices WHERE symbol = $1',
        [symbol.toUpperCase()]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          symbol: row.symbol,
          price: parseFloat(row.price),
          change: parseFloat(row.day_change || 0),
          changePercent: parseFloat(row.day_change_percent || 0),
          volume: parseInt(row.volume || 0),
          timestamp: row.updated_at,
          fromCache: true
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting stored price:', error.message);
      return null;
    }
  }

  async storePriceHistory(symbol, prices) {
    try {
      // Store last 100 days
      const recentPrices = prices.slice(-100);
      
      for (const price of recentPrices) {
        await pool.query(`
          INSERT INTO price_history (symbol, date, open_price, high_price, low_price, close_price, adjusted_close, volume)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (symbol, date) DO UPDATE SET
            close_price = EXCLUDED.close_price,
            adjusted_close = EXCLUDED.adjusted_close
        `, [symbol.toUpperCase(), price.date, price.open, price.high, price.low, price.close, price.adjustedClose, price.volume]);
      }
    } catch (error) {
      console.error('Error storing price history:', error.message);
    }
  }

  async getStoredPriceHistory(symbol, days = 100) {
    try {
      const result = await pool.query(`
        SELECT date, open_price as open, high_price as high, low_price as low, 
               close_price as close, adjusted_close as "adjustedClose", volume
        FROM price_history
        WHERE symbol = $1
        ORDER BY date DESC
        LIMIT $2
      `, [symbol.toUpperCase(), days]);
      
      return result.rows.reverse();
    } catch (error) {
      console.error('Error getting stored history:', error.message);
      return [];
    }
  }

  // ============================================
  // ASSET INFORMATION
  // ============================================

  async getAssetInfo(symbol) {
    try {
      const result = await pool.query(
        'SELECT * FROM assets WHERE symbol = $1',
        [symbol.toUpperCase()]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // If not in database, fetch company overview
      return await this.fetchCompanyOverview(symbol);
    } catch (error) {
      console.error('Error getting asset info:', error.message);
      return null;
    }
  }

  async fetchCompanyOverview(symbol) {
    try {
      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey
        }
      });

      const data = response.data;
      
      if (!data || !data.Symbol) {
        return null;
      }

      const assetInfo = {
        symbol: data.Symbol,
        name: data.Name,
        asset_type: data.AssetType === 'ETF' ? 'etf' : 'stock',
        sector: data.Sector,
        industry: data.Industry,
        market_cap: this.categorizeMarketCap(data.MarketCapitalization),
        description: data.Description,
        exchange: data.Exchange,
        country: data.Country,
        dividend_yield: parseFloat(data.DividendYield) || null
      };

      // Store in database
      await pool.query(`
        INSERT INTO assets (symbol, name, asset_type, sector, industry, market_cap, description, exchange, country, dividend_yield)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (symbol) DO UPDATE SET
          name = EXCLUDED.name,
          sector = EXCLUDED.sector,
          updated_at = CURRENT_TIMESTAMP
      `, [assetInfo.symbol, assetInfo.name, assetInfo.asset_type, assetInfo.sector, 
          assetInfo.industry, assetInfo.market_cap, assetInfo.description, 
          assetInfo.exchange, assetInfo.country, assetInfo.dividend_yield]);

      return assetInfo;
    } catch (error) {
      console.error('Error fetching company overview:', error.message);
      return null;
    }
  }

  categorizeMarketCap(marketCap) {
    const cap = parseInt(marketCap);
    if (cap >= 200000000000) return 'mega';
    if (cap >= 10000000000) return 'large';
    if (cap >= 2000000000) return 'mid';
    if (cap >= 300000000) return 'small';
    return 'micro';
  }

  // ============================================
  // SEARCH
  // ============================================

  async searchAssets(query) {
    try {
      // First search local database
      const localResults = await pool.query(`
        SELECT symbol, name, asset_type, sector, risk_level
        FROM assets
        WHERE is_active = true
          AND (symbol ILIKE $1 OR name ILIKE $1)
        ORDER BY 
          CASE WHEN symbol ILIKE $2 THEN 0 ELSE 1 END,
          name
        LIMIT 20
      `, [`%${query}%`, `${query}%`]);

      if (localResults.rows.length >= 5) {
        return localResults.rows;
      }

      // Supplement with Alpha Vantage search
      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: query,
          apikey: this.apiKey
        }
      });

      const matches = response.data.bestMatches || [];
      const apiResults = matches.map(match => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        asset_type: match['3. type'] === 'ETF' ? 'etf' : 'stock',
        region: match['4. region']
      }));

      // Combine and deduplicate
      const allResults = [...localResults.rows];
      const existingSymbols = new Set(allResults.map(r => r.symbol));
      
      for (const result of apiResults) {
        if (!existingSymbols.has(result.symbol)) {
          allResults.push(result);
        }
      }

      return allResults.slice(0, 20);
    } catch (error) {
      console.error('Error searching assets:', error.message);
      return [];
    }
  }
}

module.exports = new MarketDataService();