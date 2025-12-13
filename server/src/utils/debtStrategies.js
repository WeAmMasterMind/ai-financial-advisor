/**
 * Debt Payoff Strategy Engine
 * Implements Snowball, Avalanche, and comparison algorithms
 */

const { 
  calculateMonthlyInterest, 
  calculatePayoffDate 
} = require('./financialCalculations');

/**
 * Sort debts for Snowball method (lowest balance first)
 * @param {Array} debts - Array of debt objects
 * @returns {Array} Sorted debts
 */
function snowballSort(debts) {
  return [...debts].sort((a, b) => a.current_balance - b.current_balance);
}

/**
 * Sort debts for Avalanche method (highest interest rate first)
 * @param {Array} debts - Array of debt objects
 * @returns {Array} Sorted debts
 */
function avalancheSort(debts) {
  return [...debts].sort((a, b) => b.interest_rate - a.interest_rate);
}

/**
 * Generate complete payoff schedule for a strategy
 * @param {Array} debts - Array of debt objects with: id, debt_name, current_balance, interest_rate, minimum_payment
 * @param {number} monthlyExtra - Extra amount to pay beyond minimums
 * @param {string} strategy - 'snowball' or 'avalanche'
 * @returns {Object} Complete payoff analysis
 */
function generatePayoffSchedule(debts, monthlyExtra = 0, strategy = 'avalanche') {
  // Validate inputs
  if (!debts || debts.length === 0) {
    return {
      schedule: [],
      summary: {
        totalMonths: 0,
        totalInterest: 0,
        totalPaid: 0,
        payoffDate: new Date()
      }
    };
  }

  // Sort debts based on strategy
  const sortedDebts = strategy === 'snowball' 
    ? snowballSort(debts) 
    : avalancheSort(debts);

  // Initialize tracking
  const debtStates = sortedDebts.map(debt => ({
    id: debt.id,
    name: debt.debt_name || debt.name || 'Unnamed Debt',
    originalBalance: parseFloat(debt.current_balance) || 0,
    balance: parseFloat(debt.current_balance) || 0,
    rate: parseFloat(debt.interest_rate) / 100 || 0, // Convert percentage to decimal
    minPayment: parseFloat(debt.minimum_payment) || 0,
    paidOff: false,
    payoffMonth: null
  }));

  const schedule = [];
  let month = 0;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const maxMonths = 360; // 30-year safety limit

  // Calculate total minimum payments
  const totalMinimums = debtStates.reduce((sum, d) => sum + d.minPayment, 0);
  let availableExtra = monthlyExtra;

  while (debtStates.some(d => !d.paidOff && d.balance > 0.01) && month < maxMonths) {
    month++;
    const monthPayments = [];
    let freedUpPayment = 0;

    // First pass: Apply interest and minimum payments
    for (const debt of debtStates) {
      if (debt.paidOff || debt.balance <= 0.01) {
        freedUpPayment += debt.minPayment;
        continue;
      }

      // Calculate monthly interest
      const interest = calculateMonthlyInterest(debt.balance, debt.rate);
      debt.balance += interest;
      totalInterestPaid += interest;

      // Apply minimum payment
      const payment = Math.min(debt.minPayment, debt.balance);
      debt.balance -= payment;
      totalPaid += payment;

      monthPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        payment,
        interest,
        principal: payment - interest,
        balanceAfter: debt.balance,
        isExtra: false
      });

      // Check if paid off
      if (debt.balance <= 0.01) {
        debt.balance = 0;
        debt.paidOff = true;
        debt.payoffMonth = month;
        freedUpPayment += debt.minPayment;
      }
    }

    // Second pass: Apply extra payments to target debt
    let extraPool = availableExtra + freedUpPayment;
    
    for (const debt of debtStates) {
      if (debt.paidOff || debt.balance <= 0.01 || extraPool <= 0) continue;

      const extraPayment = Math.min(extraPool, debt.balance);
      debt.balance -= extraPayment;
      totalPaid += extraPayment;
      extraPool -= extraPayment;

      // Update or add to month payments
      const existingPayment = monthPayments.find(p => p.debtId === debt.id);
      if (existingPayment) {
        existingPayment.payment += extraPayment;
        existingPayment.principal += extraPayment;
        existingPayment.balanceAfter = debt.balance;
        existingPayment.isExtra = true;
      }

      // Check if paid off
      if (debt.balance <= 0.01) {
        debt.balance = 0;
        debt.paidOff = true;
        debt.payoffMonth = month;
      }

      // Only apply extra to first non-paid debt (focus payment)
      break;
    }

    schedule.push({
      month,
      payments: monthPayments,
      totalPayment: monthPayments.reduce((sum, p) => sum + p.payment, 0),
      remainingDebts: debtStates.filter(d => !d.paidOff).length,
      totalRemaining: debtStates.reduce((sum, d) => sum + d.balance, 0)
    });
  }

  // Build summary
  const summary = {
    strategy,
    totalMonths: month,
    totalInterest: Math.round(totalInterestPaid * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    originalTotal: debtStates.reduce((sum, d) => sum + d.originalBalance, 0),
    payoffDate: calculatePayoffDate(month),
    debtPayoffOrder: debtStates.map(d => ({
      id: d.id,
      name: d.name,
      originalBalance: d.originalBalance,
      payoffMonth: d.payoffMonth,
      payoffDate: d.payoffMonth ? calculatePayoffDate(d.payoffMonth) : null
    }))
  };

  return { schedule, summary };
}

