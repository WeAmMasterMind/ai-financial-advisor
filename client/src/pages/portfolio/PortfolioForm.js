/**
 * Portfolio Form
 * Create and edit portfolios
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortfolio, updatePortfolio, fetchPortfolioById, clearCurrentPortfolio } from '../../store/features/portfolioSlice';

const PortfolioForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { currentPortfolio, isLoading, error } = useSelector(state => state.portfolio);

  const [formData, setFormData] = useState({
    portfolio_name: '',
    portfolio_type: 'brokerage',
    risk_level: 'moderate',
    is_primary: false
  });

  const portfolioTypes = [
    { value: 'brokerage', label: 'Brokerage Account' },
    { value: 'retirement', label: 'Retirement (401k/IRA)' },
    { value: 'roth_ira', label: 'Roth IRA' },
    { value: 'traditional_ira', label: 'Traditional IRA' },
    { value: '401k', label: '401(k)' },
    { value: 'hsa', label: 'HSA' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'other', label: 'Other' }
  ];

  const riskLevels = [
    { value: 'conservative', label: 'Conservative', description: 'Focus on capital preservation' },
    { value: 'moderately_conservative', label: 'Moderately Conservative', description: 'Stability with modest growth' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced approach' },
    { value: 'moderately_aggressive', label: 'Moderately Aggressive', description: 'Growth-focused' },
    { value: 'aggressive', label: 'Aggressive', description: 'Maximum growth potential' }
  ];

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchPortfolioById(id));
    }
    return () => {
      dispatch(clearCurrentPortfolio());
    };
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentPortfolio) {
      setFormData({
        portfolio_name: currentPortfolio.portfolio_name || '',
        portfolio_type: currentPortfolio.portfolio_type || 'brokerage',
        risk_level: currentPortfolio.risk_level || 'moderate',
        is_primary: currentPortfolio.is_primary || false
      });
    }
  }, [currentPortfolio, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await dispatch(updatePortfolio({ id, data: formData })).unwrap();
      } else {
        await dispatch(createPortfolio(formData)).unwrap();
      }
      navigate('/portfolio');
    } catch (err) {
      console.error('Failed to save portfolio:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Portfolio' : 'Create New Portfolio'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEdit ? 'Update your portfolio settings' : 'Set up a new investment portfolio'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Portfolio Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio Name *
          </label>
          <input
            type="text"
            name="portfolio_name"
            value={formData.portfolio_name}
            onChange={handleChange}
            required
            placeholder="e.g., Retirement Fund, Growth Portfolio"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Portfolio Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            name="portfolio_type"
            value={formData.portfolio_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {portfolioTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Risk Level
          </label>
          <div className="space-y-2">
            {riskLevels.map(level => (
              <label 
                key={level.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.risk_level === level.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="risk_level"
                  value={level.value}
                  checked={formData.risk_level === level.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div>
                  <p className="font-medium text-gray-900">{level.label}</p>
                  <p className="text-sm text-gray-500">{level.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Primary Portfolio */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_primary"
            id="is_primary"
            checked={formData.is_primary}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
            Set as primary portfolio
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEdit ? 'Update Portfolio' : 'Create Portfolio')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PortfolioForm;