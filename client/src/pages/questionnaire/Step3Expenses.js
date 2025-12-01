import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateResponses } from '../../store/features/questionnaireSlice';

const Step3Expenses = () => {
  const dispatch = useDispatch();
  const { responses } = useSelector((state) => state.questionnaire);
  const expenses = responses.expenses || {};

  const handleChange = (field, value) => {
    dispatch(updateResponses({
      section: 'expenses',
      data: { [field]: value }
    }));
  };

  const expenseCategories = [
    { key: 'housing', label: 'Housing (rent/mortgage, utilities, insurance)' },
    { key: 'transportation', label: 'Transportation (car, gas, transit)' },
    { key: 'food', label: 'Food (groceries, dining out)' },
    { key: 'healthcare', label: 'Healthcare (insurance, medical expenses)' },
    { key: 'entertainment', label: 'Entertainment & Leisure' },
    { key: 'other', label: 'Other monthly expenses' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-gray-600 mb-4">
        Please estimate your average monthly spending in each category:
      </p>

      {expenseCategories.map((category) => (
        <div key={category.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {category.label}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              value={expenses[category.key] || ''}
              onChange={(e) => handleChange(category.key, parseFloat(e.target.value) || '')}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      ))}

      {/* Spending Habits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you describe your spending habits?
        </label>
        <select
          value={expenses.spendingHabits || ''}
          onChange={(e) => handleChange('spendingHabits', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="frugal">Very frugal - I minimize all expenses</option>
          <option value="careful">Careful - I budget and track spending</option>
          <option value="moderate">Moderate - I spend reasonably</option>
          <option value="generous">Generous - I enjoy spending on quality</option>
          <option value="impulsive">Impulsive - I often overspend</option>
        </select>
      </div>

      {/* Major Upcoming Expenses */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Do you have any major expenses planned in the next 1-2 years?
        </label>
        <div className="space-y-2">
          {['home_purchase', 'car', 'wedding', 'education', 'medical', 'travel', 'none'].map((expense) => (
            <label key={expense} className="flex items-center">
              <input
                type="checkbox"
                checked={expenses.upcomingExpenses?.includes(expense) || false}
                onChange={(e) => {
                  const current = expenses.upcomingExpenses || [];
                  const updated = e.target.checked
                    ? [...current, expense]
                    : current.filter((s) => s !== expense);
                  handleChange('upcomingExpenses', updated);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">
                {expense === 'home_purchase' && 'Home purchase'}
                {expense === 'car' && 'New vehicle'}
                {expense === 'wedding' && 'Wedding'}
                {expense === 'education' && 'Education/Training'}
                {expense === 'medical' && 'Medical procedure'}
                {expense === 'travel' && 'Major travel'}
                {expense === 'none' && 'No major expenses planned'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step3Expenses;