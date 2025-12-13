import React from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { createTransaction, updateTransaction } from '../../store/features/transactionSlice';
import toast from 'react-hot-toast';

const TransactionForm = ({ transaction, categories, onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: transaction?.type || 'expense',
      amount: transaction?.amount || '',
      category: transaction?.category || '',
      description: transaction?.description || '',
      merchant: transaction?.merchant || ''
    }
  });

  const type = watch('type');

  const onSubmit = async (data) => {
    try {
      const transactionData = {
        date: data.date,
        type: data.type,
        amount: parseFloat(data.amount),
        category: data.category || null,
        description: data.description || null,
        merchant: data.merchant || null
      };

      if (transaction) {
        await dispatch(updateTransaction({ id: transaction.id, data: transactionData })).unwrap();
      } else {
        await dispatch(createTransaction(transactionData)).unwrap();
      }
      onSuccess();
    } catch (error) {
      toast.error(error || 'Failed to save transaction');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer ${
                type === 'income' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="income"
                  {...register('type')}
                  className="sr-only"
                />
                <span className={type === 'income' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  Income
                </span>
              </label>
              <label className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer ${
                type === 'expense' ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="expense"
                  {...register('type')}
                  className="sr-only"
                />
                <span className={type === 'expense' ? 'text-red-700 font-medium' : 'text-gray-600'}>
                  Expense
                </span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: 0.01 })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.category_name}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant / Source
            </label>
            <input
              type="text"
              {...register('merchant')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Where did this transaction occur?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes..."
            />
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
                transaction ? 'Update' : 'Add'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;