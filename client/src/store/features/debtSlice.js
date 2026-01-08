/**
 * Debt Slice
 * Redux state management for debt feature
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import debtService from '../../services/debtService';

// Async thunks
export const fetchDebts = createAsyncThunk(
  'debt/fetchDebts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await debtService.getDebts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch debts');
    }
  }
);

export const fetchDebtById = createAsyncThunk(
  'debt/fetchDebtById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await debtService.getDebtById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch debt');
    }
  }
);

export const createDebt = createAsyncThunk(
  'debt/createDebt',
  async (debtData, { rejectWithValue }) => {
    try {
      const response = await debtService.createDebt(debtData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create debt');
    }
  }
);

export const updateDebt = createAsyncThunk(
  'debt/updateDebt',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await debtService.updateDebt(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update debt');
    }
  }
);

export const deleteDebt = createAsyncThunk(
  'debt/deleteDebt',
  async (id, { rejectWithValue }) => {
    try {
      await debtService.deleteDebt(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete debt');
    }
  }
);

export const fetchDebtSummary = createAsyncThunk(
  'debt/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await debtService.getDebtSummary();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

export const recordPayment = createAsyncThunk(
  'debt/recordPayment',
  async ({ debtId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await debtService.recordPayment(debtId, paymentData);
      return { debtId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record payment');
    }
  }
);

export const fetchComparison = createAsyncThunk(
  'debt/fetchComparison',
  async (monthlyExtra = 0, { rejectWithValue }) => {
    try {
      const response = await debtService.compareStrategies(monthlyExtra);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to compare strategies');
    }
  }
);

export const saveStrategy = createAsyncThunk(
  'debt/saveStrategy',
  async (strategyData, { rejectWithValue }) => {
    try {
      const response = await debtService.saveStrategy(strategyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save strategy');
    }
  }
);

// Initial state
const initialState = {
  debts: [],
  currentDebt: null,
  summary: null,
  comparison: null,
  savedStrategy: null,
  isLoading: false,
  isCalculating: false,
  error: null,
  successMessage: null
};

// Slice
const debtSlice = createSlice({
  name: 'debt',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearCurrentDebt: (state) => {
      state.currentDebt = null;
    },
    clearComparison: (state) => {
      state.comparison = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch debts
      .addCase(fetchDebts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDebts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.debts = action.payload;
      })
      .addCase(fetchDebts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch debt by ID
      .addCase(fetchDebtById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDebtById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDebt = action.payload;
      })
      .addCase(fetchDebtById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create debt
      .addCase(createDebt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDebt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.debts.push(action.payload);
        state.successMessage = 'Debt added successfully';
      })
      .addCase(createDebt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update debt
      .addCase(updateDebt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDebt.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.debts.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.debts[index] = action.payload;
        }
        state.successMessage = 'Debt updated successfully';
      })
      .addCase(updateDebt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete debt
      .addCase(deleteDebt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDebt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.debts = state.debts.filter(d => d.id !== action.payload);
        state.successMessage = 'Debt deleted successfully';
      })
      .addCase(deleteDebt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch summary
      .addCase(fetchDebtSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDebtSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDebtSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Record payment
      .addCase(recordPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update debt balance in list
        const index = state.debts.findIndex(d => d.id === action.payload.debtId);
        if (index !== -1) {
          state.debts[index].current_balance = action.payload.newBalance;
        }
        state.successMessage = 'Payment recorded successfully';
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch comparison
      .addCase(fetchComparison.pending, (state) => {
        state.isCalculating = true;
        state.error = null;
      })
      .addCase(fetchComparison.fulfilled, (state, action) => {
        state.isCalculating = false;
        state.comparison = action.payload;
      })
      .addCase(fetchComparison.rejected, (state, action) => {
        state.isCalculating = false;
        state.error = action.payload;
      })
      
      // Save strategy
      .addCase(saveStrategy.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveStrategy.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedStrategy = action.payload;
        state.successMessage = 'Strategy saved successfully';
      })
      .addCase(saveStrategy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccess, clearCurrentDebt, clearComparison } = debtSlice.actions;
export default debtSlice.reducer;