/**
 * Debt Detail
 * View single debt with payment history
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDebtById, clearCurrentDebt } from '../../store/features/debtSlice';

const DebtDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentDebt, isLoading } = useSelector(state => state.debt);

  // Validate that id is a proper UUID
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  useEffect(() => {
    if (!isValidUUID) {
      // Redirect to debt dashboard if not a valid UUID (e.g., "calculator")
      navigate('/debt');
      return;
    }
    dispatch(fetchDebtById(id));
    return () => {
      dispatch(clearCurrentDebt());
    };
  }, [dispatch, id, isValidUUID, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (!currentDebt?.original_balance || !currentDebt?.current_balance) return 0;
    const paid = currentDebt.original_balance - currentDebt.current_balance;
    return Math.round((paid / currentDebt.original_balance) * 100);
  };

  if (isLoading || !currentDebt) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/debt" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Debts
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentDebt.debt_name}</h1>
            <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {currentDebt.debt_type?.replace('_', ' ')}
            </span>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/debt/${id}/payment`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Make Payment
            </Link>
            <Link
              to={`/debt/${id}/edit`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payoff Progress</h2>
          <span className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Original Balance</p>
            <p className="text-lg font-semibold text-gray-700">{formatCurrency(currentDebt.original_balance)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paid Off</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(currentDebt.original_balance - currentDebt.current_balance)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(currentDebt.current_balance)}</p>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Debt Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Interest Rate</p>
            <p className="text-xl font-semibold text-gray-900">{currentDebt.interest_rate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Minimum Payment</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(currentDebt.minimum_payment)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-xl font-semibold text-gray-900">{currentDebt.due_date}th</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-xl font-semibold text-gray-900">{formatDate(currentDebt.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        
        {currentDebt.payments && currentDebt.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interest</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance After</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDebt.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                      {payment.is_extra && (
                        <span className="ml-2 text-xs text-green-600">+Extra</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                      {formatCurrency(payment.principal_paid)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(payment.interest_paid)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(payment.balance_after)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {payment.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No payments recorded yet</p>
            <Link
              to={`/debt/${id}/payment`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Record First Payment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtDetail;