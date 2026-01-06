import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Wallet,
  LineChart,
  Lightbulb
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Mock data - will be replaced with real data from API
  const stats = [
    {
      name: 'Total Balance',
      value: '$12,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'blue'
    },
    {
      name: 'Monthly Income',
      value: '$5,000',
      change: '+5.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      name: 'Monthly Expenses',
      value: '$3,200',
      change: '-8.1%',
      trend: 'down',
      icon: CreditCard,
      color: 'red'
    },
    {
      name: 'Savings Goal',
      value: '68%',
      change: '+15%',
      trend: 'up',
      icon: Target,
      color: 'purple'
    }
  ];

  const recentTransactions = [
    { id: 1, name: 'Grocery Store', amount: -120.50, date: '2024-01-15', category: 'Food' },
    { id: 2, name: 'Salary Deposit', amount: 5000.00, date: '2024-01-14', category: 'Income' },
    { id: 3, name: 'Electric Bill', amount: -85.00, date: '2024-01-13', category: 'Utilities' },
    { id: 4, name: 'Netflix Subscription', amount: -14.99, date: '2024-01-12', category: 'Entertainment' },
    { id: 5, name: 'Gas Station', amount: -45.00, date: '2024-01-11', category: 'Transport' },
  ];

  // FIX #1: Quick action handlers
  const quickActions = [
    {
      label: 'Add Transaction',
      icon: DollarSign,
      color: 'blue',
      onClick: () => navigate('/transactions')
    },
    {
      label: 'View Portfolio',
      icon: Wallet,
      color: 'green',
      onClick: () => navigate('/portfolio')
    },
    {
      label: 'Review Budget',
      icon: Target,
      color: 'purple',
      onClick: () => navigate('/budget')
    },
    {
      label: 'Market Explorer',
      icon: LineChart,
      color: 'indigo',
      onClick: () => navigate('/market')
    },
    {
      label: 'Get Suggestions',
      icon: Lightbulb,
      color: 'yellow',
      onClick: () => navigate('/suggestions')
    },
    {
      label: 'AI Advisor',
      icon: TrendingUp,
      color: 'pink',
      onClick: () => navigate('/advisor')
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
      green: 'bg-green-50 hover:bg-green-100 text-green-600',
      purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600',
      yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600',
      pink: 'bg-pink-50 hover:bg-pink-100 text-pink-600',
      red: 'bg-red-50 hover:bg-red-100 text-red-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your finances today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <div className="flex items-center mt-2">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount >= 0 ? '+' : ''}
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t">
              <button 
                onClick={() => navigate('/transactions')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all transactions →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions - FIX #1: Added onClick handlers */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button 
                  key={action.label}
                  onClick={action.onClick}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${getColorClasses(action.color)}`}
                >
                  <div className="flex items-center">
                    <action.icon className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Savings Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Emergency Fund</span>
                  <span className="text-gray-900 font-medium">$8,000 / $10,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Vacation Fund</span>
                  <span className="text-gray-900 font-medium">$2,500 / $5,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">New Car</span>
                  <span className="text-gray-900 font-medium">$5,000 / $20,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;