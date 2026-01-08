/**
 * Dashboard Slice
 * Redux state management for aggregated dashboard data
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardService from '../../services/dashboardService';

// Async Thunks
export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getDashboardSummary();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard data'
      );
    }
  }
);

export const fetchQuickStats = createAsyncThunk(
  'dashboard/fetchQuickStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getQuickStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch quick stats'
      );
    }
  }
);

const initialState = {
  // Profile data
  profile: null,
  
  // Questionnaire status
  questionnaire: {
    started: false,
    completed: false,
    currentStep: 1
  },
  
  // Financial summaries
  budget: null,
  transactions: {
    recentTransactions: [],
    monthlyIncome: 0,
    monthlyExpenses: 0
  },
  debt: {
    totalDebts: 0,
    totalBalance: 0,
    totalMonthlyPayment: 0,
    avgInterestRate: 0
  },
  portfolio: {
    portfolioCount: 0,
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    gainLossPercent: 0
  },
  
  // Dashboard stats for cards
  stats: [],
  
  // Financial health score
  financialHealthScore: 0,
  
  // Quick stats (lightweight)
  quickStats: null,
  
  // Meta
  lastUpdated: null,
  isLoading: false,
  isRefreshing: false,
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Invalidate dashboard data (triggers refetch)
    invalidateDashboard: (state) => {
      state.lastUpdated = null;
    },
    
    // Clear dashboard state
    clearDashboard: () => initialState,
    
    // Update specific section (for optimistic updates)
    updateSection: (state, action) => {
      const { section, data } = action.payload;
      if (state[section]) {
        state[section] = { ...state[section], ...data };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = !state.lastUpdated; // Only show loading on first fetch
        state.isRefreshing = !!state.lastUpdated;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.profile = action.payload.profile;
        state.questionnaire = action.payload.questionnaire;
        state.budget = action.payload.budget;
        state.transactions = action.payload.transactions;
        state.debt = action.payload.debt;
        state.portfolio = action.payload.portfolio;
        state.stats = action.payload.stats;
        state.financialHealthScore = action.payload.financialHealthScore;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })
      
      // Fetch Quick Stats
      .addCase(fetchQuickStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchQuickStats.fulfilled, (state, action) => {
        state.quickStats = action.payload;
      })
      .addCase(fetchQuickStats.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Export actions
export const { 
  invalidateDashboard, 
  clearDashboard, 
  updateSection 
} = dashboardSlice.actions;

// Selectors
export const selectDashboardLoading = (state) => state.dashboard.isLoading;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectProfile = (state) => state.dashboard.profile;
export const selectQuestionnaire = (state) => state.dashboard.questionnaire;
export const selectBudget = (state) => state.dashboard.budget;
export const selectTransactions = (state) => state.dashboard.transactions;
export const selectDebt = (state) => state.dashboard.debt;
export const selectPortfolio = (state) => state.dashboard.portfolio;
export const selectStats = (state) => state.dashboard.stats;
export const selectFinancialHealthScore = (state) => state.dashboard.financialHealthScore;
export const selectLastUpdated = (state) => state.dashboard.lastUpdated;

// Computed selectors
export const selectNetWorth = (state) => {
  const { portfolio, debt } = state.dashboard;
  return (portfolio?.totalValue || 0) - (debt?.totalBalance || 0);
};

export const selectMonthlyCashFlow = (state) => {
  const { transactions } = state.dashboard;
  return (transactions?.monthlyIncome || 0) - (transactions?.monthlyExpenses || 0);
};

export default dashboardSlice.reducer;
