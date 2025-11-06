import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';

const initialState = {
  profile: null,
  financialData: {
    income: '',
    expenses: '',
    savings: '',
    goals: '',
    age: '',
    riskTolerance: 'moderate'
  },
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Update user profile
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, thunkAPI) => {
    try {
      const response = await userService.updateProfile(profileData);
      return response;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user profile
export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, thunkAPI) => {
    try {
      const response = await userService.getProfile();
      return response;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update financial data
export const updateFinancialData = createAsyncThunk(
  'user/updateFinancialData',
  async (financialData, thunkAPI) => {
    try {
      const response = await userService.updateFinancialData(financialData);
      return response;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setFinancialData: (state, action) => {
      state.financialData = {
        ...state.financialData,
        ...action.payload
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profile = action.payload.data;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profile = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Financial Data
      .addCase(updateFinancialData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateFinancialData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.financialData = action.payload.data;
      })
      .addCase(updateFinancialData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setFinancialData } = userSlice.actions;
export default userSlice.reducer;