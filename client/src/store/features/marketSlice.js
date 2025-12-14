import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import marketService from '../../services/marketService';
import suggestionService from '../../services/suggestionService';
import watchlistService from '../../services/watchlistService';

// Thunks
export const fetchQuote = createAsyncThunk(
  'market/fetchQuote',
  async (symbol, { rejectWithValue }) => {
    try {
      return await marketService.getQuote(symbol);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quote');
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'market/fetchHistory',
  async ({ symbol, period }, { rejectWithValue }) => {
    try {
      return await marketService.getHistory(symbol, period);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const searchAssets = createAsyncThunk(
  'market/searchAssets',
  async (query, { rejectWithValue }) => {
    try {
      return await marketService.searchAssets(query);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchAllAssets = createAsyncThunk(
  'market/fetchAllAssets',
  async (filters, { rejectWithValue }) => {
    try {
      return await marketService.getAllAssets(filters);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assets');
    }
  }
);

export const fetchAssetDetails = createAsyncThunk(
  'market/fetchAssetDetails',
  async (symbol, { rejectWithValue }) => {
    try {
      return await marketService.getAssetDetails(symbol);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch asset details');
    }
  }
);

export const fetchPortfolioLive = createAsyncThunk(
  'market/fetchPortfolioLive',
  async (portfolioId, { rejectWithValue }) => {
    try {
      return await marketService.getPortfolioLive(portfolioId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const fetchPortfolioPerformance = createAsyncThunk(
  'market/fetchPortfolioPerformance',
  async ({ portfolioId, period }, { rejectWithValue }) => {
    try {
      return await marketService.getPortfolioPerformance(portfolioId, period);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance');
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'market/fetchSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      return await suggestionService.generateSuggestions();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate suggestions');
    }
  }
);

export const fetchWatchlist = createAsyncThunk(
  'market/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      return await watchlistService.getWatchlist();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'market/addToWatchlist',
  async ({ symbol, notes, targetBuyPrice }, { rejectWithValue }) => {
    try {
      return await watchlistService.addToWatchlist(symbol, notes, targetBuyPrice);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'market/removeFromWatchlist',
  async (symbol, { rejectWithValue }) => {
    try {
      await watchlistService.removeFromWatchlist(symbol);
      return symbol;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from watchlist');
    }
  }
);

const initialState = {
  // Quotes
  quotes: {},
  quotesLoading: false,
  
  // History
  priceHistory: {},
  historyLoading: false,
  
  // Search
  searchResults: [],
  searchLoading: false,
  
  // Assets
  assets: [],
  assetsPagination: null,
  assetsLoading: false,
  
  // Asset details
  selectedAsset: null,
  assetLoading: false,
  
  // Portfolio live
  portfolioLive: null,
  portfolioLoading: false,
  
  // Performance
  performance: null,
  performanceLoading: false,
  
  // Suggestions
  suggestions: null,
  suggestionsLoading: false,
  
  // Watchlist
  watchlist: [],
  watchlistLoading: false,
  
  error: null
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearSelectedAsset: (state) => {
      state.selectedAsset = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch quote
      .addCase(fetchQuote.pending, (state) => {
        state.quotesLoading = true;
      })
      .addCase(fetchQuote.fulfilled, (state, action) => {
        state.quotesLoading = false;
        state.quotes[action.payload.symbol] = action.payload;
      })
      .addCase(fetchQuote.rejected, (state, action) => {
        state.quotesLoading = false;
        state.error = action.payload;
      })
      
      // Fetch history
      .addCase(fetchHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.priceHistory[action.payload.symbol] = action.payload.prices;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      
      // Search
      .addCase(searchAssets.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchAssets.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchAssets.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      
      // All assets
      .addCase(fetchAllAssets.pending, (state) => {
        state.assetsLoading = true;
      })
      .addCase(fetchAllAssets.fulfilled, (state, action) => {
        state.assetsLoading = false;
        state.assets = action.payload.assets;
        state.assetsPagination = action.payload.pagination;
      })
      .addCase(fetchAllAssets.rejected, (state, action) => {
        state.assetsLoading = false;
        state.error = action.payload;
      })
      
      // Asset details
      .addCase(fetchAssetDetails.pending, (state) => {
        state.assetLoading = true;
      })
      .addCase(fetchAssetDetails.fulfilled, (state, action) => {
        state.assetLoading = false;
        state.selectedAsset = action.payload;
      })
      .addCase(fetchAssetDetails.rejected, (state, action) => {
        state.assetLoading = false;
        state.error = action.payload;
      })
      
      // Portfolio live
      .addCase(fetchPortfolioLive.pending, (state) => {
        state.portfolioLoading = true;
      })
      .addCase(fetchPortfolioLive.fulfilled, (state, action) => {
        state.portfolioLoading = false;
        state.portfolioLive = action.payload;
      })
      .addCase(fetchPortfolioLive.rejected, (state, action) => {
        state.portfolioLoading = false;
        state.error = action.payload;
      })
      
      // Performance
      .addCase(fetchPortfolioPerformance.pending, (state) => {
        state.performanceLoading = true;
      })
      .addCase(fetchPortfolioPerformance.fulfilled, (state, action) => {
        state.performanceLoading = false;
        state.performance = action.payload;
      })
      .addCase(fetchPortfolioPerformance.rejected, (state, action) => {
        state.performanceLoading = false;
        state.error = action.payload;
      })
      
      // Suggestions
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.error = action.payload;
      })
      
      // Watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.watchlistLoading = true;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.watchlistLoading = false;
        state.watchlist = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.watchlistLoading = false;
        state.error = action.payload;
      })
      
      // Add to watchlist
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        state.watchlist.unshift(action.payload);
      })
      
      // Remove from watchlist
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.watchlist = state.watchlist.filter(w => w.symbol !== action.payload);
      });
  }
});

export const { clearError, clearSearchResults, clearSelectedAsset } = marketSlice.actions;
export default marketSlice.reducer;