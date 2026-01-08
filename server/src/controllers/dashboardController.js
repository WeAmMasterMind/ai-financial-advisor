/**
 * Dashboard Controller
 * Aggregates data from all financial modules for dashboard display
 */

const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');

/**
 * Get comprehensive dashboard summary
 * Aggregates: profile, questionnaire, budget, transactions, debt, portfolio
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Execute all queries in parallel for performance
  const [
    profileResult,
    questionnaireResult,
    budgetResult,
    transactionsResult,
    debtResult,
    portfolioResult
  ] = await Promise.all([
    // User profile with questionnaire status
    query(`
      SELECT u.first_name, u.last_name, u.email,
             p.age, p.risk_tolerance, p.life_stage, p.income_stability,
             p.financial_knowledge_level, p.investment_horizon
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]),

    // Questionnaire completion status and results
    query(`
      SELECT questions_json, completed_at, current_step
      FROM financial_questionnaire
      WHERE user_id = $1
    `, [userId]),

    // Current month budget summary
    query(`
      SELECT monthly_income, planned_expenses, actual_expenses, savings_goal
      FROM budgets
      WHERE user_id = $1 
        AND EXTRACT(MONTH FROM month) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM month) = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]),

    // Recent transactions (last 10)
    query(`
      SELECT id, description, amount, type, category, date
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC, created_at DESC
      LIMIT 10
    `, [userId]),

    // Debt summary
    query(`
      SELECT 
        COUNT(*) as total_debts,
        COALESCE(SUM(current_balance), 0) as total_balance,
        COALESCE(SUM(minimum_payment), 0) as total_monthly_payment,
        COALESCE(AVG(interest_rate), 0) as avg_interest_rate
      FROM debts
      WHERE user_id = $1 AND is_active = true
    `, [userId]),

    // Portfolio summary
    query(`
      SELECT 
        COUNT(DISTINCT p.id) as portfolio_count,
        COALESCE(SUM(h.quantity * h.current_price), 0) as total_value,
        COALESCE(SUM(h.quantity * h.purchase_price), 0) as total_cost
      FROM portfolios p
      LEFT JOIN holdings h ON p.id = h.portfolio_id
      WHERE p.user_id = $1
    `, [userId])
  ]);

  // Process profile data
  const profile = profileResult.rows[0] || {};
  
  // Process questionnaire data
  const questionnaire = questionnaireResult.rows[0];
  const questionnaireStatus = {
    started: !!questionnaire,
    completed: !!questionnaire?.completed_at,
    currentStep: questionnaire?.current_step || 1,
    completedAt: questionnaire?.completed_at
  };

  // Process budget data
  const budget = budgetResult.rows[0];
  const budgetSummary = budget ? {
    monthlyIncome: parseFloat(budget.monthly_income) || 0,
    plannedExpenses: budget.planned_expenses || {},
    actualExpenses: parseFloat(budget.actual_expenses) || 0,
    savingsGoal: parseFloat(budget.savings_goal) || 0,
    savingsProgress: budget.monthly_income > 0 
      ? ((budget.monthly_income - budget.actual_expenses) / budget.savings_goal * 100).toFixed(1)
      : 0
  } : null;

  // Process transactions
  const transactions = transactionsResult.rows.map(t => ({
    id: t.id,
    description: t.description,
    amount: parseFloat(t.amount),
    type: t.type,
    category: t.category,
    date: t.date
  }));

  // Calculate transaction summary
  const transactionSummary = {
    recentTransactions: transactions.slice(0, 5),
    monthlyIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    monthlyExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  };

  // Process debt data
  const debt = debtResult.rows[0];
  const debtSummary = {
    totalDebts: parseInt(debt.total_debts) || 0,
    totalBalance: parseFloat(debt.total_balance) || 0,
    totalMonthlyPayment: parseFloat(debt.total_monthly_payment) || 0,
    avgInterestRate: parseFloat(debt.avg_interest_rate) || 0
  };

  // Process portfolio data
  const portfolio = portfolioResult.rows[0];
  const portfolioSummary = {
    portfolioCount: parseInt(portfolio.portfolio_count) || 0,
    totalValue: parseFloat(portfolio.total_value) || 0,
    totalCost: parseFloat(portfolio.total_cost) || 0,
    totalGainLoss: parseFloat(portfolio.total_value) - parseFloat(portfolio.total_cost) || 0,
    gainLossPercent: portfolio.total_cost > 0 
      ? (((portfolio.total_value - portfolio.total_cost) / portfolio.total_cost) * 100).toFixed(2)
      : 0
  };

  // Calculate overall financial health score
  const financialHealthScore = calculateHealthScore({
    questionnaire: questionnaire?.questions_json,
    budget: budgetSummary,
    debt: debtSummary,
    portfolio: portfolioSummary
  });

  // Build stats for dashboard cards
  const stats = buildDashboardStats({
    budget: budgetSummary,
    transactions: transactionSummary,
    debt: debtSummary,
    portfolio: portfolioSummary,
    questionnaire: questionnaire?.questions_json
  });

  

  res.json({
    success: true,
    data: {
      profile: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        age: profile.age,
        riskTolerance: profile.risk_tolerance,
        lifeStage: profile.life_stage,
        incomeStability: profile.income_stability
      },
      questionnaire: questionnaireStatus,
      budget: budgetSummary,
      transactions: transactionSummary,
      debt: debtSummary,
      portfolio: portfolioSummary,
      stats,
      financialHealthScore,
      lastUpdated: new Date().toISOString()
    }
  });
});

/**
 * Calculate financial health score (0-100)
 */
