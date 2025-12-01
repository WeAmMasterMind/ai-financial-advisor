import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import budgetService from '../../services/budgetService';

export const fetchCurrentBudget = createAsyncThunk(
  'budget/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await budgetService.getCurrentBudget();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budget');
    }
  }
);

export const fetchBudgetSummary = createAsyncThunk(
  'budget/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await budgetService.getBudgetSummary();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

export const fetchBudgets = createAsyncThunk(
  'budget/fetchAll',
  async (year, { rejectWithValue }) => {
    try {
      const response = await budgetService.getBudgets(year);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }
);

export const createBudget = createAsyncThunk(
  'budget/create',
  async (budgetData, { rejectWithValue }) => {
    try {
      const response = await budgetService.createBudget(budgetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create budget');
    }
  }
);

export const updateBudget = createAsyncThunk(
  'budget/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await budgetService.updateBudget(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update budget');
    }
  }
);

export const deleteBudget = createAsyncThunk(
  'budget/delete',
  async (id, { rejectWithValue }) => {
    try {
      await budgetService.deleteBudget(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete budget');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'budget/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await budgetService.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'budget/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await budgetService.createCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'budget/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await budgetService.updateCategory(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'budget/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await budgetService.deleteCategory(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

const initialState = {
  currentBudget: null,
  budgets: [],
  categories: [],
  summary: null,
  isLoading: false,
  error: null
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch current budget
      .addCase(fetchCurrentBudget.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBudget = action.payload.budget;
        state.categories = action.payload.categories;
      })
      .addCase(fetchCurrentBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch summary
      .addCase(fetchBudgetSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBudgetSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchBudgetSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch all budgets
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.budgets = action.payload;
      })
      // Create budget
      .addCase(createBudget.fulfilled, (state, action) => {
        state.budgets.unshift(action.payload);
        state.currentBudget = action.payload;
      })
      // Update budget
      .addCase(updateBudget.fulfilled, (state, action) => {
        const index = state.budgets.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.budgets[index] = action.payload;
        }
        if (state.currentBudget?.id === action.payload.id) {
          state.currentBudget = action.payload;
        }
      })
      // Delete budget
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.budgets = state.budgets.filter(b => b.id !== action.payload);
      })
      // Fetch categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Create category
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      });
  }
});

export const { clearError } = budgetSlice.actions;
export default budgetSlice.reducer;