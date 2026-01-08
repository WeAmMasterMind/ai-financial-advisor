import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { getMe } from './store/features/authSlice';

// Layout components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Core pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Questionnaire (Sprint 3-4)
import QuestionnaireWizard from './pages/questionnaire/QuestionnaireWizard';

// Budget & Transactions (Sprint 3-4)
import BudgetDashboard from './pages/budget/BudgetDashboard';
import TransactionList from './pages/transactions/TransactionList';

// Debt Management (Sprint 5-6)
import DebtDashboard from './pages/debt/DebtDashboard';
import DebtForm from './pages/debt/DebtForm';
import DebtDetail from './pages/debt/DebtDetail';
import PaymentForm from './pages/debt/PaymentForm';
import StrategyCalculator from './pages/debt/StrategyCalculator';

// Portfolio (Sprint 5-6)
import PortfolioDashboard from './pages/portfolio/PortfolioDashboard';
import PortfolioForm from './pages/portfolio/PortfolioForm';
import PortfolioDetail from './pages/portfolio/PortfolioDetail';
import HoldingForm from './pages/portfolio/HoldingForm';
import RecommendedPortfolio from './pages/portfolio/RecommendedPortfolio';

// AI Advisor (Sprint 7-8)
import AIAdvisor from './pages/AIAdvisor';

// Market Intelligence (Sprint 9-10)
import MarketExplorer from './pages/market/MarketExplorer';
import AssetDetail from './pages/market/AssetDetail';
import Watchlist from './pages/market/Watchlist';
import InvestmentSuggestions from './pages/market/InvestmentSuggestions';

// Analytics
import Analytics from './pages/Analytics';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';

// Goals
import GoalsDashboard from './pages/goals/GoalsDashboard';
import GoalDetail from './pages/goals/GoalDetail';

function AppRoutes() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      dispatch(getMe());
    }
  }, [dispatch, accessToken]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Core */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Questionnaire */}
            <Route path="/questionnaire" element={<QuestionnaireWizard />} />
            
            {/* Budget & Transactions */}
            <Route path="/budget" element={<BudgetDashboard />} />
            <Route path="/transactions" element={<TransactionList />} />
            
            {/* Debt Management */}
            <Route path="/debt" element={<DebtDashboard />} />
            <Route path="/debt/new" element={<DebtForm />} />
            <Route path="/debt/calculator" element={<StrategyCalculator />} />
            <Route path="/debt/:id" element={<DebtDetail />} />
            <Route path="/debt/:id/edit" element={<DebtForm />} />
            <Route path="/debt/:id/payment" element={<PaymentForm />} />
            
            {/* Portfolio - FIX #2: /investments points to PortfolioDashboard */}
            <Route path="/investments" element={<PortfolioDashboard />} />
            <Route path="/portfolio" element={<PortfolioDashboard />} />
            <Route path="/portfolio/dashboard" element={<PortfolioDashboard />} />
            <Route path="/portfolio/new" element={<PortfolioForm />} />
            <Route path="/portfolio/recommended" element={<RecommendedPortfolio />} />
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
            <Route path="/portfolio/:id/edit" element={<PortfolioForm />} />
            <Route path="/portfolio/:id/holding/new" element={<HoldingForm />} />
            <Route path="/portfolio/:id/holding/:holdingId/edit" element={<HoldingForm />} />
            
            {/* Market Intelligence (Sprint 9-10) */}
            <Route path="/market" element={<MarketExplorer />} />
            <Route path="/market/asset/:symbol" element={<AssetDetail />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/suggestions" element={<InvestmentSuggestions />} />
            
            {/* AI Advisor */}
            <Route path="/advisor" element={<AIAdvisor />} />
            <Route path="/atlas" element={<AIAdvisor />} />
            
            {/* FIX #3: Analytics route */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            
            {/* Goals - placeholder for Sprint 11-12 */}
            <Route path="/goals" element={<GoalsDashboard />} />
            <Route path="/goals/:id" element={<GoalDetail />} />

          </Route>
        </Route>

        {/* Root redirect */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />

        {/* 404 */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-gray-600">Page not found</p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#363636', color: '#fff' },
          success: { style: { background: '#10b981' } },
          error: { style: { background: '#ef4444' } },
        }}
      />
    </Provider>
  );
}

export default App;