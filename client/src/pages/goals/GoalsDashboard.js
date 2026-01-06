/**
 * Goals Dashboard
 * Sprint 11-12: Financial goals tracking and management
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  ChevronRight,
  Sparkles,
  Trophy,
  PiggyBank
} from 'lucide-react';
import toast from 'react-hot-toast';

import GoalCard from '../../components/goals/GoalCard';
import GoalForm from '../../components/goals/GoalForm';

import {
  fetchGoals,
  fetchGoalsSummary,
  createGoal,
  deleteGoal,
  selectGoals,
  selectGoalsSummary,
  selectGoalsLoading,
  selectGoalsError,
  selectGoalsSuccess,
  clearError,
  clearSuccess
} from '../../store/features/goalsSlice';

const GoalsDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const goals = useSelector(selectGoals);
  const summary = useSelector(selectGoalsSummary);
  const isLoading = useSelector(selectGoalsLoading);
  const error = useSelector(selectGoalsError);
  const success = useSelector(selectGoalsSuccess);

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    dispatch(fetchGoals({ status: filter }));
    dispatch(fetchGoalsSummary());
  }, [dispatch, filter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearSuccess());
    }
  }, [error, success, dispatch]);

  const handleCreateGoal = async (goalData) => {
    const result = await dispatch(createGoal(goalData));
    if (!result.error) {
      setShowForm(false);
      dispatch(fetchGoalsSummary());
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await dispatch(deleteGoal(goalId));
      dispatch(fetchGoalsSummary());
    }
  };

  const handleGoalClick = (goalId) => {
    navigate(`/goals/${goalId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const summaryData = summary?.summary || {};
  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600">Track your progress towards financial freedom</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.total_saved)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            of {formatCurrency(summaryData.total_target)} target
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {summaryData.overall_progress || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(summaryData.overall_progress || 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData.active_goals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {summaryData.completed_goals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Closest to Completion */}
      {summary?.closestToCompletion?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Almost There!</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.closestToCompletion.map(goal => (
              <div 
                key={goal.id}
                onClick={() => handleGoalClick(goal.id)}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{goal.name}</span>
                  <span className="text-sm font-bold text-green-600">{goal.progress_percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${goal.progress_percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formatCurrency(goal.target_amount - goal.current_amount)} to go
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Active ({activeGoals.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Completed ({completedGoals.length})
        </button>
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === '' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({goals.length})
        </button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-500 mb-6">
            Start by creating your first financial goal
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal}
              onClick={() => handleGoalClick(goal.id)}
              onDelete={() => handleDeleteGoal(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Recent Contributions */}
      {summary?.recentContributions?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Contributions</h2>
          <div className="space-y-3">
            {summary.recentContributions.slice(0, 5).map(contribution => (
              <div 
                key={contribution.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: contribution.color || '#3B82F6' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{contribution.goal_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(contribution.contribution_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-green-600 font-semibold">
                  +{formatCurrency(contribution.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          onSubmit={handleCreateGoal}
          onClose={() => setShowForm(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default GoalsDashboard;
