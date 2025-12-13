/**
 * Debt Dashboard
 * Main debt management view with summary and list
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchDebts, 
  fetchDebtSummary, 
  deleteDebt,
  clearError,
  clearSuccess 
} from '../../store/features/debtSlice';

const DebtDashboard = () => {
  const dispatch = useDispatch();
  const { debts, summary, isLoading, error, successMessage } = useSelector(state => state.debt);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchDebts());
    dispatch(fetchDebtSummary());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleDeleteClick = (debt) => {
    setDebtToDelete(debt);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (debtToDelete) {
      dispatch(deleteDebt(debtToDelete.id));
      setShowDeleteModal(false);
      setDebtToDelete(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDebtTypeColor = (type) => {
    const colors = {
      credit_card: 'bg-red-100 text-red-800',
      mortgage: 'bg-blue-100 text-blue-800',
      auto_loan: 'bg-green-100 text-green-800',
      student_loan: 'bg-purple-100 text-purple-800',
      personal_loan: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  if (isLoading && debts.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Debt Management</h1>
          <p className="mt-1 text-gray-500">Track and eliminate your debts strategically</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/debt/calculator"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Payoff Calculator
          </Link>
          <Link
            to="/debt/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Debt
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <span className="text-red-700">{error}</span>
          <button onClick={() => dispatch(clearError())} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Total Debt</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{summary.totalDebts} accounts</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Monthly Minimums</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary.totalMinimumPayments)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Combined minimum</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Highest Rate</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {summary.highestRate?.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">APR</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Debt-Free Date</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatDate(summary.debtFreeDate)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{summary.monthsToPayoff} months</p>
          </div>
        </div>
      )}

      {/* Debt List */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No debts tracked yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first debt to begin tracking your payoff journey.</p>
          <Link
            to="/debt/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Your First Debt
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {debts.map((debt) => (
                <tr key={debt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/debt/${debt.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {debt.debt_name || 'Unnamed Debt'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getDebtTypeColor(debt.debt_type)}`}>
                      {debt.debt_type?.replace('_', ' ') || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(debt.current_balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {parseFloat(debt.interest_rate).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {formatCurrency(debt.minimum_payment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      to={`/debt/${debt.id}/payment`}
                      className="text-green-600 hover:text-green-800 mr-3"
                    >
                      Pay
                    </Link>
                    <Link
                      to={`/debt/${debt.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(debt)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Debt</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{debtToDelete?.debt_name}"? This action cannot be undone.
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

export default DebtDashboard;