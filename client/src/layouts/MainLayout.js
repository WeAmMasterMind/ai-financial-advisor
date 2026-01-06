/**
 * Main Layout Component
 * Sprint 11-12: Updated with notification bell
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PieChart,
  TrendingUp,
  Target,
  BarChart3,
  MessageSquare,
  User,
  Menu,
  X,
  LogOut,
  Eye,
  Lightbulb,
  ChevronDown
} from 'lucide-react';

import { logout } from '../store/features/authSlice';
import NotificationBell from '../components/notifications/NotificationBell';

const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [investingOpen, setInvestingOpen] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/budget', icon: Wallet, label: 'Budget' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/debt', icon: CreditCard, label: 'Debt' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const investingItems = [
    { path: '/portfolio', icon: PieChart, label: 'Portfolio' },
    { path: '/market', icon: TrendingUp, label: 'Market' },
    { path: '/watchlist', icon: Eye, label: 'Watchlist' },
    { path: '/suggestions', icon: Lightbulb, label: 'Suggestions' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 bg-gray-900 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen ? (
            <span className="text-xl font-bold text-white">FinanceAI</span>
          ) : (
            <span className="text-xl font-bold text-white">F</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Investing Section */}
          <div className="pt-4">
            <button
              onClick={() => setInvestingOpen(!investingOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-white ${
                !sidebarOpen ? 'justify-center' : ''
              }`}
            >
              {sidebarOpen && (
                <>
                  <span className="text-xs uppercase tracking-wider">Investing</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${investingOpen ? 'rotate-180' : ''}`} />
                </>
              )}
              {!sidebarOpen && <PieChart className="w-5 h-5" />}
            </button>
            
            {(investingOpen || !sidebarOpen) && (
              <div className="mt-2 space-y-1">
                {investingItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* AI Advisor */}
          <div className="pt-4">
            <NavLink
              to="/advisor"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>AI Advisor</span>}
            </NavLink>
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <NavLink
            to="/profile"
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-2
              ${isActive 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Breadcrumb or page title could go here */}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* User avatar */}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
