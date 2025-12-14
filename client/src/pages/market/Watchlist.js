import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus
} from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist } from '../../store/features/marketSlice';
import toast from 'react-hot-toast';

const Watchlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { watchlist, watchlistLoading } = useSelector((state) => state.market);

  useEffect(() => {
    dispatch(fetchWatchlist());
  }, [dispatch]);

  const handleRemove = async (symbol) => {
    dispatch(removeFromWatchlist(symbol));
    toast.success(`Removed ${symbol} from watchlist`);
  };

  if (watchlistLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Watchlist</h1>
          <p className="text-gray-600">Track assets you're interested in</p>
        </div>
        <button
          onClick={() => navigate('/market')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Assets
        </button>
      </div>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No assets in your watchlist</h3>
          <p className="text-gray-600 mt-2">
            Start exploring the market to add assets to track
          </p>
          <button
            onClick={() => navigate('/market')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Explore Market
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Symbol</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Change</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Target</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {watchlist.map((item) => (
                <tr
                  key={item.symbol}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/market/asset/${item.symbol}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{item.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {item.currentPrice ? `$${item.currentPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.dayChange !== null ? (
                      <span
                        className={`flex items-center justify-end gap-1 ${
                          item.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.dayChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {item.dayChangePercent?.toFixed(2)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.target_buy_price
                      ? `$${parseFloat(item.target_buy_price).toFixed(2)}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.symbol);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Watchlist;