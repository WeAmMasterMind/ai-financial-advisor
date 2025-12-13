/**
 * Debt Form
 * Create and edit debt accounts
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createDebt, updateDebt, fetchDebtById, clearCurrentDebt } from '../../store/features/debtSlice';

const DebtForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const { currentDebt, isLoading, error } = useSelector(state => state.debt);
  
  const [formData, setFormData] = useState({
    debt_name: '',
    debt_type: 'credit_card',
    original_balance: '',
    current_balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_date: '1'
  });

  const debtTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'auto_loan', label: 'Auto Loan' },
    { value: 'student_loan', label: 'Student Loan' },
    { value: 'personal_loan', label: 'Personal Loan' },
    { value: 'medical', label: 'Medical Debt' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchDebtById(id));
    }
    return () => {
      dispatch(clearCurrentDebt());
    };
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentDebt) {
      setFormData({
        debt_name: currentDebt.debt_name || '',
        debt_type: currentDebt.debt_type || 'other',
        original_balance: currentDebt.original_balance || '',
        current_balance: currentDebt.current_balance || '',
        interest_rate: currentDebt.interest_rate || '',
        minimum_payment: currentDebt.minimum_payment || '',
        due_date: currentDebt.due_date || '1'
      });
    }
  }, [currentDebt, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const debtData = {
      ...formData,
      original_balance: parseFloat(formData.original_balance) || parseFloat(formData.current_balance),
      current_balance: parseFloat(formData.current_balance),
      interest_rate: parseFloat(formData.interest_rate),
      minimum_payment: parseFloat(formData.minimum_payment) || 0,
      due_date: parseInt(formData.due_date) || 1
    };

    try {
      if (isEdit) {
        await dispatch(updateDebt({ id, data: debtData })).unwrap();
      } else {
        await dispatch(createDebt(debtData)).unwrap();
      }
      navigate('/debt');
    } catch (err) {
      console.error('Failed to save debt:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Debt' : 'Add New Debt'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEdit ? 'Update your debt information' : 'Enter your debt details to start tracking'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Debt Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Debt Name *
          </label>
          <input
            type="text"
            name="debt_name"
            value={formData.debt_name}
            onChange={handleChange}
            required
            placeholder="e.g., Chase Sapphire Card"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Debt Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Debt Type
          </label>
          <select
            name="debt_type"
            value={formData.debt_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {debtTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="original_balance"
                value={formData.original_balance}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Initial amount borrowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Balance *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="current_balance"
                value={formData.current_balance}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">What you owe today</p>
          </div>
        </div>

        {/* Rate and Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate (APR) *
            </label>
            <div className="relative">
              <input
                type="number"
                name="interest_rate"
                value={formData.interest_rate}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                className="w-full pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Payment
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="minimum_payment"
                value={formData.minimum_payment}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date (Day of Month)
          </label>
          <select
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[...Array(31)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/debt')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEdit ? 'Update Debt' : 'Add Debt')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DebtForm;