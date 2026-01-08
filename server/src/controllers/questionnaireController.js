const asyncHandler = require('express-async-handler');
const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');

// Calculate risk tolerance score (1-10)
const calculateRiskScore = (responses) => {
  let score = 5; // Base score
  
  // Age factor (younger = higher risk tolerance)
  if (responses.personal?.age < 30) score += 2;
  else if (responses.personal?.age < 40) score += 1;
  else if (responses.personal?.age > 55) score -= 1;
  
  // Income stability
  if (responses.income?.stability === 'very_stable') score += 1;
  else if (responses.income?.stability === 'unstable') score -= 2;
  
  // Dependents (more dependents = lower risk)
  if (responses.personal?.dependents > 2) score -= 1;
  
  // Investment experience
  if (responses.goals?.investmentExperience === 'advanced') score += 2;
  else if (responses.goals?.investmentExperience === 'none') score -= 1;
  
  // Risk comfort from self-assessment
  if (responses.goals?.riskComfort === 'aggressive') score += 2;
  else if (responses.goals?.riskComfort === 'conservative') score -= 2;
  
  // Emergency fund
  if (responses.income?.emergencyFundMonths >= 6) score += 1;
  else if (responses.income?.emergencyFundMonths < 3) score -= 1;
  
  // Debt-to-income ratio
  const dti = responses.debt?.totalMonthlyPayments / (responses.income?.monthlyIncome || 1);
  if (dti > 0.4) score -= 2;
  else if (dti < 0.2) score += 1;
  
  return Math.max(1, Math.min(10, Math.round(score)));
};

// Calculate financial health score (1-100)
const calculateFinancialHealthScore = (responses) => {
  let score = 50; // Base score
  
  // Income factors (max +20)
  if (responses.income?.monthlyIncome > 10000) score += 15;
  else if (responses.income?.monthlyIncome > 5000) score += 10;
  else if (responses.income?.monthlyIncome > 3000) score += 5;
  
  if (responses.income?.stability === 'very_stable') score += 5;
  
  // Savings rate (max +15)
  const savingsRate = responses.income?.monthlySavings / (responses.income?.monthlyIncome || 1);
  if (savingsRate >= 0.2) score += 15;
  else if (savingsRate >= 0.1) score += 10;
  else if (savingsRate >= 0.05) score += 5;
  
  // Emergency fund (max +15)
  if (responses.income?.emergencyFundMonths >= 6) score += 15;
  else if (responses.income?.emergencyFundMonths >= 3) score += 10;
  else if (responses.income?.emergencyFundMonths >= 1) score += 5;
  
  // Debt factors (max -30)
  const dti = responses.debt?.totalMonthlyPayments / (responses.income?.monthlyIncome || 1);
  if (dti > 0.5) score -= 30;
  else if (dti > 0.4) score -= 20;
  else if (dti > 0.3) score -= 10;
  
  // High-interest debt penalty
  if (responses.debt?.hasHighInterestDebt) score -= 10;
  
  // Goals defined bonus
  if (responses.goals?.primaryGoal) score += 5;
  if (responses.goals?.timeline) score += 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Determine risk tolerance category
const getRiskCategory = (score) => {
  if (score <= 3) return 'conservative';
  if (score <= 6) return 'moderate';
  return 'aggressive';
};

// Determine life stage
const getLifeStage = (responses) => {
  const age = responses.personal?.age || 30;
  const hasChildren = responses.personal?.dependents > 0;
  
  if (age < 30) return 'early_career';
  if (age < 40 && hasChildren) return 'family_building';
  if (age < 40) return 'growth';
  if (age < 55) return 'peak_earning';
  if (age < 65) return 'pre_retirement';
  return 'retirement';
};

// Save questionnaire progress (auto-save)
const saveProgress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { step, data, allResponses } = req.body;

  // Check if questionnaire exists
  const existing = await query(
    'SELECT id FROM financial_questionnaire WHERE user_id = $1',
    [userId]
  );

  if (existing.rows.length > 0) {
    // Update existing
  await query(
    `UPDATE financial_questionnaire 
    SET questions_json = $1, current_step = $2
    WHERE user_id = $3`,
    [JSON.stringify(allResponses), step, userId]
  );
  } else {
    // Create new
    await query(
      `INSERT INTO financial_questionnaire (user_id, questions_json, current_step)
       VALUES ($1, $2, $3)`,
      [userId, JSON.stringify(allResponses), step]
    );
  }

  res.json({
    success: true,
    message: 'Progress saved',
    data: { step }
  });
});

// Get questionnaire status and saved data
const getStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT questions_json, current_step, completed_at 
     FROM financial_questionnaire 
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.json({
      success: true,
      data: {
        started: false,
        completed: false,
        currentStep: 1,
        responses: {}
      }
    });
  }

  const questionnaire = result.rows[0];

  res.json({
    success: true,
    data: {
      started: true,
      completed: !!questionnaire.completed_at,
      currentStep: questionnaire.current_step || 1,
      responses: questionnaire.questions_json || {}
    }
  });
});

