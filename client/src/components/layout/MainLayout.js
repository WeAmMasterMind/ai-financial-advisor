import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Menu, 
  X, 
  Home, 
  DollarSign, 
  TrendingUp, 
  Target, 
  User, 
  LogOut,
  PieChart,
  Bell,
  Sparkles,
  Star,
  Lightbulb,
  MessageCircle,
  CreditCard,
  Settings
} from 'lucide-react';
import { logout } from '../../store/features/authSlice';
import toast from 'react-hot-toast';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import { selectNotificationPanelOpen } from '../../store/features/notificationsSlice';


const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const panelOpen = useSelector(selectNotificationPanelOpen);
  

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Advisor', href: '/advisor', icon: Sparkles },
    { name: 'Questionnaire', href: '/questionnaire', icon: Target },
    { name: 'Budget', href: '/budget', icon: DollarSign },
    { name: 'Transactions', href: '/transactions', icon: DollarSign },
    { name: 'Debt', href: '/debt', icon: TrendingUp },
    { name: 'Investments', href: '/investments', icon: PieChart },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Portfolio', href: '/portfolio', icon: PieChart },
    { name: 'Market', href: '/market', icon: TrendingUp },
    { name: 'Watchlist', href: '/watchlist', icon: Star },
    { name: 'Suggestions', href: '/suggestions', icon: Lightbulb },
    { name: 'Goals', href: '/goals', icon: Target },
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">
            Financial Advisor
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <NavLink
              to="/profile"
              className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4 relative">
              <NotificationBell />
              {panelOpen && <NotificationPanel />}
            </div>
            
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;