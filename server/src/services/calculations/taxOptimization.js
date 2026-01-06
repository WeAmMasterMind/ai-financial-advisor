/**
 * Tax Optimization Service
 * Sprint 11-12: Tax-smart recommendations (informational only)
 * 
 * DISCLAIMER: This provides educational information only, not tax advice.
 * Users should consult a qualified tax professional.
 */

// 2024 Tax brackets (single filer) - for reference
const TAX_BRACKETS_SINGLE_2024 = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 }
];

// Long-term capital gains brackets (single filer)
const LTCG_BRACKETS_2024 = [
  { min: 0, max: 47025, rate: 0.00 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.20 }
];

/**
 * Identify tax-loss harvesting opportunities
 * @param {Array} holdings - User's holdings with cost basis and current value
 * @returns {Array} Holdings with unrealized losses that could be harvested
 */
function identifyTaxLossHarvestingOpportunities(holdings) {
  const opportunities = [];
  
  for (const holding of holdings) {
    const costBasis = holding.quantity * holding.purchase_price;
    const currentValue = holding.quantity * (holding.current_price || holding.purchase_price);
    const unrealizedGainLoss = currentValue - costBasis;
    
    if (unrealizedGainLoss < 0) {
      const lossAmount = Math.abs(unrealizedGainLoss);
      const lossPercent = (lossAmount / costBasis * 100).toFixed(1);
      
      opportunities.push({
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        costBasis,
        currentValue,
        unrealizedLoss: lossAmount,
        lossPercent,
        potentialTaxSavings: estimateTaxSavings(lossAmount, 0.22), // Assume 22% bracket
        recommendation: lossAmount > 100 
          ? 'Consider harvesting this loss to offset gains'
          : 'Small loss - may not be worth transaction costs',
        washSaleWarning: 'Remember the 30-day wash sale rule if repurchasing similar securities'
      });
    }
  }
  
  return opportunities.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);
}

/**
 * Estimate potential tax savings from harvested losses
 */
function estimateTaxSavings(lossAmount, marginalRate) {
  // Losses offset gains first, then up to $3,000 of ordinary income
  return {
    ifOffsettingGains: lossAmount * marginalRate,
    ifOffsettingIncome: Math.min(lossAmount, 3000) * marginalRate,
    note: 'Actual savings depend on your tax situation'
  };
}

/**
 * Identify tax-efficient fund alternatives
 * @param {Array} holdings - Current holdings
 * @returns {Array} Suggestions for more tax-efficient alternatives
 */
function suggestTaxEfficientAlternatives(holdings) {
  const suggestions = [];
  
  // Tax-efficient ETF alternatives for common mutual funds
  const taxEfficientAlternatives = {
    'VFINX': { alt: 'VOO', reason: 'ETF structure is more tax-efficient than mutual fund' },
    'FXAIX': { alt: 'IVV', reason: 'ETF structure is more tax-efficient than mutual fund' },
    'VTSAX': { alt: 'VTI', reason: 'ETF version has same holdings with better tax efficiency' },
    'VBTLX': { alt: 'BND', reason: 'ETF structure is more tax-efficient' }
  };
  
  for (const holding of holdings) {
    const symbol = holding.symbol?.toUpperCase();
    
    if (taxEfficientAlternatives[symbol]) {
      suggestions.push({
        currentHolding: symbol,
        suggestedAlternative: taxEfficientAlternatives[symbol].alt,
        reason: taxEfficientAlternatives[symbol].reason,
        note: 'Consider tax implications before switching'
      });
    }
    
    // Check for high-turnover funds (simplified check)
    if (holding.expense_ratio && holding.expense_ratio > 0.5) {
      suggestions.push({
        currentHolding: symbol,
        issue: 'High expense ratio fund',
        reason: 'High-turnover funds often generate more taxable distributions',
        suggestion: 'Consider lower-cost index fund alternatives'
      });
    }
  }
  
  return suggestions;
}

/**
 * Calculate estimated capital gains
 * @param {Array} holdings - Holdings with purchase dates and prices
 * @returns {Object} Short-term and long-term gains breakdown
 */
function calculateCapitalGains(holdings) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;
  
  const breakdown = [];
  
  for (const holding of holdings) {
    const costBasis = holding.quantity * holding.purchase_price;
    const currentValue = holding.quantity * (holding.current_price || holding.purchase_price);
    const gainLoss = currentValue - costBasis;
    
    const purchaseDate = new Date(holding.purchase_date || holding.created_at);
    const isLongTerm = purchaseDate < oneYearAgo;
    
    if (gainLoss > 0) {
      if (isLongTerm) {
        longTermGains += gainLoss;
      } else {
        shortTermGains += gainLoss;
      }
    } else {
      if (isLongTerm) {
        longTermLosses += Math.abs(gainLoss);
      } else {
        shortTermLosses += Math.abs(gainLoss);
      }
    }
    
    breakdown.push({
      symbol: holding.symbol,
      quantity: holding.quantity,
      costBasis,
      currentValue,
      gainLoss,
      holdingPeriod: isLongTerm ? 'long-term' : 'short-term',
      purchaseDate: purchaseDate.toISOString().split('T')[0]
    });
  }
  
  return {
    shortTerm: {
      gains: shortTermGains,
      losses: shortTermLosses,
      net: shortTermGains - shortTermLosses
    },
    longTerm: {
      gains: longTermGains,
      losses: longTermLosses,
      net: longTermGains - longTermLosses
    },
    total: {
      gains: shortTermGains + longTermGains,
      losses: shortTermLosses + longTermLosses,
      net: (shortTermGains + longTermGains) - (shortTermLosses + longTermLosses)
    },
    breakdown,
    taxNote: 'Short-term gains taxed as ordinary income. Long-term gains have preferential rates.'
  };
}

