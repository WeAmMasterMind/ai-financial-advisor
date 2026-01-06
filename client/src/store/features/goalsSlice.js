/**
 * Goals Slice
 * Sprint 11-12: Redux state management for financial goals
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import goalsService from '../../services/goalsService';

// Async thunks
export const fetchGoals = createAsyncThunk(
  'goals/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await goalsService.getGoals(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch goals');
    }
  }
);

export const fetchGoal = createAsyncThunk(
  'goals/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await goalsService.getGoal(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch goal');
    }
  }
);

export const createGoal = createAsyncThunk(
  'goals/create',
  async (goalData, { rejectWithValue }) => {
    try {
      const response = await goalsService.createGoal(goalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create goal');
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await goalsService.updateGoal(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update goal');
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/delete',
  async (id, { rejectWithValue }) => {
    try {
      await goalsService.deleteGoal(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete goal');
    }
  }
);

export const addContribution = createAsyncThunk(
  'goals/addContribution',
  async ({ goalId, contributionData }, { rejectWithValue }) => {
    try {
      const response = await goalsService.addContribution(goalId, contributionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add contribution');
    }
  }
);

export const fetchGoalsSummary = createAsyncThunk(
  'goals/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await goalsService.getGoalsSummary();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

export const fetchGoalProjection = createAsyncThunk(
  'goals/fetchProjection',
  async ({ goalId, monthlyAmount }, { rejectWithValue }) => {
    try {
      const response = await goalsService.getGoalProjection(goalId, monthlyAmount);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projection');
    }
  }
);

const initialState = {
  goals: [],
  currentGoal: null,
  summary: null,
  projection: null,
  isLoading: false,
  error: null,
  successMessage: null
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearCurrentGoal: (state) => {
      state.currentGoal = null;
    },
    clearProjection: (state) => {
      state.projection = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all goals
      .addCase(fetchGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single goal
      .addCase(fetchGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGoal = action.payload;
      })
      .addCase(fetchGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create goal
      .addCase(createGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals.push(action.payload);
        state.successMessage = 'Goal created successfully';
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update goal
      .addCase(updateGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.goals.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
        if (state.currentGoal?.id === action.payload.id) {
          state.currentGoal = { ...state.currentGoal, ...action.payload };
        }
        state.successMessage = 'Goal updated successfully';
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete goal
      .addCase(deleteGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = state.goals.filter(g => g.id !== action.payload);
        state.successMessage = 'Goal deleted successfully';
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add contribution
      .addCase(addContribution.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addContribution.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update goal in list
        const { goal } = action.payload;
        const index = state.goals.findIndex(g => g.id === goal.id);
        if (index !== -1) {
          state.goals[index] = { ...state.goals[index], ...goal };
        }
        // Update current goal if viewing
        if (state.currentGoal?.id === goal.id) {
          state.currentGoal = {
            ...state.currentGoal,
            ...goal,
            contributions: [action.payload.contribution, ...(state.currentGoal.contributions || [])]
          };
        }
        state.successMessage = 'Contribution added successfully';
      })
      .addCase(addContribution.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch summary
      .addCase(fetchGoalsSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchGoalsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchGoalsSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch projection
      .addCase(fetchGoalProjection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchGoalProjection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projection = action.payload;
      })
      .addCase(fetchGoalProjection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccess, clearCurrentGoal, clearProjection } = goalsSlice.actions;

// Selectors
export const selectGoals = (state) => state.goals.goals;
export const selectCurrentGoal = (state) => state.goals.currentGoal;
export const selectGoalsSummary = (state) => state.goals.summary;
export const selectGoalProjection = (state) => state.goals.projection;
export const selectGoalsLoading = (state) => state.goals.isLoading;
export const selectGoalsError = (state) => state.goals.error;
export const selectGoalsSuccess = (state) => state.goals.successMessage;

export default goalsSlice.reducer;
