/**
 * Portfolio Detail
 * View portfolio with holdings and performance
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchPortfolioById, deleteHolding, clearCurrentPortfolio } from '../../store/features/portfolioSlice';

const PortfolioDetail = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { currentPortfolio, isLoading } = useSelector(state => state.portfolio);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchPortfolioById(id));
    return () => {
      dispatch(clearCurrentPortfolio());
    };
  }, [dispatch, id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    const num = parseFloat(value) || 0;
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const handleDeleteHolding = (holding) => {
    setHoldingToDelete(holding);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (holdingToDelete) {
      dispatch(deleteHolding(holdingToDelete.id));
      setShowDeleteModal(false);
      setHoldingToDelete(null);
    }
  };

  const getAssetClassColor = (assetClass) => {
    const colors = {
      us_stocks: 'bg-blue-100 text-blue-800',
      intl_stocks: 'bg-green-100 text-green-800',
      bonds: 'bg-purple-100 text-purple-800',
      real_estate: 'bg-yellow-100 text-yellow-800',
      cash: 'bg-gray-100 text-gray-800',
      crypto: 'bg-orange-100 text-orange-800',
      alternatives: 'bg-pink-100 text-pink-800'
    };
    return colors[assetClass] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading || !currentPortfolio) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { performance, holdings } = currentPortfolio;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/portfolio" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Portfolios
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentPortfolio.portfolio_name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-500">{currentPortfolio.portfolio_type?.replace('_', ' ')}</span>
              {currentPortfolio.is_primary && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Primary</span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/portfolio/${id}/rebalance`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Rebalance
            </Link>
            <Link
              to={`/portfolio/${id}/holding/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Holding
            </Link>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance?.totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance?.totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Total Gain/Loss</p>
          <p className={`text-2xl font-bold ${performance?.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(performance?.totalGain)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Return</p>
          <p className={`text-2xl font-bold ${performance?.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(performance?.totalGainPercent)}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
        </div>

        {holdings && holdings.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {holdings.map((holding) => (
                <tr key={holding.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{holding.symbol || holding.name}</p>
                      <p className="text-sm text-gray-500">{holding.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getAssetClassColor(holding.asset_class)}`}>
                      {holding.asset_class?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {parseFloat(holding.quantity).toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {formatCurrency(holding.purchase_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {formatCurrency(holding.current_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {formatCurrency(holding.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                      <p className="text-sm font-medium">{formatCurrency(holding.gain)}</p>
                      <p className="text-xs">{formatPercent(holding.gainPercent)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      to={`/portfolio/${id}/holding/${holding.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteHolding(holding)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No holdings in this portfolio yet</p>
            <Link
              to={`/portfolio/${id}/holding/new`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Your First Holding
            </Link>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Holding</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {holdingToDelete?.symbol || holdingToDelete?.name} from this portfolio?
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

export default PortfolioDetail;