/**
 * AI Context Builder
 * Sprint 7-8: Aggregates user financial data for AI context
 */

const { query } = require('../../config/database');

/**
 * Build complete financial context for a user
 */
const buildUserContext = async (userId) => {
  const context = {
    user: null,
    profile: null,
    questionnaire: null,
    financialHealth: null,
    budget: null,
    topCategories: [],
    recentTransactions: [],
    debts: [],
    activeDebtStrategy: null,
    portfolio: null,
    holdings: [],
    goals: []
  };

  try {
    const [
      userResult,
      profileResult,
      questionnaireResult,
      budgetResult,
      categoriesResult,
      transactionsResult,
      debtsResult,
      strategyResult,
      portfolioResult,
      holdingsResult
    ] = await Promise.all([
      query(
        `SELECT id, email, first_name, last_name, created_at 
         FROM users WHERE id = $1`,
        [userId]
      ),
      query(
        `SELECT age, income_stability, risk_tolerance, life_stage, 
                financial_knowledge_level, investment_horizon
         FROM user_profiles WHERE user_id = $1`,
        [userId]
      ),
      query(
        `SELECT questions_json, completed_at, version
         FROM financial_questionnaire 
         WHERE user_id = $1 
         ORDER BY completed_at DESC NULLS LAST
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT monthly_income, planned_expenses, actual_expenses, savings_goal, month
         FROM budgets 
         WHERE user_id = $1 AND month = DATE_TRUNC('month', CURRENT_DATE)
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT 
           category,
           SUM(amount) as total,
           COUNT(*) as transaction_count
         FROM transactions 
         WHERE user_id = $1 
           AND type = 'expense'
           AND date >= CURRENT_DATE - INTERVAL '3 months'
         GROUP BY category
         ORDER BY total DESC
         LIMIT 10`,
        [userId]
      ),
      query(
        `SELECT 
           type,
           SUM(amount) as total,
           COUNT(*) as count,
           AVG(amount) as average
         FROM transactions 
         WHERE user_id = $1 
           AND date >= CURRENT_DATE - INTERVAL '3 months'
         GROUP BY type`,
        [userId]
      ),
      query(
        `SELECT id, debt_type, creditor, original_balance, current_balance, 
                interest_rate, minimum_payment, due_date, is_active
         FROM debts 
         WHERE user_id = $1 AND is_active = true
         ORDER BY interest_rate DESC`,
        [userId]
      ),
      query(
        `SELECT strategy_type, projected_payoff_date, total_interest_saved, strategy_details
         FROM debt_strategies 
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT p.id, p.portfolio_name, p.risk_level, p.target_allocation, 
                p.current_value, p.is_primary,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'asset_class', a.asset_class,
                      'target_percentage', a.target_percentage,
                      'current_percentage', a.current_percentage,
                      'rebalance_needed', a.rebalance_needed
                    )
                  ) FILTER (WHERE a.id IS NOT NULL),
                  '[]'
                ) as allocations
         FROM portfolios p
         LEFT JOIN asset_allocations a ON p.id = a.portfolio_id
         WHERE p.user_id = $1 AND p.is_primary = true
         GROUP BY p.id
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT h.asset_type, h.symbol, h.name, h.quantity, 
                h.purchase_price, h.current_price, h.purchase_date
         FROM holdings h
         JOIN portfolios p ON h.portfolio_id = p.id
         WHERE p.user_id = $1 AND p.is_primary = true
         ORDER BY (h.quantity * h.current_price) DESC
         LIMIT 10`,
        [userId]
      )
    ]);

    context.user = userResult.rows[0] || null;
    context.profile = profileResult.rows[0] || null;
    context.questionnaire = questionnaireResult.rows[0] || null;
    context.budget = budgetResult.rows[0] || null;
    context.debts = debtsResult.rows || [];
    context.activeDebtStrategy = strategyResult.rows[0]?.strategy_type || null;
    context.portfolio = portfolioResult.rows[0] || null;
    context.holdings = holdingsResult.rows || [];

    const categoryTotals = categoriesResult.rows;
    const totalSpending = categoryTotals.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    context.topCategories = categoryTotals.map(c => ({
      category: c.category,
      total: parseFloat(c.total),
      transaction_count: parseInt(c.transaction_count),
      percentage: totalSpending > 0 ? (parseFloat(c.total) / totalSpending) * 100 : 0
    }));

    context.financialHealth = calculateFinancialHealth(
      transactionsResult.rows,
      context.budget,
      context.debts
    );

    if (context.budget) {
      const plannedTotal = context.budget.planned_expenses 
        ? Object.values(context.budget.planned_expenses).reduce((a, b) => a + (parseFloat(b) || 0), 0)
        : 0;
      context.budget.plannedTotal = plannedTotal;
      context.budget.variance = plannedTotal - (parseFloat(context.budget.actual_expenses) || 0);
    }

    return context;

  } catch (error) {
    console.error('Error building user context:', error);
    throw error;
  }
};