/**
 * Estimate quarterly tax payment
 * @param {number} estimatedAnnualIncome - Projected annual income
 * @param {number} estimatedWithholding - Amount already withheld
 * @param {string} filingStatus - single, married_joint, married_separate, head_of_household
 * @returns {Object} Estimated quarterly payment information
 */
function estimateQuarterlyTax(estimatedAnnualIncome, estimatedWithholding = 0, filingStatus = 'single') {
  // Use single brackets for simplicity - this is informational only
  const brackets = TAX_BRACKETS_SINGLE_2024;
  
  let totalTax = 0;
  let remainingIncome = estimatedAnnualIncome;
  const breakdown = [];
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );
    
    const taxInBracket = taxableInBracket * bracket.rate;
    totalTax += taxInBracket;
    
    if (taxableInBracket > 0) {
      breakdown.push({
        bracket: `${(bracket.rate * 100).toFixed(0)}%`,
        income: taxableInBracket,
        tax: taxInBracket
      });
    }
    
    remainingIncome -= taxableInBracket;
  }
  
  // Standard deduction for 2024
  const standardDeduction = filingStatus === 'married_joint' ? 29200 : 14600;
  const adjustedIncome = Math.max(0, estimatedAnnualIncome - standardDeduction);
  
  // Recalculate with standard deduction
  let adjustedTax = 0;
  remainingIncome = adjustedIncome;
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    adjustedTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  const remainingTax = Math.max(0, adjustedTax - estimatedWithholding);
  const quarterlyPayment = remainingTax / 4;
  
  return {
    estimatedAnnualIncome,
    standardDeduction,
    taxableIncome: adjustedIncome,
    estimatedTax: adjustedTax,
    alreadyWithheld: estimatedWithholding,
    remainingTax,
    quarterlyPayment,
    dueDates: [
      { quarter: 'Q1', dueDate: 'April 15' },
      { quarter: 'Q2', dueDate: 'June 15' },
      { quarter: 'Q3', dueDate: 'September 15' },
      { quarter: 'Q4', dueDate: 'January 15 (next year)' }
    ],
    disclaimer: 'This is an estimate for informational purposes only. Consult a tax professional for accurate calculations.'
  };
}

/**
 * Get tax optimization recommendations
 * @param {Object} userData - User's financial data
 * @returns {Array} List of recommendations
 */
function getTaxRecommendations(userData) {
  const recommendations = [];
  const { holdings = [], income = 0, contributions = {} } = userData;
  
  // Check for tax-loss harvesting opportunities
  const harvestingOpps = identifyTaxLossHarvestingOpportunities(holdings);
  if (harvestingOpps.length > 0) {
    recommendations.push({
      category: 'Tax-Loss Harvesting',
      priority: 'medium',
      title: `${harvestingOpps.length} potential tax-loss harvesting opportunities`,
      description: `You have ${harvestingOpps.length} positions with unrealized losses totaling $${harvestingOpps.reduce((sum, o) => sum + o.unrealizedLoss, 0).toLocaleString()}`,
      action: 'Review positions for potential harvesting before year-end',
      details: harvestingOpps.slice(0, 3)
    });
  }
  
  // Check retirement contribution room
  const maxIRA = 7000; // 2024 limit
  const max401k = 23000; // 2024 limit
  
  if (!contributions.maxedIRA) {
    recommendations.push({
      category: 'Retirement Contributions',
      priority: 'high',
      title: 'Maximize IRA contributions',
      description: `The 2024 IRA contribution limit is $${maxIRA.toLocaleString()}`,
      action: 'Consider contributing to reduce taxable income',
      potentialSavings: maxIRA * 0.22 // Assume 22% bracket
    });
  }
  
  if (!contributions.maxed401k) {
    recommendations.push({
      category: 'Retirement Contributions',
      priority: 'high',
      title: 'Maximize 401(k) contributions',
      description: `The 2024 401(k) contribution limit is $${max401k.toLocaleString()}`,
      action: 'Pre-tax contributions reduce your taxable income',
      potentialSavings: max401k * 0.22
    });
  }
  
  // Tax-efficient fund suggestions
  const efficientAlts = suggestTaxEfficientAlternatives(holdings);
  if (efficientAlts.length > 0) {
    recommendations.push({
      category: 'Tax-Efficient Investing',
      priority: 'low',
      title: 'Consider more tax-efficient fund alternatives',
      description: `${efficientAlts.length} holdings may have more tax-efficient alternatives`,
      action: 'Review fund structures for tax efficiency',
      details: efficientAlts
    });
  }
  
  return recommendations;
}

module.exports = {
  identifyTaxLossHarvestingOpportunities,
  suggestTaxEfficientAlternatives,
  calculateCapitalGains,
  estimateQuarterlyTax,
  getTaxRecommendations,
  TAX_BRACKETS_SINGLE_2024,
  LTCG_BRACKETS_2024
};
