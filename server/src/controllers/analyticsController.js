/**
 * Analytics Controller
 * Sprint 11-12: Advanced financial analytics and insights
 */

const asyncHandler = require('express-async-handler');
const { query, transaction } = require('../config/database');

// Get comprehensive dashboard analytics
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    netWorth,
    monthlyOverview,
    healthScore,
    goalProgress,
    debtProgress,
    portfolioValue
  ] = await Promise.all([
    // Current net worth
    calculateNetWorth(userId),
    // Monthly income/expense overview
    getMonthlyOverview(userId),
    // Financial health score
    getLatestHealthScore(userId),
    // Goal progress
    getGoalProgress(userId),
    // Debt payoff progress
    getDebtProgress(userId),
    // Portfolio value
    getPortfolioValue(userId)
  ]);

  res.json({
    success: true,
    data: {
      netWorth,
      monthlyOverview,
      healthScore,
      goalProgress,
      debtProgress,
      portfolioValue
    }
  });
});

// Calculate and store net worth
async function calculateNetWorth(userId) {
  // Get portfolio value (assets)
  const portfolioResult = await query(
    `SELECT COALESCE(SUM(h.quantity * COALESCE(h.current_price, h.purchase_price)), 0) as total
     FROM holdings h
     JOIN portfolios p ON h.portfolio_id = p.id
     WHERE p.user_id = $1`,
    [userId]
  );

  // Get goal savings (assets)
  const savingsResult = await query(
    `SELECT COALESCE(SUM(current_amount), 0) as total
     FROM financial_goals
     WHERE user_id = $1`,
    [userId]
  );

  // Get total debt (liabilities)
  const debtResult = await query(
    `SELECT COALESCE(SUM(current_balance), 0) as total
     FROM debts
     WHERE user_id = $1`,
    [userId]
  );

  const assets = parseFloat(portfolioResult.rows[0].total) + parseFloat(savingsResult.rows[0].total);
  const liabilities = parseFloat(debtResult.rows[0].total);
  const netWorth = assets - liabilities;

  return {
    totalAssets: assets,
    totalLiabilities: liabilities,
    netWorth,
    breakdown: {
      investments: parseFloat(portfolioResult.rows[0].total),
      savings: parseFloat(savingsResult.rows[0].total),
      debt: liabilities
    }
  };
}

// Get monthly income/expense overview
async function getMonthlyOverview(userId) {
  const result = await query(
    `SELECT 
      DATE_TRUNC('month', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
    FROM transactions
    WHERE user_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month ASC`,
    [userId]
  );

  return result.rows.map(r => ({
    month: r.month,
    income: parseFloat(r.income),
    expenses: parseFloat(r.expenses),
    net: parseFloat(r.net),
    savingsRate: r.income > 0 ? ((r.income - r.expenses) / r.income * 100).toFixed(1) : 0
  }));
}

