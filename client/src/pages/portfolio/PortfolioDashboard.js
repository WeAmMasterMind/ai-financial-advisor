import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PieChart,
  BarChart3,
  Plus,
  Lightbulb
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { fetchPortfolios } from '../../store/features/portfolioSlice';
import { 
  fetchPortfolioLive, 
  fetchPortfolioPerformance 
} from '../../store/features/marketSlice';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PortfolioDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { portfolios } = useSelector((state) => state.portfolio);
  const { portfolioLive, performance, portfolioLoading, performanceLoading } = useSelector(
    (state) => state.market
  );
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [activePortfolioId, setActivePortfolioId] = useState(null);

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  useEffect(() => {
    if (portfolios.length > 0 && !activePortfolioId) {
      setActivePortfolioId(portfolios[0].id);
    }
  }, [portfolios, activePortfolioId]);

  useEffect(() => {
    if (activePortfolioId) {
      dispatch(fetchPortfolioLive(activePortfolioId));
      dispatch(fetchPortfolioPerformance({ portfolioId: activePortfolioId, period: selectedPeriod }));
    }
  }, [dispatch, activePortfolioId, selectedPeriod]);

  const handleRefresh = () => {
    if (activePortfolioId) {
      dispatch(fetchPortfolioLive(activePortfolioId));
      toast.success('Prices refreshed');
    }
  };

  // Prepare pie chart data
  const allocationData = portfolioLive?.holdings?.reduce((acc, holding) => {
    const assetType = holding.asset_type || holding.asset_class || 'Other';
    const existing = acc.find((a) => a.name === assetType);
    if (existing) {
      existing.value += holding.value;
    } else {
      acc.push({ name: assetType, value: holding.value });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-gray-600">Live valuations and performance tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={portfolioLoading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${portfolioLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/suggestions')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Lightbulb className="w-4 h-4" />
            Get Suggestions
          </button>
        </div>
      </div>

      {/* Portfolio Selector */}
      {portfolios.length > 1 && (
        <div className="flex gap-2">
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePortfolioId(p.id)}
              className={`px-4 py-2 rounded-lg ${
                activePortfolioId === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {portfolioLive && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold mt-1">
              ${portfolioLive.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold mt-1">
              ${portfolioLive.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Total Gain/Loss</p>
            <p className={`text-2xl font-bold mt-1 ${portfolioLive.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioLive.totalGain >= 0 ? '+' : ''}
              ${portfolioLive.totalGain?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Return</p>
            <div className={`flex items-center gap-2 mt-1 ${portfolioLive.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioLive.totalGainPercent >= 0 ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
              <span className="text-2xl font-bold">
                {portfolioLive.totalGainPercent >= 0 ? '+' : ''}
                {portfolioLive.totalGainPercent?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Performance
            </h2>
            <div className="flex gap-1">
              {['1W', '1M', '3M', '6M', '1Y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedPeriod === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          {performanceLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : performance?.dataPoints?.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performance.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [`$${v.toLocaleString()}`, 'Value']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <p>No performance data yet</p>
            </div>
          )}
          
          {performance && (
            <div className="flex justify-between mt-4 pt-4 border-t text-sm">
              <span className="text-gray-500">{selectedPeriod} Change</span>
              <span className={performance.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {performance.percentChange >= 0 ? '+' : ''}{performance.percentChange?.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Allocation Chart */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-500" />
            Allocation
          </h2>
          
          {allocationData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {allocationData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm capitalize">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {(portfolioLive?.totalValue ? ((Number(item.value) / Number(portfolioLive.totalValue)) * 100).toFixed(1) : 0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <p>No holdings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      {portfolioLive?.holdings?.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Holdings</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Symbol</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Shares</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Value</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Gain/Loss</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Today</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {portfolioLive.holdings.map((holding) => (
                <tr
                  key={holding.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/market/asset/${holding.symbol}`)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{holding.symbol}</p>
                      <p className="text-sm text-gray-500">{holding.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">{holding.quantity}</td>
                  <td className="px-6 py-4 text-right">
                    ${holding.currentPrice ? Number(holding.currentPrice).toFixed(2) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ${holding.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-6 py-4 text-right ${holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.gain >= 0 ? '+' : ''}{holding.gain != null ? Number(holding.gain).toFixed(2) : '—'}
                    <span className="text-xs ml-1">({holding.gainPercent != null ? Number(holding.gainPercent).toFixed(1) : 0}%)</span>
                  </td>
                  <td className={`px-6 py-4 text-right ${holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.dayChangePercent !== undefined ? (
                      <>
                        {holding.dayChangePercent >= 0 ? '+' : ''}
                        {holding.dayChangePercent?.toFixed(2)}%
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {portfolios.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No portfolios yet</h3>
          <p className="text-gray-600 mt-2">Create a portfolio to start tracking your investments</p>
          <button
            onClick={() => navigate('/portfolio/new')}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg mx-auto hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Portfolio
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioDashboard;