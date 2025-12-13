/**
 * Portfolio Dashboard
 * Overview of all investment portfolios
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPortfolios, deletePortfolio, clearSuccess } from '../../store/features/portfolioSlice';

const PortfolioDashboard = () => {
  const dispatch = useDispatch();
  const { portfolios, isLoading, successMessage } = useSelector(state => state.portfolio);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const handleDeleteClick = (portfolio) => {
    setPortfolioToDelete(portfolio);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (portfolioToDelete) {
      dispatch(deletePortfolio(portfolioToDelete.id));
      setShowDeleteModal(false);
      setPortfolioToDelete(null);
    }
  };

  const totalValue = portfolios.reduce((sum, p) => sum + parseFloat(p.calculated_value || p.current_value || 0), 0);

  const getRiskColor = (risk) => {
    const colors = {
      conservative: 'bg-blue-100 text-blue-800',
      moderately_conservative: 'bg-cyan-100 text-cyan-800',
      moderate: 'bg-green-100 text-green-800',
      moderately_aggressive: 'bg-yellow-100 text-yellow-800',
      aggressive: 'bg-red-100 text-red-800'
    };
    return colors[risk] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading && portfolios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Portfolios</h1>
          <p className="mt-1 text-gray-500">Manage your investment portfolios and track performance</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/portfolio/recommended"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Get Recommendation
          </Link>
          <Link
            to="/portfolio/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Portfolio
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
        <p className="text-blue-100 text-sm">Total Portfolio Value</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(totalValue)}</p>
        <p className="text-blue-100 mt-2">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Portfolio List */}
      {portfolios.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No portfolios yet</h3>
          <p className="text-gray-500 mb-6">Create your first investment portfolio to start tracking your wealth.</p>
          <Link
            to="/portfolio/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Your First Portfolio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link 
                    to={`/portfolio/${portfolio.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {portfolio.portfolio_name}
                  </Link>
                  {portfolio.is_primary && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Primary</span>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(portfolio.risk_level)}`}>
                  {portfolio.risk_level?.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500">Current Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(portfolio.calculated_value || portfolio.current_value)}
                </p>
              </div>

              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>{portfolio.holdings_count || 0} holdings</span>
                <span>{portfolio.portfolio_type?.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Link
                  to={`/portfolio/${portfolio.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details
                </Link>
                <div className="space-x-3">
                  <Link
                    to={`/portfolio/${portfolio.id}/edit`}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(portfolio)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Portfolio</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{portfolioToDelete?.portfolio_name}"? This will also delete all holdings.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDashboard;