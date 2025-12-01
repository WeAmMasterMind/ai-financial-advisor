import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: true,
  currentTheme: 'light',
  notifications: [],
  modals: {
    isOpen: false,
    type: null,
    data: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.currentTheme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    openModal: (state, action) => {
      state.modals.isOpen = true;
      state.modals.type = action.payload.type;
      state.modals.data = action.payload.data;
    },
    closeModal: (state) => {
      state.modals.isOpen = false;
      state.modals.type = null;
      state.modals.data = null;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  removeNotification,
  openModal,
  closeModal
} = uiSlice.actions;

export default uiSlice.reducer;