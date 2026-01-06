/**
 * Goal Form Component
 * Sprint 11-12: Create/Edit financial goal
 */

import React, { useState } from 'react';
import {
  X,
  Target,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  PiggyBank,
  Briefcase,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react';

const GOAL_TYPES = [
  { value: 'emergency_fund', label: 'Emergency Fund', icon: PiggyBank, color: '#10B981' },
  { value: 'debt_payoff', label: 'Debt Payoff', icon: TrendingUp, color: '#EF4444' },
  { value: 'house_down_payment', label: 'House Down Payment', icon: Home, color: '#3B82F6' },
  { value: 'retirement', label: 'Retirement', icon: Briefcase, color: '#8B5CF6' },
  { value: 'vacation', label: 'Vacation', icon: Plane, color: '#F59E0B' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: '#6366F1' },
  { value: 'car', label: 'Car', icon: Car, color: '#EC4899' },
  { value: 'investment', label: 'Investment', icon: DollarSign, color: '#14B8A6' },
  { value: 'wedding', label: 'Wedding', icon: Heart, color: '#F472B6' },
  { value: 'other', label: 'Other', icon: Target, color: '#6B7280' }
];

const GoalForm = ({ goal, onSubmit, onClose, isLoading }) => {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    goalType: goal?.goal_type || '',
    targetAmount: goal?.target_amount || '',
    currentAmount: goal?.current_amount || 0,
    targetDate: goal?.target_date?.split('T')[0] || '',
    monthlyContribution: goal?.monthly_contribution || '',
    priority: goal?.priority || 5,
    notes: goal?.notes || '',
    color: goal?.color || '#3B82F6'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      goalType: type.value,
      color: type.color
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.goalType) newErrors.goalType = 'Please select a goal type';
    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      goalType: formData.goalType,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      targetDate: formData.targetDate || null,
      monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
      priority: parseInt(formData.priority),
      notes: formData.notes.trim(),
      color: formData.color
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Goal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GOAL_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = formData.goalType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={type.label}
                  >
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: isSelected ? type.color : '#9CA3AF' }}
                    />
                    <span className="text-[10px] text-gray-600 truncate w-full text-center">
                      {type.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.goalType && (
              <p className="text-red-500 text-xs mt-1">{errors.goalType}</p>
            )}
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Emergency Fund"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => handleChange('targetAmount', e.target.value)}
                placeholder="10,000"
                min="0"
                step="100"
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.targetAmount && (
              <p className="text-red-500 text-xs mt-1">{errors.targetAmount}</p>
            )}
          </div>

          {/* Current Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount (already saved)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.currentAmount}
                onChange={(e) => handleChange('currentAmount', e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleChange('targetDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Monthly Contribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Contribution
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.monthlyContribution}
                  onChange={(e) => handleChange('monthlyContribution', e.target.value)}
                  placeholder="500"
                  min="0"
                  step="50"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority: {formData.priority}
            </label>
            <input
              type="range"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              min="1"
              max="10"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about this goal..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Preview */}
          {formData.targetAmount && formData.monthlyContribution > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Estimated time to goal:</strong>{' '}
                {Math.ceil((formData.targetAmount - (formData.currentAmount || 0)) / formData.monthlyContribution)} months
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                goal ? 'Update Goal' : 'Create Goal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;
