/**
 * Context Panel
 * Sprint 7-8: Display what financial data the AI has access to
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  RefreshCw, 
  Loader2,
  TrendingDown,
  Wallet,
  CreditCard,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

import {
  fetchContext,
  selectContext,
  selectContextLoading
} from '../../store/features/aiSlice';

const ContextPanel = () => {
  const dispatch = useDispatch();
  
  const context = useSelector(selectContext);
  const isLoading = useSelector(selectContextLoading);

  useEffect(() => {
    if (!context) {
      dispatch(fetchContext());
    }
  }, [dispatch, context]);

  const handleRefresh = () => {
    dispatch(fetchContext());
  };

  const raw = context?.raw || {};
  const fh = raw.financialHealth || {};

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score) => {
    if (score >= 70) return CheckCircle;
    if (score >= 40) return AlertTriangle;
    return AlertTriangle;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return '-';
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading && !context) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Financial Context</h3>
          <p className="text-xs text-gray-500">What Atlas knows about you</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {fh.score !== undefined && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Financial Health</span>
              {React.createElement(getHealthIcon(fh.score), {
                className: `w-5 h-5 ${getHealthColor(fh.score)}`
              })}
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${getHealthColor(fh.score)}`}>
                {fh.score}
              </span>
              <span className="text-gray-400 mb-1">/100</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  fh.score >= 70 ? 'bg-green-500' :
                  fh.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${fh.score}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Monthly Cash Flow
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Income</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(fh.monthlyIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expenses</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(fh.monthlyExpenses)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Net Cash Flow</span>
              <span className={`text-sm font-bold ${fh.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(fh.netCashFlow)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Savings
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Savings Rate</span>
              <span className={`text-sm font-medium ${
                fh.savingsRate >= 0.2 ? 'text-green-600' :
                fh.savingsRate >= 0.1 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {formatPercent(fh.savingsRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Emergency Fund</span>
              <span className="text-sm font-medium">
                {fh.emergencyFundMonths?.toFixed(1) || 0} months
              </span>
            </div>
          </div>
        </div>

        {raw.debts?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Debt Overview
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Debt</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(fh.totalDebt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Accounts</span>
                <span className="text-sm font-medium">{raw.debts.length}</span>
              </div>
              {raw.activeDebtStrategy && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Strategy</span>
                  <span className="text-sm font-medium capitalize">
                    {raw.activeDebtStrategy}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {raw.portfolio && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Investment Portfolio
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(raw.portfolio.current_value)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Risk Level</span>
                <span className="text-sm font-medium capitalize">
                  {raw.portfolio.risk_level || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Holdings</span>
                <span className="text-sm font-medium">
                  {raw.holdings?.length || 0} positions
                </span>
              </div>
            </div>
          </div>
        )}

        {raw.topCategories?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Top Spending (3 months)
            </h4>
            <div className="space-y-2">
              {raw.topCategories.slice(0, 5).map((cat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate">{cat.category}</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {raw.profile && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Profile
            </h4>
            <div className="space-y-2">
              {raw.profile.age && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Age</span>
                  <span className="text-sm font-medium">{raw.profile.age}</span>
                </div>
              )}
              {raw.profile.risk_tolerance && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk Tolerance</span>
                  <span className="text-sm font-medium capitalize">
                    {raw.profile.risk_tolerance}
                  </span>
                </div>
              )}
              {raw.profile.investment_horizon && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Horizon</span>
                  <span className="text-sm font-medium capitalize">
                    {raw.profile.investment_horizon}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          This data is used to personalize your financial advice.
          <br />
          Your data is never shared externally.
        </p>
      </div>
    </div>
  );
};

export default ContextPanel;