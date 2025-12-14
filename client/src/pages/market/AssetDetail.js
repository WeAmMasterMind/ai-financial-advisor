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
  Info
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
import toast from 'react-hot-toast';

const AssetDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedAsset, priceHistory, assetLoading, historyLoading, watchlist } = useSelector(
    (state) => state.market
  );
  const [period, setPeriod] = useState('1M');

  useEffect(() => {
    dispatch(fetchAssetDetails(symbol));
    dispatch(fetchHistory({ symbol, period: 'compact' }));
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
          onClick={() => navigate('/portfolio')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add to Portfolio
        </button>
      </div>
    </div>
  );
};

export default AssetDetail;