/**
 * Goal Card Component
 * Sprint 11-12: Display individual goal with progress
 */

import React from 'react';
import {
  Target,
  Trash2,
  Calendar,
  TrendingUp,
  CheckCircle,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  PiggyBank,
  Briefcase,
  DollarSign
} from 'lucide-react';

const GOAL_ICONS = {
  emergency_fund: PiggyBank,
  debt_payoff: TrendingUp,
  house_down_payment: Home,
  retirement: Briefcase,
  vacation: Plane,
  education: GraduationCap,
  car: Car,
  investment: DollarSign,
  wedding: Heart,
  other: Target
};

const GoalCard = ({ goal, onClick, onDelete }) => {
  const Icon = GOAL_ICONS[goal.goal_type] || Target;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const progress = parseFloat(goal.progress_percent) || 0;
  const remaining = (goal.target_amount || 0) - (goal.current_amount || 0);
  
  const getProgressColor = () => {
    if (goal.is_completed) return 'bg-green-500';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
        goal.is_completed ? 'ring-2 ring-green-500' : ''
      }`}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ backgroundColor: `${goal.color}15` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: goal.color || '#3B82F6' }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{goal.name}</h3>
            <p className="text-xs text-gray-500 capitalize">
              {goal.goal_type?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        
        {goal.is_completed ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Amount Progress */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(goal.current_amount)}
              </span>
              <span className="text-gray-400 text-sm ml-1">
                / {formatCurrency(goal.target_amount)}
              </span>
            </div>
            <span className={`text-sm font-bold ${
              goal.is_completed ? 'text-green-600' : 'text-blue-600'
            }`}>
              {progress.toFixed(0)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {!goal.is_completed && (
            <div>
              <p className="text-gray-500">Remaining</p>
              <p className="font-semibold text-gray-900">{formatCurrency(remaining)}</p>
            </div>
          )}
          
          {goal.monthly_contribution > 0 && !goal.is_completed && (
            <div>
              <p className="text-gray-500">Monthly</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(goal.monthly_contribution)}
              </p>
            </div>
          )}
          
          {goal.target_date && (
            <div>
              <p className="text-gray-500">Target Date</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(goal.target_date)}
              </p>
            </div>
          )}
          
          {goal.months_to_goal && !goal.is_completed && (
            <div>
              <p className="text-gray-500">Time to Goal</p>
              <p className="font-semibold text-gray-900">
                {goal.months_to_goal} months
              </p>
            </div>
          )}
          
          {goal.is_completed && goal.completed_at && (
            <div className="col-span-2">
              <p className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Completed {formatDate(goal.completed_at)}
              </p>
            </div>
          )}
        </div>

        {/* Priority Badge */}
        {goal.priority >= 8 && !goal.is_completed && (
          <div className="mt-3 inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            High Priority
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
