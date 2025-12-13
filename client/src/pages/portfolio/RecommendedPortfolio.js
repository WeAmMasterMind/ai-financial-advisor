/**
 * Recommended Portfolio
 * AI-generated portfolio recommendation based on risk profile
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRecommendation, createPortfolio } from '../../store/features/portfolioSlice';

const RecommendedPortfolio = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { recommendation, isLoading } = useSelector(state => state.portfolio);

  useEffect(() => {
    dispatch(fetchRecommendation());
  }, [dispatch]);

  const handleCreatePortfolio = async () => {
    try {
      await dispatch(createPortfolio({
        portfolio_name: `${recommendation.modelName} Portfolio`,
        portfolio_type: 'brokerage',
        risk_level: recommendation.riskLevel,
        target_allocation: recommendation.allocation,
        is_primary: false
      })).unwrap();
      navigate('/portfolio');
    } catch (err) {
      console.error('Failed to create portfolio:', err);
    }
  };

  if (isLoading || !recommendation) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const colors = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#6B7280', '#EC4899', '#8B5CF6'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/portfolio" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Portfolios
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Recommended Portfolio</h1>
        <p className="mt-1 text-gray-500">Based on your risk profile and financial questionnaire</p>
      </div>

      {/* User Profile Summary */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Risk Score</p>
            <p className="text-2xl font-bold text-blue-600">{recommendation.userProfile?.riskScore}/10</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age</p>
            <p className="text-2xl font-bold text-gray-900">{recommendation.userProfile?.age}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Investment Horizon</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {recommendation.userProfile?.investmentHorizon?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{recommendation.modelName}</h2>
            <p className="text-gray-500 mt-1">{recommendation.description}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Recommended
          </span>
        </div>

        {/* Allocation Chart Placeholder */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Allocation</h3>
          <div className="flex h-8 rounded-full overflow-hidden mb-4">
            {recommendation.assetClasses?.map((asset, index) => (
              <div
                key={asset.class}
                style={{
                  width: `${asset.targetPercentage}%`,
                  backgroundColor: asset.color || colors[index % colors.length]
                }}
                title={`${asset.name}: ${asset.targetPercentage}%`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recommendation.assetClasses?.map((asset, index) => (
              <div key={asset.class} className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: asset.color || colors[index % colors.length] }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                  <p className="text-sm text-gray-500">{asset.targetPercentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested ETFs */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested ETFs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendation.assetClasses?.map((asset) => (
              <div key={asset.class} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">{asset.name}</p>
                <div className="flex flex-wrap gap-2">
                  {asset.suggestedETFs?.slice(0, 3).map(etf => (
                    <span key={etf} className="px-2 py-1 bg-white border rounded text-sm text-gray-700">
                      {etf}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Link
          to="/portfolio"
          className="px-6 py-3 text-gray-600 hover:text-gray-800"
        >
          Maybe Later
        </Link>
        <button
          onClick={handleCreatePortfolio}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Create This Portfolio
        </button>
      </div>
    </div>
  );
};

export default RecommendedPortfolio;