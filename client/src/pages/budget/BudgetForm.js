import React from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { createBudget, updateBudget } from '../../store/features/budgetSlice';
import toast from 'react-hot-toast';

const BudgetForm = ({ budget, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      monthlyIncome: budget?.monthly_income || '',
      savingsGoal: budget?.savings_goal || '',
      housing: budget?.planned_expenses?.housing || '',
      food: budget?.planned_expenses?.food || '',
      transportation: budget?.planned_expenses?.transportation || '',
      utilities: budget?.planned_expenses?.utilities || '',
      entertainment: budget?.planned_expenses?.entertainment || '',
      other: budget?.planned_expenses?.other || ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const budgetData = {
        month: currentMonth,
        monthlyIncome: parseFloat(data.monthlyIncome) || 0,
        savingsGoal: parseFloat(data.savingsGoal) || 0,
        plannedExpenses: {
          housing: parseFloat(data.housing) || 0,
          food: parseFloat(data.food) || 0,
          transportation: parseFloat(data.transportation) || 0,
          utilities: parseFloat(data.utilities) || 0,
          entertainment: parseFloat(data.entertainment) || 0,
          other: parseFloat(data.other) || 0
        }
      };

      if (budget) {
        await dispatch(updateBudget({ id: budget.id, data: budgetData })).unwrap();
      } else {
        await dispatch(createBudget(budgetData)).unwrap();
      }
      onSuccess();
    } catch (error) {
      toast.error(error || 'Failed to save budget');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {budget ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                {...register('monthlyIncome', { required: 'Income is required' })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.monthlyIncome && (
              <p className="text-red-500 text-sm mt-1">{errors.monthlyIncome.message}</p>
            )}
          </div>

          {/* Savings Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Savings Goal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                {...register('savingsGoal')}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Planned Expenses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Planned Expenses by Category
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['housing', 'food', 'transportation', 'utilities', 'entertainment', 'other'].map((category) => (
                <div key={category}>
                  <label className="block text-xs text-gray-500 mb-1 capitalize">{category}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register(category)}
                      className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                budget ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;