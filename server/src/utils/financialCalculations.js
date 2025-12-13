/**
 * Financial Calculation Utilities
 * Core mathematical functions for debt and portfolio calculations
 */

/**
 * Calculate compound interest
 * @param {number} principal - Initial amount
 * @param {number} annualRate - Annual interest rate (e.g., 0.05 for 5%)
 * @param {number} years - Time period in years
 * @param {number} n - Compounding frequency per year (12 for monthly)
 * @returns {number} Final amount after interest
 */
function calculateCompoundInterest(principal, annualRate, years, n = 12) {
  if (principal <= 0 || annualRate < 0 || years < 0) {
    return principal;
  }
  return principal * Math.pow(1 + annualRate / n, n * years);
}

/**
 * Calculate monthly payment for amortized loan
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (e.g., 0.05 for 5%)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Monthly payment amount
 */
function calculateMonthlyPayment(principal, annualRate, termMonths) {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;
  
  const monthlyRate = annualRate / 12;
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment * 100) / 100;
}

/**
 * Generate full amortization schedule
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (decimal)
 * @param {number} termMonths - Loan term in months
 * @param {number} extraPayment - Additional monthly payment (optional)
 * @returns {Array} Array of payment objects with breakdown
 */
function generateAmortizationSchedule(principal, annualRate, termMonths, extraPayment = 0) {
  const schedule = [];
  const monthlyRate = annualRate / 12;
  const basePayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPayment = basePayment + extraPayment;
  
  let balance = principal;
  let month = 0;
  let totalInterest = 0;
  let totalPrincipal = 0;
  
  while (balance > 0.01 && month < termMonths * 2) { // Safety limit
    month++;
    
    const interestPayment = Math.round(balance * monthlyRate * 100) / 100;
    let principalPayment = Math.min(totalPayment - interestPayment, balance);
    
    // Handle final payment
    if (principalPayment > balance) {
      principalPayment = balance;
    }
    
    const actualPayment = interestPayment + principalPayment;
    balance = Math.max(0, balance - principalPayment);
    
    totalInterest += interestPayment;
    totalPrincipal += principalPayment;
    
    schedule.push({
      month,
      payment: Math.round(actualPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100
    });
    
    if (balance <= 0) break;
  }
  
  return schedule;
}

/**
 * Calculate months to payoff with given payment
 * @param {number} balance - Current balance
 * @param {number} annualRate - Annual interest rate (decimal)
 * @param {number} monthlyPayment - Monthly payment amount
 * @returns {number} Months until payoff (Infinity if payment too low)
 */
function calculateMonthsToPayoff(balance, annualRate, monthlyPayment) {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;
  
  const monthlyRate = annualRate / 12;
  const minPayment = balance * monthlyRate;
  
  // Payment must exceed monthly interest
  if (monthlyPayment <= minPayment) {
    return Infinity;
  }
  
  if (monthlyRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }
  
  const months = -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / 
                  Math.log(1 + monthlyRate);
  
  return Math.ceil(months);
}

/**
 * Calculate total interest paid over loan life
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (decimal)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Total interest paid
 */
function calculateTotalInterest(principal, annualRate, termMonths) {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPaid = monthlyPayment * termMonths;
  return Math.round((totalPaid - principal) * 100) / 100;
}

/**
 * Calculate interest for one month
 * @param {number} balance - Current balance
 * @param {number} annualRate - Annual interest rate (decimal)
 * @returns {number} Interest for the month
 */
function calculateMonthlyInterest(balance, annualRate) {
  return Math.round(balance * (annualRate / 12) * 100) / 100;
}

/**
 * Calculate payoff date from today
 * @param {number} months - Months until payoff
 * @returns {Date} Projected payoff date
 */
function calculatePayoffDate(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Calculate debt-to-income ratio
 * @param {number} totalMonthlyDebt - Total monthly debt payments
 * @param {number} monthlyIncome - Gross monthly income
 * @returns {number} DTI ratio as percentage
 */
function calculateDebtToIncomeRatio(totalMonthlyDebt, monthlyIncome) {
  if (monthlyIncome <= 0) return 0;
  return Math.round((totalMonthlyDebt / monthlyIncome) * 10000) / 100;
}

module.exports = {
  calculateCompoundInterest,
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateMonthsToPayoff,
  calculateTotalInterest,
  calculateMonthlyInterest,
  calculatePayoffDate,
  formatCurrency,
  calculateDebtToIncomeRatio
};