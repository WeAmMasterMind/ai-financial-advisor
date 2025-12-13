/**
 * Strategy Calculator
 * Compare Snowball vs Avalanche payoff strategies
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDebts, fetchComparison, saveStrategy } from '../../store/features/debtSlice';

const StrategyCalculator = () => {
  const dispatch = useDispatch();
  const { debts, comparison, isLoading, isCalculating } = useSelector(state => state.debt);
  const [monthlyExtra, setMonthlyExtra] = useState(100);

  useEffect(() => {
    dispatch(fetchDebts());
  }, [dispatch]);

  useEffect(() => {
    if (debts.length > 0) {
      dispatch(fetchComparison(monthlyExtra));
    }
  }, [dispatch, debts.length, monthlyExtra]);

  const handleCalculate = () => {
    dispatch(fetchComparison(monthlyExtra));
  };

  const handleSaveStrategy = (strategyType) => {
    const strategyData = strategyType === 'snowball' ? comparison.snowball : comparison.avalanche;
    dispatch(saveStrategy({
      strategy_type: strategyType,
      monthly_extra: monthlyExtra,
      projected_payoff_date: strategyData.payoffDate,
      total_interest_saved: comparison.comparison.interestSavedVsMinimum,
      strategy_details: strategyData
    }));
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
      month: 'long'
    });
  };

  if (isLoading && debts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🧮</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No debts to calculate</h3>
          <p className="text-gray-500 mb-6">Add your debts first to compare payoff strategies.</p>
          <Link
            to="/debt/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Your First Debt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/debt" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Debts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Payoff Strategy Calculator</h1>
        <p className="mt-1 text-gray-500">Compare Snowball vs Avalanche methods to find your best path to debt freedom</p>
      </div>

      {/* Extra Payment Input */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Extra Monthly Payment</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How much extra can you pay monthly?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={monthlyExtra}
                onChange={(e) => setMonthlyExtra(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="50"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          This amount will be applied on top of your minimum payments
        </p>
      </div>

      {/* Strategy Comparison */}
      {comparison && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Snowball Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">❄️ Snowball</h3>
                {comparison.comparison.recommendation?.strategy === 'snowball' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">Pay smallest balances first for quick wins</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Debt-Free Date</p>
                  <p className="text-xl font-bold text-gray-900">{formatDate(comparison.snowball?.payoffDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Interest</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(comparison.snowball?.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Months to Payoff</p>
                  <p className="text-xl font-bold text-gray-900">{comparison.snowball?.totalMonths}</p>
                </div>
              </div>

              <button
                onClick={() => handleSaveStrategy('snowball')}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Choose Snowball
              </button>
            </div>

            {/* Avalanche Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🏔️ Avalanche</h3>
                {comparison.comparison.recommendation?.strategy === 'avalanche' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">Pay highest interest first to save money</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Debt-Free Date</p>
                  <p className="text-xl font-bold text-gray-900">{formatDate(comparison.avalanche?.payoffDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Interest</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(comparison.avalanche?.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Months to Payoff</p>
                  <p className="text-xl font-bold text-gray-900">{comparison.avalanche?.totalMonths}</p>
                </div>
              </div>

              <button
                onClick={() => handleSaveStrategy('avalanche')}
                className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Choose Avalanche
              </button>
            </div>

            {/* Comparison Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Comparison</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Avalanche Saves</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(comparison.comparison?.interestSavedWithAvalanche)}
                  </p>
                  <p className="text-xs text-gray-500">vs Snowball</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">vs Minimum Payments Only</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(comparison.comparison?.interestSavedVsMinimum)} saved
                  </p>
                  <p className="text-xs text-gray-500">
                    {comparison.comparison?.timeSavedVsMinimum} months faster
                  </p>
                </div>

                {comparison.comparison?.recommendation && (
                  <div className="pt-4 border-t border-green-200">
                    <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {comparison.comparison.recommendation.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payoff Order */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payoff Order Comparison</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Snowball Order */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">❄️ Snowball Order</h3>
                <div className="space-y-2">
                  {comparison.snowball?.debtPayoffOrder?.map((debt, index) => (
                    <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{debt.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(debt.originalBalance)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">Month {debt.payoffMonth}</p>
                        <p className="text-xs text-gray-500">{formatDate(debt.payoffDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avalanche Order */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">🏔️ Avalanche Order</h3>
                <div className="space-y-2">
                  {comparison.avalanche?.debtPayoffOrder?.map((debt, index) => (
                    <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{debt.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(debt.originalBalance)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">Month {debt.payoffMonth}</p>
                        <p className="text-xs text-gray-500">{formatDate(debt.payoffDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StrategyCalculator;