/**
 * Portfolio Allocation Utilities
 * Risk-based allocation recommendations and rebalancing calculations
 */

/**
 * Model portfolios based on risk tolerance
 */
const MODEL_PORTFOLIOS = {
  conservative: {
    name: 'Conservative',
    riskRange: [1, 3],
    allocation: {
      us_stocks: 20,
      intl_stocks: 10,
      bonds: 50,
      real_estate: 10,
      cash: 10
    },
    description: 'Focus on capital preservation with modest growth'
  },
  moderately_conservative: {
    name: 'Moderately Conservative',
    riskRange: [3, 4],
    allocation: {
      us_stocks: 30,
      intl_stocks: 15,
      bonds: 40,
      real_estate: 10,
      cash: 5
    },
    description: 'Balance between stability and growth'
  },
  moderate: {
    name: 'Moderate',
    riskRange: [4, 6],
    allocation: {
      us_stocks: 40,
      intl_stocks: 20,
      bonds: 30,
      real_estate: 7,
      cash: 3
    },
    description: 'Balanced approach for long-term growth'
  },
  moderately_aggressive: {
    name: 'Moderately Aggressive',
    riskRange: [6, 8],
    allocation: {
      us_stocks: 50,
      intl_stocks: 25,
      bonds: 15,
      real_estate: 7,
      cash: 3
    },
    description: 'Growth-focused with some stability'
  },
  aggressive: {
    name: 'Aggressive',
    riskRange: [8, 10],
    allocation: {
      us_stocks: 55,
      intl_stocks: 30,
      bonds: 5,
      real_estate: 5,
      alternatives: 5
    },
    description: 'Maximum growth potential, higher volatility'
  }
};

/**
 * Asset class definitions with suggested ETFs
 */
const ASSET_CLASSES = {
  us_stocks: {
    name: 'US Stocks',
    color: '#3B82F6',
    suggestedETFs: ['VTI', 'SPY', 'IVV', 'VOO', 'ITOT']
  },
  intl_stocks: {
    name: 'International Stocks',
    color: '#10B981',
    suggestedETFs: ['VXUS', 'VEU', 'IXUS', 'VWO', 'IEFA']
  },
  bonds: {
    name: 'Bonds',
    color: '#6366F1',
    suggestedETFs: ['BND', 'AGG', 'VBTLX', 'TLT', 'VCIT']
  },
  real_estate: {
    name: 'Real Estate',
    color: '#F59E0B',
    suggestedETFs: ['VNQ', 'SCHH', 'IYR', 'XLRE']
  },
  cash: {
    name: 'Cash & Equivalents',
    color: '#6B7280',
    suggestedETFs: ['SGOV', 'BIL', 'SHV', 'VMFXX']
  },
  alternatives: {
    name: 'Alternatives',
    color: '#EC4899',
    suggestedETFs: ['GLD', 'IAU', 'PDBC', 'DBC']
  },
  crypto: {
    name: 'Cryptocurrency',
    color: '#8B5CF6',
    suggestedETFs: ['BITO', 'GBTC', 'ETHE']
  }
};

/**
 * Get recommended allocation based on risk score and age
 * @param {number} riskScore - Risk tolerance (1-10)
 * @param {number} age - User's age
 * @param {string} investmentHorizon - short/medium/long/very_long
 * @returns {Object} Recommended allocation
 */
function getRecommendedAllocation(riskScore, age = 30, investmentHorizon = 'long') {
  // Determine base model portfolio from risk score
  let modelKey = 'moderate';
  
  if (riskScore <= 2) modelKey = 'conservative';
  else if (riskScore <= 4) modelKey = 'moderately_conservative';
  else if (riskScore <= 6) modelKey = 'moderate';
  else if (riskScore <= 8) modelKey = 'moderately_aggressive';
  else modelKey = 'aggressive';

  const model = MODEL_PORTFOLIOS[modelKey];
  let allocation = { ...model.allocation };

  // Age-based adjustment (increase bonds as age increases)
  // Rule of thumb: bond percentage roughly equals age, but capped
  const ageAdjustment = Math.max(0, Math.min(20, (age - 30) / 2));
  
  if (ageAdjustment > 0 && allocation.bonds !== undefined) {
    const stockReduction = ageAdjustment / 2;
    
    if (allocation.us_stocks) {
      allocation.us_stocks = Math.max(10, allocation.us_stocks - stockReduction);
    }
    if (allocation.intl_stocks) {
      allocation.intl_stocks = Math.max(5, allocation.intl_stocks - stockReduction / 2);
    }
    allocation.bonds = Math.min(70, allocation.bonds + ageAdjustment);
  }

  // Horizon adjustment
  if (investmentHorizon === 'short') {
    // Shorter horizon = more conservative
    allocation.bonds = Math.min(60, (allocation.bonds || 0) + 15);
    allocation.cash = Math.min(20, (allocation.cash || 0) + 5);
    allocation.us_stocks = Math.max(15, (allocation.us_stocks || 0) - 15);
    allocation.intl_stocks = Math.max(5, (allocation.intl_stocks || 0) - 5);
  } else if (investmentHorizon === 'very_long') {
    // Longer horizon = can be more aggressive
    allocation.us_stocks = Math.min(65, (allocation.us_stocks || 0) + 5);
    allocation.intl_stocks = Math.min(35, (allocation.intl_stocks || 0) + 5);
    allocation.bonds = Math.max(5, (allocation.bonds || 0) - 10);
  }

  // Normalize to 100%
  const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
  if (total !== 100) {
    const factor = 100 / total;
    for (const key in allocation) {
      allocation[key] = Math.round(allocation[key] * factor * 10) / 10;
    }
  }

  return {
    modelName: model.name,
    description: model.description,
    riskLevel: modelKey,
    allocation,
    assetClasses: Object.keys(allocation).map(key => ({
      class: key,
      ...ASSET_CLASSES[key],
      targetPercentage: allocation[key]
    }))
  };
}

