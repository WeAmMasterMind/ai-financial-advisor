/**
 * Dashboard Component
 * Main financial overview with real data from Redux store
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  PieChart
} from 'lucide-react';
import { 
  fetchDashboardSummary,
  selectDashboardLoading,
  selectDashboardError,
  selectProfile,
  selectQuestionnaire,
  selectTransactions,
  selectDebt,
  selectPortfolio,
  selectStats,
  selectFinancialHealthScore,
  selectLastUpdated
} from '../store/features/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const isLoading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const profile = useSelector(selectProfile);
  const questionnaire = useSelector(selectQuestionnaire);
  const transactions = useSelector(selectTransactions);
  const debt = useSelector(selectDebt);
  const portfolio = useSelector(selectPortfolio);
  const stats = useSelector(selectStats);
  const healthScore = useSelector(selectFinancialHealthScore);
  const lastUpdated = useSelector(selectLastUpdated);

  // Fetch dashboard data on mount
  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get icon component
  const getIcon = (iconName) => {
    const icons = {
      DollarSign,
      TrendingUp,
      TrendingDown,
      CreditCard,
      PieChart
    };
    return icons[iconName] || DollarSign;
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchDashboardSummary());
  };

  // Loading state
  if (isLoading && !lastUpdated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !lastUpdated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your finances today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Questionnaire Banner */}
      {!questionnaire?.completed && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Complete Your Financial Profile</h3>
                <p className="text-sm text-gray-600">
                  {questionnaire?.started 
                    ? `You're on step ${questionnaire.currentStep} of 5. Continue to get personalized recommendations.`
                    : 'Answer a few questions to get personalized financial advice.'}
                </p>
              </div>
            </div>
            <Link
              to="/questionnaire"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {questionnaire?.started ? 'Continue' : 'Get Started'}
            </Link>
          </div>
        </div>
      )}

      {/* Financial Health Score */}
      {questionnaire?.completed && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                healthScore >= 70 ? 'bg-green-100' : 
                healthScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`text-2xl font-bold ${
                  healthScore >= 70 ? 'text-green-600' : 
                  healthScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {healthScore}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Financial Health Score</h3>
                <p className="text-sm text-gray-500">
                  {healthScore >= 70 ? 'Excellent! Keep up the good work.' : 
                   healthScore >= 50 ? 'Good progress. Room for improvement.' : 
                   'Needs attention. Check recommendations below.'}
                </p>
              </div>
            </div>
            <Link
              to="/advisor"
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Get AI Advice
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats && stats.length > 0 ? (
          stats.map((stat, index) => {
            const IconComponent = getIcon(stat.icon);
            const colorClasses = {
              blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
              green: { bg: 'bg-green-100', text: 'text-green-600' },
              red: { bg: 'bg-red-100', text: 'text-red-600' },
              orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
              purple: { bg: 'bg-purple-100', text: 'text-purple-600' }
            };
            const colors = colorClasses[stat.color] || colorClasses.blue;
            
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <IconComponent className={`w-6 h-6 ${colors.text}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stat.value)}
                  </p>
                  {stat.change !== 0 && (
                    <div className="flex items-center mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ml-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(stat.change)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          // Fallback stats when no data
          <div className="col-span-4 text-center py-8 text-gray-500">
            <p>Complete the questionnaire to see your financial stats.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
            {transactions?.recentTransactions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {transaction.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No transactions yet</p>
                <Link
                  to="/transactions"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Add your first transaction →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/transactions"
                className="w-full flex items-center px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Add Transaction</span>
              </Link>
              <Link 
                to="/budget"
                className="w-full flex items-center px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <PiggyBank className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Review Budget</span>
              </Link>
              <Link 
                to="/debt"
                className="w-full flex items-center px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <CreditCard className="w-5 h-5 text-orange-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage Debt</span>
              </Link>
              <Link 
                to="/portfolio"
                className="w-full flex items-center px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <PieChart className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Portfolio</span>
              </Link>
            </div>
          </div>

          {/* Debt Summary */}
          {debt && debt.totalDebts > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Debt Overview</h2>
                <Link to="/debt" className="text-sm text-blue-600 hover:text-blue-700">
                  Details
                </Link>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total Debt</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(debt.totalBalance)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Monthly Payments</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(debt.totalMonthlyPayment)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avg Interest Rate</span>
                    <span className="text-gray-900 font-medium">{debt.avgInterestRate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Summary */}
          {portfolio && portfolio.portfolioCount > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Portfolio</h2>
                <Link to="/portfolio" className="text-sm text-blue-600 hover:text-blue-700">
                  Details
                </Link>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total Value</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(portfolio.totalValue)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total Gain/Loss</span>
                    <span className={`font-medium ${portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolio.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGainLoss)}
                      <span className="text-xs ml-1">({portfolio.gainLossPercent}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="mt-6 text-xs text-gray-400 text-center">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default Dashboard;
