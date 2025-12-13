/**
 * Portfolio Slice
 * Redux state management for portfolio feature
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import portfolioService from '../../services/portfolioService';

export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchPortfolios',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolios();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolios');
    }
  }
);

export const fetchPortfolioById = createAsyncThunk(
  'portfolio/fetchPortfolioById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolioById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const createPortfolio = createAsyncThunk(
  'portfolio/createPortfolio',
  async (data, { rejectWithValue }) => {
    try {
      const response = await portfolioService.createPortfolio(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create portfolio');
    }
  }
);

export const updatePortfolio = createAsyncThunk(
  'portfolio/updatePortfolio',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.updatePortfolio(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update portfolio');
    }
  }
);

export const deletePortfolio = createAsyncThunk(
  'portfolio/deletePortfolio',
  async (id, { rejectWithValue }) => {
    try {
      await portfolioService.deletePortfolio(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete portfolio');
    }
  }
);

export const addHolding = createAsyncThunk(
  'portfolio/addHolding',
  async ({ portfolioId, data }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.addHolding(portfolioId, data);
      return { portfolioId, holding: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add holding');
    }
  }
);

export const updateHolding = createAsyncThunk(
  'portfolio/updateHolding',
  async ({ holdingId, data }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.updateHolding(holdingId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update holding');
    }
  }
);

export const deleteHolding = createAsyncThunk(
  'portfolio/deleteHolding',
  async (holdingId, { rejectWithValue }) => {
    try {
      await portfolioService.deleteHolding(holdingId);
      return holdingId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete holding');
    }
  }
);

export const fetchRecommendation = createAsyncThunk(
  'portfolio/fetchRecommendation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getRecommendedPortfolio();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recommendation');
    }
  }
);

export const fetchRebalancePlan = createAsyncThunk(
  'portfolio/fetchRebalancePlan',
  async ({ portfolioId, threshold }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getRebalancePlan(portfolioId, threshold);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rebalance plan');
    }
  }
);

const initialState = {
  portfolios: [],
  currentPortfolio: null,
  recommendation: null,
  rebalancePlan: null,
  isLoading: false,
  error: null,
  successMessage: null
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearCurrentPortfolio: (state) => {
      state.currentPortfolio = null;
    },
    clearRebalancePlan: (state) => {
      state.rebalancePlan = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch portfolios
      .addCase(fetchPortfolios.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolios = action.payload;
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch portfolio by ID
      .addCase(fetchPortfolioById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPortfolio = action.payload;
      })
      .addCase(fetchPortfolioById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create portfolio
      .addCase(createPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolios.push(action.payload);
        state.successMessage = 'Portfolio created successfully';
      })
      .addCase(createPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update portfolio
      .addCase(updatePortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.portfolios.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.portfolios[index] = action.payload;
        }
        state.successMessage = 'Portfolio updated successfully';
      })

      // Delete portfolio
      .addCase(deletePortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolios = state.portfolios.filter(p => p.id !== action.payload);
        state.successMessage = 'Portfolio deleted successfully';
      })

      // Add holding
      .addCase(addHolding.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentPortfolio && state.currentPortfolio.id === action.payload.portfolioId) {
          state.currentPortfolio.holdings = state.currentPortfolio.holdings || [];
          state.currentPortfolio.holdings.push(action.payload.holding);
        }
        state.successMessage = 'Holding added successfully';
      })

      // Update holding
      .addCase(updateHolding.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentPortfolio?.holdings) {
          const index = state.currentPortfolio.holdings.findIndex(h => h.id === action.payload.id);
          if (index !== -1) {
            state.currentPortfolio.holdings[index] = action.payload;
          }
        }
        state.successMessage = 'Holding updated successfully';
      })

      // Delete holding
      .addCase(deleteHolding.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentPortfolio?.holdings) {
          state.currentPortfolio.holdings = state.currentPortfolio.holdings.filter(h => h.id !== action.payload);
        }
        state.successMessage = 'Holding deleted successfully';
      })

      // Fetch recommendation
      .addCase(fetchRecommendation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRecommendation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recommendation = action.payload;
      })
      .addCase(fetchRecommendation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch rebalance plan
      .addCase(fetchRebalancePlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rebalancePlan = action.payload;
      });
  }
});

export const { clearError, clearSuccess, clearCurrentPortfolio, clearRebalancePlan } = portfolioSlice.actions;
export default portfolioSlice.reducer;