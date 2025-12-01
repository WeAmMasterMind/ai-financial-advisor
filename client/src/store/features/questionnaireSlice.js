import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import questionnaireService from '../../services/questionnaireService';

export const fetchStatus = createAsyncThunk(
  'questionnaire/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questionnaireService.getStatus();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch status');
    }
  }
);

export const saveProgress = createAsyncThunk(
  'questionnaire/saveProgress',
  async ({ step, data, allResponses }, { rejectWithValue }) => {
    try {
      const response = await questionnaireService.saveProgress(step, data, allResponses);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save');
    }
  }
);

export const completeQuestionnaire = createAsyncThunk(
  'questionnaire/complete',
  async (responses, { rejectWithValue }) => {
    try {
      const response = await questionnaireService.completeQuestionnaire(responses);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete');
    }
  }
);

export const fetchResults = createAsyncThunk(
  'questionnaire/fetchResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questionnaireService.getResults();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch results');
    }
  }
);

const initialState = {
  currentStep: 1,
  totalSteps: 5,
  responses: {
    personal: {},
    income: {},
    expenses: {},
    debt: {},
    goals: {}
  },
  isLoading: false,
  isSaving: false,
  isCompleted: false,
  results: null,
  error: null
};

const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    updateResponses: (state, action) => {
      const { section, data } = action.payload;
      state.responses[section] = { ...state.responses[section], ...data };
    },
    resetQuestionnaire: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Status
      .addCase(fetchStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentStep = action.payload.currentStep || 1;
        state.responses = action.payload.responses || initialState.responses;
        state.isCompleted = action.payload.completed;
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Save Progress
      .addCase(saveProgress.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveProgress.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(saveProgress.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      // Complete
      .addCase(completeQuestionnaire.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeQuestionnaire.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isCompleted = true;
        state.results = action.payload;
      })
      .addCase(completeQuestionnaire.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Results
      .addCase(fetchResults.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload;
        state.isCompleted = true;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setStep, updateResponses, resetQuestionnaire } = questionnaireSlice.actions;
export default questionnaireSlice.reducer;