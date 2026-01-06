/**
 * Analytics Dashboard
 * Sprint 11-12: Comprehensive financial analytics
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  CreditCard,
  Wallet,
  Loader2,
  RefreshCw,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  fetchDashboardAnalytics,
  fetchSpendingTrends,
  fetchIncomeExpenseAnalysis,
  fetchCrossModuleInsights,
  recordNetWorthSnapshot,
  recordHealthSnapshot,
  selectDashboard,
  selectSpendingTrends,
  selectIncomeExpense,
  selectInsights,
  selectAnalyticsLoading,
  selectAnalyticsError,
  clearError
} from '../../store/features/analyticsSlice';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const dashboard = useSelector(selectDashboard);
  const spendingTrends = useSelector(selectSpendingTrends);
  const incomeExpense = useSelector(selectIncomeExpense);
  const insights = useSelector(selectInsights);
  const isLoading = useSelector(selectAnalyticsLoading);
  const error = useSelector(selectAnalyticsError);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchDashboardAnalytics());
    dispatch(fetchSpendingTrends({ months: 6 }));
    dispatch(fetchIncomeExpenseAnalysis(12));
    dispatch(fetchCrossModuleInsights());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRecordSnapshots = async () => {
    await Promise.all([
      dispatch(recordNetWorthSnapshot()),
      dispatch(recordHealthSnapshot())
    ]);
    toast.success('Financial snapshots recorded');
    dispatch(fetchDashboardAnalytics());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercent = (value) => `${parseFloat(value || 0).toFixed(1)}%`;

  if (isLoading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600">Your complete financial overview</p>
        </div>
        <button
          onClick={handleRecordSnapshots}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Record Snapshot
        </button>
      </div>

      {dashboard?.netWorth && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Net Worth</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(dashboard.netWorth.netWorth)}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-blue-200 text-xs">Assets</p>
                  <p className="text-lg font-semibold">{formatCurrency(dashboard.netWorth.totalAssets)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs">Liabilities</p>
                  <p className="text-lg font-semibold">{formatCurrency(dashboard.netWorth.totalLiabilities)}</p>
                </div>
              </div>
            </div>
            <Wallet className="w-16 h-16 text-blue-200 opacity-50" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Health Score</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard?.healthScore?.health_score || '--'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Goal Progress</p>
              <p className="text-3xl font-bold text-blue-600">{formatPercent(dashboard?.goalProgress?.overallProgress)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Debt Paid Off</p>
              <p className="text-3xl font-bold text-green-600">{formatPercent(dashboard?.debtProgress?.progress)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Portfolio Value</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(dashboard?.portfolioValue?.currentValue)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['overview', 'spending', 'insights'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && incomeExpense?.averages && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Monthly Income</p>
                <p className="text-2xl font-bold">{formatCurrency(incomeExpense.averages.income)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <ArrowDownRight className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Monthly Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(incomeExpense.averages.expenses)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Monthly Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(incomeExpense.averages.savings)}</p>
                <p className="text-sm text-blue-600">{incomeExpense.averages.savingsRate}% rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spending' && spendingTrends?.topCategories && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {spendingTrends.topCategories.slice(0, 8).map((cat, idx) => {
              const maxTotal = spendingTrends.topCategories[0]?.total || 1;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{cat.category}</span>
                    <span>{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(cat.total / maxTotal) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {insights?.insights?.length > 0 ? (
            insights.insights.map((insight, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                  <div>
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Add more financial data to receive insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
