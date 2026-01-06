/**
 * Notifications Slice
 * Sprint 11-12: Redux state management for notifications
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationsService from '../../services/notificationsService';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await notificationsService.markAsRead(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await notificationsService.deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

export const deleteAllReadNotifications = createAsyncThunk(
  'notifications/deleteAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsService.deleteAllRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notifications');
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getPreferences();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch preferences');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await notificationsService.updatePreferences(preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update preferences');
    }
  }
);

export const generateNotifications = createAsyncThunk(
  'notifications/generate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsService.generateNotifications();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate notifications');
    }
  }
);

export const fetchNotificationCounts = createAsyncThunk(
  'notifications/fetchCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getNotificationCounts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch counts');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  counts: null,
  preferences: null,
  hasMore: false,
  isLoading: false,
  error: null,
  panelOpen: false
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleNotificationPanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    openNotificationPanel: (state) => {
      state.panelOpen = true;
    },
    closeNotificationPanel: (state) => {
      state.panelOpen = false;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.id);
        if (notification && !notification.is_read) {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.is_read = true;
          n.read_at = new Date().toISOString();
        });
        state.unreadCount = 0;
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      })
      // Delete all read
      .addCase(deleteAllReadNotifications.fulfilled, (state) => {
        state.notifications = state.notifications.filter(n => !n.is_read);
      })
      // Fetch preferences
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      // Update preferences
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      // Generate notifications
      .addCase(generateNotifications.fulfilled, (state, action) => {
        state.notifications = [...action.payload, ...state.notifications];
        state.unreadCount += action.payload.length;
      })
      // Fetch counts
      .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
        state.counts = action.payload.byType;
        state.unreadCount = action.payload.totalUnread;
      });
  }
});

export const { 
  clearError, 
  toggleNotificationPanel, 
  openNotificationPanel, 
  closeNotificationPanel,
  addNotification,
  decrementUnreadCount
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationCounts = (state) => state.notifications.counts;
export const selectNotificationPreferences = (state) => state.notifications.preferences;
export const selectNotificationPanelOpen = (state) => state.notifications.panelOpen;
export const selectNotificationsLoading = (state) => state.notifications.isLoading;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectHasMoreNotifications = (state) => state.notifications.hasMore;

export default notificationsSlice.reducer;