// Complete questionnaire and calculate scores
const completeQuestionnaire = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { responses } = req.body;

  // Calculate scores
  const riskScore = calculateRiskScore(responses);
  const healthScore = calculateFinancialHealthScore(responses);
  const riskCategory = getRiskCategory(riskScore);
  const lifeStage = getLifeStage(responses);

  await transaction(async (client) => {
    // Update questionnaire as completed
    await client.query(
      `UPDATE financial_questionnaire 
      SET questions_json = $1, completed_at = NOW(), version = version + 1
      WHERE user_id = $2`,
      [JSON.stringify(responses), userId]
    );

    // Update user profile with calculated data
    await client.query(
      `UPDATE user_profiles SET
        age = $1,
        income_stability = $2,
        risk_tolerance = $3,
        life_stage = $4,
        financial_knowledge_level = $5,
        investment_horizon = $6
      WHERE user_id = $7`,
      [
        responses.personal?.age,
        responses.income?.stability,
        riskCategory,
        lifeStage,
        responses.goals?.investmentExperience === 'advanced' ? 5 : 
          responses.goals?.investmentExperience === 'intermediate' ? 3 : 1,
        responses.goals?.timeline,
        userId
      ]
    );

    // Auto-create spending categories from questionnaire expenses
    const expenseCategories = [
      { key: 'housing', label: 'Housing', color: '#3B82F6' },
      { key: 'transportation', label: 'Transportation', color: '#10B981' },
      { key: 'food', label: 'Food', color: '#F59E0B' },
      { key: 'healthcare', label: 'Healthcare', color: '#EF4444' },
      { key: 'entertainment', label: 'Entertainment', color: '#8B5CF6' },
      { key: 'other', label: 'Other', color: '#6B7280' }
    ];

    for (const category of expenseCategories) {
      const amount = responses.expenses?.[category.key] || 0;
      if (amount > 0) {
        // Insert or update category
        await client.query(
          `INSERT INTO spending_categories (user_id, category_name, monthly_limit, color)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, category_name) 
          DO UPDATE SET monthly_limit = $3`,
          [userId, category.label, amount, category.color]
        );
      }
    }

    // Also create a budget for current month if income was provided
    if (responses.income?.monthlyIncome) {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      await client.query(
        `INSERT INTO budgets (user_id, month, monthly_income, savings_goal)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, month) DO UPDATE 
        SET monthly_income = $3, savings_goal = $4`,
        [
          userId, 
          currentMonth, 
          responses.income.monthlyIncome,
          responses.income.monthlySavings || 0
        ]
      );
    }
  });

  // Clear user cache
  await cache.del(`user:${userId}`);

  res.json({
    success: true,
    message: 'Questionnaire completed successfully',
    data: {
      riskScore,
      riskCategory,
      healthScore,
      lifeStage,
      recommendations: generateRecommendations(responses, riskCategory, healthScore)
    }
  });
});

// Generate basic recommendations
const generateRecommendations = (responses, riskCategory, healthScore) => {
  const recommendations = [];

  // Emergency fund recommendation
  if ((responses.income?.emergencyFundMonths || 0) < 3) {
    recommendations.push({
      priority: 'high',
      category: 'savings',
      title: 'Build Emergency Fund',
      description: 'Aim for 3-6 months of expenses in easily accessible savings.'
    });
  }

  // High-interest debt
  if (responses.debt?.hasHighInterestDebt) {
    recommendations.push({
      priority: 'high',
      category: 'debt',
      title: 'Pay Down High-Interest Debt',
      description: 'Focus on eliminating credit card and high-interest debt first.'
    });
  }

  // Savings rate
  const savingsRate = (responses.income?.monthlySavings || 0) / (responses.income?.monthlyIncome || 1);
  if (savingsRate < 0.15) {
    recommendations.push({
      priority: 'medium',
      category: 'savings',
      title: 'Increase Savings Rate',
      description: 'Try to save at least 15-20% of your income for long-term goals.'
    });
  }

  // Investment recommendation based on risk
  recommendations.push({
    priority: 'medium',
    category: 'investment',
    title: `${riskCategory.charAt(0).toUpperCase() + riskCategory.slice(1)} Portfolio`,
    description: riskCategory === 'aggressive' 
      ? 'Consider a growth-focused portfolio with 80% stocks, 20% bonds.'
      : riskCategory === 'moderate'
      ? 'A balanced portfolio with 60% stocks, 40% bonds suits your profile.'
      : 'A conservative portfolio with 40% stocks, 60% bonds is recommended.'
  });

  return recommendations;
};

// Get completed results
const getResults = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT q.questions_json, q.completed_at,
            p.risk_tolerance, p.life_stage, p.age, p.income_stability
     FROM financial_questionnaire q
     JOIN user_profiles p ON q.user_id = p.user_id
     WHERE q.user_id = $1 AND q.completed_at IS NOT NULL`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No completed questionnaire found'
    });
  }

  const data = result.rows[0];
  const responses = data.questions_json;
  const riskScore = calculateRiskScore(responses);
  const healthScore = calculateFinancialHealthScore(responses);

  res.json({
    success: true,
    data: {
      completedAt: data.completed_at,
      riskScore,
      riskCategory: data.risk_tolerance,
      healthScore,
      lifeStage: data.life_stage,
      recommendations: generateRecommendations(responses, data.risk_tolerance, healthScore)
    }
  });
});

module.exports = {
  saveProgress,
  getStatus,
  completeQuestionnaire,
  getResults
};