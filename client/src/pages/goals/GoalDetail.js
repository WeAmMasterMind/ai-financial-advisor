/**
 * Goal Detail Page
 * Sprint 11-12: Individual goal view with contributions and projections
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Target,
  Calendar,
  DollarSign,
  CheckCircle,
  Loader2,
  Clock,
  PiggyBank
} from 'lucide-react';
import toast from 'react-hot-toast';

import GoalForm from '../../components/goals/GoalForm';
import ContributionForm from '../../components/goals/ContributionForm';

import {
  fetchGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  fetchGoalProjection,
  selectCurrentGoal,
  selectGoalProjection,
  selectGoalsLoading,
  selectGoalsError,
  selectGoalsSuccess,
  clearError,
  clearSuccess,
  clearCurrentGoal,
  clearProjection
} from '../../store/features/goalsSlice';

const GoalDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const goal = useSelector(selectCurrentGoal);
  const projection = useSelector(selectGoalProjection);
  const isLoading = useSelector(selectGoalsLoading);
  const error = useSelector(selectGoalsError);
  const success = useSelector(selectGoalsSuccess);

  const [showEditForm, setShowEditForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);

  useEffect(() => {
    dispatch(fetchGoal(id));
    dispatch(fetchGoalProjection({ goalId: id }));

    return () => {
      dispatch(clearCurrentGoal());
      dispatch(clearProjection());
    };
  }, [dispatch, id]);

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

  const handleUpdate = async (data) => {
    const result = await dispatch(updateGoal({ id, data }));
    if (!result.error) {
      setShowEditForm(false);
      dispatch(fetchGoalProjection({ goalId: id }));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      const result = await dispatch(deleteGoal(id));
      if (!result.error) {
        navigate('/goals');
      }
    }
  };

  const handleAddContribution = async (contributionData) => {
    const result = await dispatch(addContribution({ goalId: id, contributionData }));
    if (!result.error) {
      setShowContributionForm(false);
      dispatch(fetchGoalProjection({ goalId: id }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading && !goal) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="p-6 text-center">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Goal not found</h2>
        <button
          onClick={() => navigate('/goals')}
          className="text-blue-600 hover:underline"
        >
          Back to Goals
        </button>
      </div>
    );
  }

  const progress = parseFloat(goal.progress_percent) || 0;
  const remaining = (goal.target_amount || 0) - (goal.current_amount || 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/goals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
              {goal.is_completed && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
            <p className="text-gray-500 capitalize">{goal.goal_type?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!goal.is_completed && (
            <button
              onClick={() => setShowContributionForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contribution
            </button>
          )}
          <button
            onClick={() => setShowEditForm(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Progress Card */}
      <div 
        className="bg-white rounded-xl shadow-lg p-6"
        style={{ borderTop: `4px solid ${goal.color || '#3B82F6'}` }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={goal.is_completed ? '#10B981' : goal.color || '#3B82F6'}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min(progress, 100) / 100)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{progress.toFixed(0)}%</span>
                <span className="text-sm text-gray-500">Complete</span>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Current Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(goal.current_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target Amount</p>
              <p className="text-2xl font-semibold text-gray-700">
                {formatCurrency(goal.target_amount)}
              </p>
            </div>
            {!goal.is_completed && (
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(remaining)}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {goal.monthly_contribution > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Contribution</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(goal.monthly_contribution)}
                  </p>
                </div>
              </div>
            )}
            
            {goal.target_date && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(goal.target_date)}
                  </p>
                </div>
              </div>
            )}

            {projection?.monthsToGoal && !goal.is_completed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Time</p>
                  <p className="font-semibold text-gray-900">
                    {projection.monthsToGoal} months
                  </p>
                </div>
              </div>
            )}

            {projection?.onTrack !== null && goal.target_date && !goal.is_completed && (
              <div className={`p-3 rounded-lg ${
                projection.onTrack ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
              }`}>
                <p className="text-sm font-medium">
                  {projection.onTrack 
                    ? `✓ On track! ${projection.monthsAhead} months ahead` 
                    : `⚠ Behind schedule by ${Math.abs(projection.monthsAhead)} months`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contribution History */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Contribution History</h2>
          {goal.contributions_this_month > 0 && (
            <span className="text-sm text-green-600 font-medium">
              +{formatCurrency(goal.contributions_this_month)} this month
            </span>
          )}
        </div>

        {goal.contributions && goal.contributions.length > 0 ? (
          <div className="space-y-3">
            {goal.contributions.map(contribution => (
              <div 
                key={contribution.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDate(contribution.contribution_date)}
                    </p>
                    {contribution.notes && (
                      <p className="text-sm text-gray-500">{contribution.notes}</p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  +{formatCurrency(contribution.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No contributions yet</p>
            {!goal.is_completed && (
              <button
                onClick={() => setShowContributionForm(true)}
                className="text-blue-600 hover:underline mt-2"
              >
                Add your first contribution
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {goal.notes && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{goal.notes}</p>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <GoalForm
          goal={goal}
          onSubmit={handleUpdate}
          onClose={() => setShowEditForm(false)}
          isLoading={isLoading}
        />
      )}

      {/* Contribution Form Modal */}
      {showContributionForm && (
        <ContributionForm
          goalName={goal.name}
          onSubmit={handleAddContribution}
          onClose={() => setShowContributionForm(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default GoalDetail;