/**
 * Compare Snowball vs Avalanche strategies
 * @param {Array} debts - Array of debt objects
 * @param {number} monthlyExtra - Extra monthly payment
 * @returns {Object} Comparison analysis
 */
function compareStrategies(debts, monthlyExtra = 0) {
  const snowball = generatePayoffSchedule(debts, monthlyExtra, 'snowball');
  const avalanche = generatePayoffSchedule(debts, monthlyExtra, 'avalanche');
  const minimumOnly = generatePayoffSchedule(debts, 0, 'avalanche');

  const interestSavedVsMinimum = minimumOnly.summary.totalInterest - avalanche.summary.totalInterest;
  const timeSavedVsMinimum = minimumOnly.summary.totalMonths - avalanche.summary.totalMonths;
  
  const avalancheSavings = snowball.summary.totalInterest - avalanche.summary.totalInterest;
  const snowballFasterPayoffs = snowball.summary.debtPayoffOrder.filter((d, i) => {
    const avalancheDebt = avalanche.summary.debtPayoffOrder.find(a => a.id === d.id);
    return d.payoffMonth < (avalancheDebt?.payoffMonth || Infinity);
  }).length;

  return {
    snowball: snowball.summary,
    avalanche: avalanche.summary,
    minimumOnly: minimumOnly.summary,
    comparison: {
      interestSavedWithAvalanche: Math.round(avalancheSavings * 100) / 100,
      interestSavedVsMinimum: Math.round(interestSavedVsMinimum * 100) / 100,
      timeSavedVsMinimum,
      snowballQuickWins: snowballFasterPayoffs,
      recommendation: getRecommendation(avalancheSavings, snowballFasterPayoffs, debts.length)
    }
  };
}

/**
 * Get strategy recommendation based on analysis
 */
function getRecommendation(avalancheSavings, snowballQuickWins, totalDebts) {
  // If savings are minimal, recommend snowball for psychological wins
  if (avalancheSavings < 100) {
    return {
      strategy: 'snowball',
      reason: 'Interest savings are minimal. Snowball provides faster psychological wins to keep you motivated.'
    };
  }
  
  // If avalanche saves significant money
  if (avalancheSavings > 500) {
    return {
      strategy: 'avalanche',
      reason: `Avalanche saves you $${avalancheSavings.toFixed(2)} in interest. The mathematical advantage is significant.`
    };
  }
  
  // Middle ground - consider quick wins
  if (snowballQuickWins > totalDebts / 2) {
    return {
      strategy: 'snowball',
      reason: 'Snowball pays off more debts quickly, providing motivation to stay on track.'
    };
  }
  
  return {
    strategy: 'avalanche',
    reason: 'Avalanche minimizes total interest paid while still making steady progress.'
  };
}

/**
 * Calculate debt-free date and summary stats
 * @param {Array} debts - Array of debt objects
 * @param {number} monthlyExtra - Extra monthly payment
 * @returns {Object} Quick summary
 */
function getDebtSummary(debts, monthlyExtra = 0) {
  if (!debts || debts.length === 0) {
    return {
      totalDebts: 0,
      totalBalance: 0,
      totalMinimumPayments: 0,
      highestRate: 0,
      lowestBalance: 0,
      debtFreeDate: new Date(),
      monthsToPayoff: 0
    };
  }

  const avalanche = generatePayoffSchedule(debts, monthlyExtra, 'avalanche');
  
  return {
    totalDebts: debts.length,
    totalBalance: debts.reduce((sum, d) => sum + parseFloat(d.current_balance || 0), 0),
    totalMinimumPayments: debts.reduce((sum, d) => sum + parseFloat(d.minimum_payment || 0), 0),
    highestRate: Math.max(...debts.map(d => parseFloat(d.interest_rate || 0))),
    lowestBalance: Math.min(...debts.map(d => parseFloat(d.current_balance || 0))),
    debtFreeDate: avalanche.summary.payoffDate,
    monthsToPayoff: avalanche.summary.totalMonths,
    totalInterestProjected: avalanche.summary.totalInterest
  };
}

module.exports = {
  snowballSort,
  avalancheSort,
  generatePayoffSchedule,
  compareStrategies,
  getDebtSummary,
  getRecommendation
};