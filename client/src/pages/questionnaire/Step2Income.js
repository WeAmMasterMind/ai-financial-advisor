import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateResponses } from '../../store/features/questionnaireSlice';

const Step2Income = () => {
  const dispatch = useDispatch();
  const { responses } = useSelector((state) => state.questionnaire);
  const income = responses.income || {};

  const handleChange = (field, value) => {
    dispatch(updateResponses({
      section: 'income',
      data: { [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Monthly Income */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your total monthly income (after taxes)?
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            value={income.monthlyIncome || ''}
            onChange={(e) => handleChange('monthlyIncome', parseFloat(e.target.value) || '')}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Income Stability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How stable is your income?
        </label>
        <select
          value={income.stability || ''}
          onChange={(e) => handleChange('stability', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="very_stable">Very stable (salary, long-term contract)</option>
          <option value="stable">Stable (regular income with some variation)</option>
          <option value="variable">Variable (commission, freelance)</option>
          <option value="unstable">Unstable (irregular work)</option>
        </select>
      </div>

      {/* Additional Income */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Do you have additional income sources?
        </label>
        <div className="space-y-2">
          {['investments', 'rental', 'side_business', 'pension', 'none'].map((source) => (
            <label key={source} className="flex items-center">
              <input
                type="checkbox"
                checked={income.additionalSources?.includes(source) || false}
                onChange={(e) => {
                  const current = income.additionalSources || [];
                  const updated = e.target.checked
                    ? [...current, source]
                    : current.filter((s) => s !== source);
                  handleChange('additionalSources', updated);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">
                {source === 'investments' && 'Investment income'}
                {source === 'rental' && 'Rental income'}
                {source === 'side_business' && 'Side business'}
                {source === 'pension' && 'Pension/Social Security'}
                {source === 'none' && 'No additional income'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Monthly Savings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How much do you currently save per month?
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            value={income.monthlySavings || ''}
            onChange={(e) => handleChange('monthlySavings', parseFloat(e.target.value) || '')}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Emergency Fund */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How many months of expenses do you have in emergency savings?
        </label>
        <select
          value={income.emergencyFundMonths || ''}
          onChange={(e) => handleChange('emergencyFundMonths', parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="0">No emergency fund</option>
          <option value="1">Less than 1 month</option>
          <option value="2">1-2 months</option>
          <option value="3">3-4 months</option>
          <option value="6">5-6 months</option>
          <option value="12">More than 6 months</option>
        </select>
      </div>
    </div>
  );
};

export default Step2Income;