/**
 * Calculate current allocation from holdings
 * @param {Array} holdings - Array of holding objects
 * @returns {Object} Current allocation percentages by asset class
 */
function calculateCurrentAllocation(holdings) {
  if (!holdings || holdings.length === 0) {
    return { allocation: {}, totalValue: 0 };
  }

  const totalValue = holdings.reduce((sum, h) => {
    const value = (parseFloat(h.quantity) || 0) * (parseFloat(h.current_price) || parseFloat(h.purchase_price) || 0);
    return sum + value;
  }, 0);

  if (totalValue === 0) {
    return { allocation: {}, totalValue: 0 };
  }

  const allocationByClass = {};
  
  holdings.forEach(holding => {
    const value = (parseFloat(holding.quantity) || 0) * 
                  (parseFloat(holding.current_price) || parseFloat(holding.purchase_price) || 0);
    const assetClass = holding.asset_class || 'other';
    
    if (!allocationByClass[assetClass]) {
      allocationByClass[assetClass] = 0;
    }
    allocationByClass[assetClass] += value;
  });

  // Convert to percentages
  const allocation = {};
  for (const [key, value] of Object.entries(allocationByClass)) {
    allocation[key] = Math.round((value / totalValue) * 1000) / 10;
  }

  return { allocation, totalValue };
}

/**
 * Calculate drift between current and target allocation
 * @param {Object} currentAllocation - Current allocation percentages
 * @param {Object} targetAllocation - Target allocation percentages
 * @param {number} threshold - Drift threshold percentage (default 5%)
 * @returns {Object} Drift analysis
 */
function calculateDrift(currentAllocation, targetAllocation, threshold = 5) {
  const drifts = [];
  const allClasses = new Set([
    ...Object.keys(currentAllocation),
    ...Object.keys(targetAllocation)
  ]);

  for (const assetClass of allClasses) {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass] || 0;
    const drift = current - target;
    const needsRebalance = Math.abs(drift) > threshold;

    drifts.push({
      assetClass,
      classInfo: ASSET_CLASSES[assetClass] || { name: assetClass, color: '#9CA3AF' },
      current: Math.round(current * 10) / 10,
      target: Math.round(target * 10) / 10,
      drift: Math.round(drift * 10) / 10,
      needsRebalance,
      action: drift > threshold ? 'SELL' : drift < -threshold ? 'BUY' : 'HOLD'
    });
  }

  const needsRebalancing = drifts.some(d => d.needsRebalance);
  const maxDrift = Math.max(...drifts.map(d => Math.abs(d.drift)));

  return {
    drifts: drifts.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift)),
    needsRebalancing,
    maxDrift,
    threshold
  };
}

/**
 * Generate rebalancing plan
 * @param {Array} holdings - Current holdings
 * @param {Object} targetAllocation - Target allocation percentages
 * @param {number} threshold - Drift threshold
 * @returns {Object} Rebalancing recommendations
 */
function generateRebalancePlan(holdings, targetAllocation, threshold = 5) {
  const { allocation: currentAllocation, totalValue } = calculateCurrentAllocation(holdings);
  const drift = calculateDrift(currentAllocation, targetAllocation, threshold);

  if (!drift.needsRebalancing) {
    return {
      needsRebalancing: false,
      message: 'Portfolio is within acceptable drift tolerance',
      currentAllocation,
      targetAllocation,
      totalValue
    };
  }

  const trades = [];

  for (const d of drift.drifts) {
    if (!d.needsRebalance) continue;

    const targetValue = (d.target / 100) * totalValue;
    const currentValue = (d.current / 100) * totalValue;
    const difference = targetValue - currentValue;

    trades.push({
      assetClass: d.assetClass,
      classInfo: d.classInfo,
      action: difference > 0 ? 'BUY' : 'SELL',
      amount: Math.abs(Math.round(difference * 100) / 100),
      currentValue: Math.round(currentValue * 100) / 100,
      targetValue: Math.round(targetValue * 100) / 100,
      currentPercent: d.current,
      targetPercent: d.target
    });
  }

  return {
    needsRebalancing: true,
    trades: trades.sort((a, b) => b.amount - a.amount),
    currentAllocation,
    targetAllocation,
    totalValue,
    drift: drift.drifts
  };
}

/**
 * Calculate portfolio performance
 * @param {Array} holdings - Array of holdings
 * @returns {Object} Performance metrics
 */
function calculatePerformance(holdings) {
  if (!holdings || holdings.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercent: 0,
      holdings: []
    };
  }

  let totalValue = 0;
  let totalCost = 0;

  const holdingsWithGains = holdings.map(h => {
    const quantity = parseFloat(h.quantity) || 0;
    const purchasePrice = parseFloat(h.purchase_price) || 0;
    const currentPrice = parseFloat(h.current_price) || purchasePrice;
    
    const cost = quantity * purchasePrice;
    const value = quantity * currentPrice;
    const gain = value - cost;
    const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

    totalValue += value;
    totalCost += cost;

    return {
      ...h,
      cost: Math.round(cost * 100) / 100,
      value: Math.round(value * 100) / 100,
      gain: Math.round(gain * 100) / 100,
      gainPercent: Math.round(gainPercent * 100) / 100
    };
  });

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    totalGainPercent: Math.round(totalGainPercent * 100) / 100,
    holdings: holdingsWithGains
  };
}

module.exports = {
  MODEL_PORTFOLIOS,
  ASSET_CLASSES,
  getRecommendedAllocation,
  calculateCurrentAllocation,
  calculateDrift,
  generateRebalancePlan,
  calculatePerformance
};