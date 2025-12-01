import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  DollarSign, TrendingUp, TrendingDown, PiggyBank, 
  Plus, Settings, AlertCircle, CheckCircle 
} from 'lucide-react';
import { fetchCurrentBudget, fetchBudgetSummary } from '../../store/features/budgetSlice';
import BudgetForm from './BudgetForm';
import CategoryManager from './CategoryManager';
import toast from 'react-hot-toast';

const BudgetDashboard = () => {
  const dispatch = useDispatch();
  const { currentBudget, categories, summary, isLoading } = useSelector((state) => state.budget);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentBudget());
    dispatch(fetchBudgetSummary());
  }, [dispatch]);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (percentage >= 80) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-gray-600">{currentMonth}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Settings className="w-5 h-5 mr-2" />
            Categories
          </button>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            {currentBudget ? 'Edit Budget' : 'Create Budget'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary?.currentMonth?.income?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary?.currentMonth?.spent?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className={`text-2xl font-bold ${(summary?.currentMonth?.remaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary?.currentMonth?.remaining?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Savings Goal</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary?.currentMonth?.savingsGoal?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No categories set up yet</p>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="text-blue-600 hover:underline"
            >
              Add your first category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {summary?.categoryBreakdown?.map((category) => {
              const percentage = Math.min(category.percentage, 100);
              return (
                <div key={category.category_name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      />
                      <span className="font-medium text-gray-900">{category.category_name}</span>
                      {getStatusIcon(category.percentage)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${category.spent?.toLocaleString()} / ${category.monthly_limit?.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(category.percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{category.percentage?.toFixed(0)}% used</span>
                    <span>${(category.monthly_limit - category.spent)?.toLocaleString()} remaining</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* No Budget Message */}
      {!currentBudget && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budget Set</h3>
          <p className="text-gray-600 mb-4">
            Create a budget for {currentMonth} to start tracking your spending.
          </p>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Budget
          </button>
        </div>
      )}

      {/* Modals */}
      {showBudgetForm && (
        <BudgetForm
          budget={currentBudget}
          onClose={() => setShowBudgetForm(false)}
          onSuccess={() => {
            setShowBudgetForm(false);
            dispatch(fetchCurrentBudget());
            dispatch(fetchBudgetSummary());
            toast.success(currentBudget ? 'Budget updated!' : 'Budget created!');
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onUpdate={() => {
            dispatch(fetchCurrentBudget());
            dispatch(fetchBudgetSummary());
          }}
        />
      )}
    </div>
  );
};

export default BudgetDashboard;