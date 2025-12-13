/**
 * Holding Form
 * Add/Edit holdings in a portfolio
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { addHolding, updateHolding, fetchPortfolioById } from '../../store/features/portfolioSlice';

const HoldingForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: portfolioId, holdingId } = useParams();
  const isEdit = Boolean(holdingId);

  const { currentPortfolio, isLoading, error } = useSelector(state => state.portfolio);

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    asset_type: 'etf',
    asset_class: 'us_stocks',
    quantity: '',
    purchase_price: '',
    current_price: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });

  const assetTypes = [
    { value: 'stock', label: 'Stock' },
    { value: 'etf', label: 'ETF' },
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'bond', label: 'Bond' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'reit', label: 'REIT' },
    { value: 'commodity', label: 'Commodity' },
    { value: 'cash', label: 'Cash/Money Market' },
    { value: 'other', label: 'Other' }
  ];

  const assetClasses = [
    { value: 'us_stocks', label: 'US Stocks' },
    { value: 'intl_stocks', label: 'International Stocks' },
    { value: 'bonds', label: 'Bonds' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'cash', label: 'Cash & Equivalents' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'alternatives', label: 'Alternatives' },
    { value: 'commodities', label: 'Commodities' }
  ];

  useEffect(() => {
    if (!currentPortfolio || currentPortfolio.id !== portfolioId) {
      dispatch(fetchPortfolioById(portfolioId));
    }
  }, [dispatch, portfolioId, currentPortfolio]);

  useEffect(() => {
    if (isEdit && currentPortfolio?.holdings) {
      const holding = currentPortfolio.holdings.find(h => h.id === holdingId);
      if (holding) {
        setFormData({
          symbol: holding.symbol || '',
          name: holding.name || '',
          asset_type: holding.asset_type || 'stock',
          asset_class: holding.asset_class || 'us_stocks',
          quantity: holding.quantity || '',
          purchase_price: holding.purchase_price || '',
          current_price: holding.current_price || '',
          purchase_date: holding.purchase_date?.split('T')[0] || ''
        });
      }
    }
  }, [currentPortfolio, holdingId, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const holdingData = {
      ...formData,
      quantity: parseFloat(formData.quantity) || 0,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      current_price: parseFloat(formData.current_price) || parseFloat(formData.purchase_price) || 0
    };

    try {
      if (isEdit) {
        await dispatch(updateHolding({ holdingId, data: holdingData })).unwrap();
      } else {
        await dispatch(addHolding({ portfolioId, data: holdingData })).unwrap();
      }
      navigate(`/portfolio/${portfolioId}`);
    } catch (err) {
      console.error('Failed to save holding:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Holding' : 'Add Holding'}
        </h1>
        <p className="mt-1 text-gray-500">
          {currentPortfolio?.portfolio_name}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Symbol & Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="e.g., VTI, AAPL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Vanguard Total Stock Market"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Asset Type & Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Type
            </label>
            <select
              name="asset_type"
              value={formData.asset_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {assetTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Class
            </label>
            <select
              name="asset_class"
              value={formData.asset_class}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {assetClasses.map(cls => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity & Prices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity/Shares *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              step="0.0001"
              min="0"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="current_price"
                value={formData.current_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Same as purchase"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Purchase Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Preview */}
        {formData.quantity && formData.purchase_price && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Position Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cost Basis</p>
                <p className="font-semibold">
                  ${(parseFloat(formData.quantity) * parseFloat(formData.purchase_price)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Current Value</p>
                <p className="font-semibold">
                  ${(parseFloat(formData.quantity) * (parseFloat(formData.current_price) || parseFloat(formData.purchase_price))).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(`/portfolio/${portfolioId}`)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEdit ? 'Update Holding' : 'Add Holding')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HoldingForm;