/**
 * Calculate financial health metrics
 */
const calculateFinancialHealth = (transactionSummary, budget, debts) => {
  const income = transactionSummary.find(t => t.type === 'income');
  const expenses = transactionSummary.find(t => t.type === 'expense');

  const monthlyIncome = income ? parseFloat(income.total) / 3 : 0;
  const monthlyExpenses = expenses ? parseFloat(expenses.total) / 3 : 0;
  const netCashFlow = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? netCashFlow / monthlyIncome : 0;

  const estimatedSavings = Math.max(0, netCashFlow * 6);
  const emergencyFundMonths = monthlyExpenses > 0 ? estimatedSavings / monthlyExpenses : 0;

  const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.current_balance) || 0), 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + (parseFloat(d.minimum_payment) || 0), 0);
  const debtToIncomeRatio = monthlyIncome > 0 ? totalMinPayments / monthlyIncome : 0;

  let score = 50;
  if (savingsRate >= 0.20) score += 20;
  else if (savingsRate >= 0.10) score += 10;
  else if (savingsRate < 0) score -= 20;

  if (emergencyFundMonths >= 6) score += 15;
  else if (emergencyFundMonths >= 3) score += 10;
  else if (emergencyFundMonths < 1) score -= 10;

  if (debtToIncomeRatio <= 0.20) score += 15;
  else if (debtToIncomeRatio <= 0.36) score += 5;
  else if (debtToIncomeRatio > 0.50) score -= 15;

  score = Math.max(0, Math.min(100, score));

  return {
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
    netCashFlow: Math.round(netCashFlow * 100) / 100,
    savingsRate: Math.round(savingsRate * 1000) / 1000,
    emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
    totalDebt: Math.round(totalDebt * 100) / 100,
    debtToIncomeRatio: Math.round(debtToIncomeRatio * 1000) / 1000,
    score
  };
};

/**
 * Get minimal context for rate limit checks
 */
const getMinimalContext = async (userId) => {
  const result = await query(
    `SELECT u.id, u.email, u.first_name, 
            p.risk_tolerance, p.financial_knowledge_level,
            EXISTS(SELECT 1 FROM financial_questionnaire WHERE user_id = u.id) as has_questionnaire
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Create a snapshot of context for message storage
 */
const createContextSnapshot = (context) => {
  return {
    timestamp: new Date().toISOString(),
    financialHealth: context.financialHealth,
    debtCount: context.debts?.length || 0,
    totalDebt: context.financialHealth?.totalDebt || 0,
    portfolioValue: context.portfolio?.current_value || 0,
    topCategories: context.topCategories?.slice(0, 3).map(c => c.category) || []
  };
};

module.exports = {
  buildUserContext,
  calculateFinancialHealth,
  getMinimalContext,
  createContextSnapshot
};