// Get latest health score
async function getLatestHealthScore(userId) {
  const result = await query(
    `SELECT * FROM financial_health_history
     WHERE user_id = $1
     ORDER BY record_date DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// Get goal progress summary
async function getGoalProgress(userId) {
  const result = await query(
    `SELECT 
      COUNT(*) as total_goals,
      COUNT(*) FILTER (WHERE is_completed = true) as completed,
      COALESCE(SUM(current_amount), 0) as total_saved,
      COALESCE(SUM(target_amount), 0) as total_target
    FROM financial_goals
    WHERE user_id = $1`,
    [userId]
  );

  const data = result.rows[0];
  return {
    totalGoals: parseInt(data.total_goals),
    completed: parseInt(data.completed),
    totalSaved: parseFloat(data.total_saved),
    totalTarget: parseFloat(data.total_target),
    overallProgress: data.total_target > 0 
      ? ((data.total_saved / data.total_target) * 100).toFixed(1)
      : 0
  };
}

// Get debt payoff progress
async function getDebtProgress(userId) {
  const result = await query(
    `SELECT 
      COUNT(*) as total_debts,
      COALESCE(SUM(current_balance), 0) as remaining_debt,
      COALESCE(SUM(original_balance), 0) as original_debt
    FROM debts
    WHERE user_id = $1`,
    [userId]
  );

  const data = result.rows[0];
  const paidOff = parseFloat(data.original_debt) - parseFloat(data.remaining_debt);
  
  return {
    totalDebts: parseInt(data.total_debts),
    remainingDebt: parseFloat(data.remaining_debt),
    originalDebt: parseFloat(data.original_debt),
    paidOff,
    progress: data.original_debt > 0 
      ? ((paidOff / data.original_debt) * 100).toFixed(1)
      : 100
  };
}

// Get portfolio value
async function getPortfolioValue(userId) {
  const result = await query(
    `SELECT 
      COUNT(DISTINCT p.id) as portfolio_count,
      COALESCE(SUM(h.quantity * h.purchase_price), 0) as total_cost,
      COALESCE(SUM(h.quantity * COALESCE(h.current_price, h.purchase_price)), 0) as current_value
    FROM portfolios p
    LEFT JOIN holdings h ON p.id = h.portfolio_id
    WHERE p.user_id = $1`,
    [userId]
  );

  const data = result.rows[0];
  const gain = parseFloat(data.current_value) - parseFloat(data.total_cost);
  
  return {
    portfolioCount: parseInt(data.portfolio_count),
    totalCost: parseFloat(data.total_cost),
    currentValue: parseFloat(data.current_value),
    totalGain: gain,
    gainPercent: data.total_cost > 0 
      ? ((gain / data.total_cost) * 100).toFixed(2)
      : 0
  };
}

// Get spending trends
const getSpendingTrends = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period = 'monthly', months = 6 } = req.query;

  // Get spending by category over time
  const categoryTrends = await query(
    `SELECT 
      DATE_TRUNC($1, date) as period,
      category,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = $2
      AND type = 'expense'
      AND date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
    GROUP BY DATE_TRUNC($1, date), category
    ORDER BY period ASC, total DESC`,
    [period === 'weekly' ? 'week' : 'month', userId]
  );

  // Get top spending categories
  const topCategories = await query(
    `SELECT 
      category,
      SUM(amount) as total,
      COUNT(*) as transaction_count,
      AVG(amount) as avg_transaction
    FROM transactions
    WHERE user_id = $1
      AND type = 'expense'
      AND date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
    GROUP BY category
    ORDER BY total DESC
    LIMIT 10`,
    [userId]
  );

  // Get month-over-month change
  const momChange = await query(
    `WITH monthly AS (
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 2
    )
    SELECT 
      (SELECT total FROM monthly LIMIT 1) as current_month,
      (SELECT total FROM monthly OFFSET 1 LIMIT 1) as previous_month`,
    [userId]
  );

  const current = parseFloat(momChange.rows[0]?.current_month || 0);
  const previous = parseFloat(momChange.rows[0]?.previous_month || 0);
  const changePercent = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      categoryTrends: categoryTrends.rows,
      topCategories: topCategories.rows,
      monthOverMonth: {
        current,
        previous,
        change: current - previous,
        changePercent
      }
    }
  });
});

// Get net worth history
const getNetWorthHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { months = 12 } = req.query;

  const history = await query(
    `SELECT * FROM net_worth_history
     WHERE user_id = $1
       AND record_date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
     ORDER BY record_date ASC`,
    [userId]
  );

  res.json({
    success: true,
    data: history.rows
  });
});

// Record net worth snapshot
const recordNetWorthSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const netWorth = await calculateNetWorth(userId);

  const result = await query(
    `INSERT INTO net_worth_history (user_id, total_assets, total_liabilities, net_worth, breakdown)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, record_date) 
     DO UPDATE SET 
       total_assets = EXCLUDED.total_assets,
       total_liabilities = EXCLUDED.total_liabilities,
       net_worth = EXCLUDED.net_worth,
       breakdown = EXCLUDED.breakdown
     RETURNING *`,
    [userId, netWorth.totalAssets, netWorth.totalLiabilities, netWorth.netWorth, JSON.stringify(netWorth.breakdown)]
  );

  res.json({
    success: true,
    message: 'Net worth snapshot recorded',
    data: result.rows[0]
  });
});

// Get financial health history
const getHealthHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { months = 12 } = req.query;

  const history = await query(
    `SELECT * FROM financial_health_history
     WHERE user_id = $1
       AND record_date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
     ORDER BY record_date ASC`,
    [userId]
  );

  res.json({
    success: true,
    data: history.rows
  });
});

// Record health score snapshot
const recordHealthSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Calculate current health metrics
  const [income, expenses, debt, savings] = await Promise.all([
    query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
           WHERE user_id = $1 AND type = 'income' 
           AND date >= DATE_TRUNC('month', CURRENT_DATE)`, [userId]),
    query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
           WHERE user_id = $1 AND type = 'expense' 
           AND date >= DATE_TRUNC('month', CURRENT_DATE)`, [userId]),
    query(`SELECT COALESCE(SUM(current_balance), 0) as total, 
                  COALESCE(SUM(minimum_payment), 0) as payments 
           FROM debts WHERE user_id = $1`, [userId]),
    query(`SELECT COALESCE(SUM(current_amount), 0) as total 
           FROM financial_goals WHERE user_id = $1`, [userId])
  ]);

  const monthlyIncome = parseFloat(income.rows[0].total);
  const monthlyExpenses = parseFloat(expenses.rows[0].total);
  const totalDebt = parseFloat(debt.rows[0].total);
  const debtPayments = parseFloat(debt.rows[0].payments);
  const totalSavings = parseFloat(savings.rows[0].total);

  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  const dti = monthlyIncome > 0 ? debtPayments / monthlyIncome : 0;
  const emergencyMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;

  // Calculate health score (0-100)
  let healthScore = 50;
  if (savingsRate > 0.2) healthScore += 15;
  else if (savingsRate > 0.1) healthScore += 10;
  else if (savingsRate < 0) healthScore -= 15;

  if (dti < 0.2) healthScore += 15;
  else if (dti < 0.35) healthScore += 5;
  else if (dti > 0.5) healthScore -= 15;

  if (emergencyMonths >= 6) healthScore += 20;
  else if (emergencyMonths >= 3) healthScore += 10;
  else if (emergencyMonths < 1) healthScore -= 10;

  healthScore = Math.max(0, Math.min(100, healthScore));

  const result = await query(
    `INSERT INTO financial_health_history 
     (user_id, health_score, savings_rate, debt_to_income, emergency_fund_months, metrics)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, record_date)
     DO UPDATE SET
       health_score = EXCLUDED.health_score,
       savings_rate = EXCLUDED.savings_rate,
       debt_to_income = EXCLUDED.debt_to_income,
       emergency_fund_months = EXCLUDED.emergency_fund_months,
       metrics = EXCLUDED.metrics
     RETURNING *`,
    [userId, healthScore, savingsRate, dti, emergencyMonths, JSON.stringify({
      monthlyIncome,
      monthlyExpenses,
      totalDebt,
      totalSavings
    })]
  );

  res.json({
    success: true,
    message: 'Health snapshot recorded',
    data: result.rows[0]
  });
});

// Get income vs expense analysis
const getIncomeExpenseAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { months = 12 } = req.query;

  const data = await query(
    `SELECT 
      DATE_TRUNC('month', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM transactions
    WHERE user_id = $1
      AND date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month ASC`,
    [userId]
  );

  const processed = data.rows.map(row => ({
    month: row.month,
    income: parseFloat(row.income),
    expenses: parseFloat(row.expenses),
    savings: parseFloat(row.income) - parseFloat(row.expenses),
    savingsRate: row.income > 0 
      ? (((row.income - row.expenses) / row.income) * 100).toFixed(1)
      : 0
  }));

  // Calculate averages
  const totals = processed.reduce((acc, m) => ({
    income: acc.income + m.income,
    expenses: acc.expenses + m.expenses,
    savings: acc.savings + m.savings
  }), { income: 0, expenses: 0, savings: 0 });

  const count = processed.length || 1;

  res.json({
    success: true,
    data: {
      monthly: processed,
      averages: {
        income: totals.income / count,
        expenses: totals.expenses / count,
        savings: totals.savings / count,
        savingsRate: totals.income > 0 
          ? ((totals.savings / totals.income) * 100).toFixed(1)
          : 0
      }
    }
  });
});

// Get cross-module insights
const getCrossModuleInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Calculate how debt paydown affects investment capacity
  const debtData = await query(
    `SELECT 
      COALESCE(SUM(minimum_payment), 0) as monthly_debt_payments,
      COALESCE(SUM(current_balance), 0) as total_debt
    FROM debts WHERE user_id = $1`,
    [userId]
  );

  const incomeData = await query(
    `SELECT COALESCE(AVG(monthly_total), 0) as avg_monthly_income
     FROM (
       SELECT DATE_TRUNC('month', date) as month, SUM(amount) as monthly_total
       FROM transactions
       WHERE user_id = $1 AND type = 'income'
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month DESC
       LIMIT 3
     ) recent`,
    [userId]
  );

  const monthlyDebtPayments = parseFloat(debtData.rows[0].monthly_debt_payments);
  const avgIncome = parseFloat(incomeData.rows[0].avg_monthly_income);
  const potentialInvestment = monthlyDebtPayments; // After debt is paid

  const insights = [];

  // Debt-to-investment insight
  if (monthlyDebtPayments > 0 && avgIncome > 0) {
    const debtPercent = ((monthlyDebtPayments / avgIncome) * 100).toFixed(1);
    insights.push({
      type: 'debt_to_investment',
      title: 'Investment Potential After Debt',
      message: `You're paying ${debtPercent}% of income to debt. Eliminating debt could free up $${monthlyDebtPayments.toFixed(0)}/month for investments.`,
      impact: potentialInvestment * 12,
      priority: monthlyDebtPayments > avgIncome * 0.2 ? 'high' : 'medium'
    });
  }

  // Goal funding rate insight
  const goalData = await query(
    `SELECT 
      COALESCE(SUM(monthly_contribution), 0) as monthly_goal_funding,
      COALESCE(SUM(target_amount - current_amount), 0) as remaining_to_goals
    FROM financial_goals
    WHERE user_id = $1 AND is_completed = false`,
    [userId]
  );

  const monthlyGoalFunding = parseFloat(goalData.rows[0].monthly_goal_funding);
  const remainingToGoals = parseFloat(goalData.rows[0].remaining_to_goals);

  if (remainingToGoals > 0) {
    const monthsToComplete = monthlyGoalFunding > 0 
      ? Math.ceil(remainingToGoals / monthlyGoalFunding)
      : null;
    
    insights.push({
      type: 'goal_timeline',
      title: 'Goal Completion Timeline',
      message: monthsToComplete 
        ? `At current contribution rates, you'll reach all goals in approximately ${monthsToComplete} months.`
        : 'Set monthly contributions to track your goal timeline.',
      monthsToComplete,
      priority: 'medium'
    });
  }

  res.json({
    success: true,
    data: {
      insights,
      metrics: {
        monthlyDebtPayments,
        avgMonthlyIncome: avgIncome,
        monthlyGoalFunding,
        remainingToGoals,
        potentialMonthlyInvestment: potentialInvestment
      }
    }
  });
});

module.exports = {
  getDashboardAnalytics,
  getSpendingTrends,
  getNetWorthHistory,
  recordNetWorthSnapshot,
  getHealthHistory,
  recordHealthSnapshot,
  getIncomeExpenseAnalysis,
  getCrossModuleInsights
};
