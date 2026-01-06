/**
 * Analytics Page
 * Financial analytics and insights dashboard
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const { user } = useSelector((state) => state.auth);
  const [period, setPeriod] = useState('6M');

  // Mock data - replace with actual API calls
  const monthlySpending = [
    { month: 'Jul', income: 5000, expenses: 3200, savings: 1800 },
    { month: 'Aug', income: 5200, expenses: 3400, savings: 1800 },
    { month: 'Sep', income: 5000, expenses: 3100, savings: 1900 },
    { month: 'Oct', income: 5500, expenses: 3600, savings: 1900 },
    { month: 'Nov', income: 5000, expenses: 3800, savings: 1200 },
    { month: 'Dec', income: 6000, expenses: 4200, savings: 1800 },
  ];

  const categoryBreakdown = [
    { name: 'Housing', value: 1500, color: '#3b82f6' },
    { name: 'Food', value: 600, color: '#10b981' },
    { name: 'Transport', value: 400, color: '#f59e0b' },
    { name: 'Utilities', value: 300, color: '#ef4444' },
    { name: 'Entertainment', value: 250, color: '#8b5cf6' },
    { name: 'Other', value: 150, color: '#6b7280' },
  ];

  const portfolioGrowth = [
    { month: 'Jul', value: 10000 },
    { month: 'Aug', value: 10500 },
    { month: 'Sep', value: 10200 },
    { month: 'Oct', value: 11000 },
    { month: 'Nov', value: 11800 },
    { month: 'Dec', value: 12450 },
  ];

  const debtProgress = [
    { month: 'Jul', remaining: 15000 },
    { month: 'Aug', remaining: 14200 },
    { month: 'Sep', remaining: 13500 },
    { month: 'Oct', remaining: 12700 },
    { month: 'Nov', remaining: 11800 },
    { month: 'Dec', remaining: 11000 },
  ];

  const summaryStats = [
    {
      label: 'Net Worth',
      value: '$45,230',
      change: '+8.2%',
      positive: true,
      icon: DollarSign
    },
    {
      label: 'Monthly Savings Rate',
      value: '28%',
      change: '+3%',
      positive: true,
      icon: Target
    },
    {
      label: 'Debt-to-Income',
      value: '22%',
      change: '-4%',
      positive: true,
      icon: TrendingDown
    },
    {
      label: 'Investment Returns',
      value: '+12.4%',
      change: '+2.1%',
      positive: true,
      icon: TrendingUp
    }
  ];

  const insights = [
    {
      type: 'success',
      title: 'Great savings month!',
      description: 'You saved 28% of your income this month, above your 20% target.'
    },
    {
      type: 'warning',
      title: 'Food spending increased',
      description: 'Your food expenses are 15% higher than your 3-month average.'
    },
    {
      type: 'info',
      title: 'Debt payoff on track',
      description: 'At this rate, you\'ll be debt-free in 18 months.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600">Track your financial health and trends</p>
        </div>
        <div className="flex gap-2">
          {['1M', '3M', '6M', '1Y', 'ALL'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">{stat.label}</span>
              <stat.icon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <RechartsPie>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-600">{cat.name}</span>
                  </div>
                  <span className="font-medium">${cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Growth */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Debt Paydown */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debt Paydown Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={debtProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Remaining']} />
                <Line 
                  type="monotone" 
                  dataKey="remaining" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'success' 
                  ? 'bg-green-50 border-green-500' 
                  : insight.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;