const calculateHealthScore = ({ questionnaire, budget, debt, portfolio }) => {
  let score = 50; // Base score

  // Budget factors (+/- 15 points)
  if (budget) {
    const savingsRate = budget.monthlyIncome > 0 
      ? (budget.monthlyIncome - budget.actualExpenses) / budget.monthlyIncome 
      : 0;
    if (savingsRate >= 0.2) score += 15;
    else if (savingsRate >= 0.1) score += 10;
    else if (savingsRate >= 0.05) score += 5;
    else if (savingsRate < 0) score -= 10;
  }

  // Debt factors (+/- 20 points)
  if (debt && budget?.monthlyIncome > 0) {
    const dti = debt.totalMonthlyPayment / budget.monthlyIncome;
    if (dti === 0) score += 15;
    else if (dti < 0.2) score += 10;
    else if (dti < 0.3) score += 5;
    else if (dti > 0.4) score -= 15;
    else if (dti > 0.5) score -= 20;
  }

  // Portfolio/Investment factors (+/- 15 points)
  if (portfolio) {
    if (portfolio.portfolioCount > 0) score += 10;
    if (portfolio.totalGainLoss > 0) score += 5;
    else if (portfolio.totalGainLoss < 0) score -= 5;
  }

  // Questionnaire completion bonus
  if (questionnaire) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Build dashboard stat cards data
 */
const buildDashboardStats = ({ budget, transactions, debt, portfolio, questionnaire }) => {
  const monthlyIncome = budget?.monthlyIncome || questionnaire?.income?.monthlyIncome || 0;
  const monthlyExpenses = budget?.actualExpenses || transactions?.monthlyExpenses || 0;
  const netBalance = monthlyIncome - monthlyExpenses;
  
  // Calculate month-over-month changes (placeholder - would need historical data)
  return [
    {
      name: 'Net Worth',
      value: portfolio?.totalValue - debt?.totalBalance || 0,
      change: portfolio?.gainLossPercent || 0,
      trend: (portfolio?.totalGainLoss || 0) >= 0 ? 'up' : 'down',
      icon: 'DollarSign',
      color: 'blue'
    },
    {
      name: 'Monthly Income',
      value: monthlyIncome,
      change: 0, // Would calculate from historical data
      trend: 'up',
      icon: 'TrendingUp',
      color: 'green'
    },
    {
      name: 'Monthly Expenses',
      value: monthlyExpenses,
      change: 0,
      trend: monthlyExpenses > monthlyIncome ? 'up' : 'down',
      icon: 'CreditCard',
      color: 'red'
    },
    {
      name: 'Total Debt',
      value: debt?.totalBalance || 0,
      change: 0,
      trend: 'down',
      icon: 'TrendingDown',
      color: 'orange'
    }
  ];
};

/**
 * Get quick stats for header/widget
 */
const getQuickStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(`
    SELECT 
      (SELECT COALESCE(SUM(amount), 0) FROM transactions 
      WHERE user_id = $1 AND type = 'income' 
      AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_income,
      (SELECT COALESCE(SUM(ABS(amount)), 0) FROM transactions 
      WHERE user_id = $1 AND type = 'expense'
      AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_expenses,
      (SELECT COALESCE(SUM(current_balance), 0) FROM debts 
      WHERE user_id = $1 AND is_active = true) as total_debt,
      (SELECT COALESCE(SUM(h.quantity * h.current_price), 0) 
      FROM portfolios p JOIN holdings h ON p.id = h.portfolio_id 
      WHERE p.user_id = $1) as portfolio_value
  `, [userId]);

  const stats = result.rows[0];

  res.json({
    success: true,
    data: {
      monthlyIncome: parseFloat(stats.monthly_income) || 0,
      monthlyExpenses: parseFloat(stats.monthly_expenses) || 0,
      totalDebt: parseFloat(stats.total_debt) || 0,
      portfolioValue: parseFloat(stats.portfolio_value) || 0,
      netCashFlow: parseFloat(stats.monthly_income) - parseFloat(stats.monthly_expenses)
    }
  });
});

module.exports = {
  getDashboardSummary,
  getQuickStats
};
