/**
 * Payment Form
 * Record a payment for a specific debt
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchDebtById, recordPayment, clearCurrentDebt } from '../../store/features/debtSlice';

const PaymentForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { currentDebt, isLoading, error } = useSelector(state => state.debt);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Validate that id is a proper UUID, not "calculator" or other routes
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    useEffect(() => {
      if (!isValidUUID) {
        navigate('/debt');
        return;
      }
      dispatch(fetchDebtById(id));
      return () => {
        dispatch(clearCurrentDebt());
      };
    }, [dispatch, id, isValidUUID, navigate]);

    useEffect(() => {
      if (currentDebt?.minimum_payment) {
        setFormData(prev => ({
          ...prev,
          amount: currentDebt.minimum_payment
        }));
      }
    }, [currentDebt]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(recordPayment({
        debtId: id,
        paymentData: {
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          notes: formData.notes || null
        }
      })).unwrap();
      navigate(`/debt/${id}`);
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const setQuickAmount = (amount) => {
    setFormData(prev => ({
      ...prev,
      amount: amount.toString()
    }));
  };

  if (isLoading && !currentDebt) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentDebt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">Debt not found</p>
          <Link to="/debt" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Debts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to={`/debt/${id}`} className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to {currentDebt.debt_name}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
        <p className="mt-1 text-gray-500">Log a payment for {currentDebt.debt_name}</p>
      </div>

      {/* Debt Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(currentDebt.current_balance)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Interest Rate</p>
            <p className="text-xl font-bold text-gray-900">{currentDebt.interest_rate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Minimum Payment</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(currentDebt.minimum_payment)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => setQuickAmount(currentDebt.minimum_payment)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              Minimum ({formatCurrency(currentDebt.minimum_payment)})
            </button>
            <button
              type="button"
              onClick={() => setQuickAmount(currentDebt.minimum_payment * 1.5)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              1.5x ({formatCurrency(currentDebt.minimum_payment * 1.5)})
            </button>
            <button
              type="button"
              onClick={() => setQuickAmount(currentDebt.minimum_payment * 2)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              2x ({formatCurrency(currentDebt.minimum_payment * 2)})
            </button>
            <button
              type="button"
              onClick={() => setQuickAmount(currentDebt.current_balance)}
              className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-full"
            >
              Pay in Full
            </button>
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date
          </label>
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            placeholder="e.g., Extra payment from bonus"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Payment Preview */}
        {formData.amount > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-semibold">{formatCurrency(parseFloat(formData.amount))}</p>
              </div>
              <div>
                <p className="text-gray-500">New Balance (approx)</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(Math.max(0, currentDebt.current_balance - parseFloat(formData.amount)))}
                </p>
              </div>
            </div>
            {parseFloat(formData.amount) > currentDebt.minimum_payment && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Extra payment of {formatCurrency(parseFloat(formData.amount) - currentDebt.minimum_payment)} above minimum
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(`/debt/${id}`)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.amount}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;