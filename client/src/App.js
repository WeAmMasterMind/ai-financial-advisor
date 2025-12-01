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

// Protected pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

import QuestionnaireWizard from './pages/questionnaire/QuestionnaireWizard';
import BudgetDashboard from './pages/budget/BudgetDashboard';

function AppRoutes() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is logged in on app load
    if (accessToken) {
      dispatch(getMe());
    }
  }, [dispatch, accessToken]);

  return (
    <Router>
      <Routes>
        {/* Public routes with AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />
        </Route>

        {/* Protected routes with MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/investments" element={<div>Investments (Coming Soon)</div>} />
            <Route path="/goals" element={<div>Goals (Coming Soon)</div>} />
            <Route path="/questionnaire" element={<QuestionnaireWizard />} />
            <Route path="/budget" element={<BudgetDashboard />} />
          </Route>
        </Route>

        {/* Root redirect */}
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/login" replace />
          } 
        />

        {/* 404 */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-gray-600">Page not found</p>
          </div>
        </div>} />
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
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </Provider>
  );
}

export default App;