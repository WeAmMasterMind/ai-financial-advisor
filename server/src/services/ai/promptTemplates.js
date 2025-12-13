/**
 * AI Financial Advisor - Prompt Templates
 * Sprint 7-8: System prompts and persona configuration
 */

const ADVISOR_PERSONA = {
  name: 'Atlas',
  role: 'AI Financial Advisor',
  version: '1.0.0'
};

/**
 * Main system prompt for the financial advisor
 */
const getSystemPrompt = (userContext) => {
  const { user, financialHealth, hasCompletedQuestionnaire } = userContext;
  
  return `You are Atlas, an expert AI financial advisor built into a comprehensive personal finance platform. You have direct access to the user's financial data and provide personalized, actionable advice.

## Your Personality
- Professional yet approachable, like a trusted financial advisor
- Patient and educational - explain concepts when needed
- Proactive about identifying opportunities and risks
- Honest about limitations and when professional human advice is needed

## Your Capabilities
You have real-time access to the user's:
- Budget and spending patterns
- Transaction history (last 3 months detailed)
- Debt accounts and payoff strategies
- Investment portfolios and allocations
- Financial goals and risk tolerance
- Overall financial health score

## Guidelines

### DO:
- Reference specific numbers from their data when relevant
- Provide actionable, step-by-step recommendations
- Explain the "why" behind your advice
- Celebrate progress and positive financial behaviors
- Flag concerning patterns (overspending, missed payments, etc.)
- Suggest using platform features (debt strategies, rebalancing, etc.)
- Use simple language, avoid jargon unless explaining it

### DON'T:
- Give specific stock picks or market timing advice
- Provide tax or legal advice (recommend professionals)
- Make promises about investment returns
- Share data with external services
- Discuss other users or compare to averages in a judgmental way

### Response Format:
- Use clear paragraphs for explanations
- Use bullet points for action items or lists
- Bold **key numbers** and **important terms**
- Keep responses focused and concise (under 400 words unless complex topic)
- End actionable advice with a clear next step

## User Context
${user.first_name ? `User: ${user.first_name}` : 'User has not set their name'}
${hasCompletedQuestionnaire ? 'Questionnaire: Completed' : 'Note: User has not completed the financial questionnaire. Encourage them to do so for better personalized advice.'}
${financialHealth ? `Financial Health Score: ${financialHealth.score}/100` : ''}

Remember: You're here to help the user build wealth, eliminate debt, and achieve financial freedom. Be their trusted partner on this journey.`;
};

/**
 * Format user's financial context for inclusion in messages
 */
const formatFinancialContext = (context) => {
  if (!context) {
    return 'No financial data available yet. The user should add their financial information for personalized advice.';
  }

  const sections = [];

  // User Profile
  if (context.profile) {
    const p = context.profile;
    sections.push(`## User Profile
- Age: ${p.age || 'Not specified'}
- Risk Tolerance: ${p.risk_tolerance || 'Not assessed'}
- Investment Horizon: ${p.investment_horizon || 'Not specified'}
- Financial Knowledge: ${p.financial_knowledge_level ? `${p.financial_knowledge_level}/5` : 'Not assessed'}
- Life Stage: ${p.life_stage || 'Not specified'}`);
  }

  // Financial Health Summary
  if (context.financialHealth) {
    const fh = context.financialHealth;
    sections.push(`## Financial Health Summary
- Monthly Income: $${fh.monthlyIncome?.toLocaleString() || 0}
- Monthly Expenses: $${fh.monthlyExpenses?.toLocaleString() || 0}
- Savings Rate: ${fh.savingsRate ? (fh.savingsRate * 100).toFixed(1) : 0}%
- Net Cash Flow: $${fh.netCashFlow?.toLocaleString() || 0}
- Emergency Fund: ${fh.emergencyFundMonths?.toFixed(1) || 0} months of expenses`);
  }

  // Budget Overview
  if (context.budget) {
    const b = context.budget;
    sections.push(`## Current Month Budget
- Planned Income: $${b.monthly_income?.toLocaleString() || 0}
- Planned Expenses: $${b.plannedTotal?.toLocaleString() || 0}
- Actual Spending: $${b.actual_expenses?.toLocaleString() || 0}
- Savings Goal: $${b.savings_goal?.toLocaleString() || 0}
- Status: ${b.variance >= 0 ? 'Under budget' : 'Over budget'} by $${Math.abs(b.variance || 0).toLocaleString()}`);
  }

  // Top Spending Categories
  if (context.topCategories?.length > 0) {
    const cats = context.topCategories.slice(0, 5);
    sections.push(`## Top Spending Categories (Last 3 Months)
${cats.map(c => `- ${c.category}: $${c.total?.toLocaleString()} (${c.percentage?.toFixed(1)}%)`).join('\n')}`);
  }

  // Debts
  if (context.debts?.length > 0) {
    const totalDebt = context.debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
    sections.push(`## Debt Overview
- Total Debt: $${totalDebt.toLocaleString()}
- Number of Accounts: ${context.debts.length}
- Active Strategy: ${context.activeDebtStrategy || 'None selected'}

Accounts:
${context.debts.slice(0, 5).map(d => 
  `- ${d.creditor || d.debt_type}: $${d.current_balance?.toLocaleString()} at ${d.interest_rate}% APR`
).join('\n')}`);
  }

  // Portfolio
  if (context.portfolio) {
    const p = context.portfolio;
    sections.push(`## Investment Portfolio
- Total Value: $${p.current_value?.toLocaleString() || 0}
- Risk Level: ${p.risk_level || 'Not set'}
- Rebalancing Needed: ${p.rebalance_needed ? 'Yes' : 'No'}

Current Allocation:
${p.allocations?.map(a => 
  `- ${a.asset_class}: ${a.current_percentage}% (target: ${a.target_percentage}%)`
).join('\n') || 'No allocation data'}`);
  }

  // Holdings
  if (context.holdings?.length > 0) {
    sections.push(`## Top Holdings
${context.holdings.slice(0, 5).map(h => 
  `- ${h.symbol || h.name}: ${h.quantity} shares @ $${h.current_price?.toFixed(2)} = $${(h.quantity * h.current_price)?.toLocaleString()}`
).join('\n')}`);
  }

  return sections.join('\n\n');
};

/**
 * Generate a conversation title from the first user message
 */
const generateConversationTitle = (firstMessage) => {
  const cleaned = firstMessage
    .replace(/[^\w\s]/g, '')
    .trim()
    .substring(0, 50);
  
  return cleaned.length > 45 ? cleaned.substring(0, 45) + '...' : cleaned;
};

/**
 * Prompt for generating conversation summary/title
 */
const getTitleGenerationPrompt = (firstMessage) => {
  return `Generate a short, descriptive title (3-6 words) for a financial conversation that starts with: "${firstMessage.substring(0, 200)}"

Respond with ONLY the title, no quotes or explanation.`;
};

module.exports = {
  ADVISOR_PERSONA,
  getSystemPrompt,
  formatFinancialContext,
  generateConversationTitle,
  getTitleGenerationPrompt
};