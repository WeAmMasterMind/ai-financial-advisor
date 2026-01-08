import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Plus,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  fetchAssetDetails,
  fetchHistory,
  addToWatchlist,
  removeFromWatchlist
} from '../../store/features/marketSlice';
import { fetchPortfolios, addHolding } from '../../store/features/portfolioSlice';
import toast from 'react-hot-toast';

const AssetDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedAsset, priceHistory, assetLoading, historyLoading, watchlist } = useSelector(
    (state) => state.market
  );
  const { portfolios } = useSelector((state) => state.portfolio);
  
  const [period, setPeriod] = useState('1M');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    dispatch(fetchAssetDetails(symbol));
    dispatch(fetchHistory({ symbol, period: 'compact' }));
    dispatch(fetchPortfolios());
  }, [dispatch, symbol]);

  const isInWatchlist = watchlist.some((w) => w.symbol === symbol);

  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      dispatch(removeFromWatchlist(symbol));
      toast.success(`Removed ${symbol} from watchlist`);
    } else {
      dispatch(addToWatchlist({ symbol }));
      toast.success(`Added ${symbol} to watchlist`);
    }
  };

  const handleAddToPortfolio = async () => {
    if (!selectedPortfolio) {
      toast.error('Please select a portfolio');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    setIsAdding(true);
    try {
      await dispatch(addHolding({
        portfolioId: selectedPortfolio,
        data: {
          symbol: symbol,
          name: asset?.name || symbol,
          asset_type: asset?.asset_type || 'stock',
          asset_class: 'us_stocks',
          quantity: parseFloat(quantity),
          purchase_price: parseFloat(purchasePrice) || quote?.price || 0,
          current_price: quote?.price || 0,
          purchase_date: new Date().toISOString().split('T')[0]
        }
      })).unwrap();
      
      toast.success(`Added ${quantity} shares of ${symbol} to portfolio`);
      setShowAddModal(false);
      setQuantity('');
      setPurchasePrice('');
      setSelectedPortfolio('');
    } catch (err) {
      toast.error(err?.message || 'Failed to add to portfolio');
    } finally {
      setIsAdding(false);
    }
  };

  const openAddModal = () => {
    if (portfolios.length === 0) {
      toast.error('Create a portfolio first');
      navigate('/portfolio/new');
    } else {
      setPurchasePrice(quote?.price?.toString() || '');
      if (portfolios.length === 1) {
        setSelectedPortfolio(portfolios[0].id);
      }
      setShowAddModal(true);
    }
  };

  const chartData = priceHistory[symbol]?.slice(-getDataPoints(period)).map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: p.close,
  })) || [];

  function getDataPoints(p) {
    switch (p) {
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      default: return 30;
    }
  }

  if (assetLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const quote = selectedAsset?.quote;
  const asset = selectedAsset;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded uppercase">
              {asset?.asset_type}
            </span>
          </div>
          <p className="text-gray-600">{asset?.name}</p>
        </div>
        <button
          onClick={handleWatchlistToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            isInWatchlist
              ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
              : 'hover:bg-gray-50'
          }`}
        >
          {isInWatchlist ? (
            <>
              <Star className="w-4 h-4 fill-yellow-500" />
              Watching
            </>
          ) : (
            <>
              <StarOff className="w-4 h-4" />
              Watch
            </>
          )}
        </button>
      </div>

      {/* Price Card */}
      {quote && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-gray-900">
              ${quote.price?.toFixed(2)}
            </span>
            <div
              className={`flex items-center gap-1 text-lg ${
                quote.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {quote.change >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span>
                {quote.change >= 0 ? '+' : ''}
                {quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {quote.timestamp ? new Date(quote.timestamp).toLocaleString() : 'N/A'}
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Price History</h2>
          <div className="flex gap-2">
            {['1W', '1M', '3M', '1Y'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No price history available
          </div>
        )}
      </div>

      {/* Asset Info */}
      {asset && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            About {symbol}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {asset.sector && (
              <div>
                <p className="text-sm text-gray-500">Sector</p>
                <p className="font-medium">{asset.sector}</p>
              </div>
            )}
            {asset.industry && (
              <div>
                <p className="text-sm text-gray-500">Industry</p>
                <p className="font-medium">{asset.industry}</p>
              </div>
            )}
            {asset.market_cap && (
              <div>
                <p className="text-sm text-gray-500">Market Cap</p>
                <p className="font-medium capitalize">{asset.market_cap}</p>
              </div>
            )}
            {asset.risk_level && (
              <div>
                <p className="text-sm text-gray-500">Risk Level</p>
                <p className={`font-medium ${
                  asset.risk_level <= 3 ? 'text-green-600' :
                  asset.risk_level <= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {asset.risk_level}/10
                </p>
              </div>
            )}
          </div>
          {asset.description && (
            <p className="text-gray-600">{asset.description}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add to Portfolio
        </button>
      </div>

      {/* Add to Portfolio Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add {symbol} to Portfolio</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Portfolio Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio *
                </label>
                <select
                  value={selectedPortfolio}
                  onChange={(e) => setSelectedPortfolio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select portfolio...</option>
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.portfolio_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Shares *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 10"
                  min="0"
                  step="0.0001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price per Share
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder={quote?.price?.toFixed(2) || '0.00'}
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current price: ${quote?.price?.toFixed(2) || 'N/A'}
                </p>
              </div>
              
              {/* Cost Summary */}
              {quantity && purchasePrice && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold">
                      ${(parseFloat(quantity) * parseFloat(purchasePrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {quote?.price && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Current Value:</span>
                      <span className="font-semibold">
                        ${(parseFloat(quantity) * quote.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToPortfolio}
                disabled={isAdding || !selectedPortfolio || !quantity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;