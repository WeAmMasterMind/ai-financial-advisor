import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateResponses } from '../../store/features/questionnaireSlice';

const Step5Goals = () => {
  const dispatch = useDispatch();
  const { responses } = useSelector((state) => state.questionnaire);
  const goals = responses.goals || {};

  const handleChange = (field, value) => {
    dispatch(updateResponses({
      section: 'goals',
      data: { [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Primary Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your primary financial goal?
        </label>
        <select
          value={goals.primaryGoal || ''}
          onChange={(e) => handleChange('primaryGoal', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="emergency_fund">Build emergency fund</option>
          <option value="debt_payoff">Pay off debt</option>
          <option value="home_purchase">Save for home purchase</option>
          <option value="retirement">Retirement savings</option>
          <option value="investment">Grow investments</option>
          <option value="education">Education savings</option>
          <option value="financial_independence">Financial independence</option>
        </select>
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your investment timeline?
        </label>
        <select
          value={goals.timeline || ''}
          onChange={(e) => handleChange('timeline', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="short_term">Short-term (less than 3 years)</option>
          <option value="medium_term">Medium-term (3-10 years)</option>
          <option value="long_term">Long-term (10+ years)</option>
        </select>
      </div>

      {/* Investment Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your investment experience level?
        </label>
        <select
          value={goals.investmentExperience || ''}
          onChange={(e) => handleChange('investmentExperience', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="none">None - I'm new to investing</option>
          <option value="beginner">Beginner - Basic knowledge</option>
          <option value="intermediate">Intermediate - Some experience</option>
          <option value="advanced">Advanced - Very experienced</option>
        </select>
      </div>

      {/* Risk Comfort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you react if your investments dropped 20% in value?
        </label>
        <select
          value={goals.riskComfort || ''}
          onChange={(e) => handleChange('riskComfort', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="conservative">Sell everything - I can't handle losses</option>
          <option value="moderate_conservative">Sell some - Reduce my exposure</option>
          <option value="moderate">Hold steady - Wait for recovery</option>
          <option value="moderate_aggressive">Buy more - Take advantage of lower prices</option>
          <option value="aggressive">Buy aggressively - Great opportunity</option>
        </select>
      </div>

      {/* Monthly Investment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How much can you invest monthly (after expenses and savings)?
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            value={goals.monthlyInvestment || ''}
            onChange={(e) => handleChange('monthlyInvestment', parseFloat(e.target.value) || '')}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Financial Priorities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rank what matters most to you (select your top 3):
        </label>
        <div className="space-y-2">
          {[
            { key: 'security', label: 'Financial security' },
            { key: 'growth', label: 'Wealth growth' },
            { key: 'income', label: 'Passive income' },
            { key: 'flexibility', label: 'Financial flexibility' },
            { key: 'legacy', label: 'Leaving a legacy' },
            { key: 'early_retirement', label: 'Early retirement' },
          ].map((priority) => (
            <label key={priority.key} className="flex items-center">
              <input
                type="checkbox"
                checked={goals.priorities?.includes(priority.key) || false}
                onChange={(e) => {
                  const current = goals.priorities || [];
                  if (e.target.checked && current.length >= 3) return; // Max 3
                  const updated = e.target.checked
                    ? [...current, priority.key]
                    : current.filter((p) => p !== priority.key);
                  handleChange('priorities', updated);
                }}
                disabled={!goals.priorities?.includes(priority.key) && (goals.priorities?.length || 0) >= 3}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">{priority.label}</span>
            </label>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Selected: {goals.priorities?.length || 0}/3
        </p>
      </div>
    </div>
  );
};

export default Step5Goals;