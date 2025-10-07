export const calculateBudgetAnalysis = (income, expenses) => {
  const incomeNum = parseFloat(income) || 0;
  const expensesNum = parseFloat(expenses) || 0;
  const savings = incomeNum - expensesNum;
  const savingsRate = incomeNum > 0 ? (savings / incomeNum * 100).toFixed(1) : 0;
  
  return {
    surplus: savings,
    savingsRate,
    recommendation: savingsRate >= 20 ? 'Excellent!' : 
                   savingsRate >= 10 ? 'Good progress!' : 
                   'Consider reducing expenses'
  };
};

export const getPortfolioAllocation = (age, riskTolerance) => {
  const ageNum = parseInt(age) || 30;
  let stocks, bonds, alternatives;
  
  if (riskTolerance === 'conservative') {
    stocks = Math.max(20, 60 - (ageNum - 25) * 0.5);
    bonds = Math.min(70, 30 + (ageNum - 25) * 0.5);
    alternatives = 10;
  } else if (riskTolerance === 'moderate') {
    stocks = Math.max(40, 80 - (ageNum - 25) * 0.7);
    bonds = Math.min(50, 15 + (ageNum - 25) * 0.6);
    alternatives = 100 - stocks - bonds;
  } else { // aggressive
    stocks = Math.max(60, 90 - (ageNum - 25) * 0.4);
    bonds = Math.min(25, 5 + (ageNum - 25) * 0.3);
    alternatives = 100 - stocks - bonds;
  }
  
  return {
    stocks: Math.round(stocks),
    bonds: Math.round(bonds),
    alternatives: Math.round(alternatives)
  };
};