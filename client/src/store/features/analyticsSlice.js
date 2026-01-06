/**
 * Analytics Slice
 * Sprint 11-12: Redux state management for advanced analytics
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../../services/analyticsService';

// Async thunks
export const fetchDashboardAnalytics = createAsyncThunk(
  'analytics/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchSpendingTrends = createAsyncThunk(
  'analytics/fetchSpendingTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSpendingTrends(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch spending trends');
    }
  }
);

export const fetchIncomeExpenseAnalysis = createAsyncThunk(
  'analytics/fetchIncomeExpense',
  async (months = 12, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getIncomeExpenseAnalysis(months);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch income/expense analysis');
    }
  }
);

export const fetchNetWorthHistory = createAsyncThunk(
  'analytics/fetchNetWorthHistory',
  async (months = 12, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getNetWorthHistory(months);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch net worth history');
    }
  }
);

export const recordNetWorthSnapshot = createAsyncThunk(
  'analytics/recordNetWorthSnapshot',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.recordNetWorthSnapshot();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record snapshot');
    }
  }
);

export const fetchHealthHistory = createAsyncThunk(
  'analytics/fetchHealthHistory',
  async (months = 12, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getHealthHistory(months);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch health history');
    }
  }
);

export const recordHealthSnapshot = createAsyncThunk(
  'analytics/recordHealthSnapshot',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.recordHealthSnapshot();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record health snapshot');
    }
  }
);

export const fetchCrossModuleInsights = createAsyncThunk(
  'analytics/fetchInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getCrossModuleInsights();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch insights');
    }
  }
);

const initialState = {
  dashboard: null,
  spendingTrends: null,
  incomeExpense: null,
  netWorthHistory: [],
  healthHistory: [],
  insights: null,
  isLoading: false,
  error: null
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAnalytics: (state) => {
      state.dashboard = null;
      state.spendingTrends = null;
      state.incomeExpense = null;
      state.netWorthHistory = [];
      state.healthHistory = [];
      state.insights = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Spending trends
      .addCase(fetchSpendingTrends.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSpendingTrends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.spendingTrends = action.payload;
      })
      .addCase(fetchSpendingTrends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Income/Expense analysis
      .addCase(fetchIncomeExpenseAnalysis.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchIncomeExpenseAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incomeExpense = action.payload;
      })
      .addCase(fetchIncomeExpenseAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Net worth history
      .addCase(fetchNetWorthHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNetWorthHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.netWorthHistory = action.payload;
      })
      .addCase(fetchNetWorthHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Record net worth snapshot
      .addCase(recordNetWorthSnapshot.fulfilled, (state, action) => {
        state.netWorthHistory.push(action.payload);
      })
      // Health history
      .addCase(fetchHealthHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHealthHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.healthHistory = action.payload;
      })
      .addCase(fetchHealthHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Record health snapshot
      .addCase(recordHealthSnapshot.fulfilled, (state, action) => {
        state.healthHistory.push(action.payload);
      })
      // Cross-module insights
      .addCase(fetchCrossModuleInsights.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCrossModuleInsights.fulfilled, (state, action) => {
        state.isLoading = false;
        state.insights = action.payload;
      })
      .addCase(fetchCrossModuleInsights.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearAnalytics } = analyticsSlice.actions;

// Selectors
export const selectDashboard = (state) => state.analytics.dashboard;
export const selectSpendingTrends = (state) => state.analytics.spendingTrends;
export const selectIncomeExpense = (state) => state.analytics.incomeExpense;
export const selectNetWorthHistory = (state) => state.analytics.netWorthHistory;
export const selectHealthHistory = (state) => state.analytics.healthHistory;
export const selectInsights = (state) => state.analytics.insights;
export const selectAnalyticsLoading = (state) => state.analytics.isLoading;
export const selectAnalyticsError = (state) => state.analytics.error;

export default analyticsSlice.reducer;
