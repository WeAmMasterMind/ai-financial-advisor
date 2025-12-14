const { pool } = require('../config/database');
const marketDataService = require('./marketDataService');

class SuggestionEngine {
  
  // Risk level mapping for asset types
  static RISK_PROFILES = {
    conservative: { min: 1, max: 3 },
    moderate: { min: 4, max: 6 },
    aggressive: { min: 7, max: 10 }
  };

  // Target allocations by risk level
  static TARGET_ALLOCATIONS = {
    1: { bonds: 80, stocks: 15, alternatives: 5 },
    2: { bonds: 70, stocks: 25, alternatives: 5 },
    3: { bonds: 60, stocks: 35, alternatives: 5 },
    4: { bonds: 45, stocks: 45, alternatives: 10 },
    5: { bonds: 35, stocks: 55, alternatives: 10 },
    6: { bonds: 25, stocks: 60, alternatives: 15 },
    7: { bonds: 15, stocks: 70, alternatives: 15 },
    8: { bonds: 10, stocks: 75, alternatives: 15 },
    9: { bonds: 5, stocks: 75, alternatives: 20 },
    10: { bonds: 0, stocks: 80, alternatives: 20 }
  };

  // ============================================
  // MAIN SUGGESTION GENERATOR
  // ============================================

  async generateSuggestions(userId) {
    try {
      // Get user's risk profile
      const riskProfile = await this.getUserRiskProfile(userId);
      if (!riskProfile) {
        return { error: 'Complete the financial questionnaire first' };
      }

      // Get user's current portfolio
      const portfolio = await this.getUserPortfolio(userId);
      
      // Analyze current allocation
      const currentAllocation = this.analyzeAllocation(portfolio.holdings);
      
      // Get target allocation based on risk score
      const targetAllocation = SuggestionEngine.TARGET_ALLOCATIONS[riskProfile.riskScore];
      
      // Generate suggestions
      const suggestions = [];

      // 1. Allocation gap suggestions
      const allocationSuggestions = await this.generateAllocationSuggestions(
        currentAllocation, 
        targetAllocation, 
        riskProfile.riskScore
      );
      suggestions.push(...allocationSuggestions);

      // 2. Diversification suggestions
      const diversificationSuggestions = await this.generateDiversificationSuggestions(
        portfolio.holdings,
        riskProfile.riskScore
      );
      suggestions.push(...diversificationSuggestions);

      // 3. Sector gap suggestions
      const sectorSuggestions = await this.generateSectorSuggestions(
        portfolio.holdings,
        riskProfile.riskScore
      );
      suggestions.push(...sectorSuggestions);

      // Store suggestions in database
      await this.storeSuggestions(userId, suggestions);

      return {
        riskScore: riskProfile.riskScore,
        currentAllocation,
        targetAllocation,
        suggestions: suggestions.slice(0, 10) // Top 10 suggestions
      };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }

  // ============================================
  // USER DATA RETRIEVAL
  // ============================================

  async getUserRiskProfile(userId) {
    const result = await pool.query(`
      SELECT risk_score, investment_experience, investment_goal, time_horizon
      FROM financial_questionnaire
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) return null;

    return {
      riskScore: result.rows[0].risk_score,
      experience: result.rows[0].investment_experience,
      goal: result.rows[0].investment_goal,
      timeHorizon: result.rows[0].time_horizon
    };
  }

  async getUserPortfolio(userId) {
    // Get primary portfolio
    const portfolioResult = await pool.query(`
      SELECT p.*, 
        (SELECT COALESCE(SUM(h.quantity * h.purchase_price), 0) 
         FROM holdings h WHERE h.portfolio_id = p.id) as total_invested
      FROM portfolios p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 1
    `, [userId]);

    if (portfolioResult.rows.length === 0) {
      return { holdings: [], totalValue: 0 };
    }

    const portfolio = portfolioResult.rows[0];

    // Get holdings with asset info
    const holdingsResult = await pool.query(`
      SELECT h.*, a.sector, a.asset_type as asset_category, a.risk_level as asset_risk
      FROM holdings h
      LEFT JOIN assets a ON h.symbol = a.symbol
      WHERE h.portfolio_id = $1
    `, [portfolio.id]);

    return {
      id: portfolio.id,
      holdings: holdingsResult.rows,
      totalInvested: parseFloat(portfolio.total_invested)
    };
  }

  // ============================================
  // ALLOCATION ANALYSIS
  // ============================================

  analyzeAllocation(holdings) {
    const totalValue = holdings.reduce((sum, h) => 
      sum + (h.quantity * (h.current_price || h.purchase_price)), 0
    );

    if (totalValue === 0) {
      return { bonds: 0, stocks: 0, alternatives: 0, cash: 100 };
    }

    const allocation = {
      bonds: 0,
      stocks: 0,
      alternatives: 0,
      cash: 0
    };

    for (const holding of holdings) {
      const value = holding.quantity * (holding.current_price || holding.purchase_price);
      const percentage = (value / totalValue) * 100;
      const assetType = holding.asset_class || holding.asset_category || 'stock';

      if (['bond', 'bonds'].includes(assetType.toLowerCase())) {
        allocation.bonds += percentage;
      } else if (['crypto', 'reit', 'commodity', 'alternative'].includes(assetType.toLowerCase())) {
        allocation.alternatives += percentage;
      } else {
        allocation.stocks += percentage;
      }
    }

    return allocation;
  }

  // ============================================
  // SUGGESTION GENERATORS
  // ============================================

  async generateAllocationSuggestions(current, target, riskScore) {
    const suggestions = [];

    // Check bonds allocation
    const bondsDiff = target.bonds - (current.bonds || 0);
    if (bondsDiff > 10) {
      const bondAssets = await this.getAssetsByCategory('bonds', riskScore);
      if (bondAssets.length > 0) {
        suggestions.push({
          symbol: bondAssets[0].symbol,
          type: 'allocation_gap',
          category: 'bonds',
          reason: `Your portfolio is ${Math.abs(bondsDiff).toFixed(0)}% underweight in bonds. Consider adding ${bondAssets[0].name} for stability.`,
          priority: Math.min(10, Math.floor(bondsDiff / 5)),
          suggestedAllocation: bondsDiff,
          confidence: 0.85
        });
      }
    }

    // Check stocks allocation
    const stocksDiff = target.stocks - (current.stocks || 0);
    if (stocksDiff > 10) {
      const stockAssets = await this.getAssetsByCategory('stocks', riskScore);
      if (stockAssets.length > 0) {
        suggestions.push({
          symbol: stockAssets[0].symbol,
          type: 'allocation_gap',
          category: 'stocks',
          reason: `Your portfolio is ${Math.abs(stocksDiff).toFixed(0)}% underweight in stocks. Consider ${stockAssets[0].name} for growth potential.`,
          priority: Math.min(10, Math.floor(stocksDiff / 5)),
          suggestedAllocation: stocksDiff,
          confidence: 0.80
        });
      }
    }

    // Check alternatives allocation
    const altsDiff = target.alternatives - (current.alternatives || 0);
    if (altsDiff > 5) {
      const altAssets = await this.getAssetsByCategory('alternatives', riskScore);
      if (altAssets.length > 0) {
        suggestions.push({
          symbol: altAssets[0].symbol,
          type: 'allocation_gap',
          category: 'alternatives',
          reason: `Consider adding ${altAssets[0].name} for diversification into alternative assets.`,
          priority: Math.min(8, Math.floor(altsDiff / 3)),
          suggestedAllocation: altsDiff,
          confidence: 0.70
        });
      }
    }

    return suggestions;
  }

  async generateDiversificationSuggestions(holdings, riskScore) {
    const suggestions = [];
    
    // Check for concentration risk
    const totalValue = holdings.reduce((sum, h) => 
      sum + (h.quantity * (h.current_price || h.purchase_price)), 0
    );

    for (const holding of holdings) {
      const value = holding.quantity * (holding.current_price || holding.purchase_price);
      const percentage = (value / totalValue) * 100;

      if (percentage > 25) {
        suggestions.push({
          symbol: holding.symbol,
          type: 'concentration_warning',
          reason: `${holding.symbol} represents ${percentage.toFixed(0)}% of your portfolio. Consider diversifying to reduce risk.`,
          priority: 9,
          confidence: 0.90
        });
      }
    }

    // Suggest broad market ETF if less than 5 holdings
    if (holdings.length < 5 && holdings.length > 0) {
      const etfSuggestion = riskScore >= 6 ? 'VTI' : 'VOO';
      suggestions.push({
        symbol: etfSuggestion,
        type: 'diversification',
        reason: `With only ${holdings.length} holding(s), consider adding a broad market ETF like ${etfSuggestion} for instant diversification.`,
        priority: 8,
        confidence: 0.85
      });
    }

    return suggestions;
  }

  async generateSectorSuggestions(holdings, riskScore) {
    const suggestions = [];
    
    // Get sectors in current portfolio
    const currentSectors = new Set(
      holdings
        .filter(h => h.sector)
        .map(h => h.sector)
    );

    // Key sectors to have exposure to
    const importantSectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Defensive'];
    
    for (const sector of importantSectors) {
      if (!currentSectors.has(sector)) {
        const sectorAssets = await this.getAssetsBySector(sector, riskScore);
        if (sectorAssets.length > 0) {
          suggestions.push({
            symbol: sectorAssets[0].symbol,
            type: 'sector_gap',
            category: sector,
            reason: `Your portfolio has no exposure to ${sector}. Consider ${sectorAssets[0].name} (${sectorAssets[0].symbol}).`,
            priority: 5,
            confidence: 0.70
          });
        }
      }
    }

    return suggestions;
  }

  // ============================================
  // ASSET RETRIEVAL HELPERS
  // ============================================

  async getAssetsByCategory(category, userRiskScore) {
    let assetTypes, riskRange;

    switch (category) {
      case 'bonds':
        assetTypes = ['bond', 'etf'];
        riskRange = [1, 3];
        break;
      case 'stocks':
        assetTypes = ['stock', 'etf'];
        riskRange = [Math.max(1, userRiskScore - 2), Math.min(10, userRiskScore + 2)];
        break;
      case 'alternatives':
        assetTypes = ['reit', 'crypto', 'etf'];
        riskRange = [userRiskScore - 1, userRiskScore + 1];
        break;
      default:
        assetTypes = ['stock', 'etf'];
        riskRange = [1, 10];
    }

    const result = await pool.query(`
      SELECT symbol, name, asset_type, sector, risk_level, description
      FROM assets
      WHERE asset_type = ANY($1)
        AND risk_level BETWEEN $2 AND $3
        AND is_active = true
      ORDER BY 
        CASE WHEN asset_type = 'etf' THEN 0 ELSE 1 END,
        risk_level
      LIMIT 5
    `, [assetTypes, riskRange[0], riskRange[1]]);

    return result.rows;
  }

  async getAssetsBySector(sector, userRiskScore) {
    const result = await pool.query(`
      SELECT symbol, name, asset_type, sector, risk_level
      FROM assets
      WHERE sector = $1
        AND risk_level BETWEEN $2 AND $3
        AND is_active = true
      ORDER BY 
        CASE WHEN asset_type = 'etf' THEN 0 ELSE 1 END,
        ABS(risk_level - $4)
      LIMIT 3
    `, [sector, Math.max(1, userRiskScore - 3), Math.min(10, userRiskScore + 3), userRiskScore]);

    return result.rows;
  }

  // ============================================
  // STORAGE
  // ============================================

  async storeSuggestions(userId, suggestions) {
    // Clear old pending suggestions
    await pool.query(`
      DELETE FROM investment_suggestions
      WHERE user_id = $1 AND status = 'pending'
    `, [userId]);

    // Insert new suggestions
    for (const suggestion of suggestions) {
      await pool.query(`
        INSERT INTO investment_suggestions 
        (user_id, symbol, suggestion_type, reason, confidence_score, priority, suggested_allocation, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        userId,
        suggestion.symbol,
        suggestion.type,
        suggestion.reason,
        suggestion.confidence,
        suggestion.priority,
        suggestion.suggestedAllocation || null,
        JSON.stringify({ category: suggestion.category })
      ]);
    }
  }

  async getSuggestions(userId, status = 'pending') {
    const result = await pool.query(`
      SELECT s.*, a.name, a.asset_type, a.sector, a.description
      FROM investment_suggestions s
      LEFT JOIN assets a ON s.symbol = a.symbol
      WHERE s.user_id = $1 
        AND ($2 = 'all' OR s.status = $2)
      ORDER BY s.priority DESC, s.created_at DESC
      LIMIT 20
    `, [userId, status]);

    return result.rows;
  }

  async updateSuggestionStatus(suggestionId, userId, status) {
    await pool.query(`
      UPDATE investment_suggestions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
    `, [status, suggestionId, userId]);
  }
}

module.exports = new SuggestionEngine();