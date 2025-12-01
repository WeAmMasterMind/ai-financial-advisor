import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateResponses } from '../../store/features/questionnaireSlice';

const Step4Debt = () => {
  const dispatch = useDispatch();
  const { responses } = useSelector((state) => state.questionnaire);
  const debt = responses.debt || {};

  const handleChange = (field, value) => {
    dispatch(updateResponses({
      section: 'debt',
      data: { [field]: value }
    }));
  };

  const debtTypes = [
    { key: 'mortgage', label: 'Mortgage' },
    { key: 'auto', label: 'Auto loan' },
    { key: 'student', label: 'Student loans' },
    { key: 'credit_card', label: 'Credit card debt' },
    { key: 'personal', label: 'Personal loans' },
    { key: 'medical', label: 'Medical debt' },
    { key: 'other', label: 'Other debt' },
  ];

  return (
    <div className="space-y-6">
      {/* Has Debt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Do you currently have any debt?
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={debt.hasDebt === true}
              onChange={() => handleChange('hasDebt', true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={debt.hasDebt === false}
              onChange={() => handleChange('hasDebt', false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2">No</span>
          </label>
        </div>
      </div>

      {debt.hasDebt && (
        <>
          {/* Debt Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What types of debt do you have?
            </label>
            <div className="space-y-2">
              {debtTypes.map((type) => (
                <label key={type.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={debt.types?.includes(type.key) || false}
                    onChange={(e) => {
                      const current = debt.types || [];
                      const updated = e.target.checked
                        ? [...current, type.key]
                        : current.filter((t) => t !== type.key);
                      handleChange('types', updated);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Total Debt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is your approximate total debt balance?
            </label>
            <select
              value={debt.totalDebt || ''}
              onChange={(e) => handleChange('totalDebt', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="under_5000">Under $5,000</option>
              <option value="5000_15000">$5,000 - $15,000</option>
              <option value="15000_30000">$15,000 - $30,000</option>
              <option value="30000_50000">$30,000 - $50,000</option>
              <option value="50000_100000">$50,000 - $100,000</option>
              <option value="over_100000">Over $100,000</option>
            </select>
          </div>

          {/* Monthly Payments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is your total monthly debt payment?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                value={debt.totalMonthlyPayments || ''}
                onChange={(e) => handleChange('totalMonthlyPayments', parseFloat(e.target.value) || '')}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* High Interest Debt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you have any high-interest debt (over 15% APR)?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={debt.hasHighInterestDebt === true}
                  onChange={() => handleChange('hasHighInterestDebt', true)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={debt.hasHighInterestDebt === false}
                  onChange={() => handleChange('hasHighInterestDebt', false)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Debt Comfort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How do you feel about your current debt situation?
        </label>
        <select
          value={debt.debtComfort || ''}
          onChange={(e) => handleChange('debtComfort', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="comfortable">Comfortable - I can easily manage it</option>
          <option value="manageable">Manageable - It's under control</option>
          <option value="concerned">Concerned - I'm working to reduce it</option>
          <option value="stressed">Stressed - It's a significant burden</option>
          <option value="no_debt">I don't have any debt</option>
        </select>
      </div>
    </div>
  );
};

export default Step4Debt;