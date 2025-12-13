/**
 * AI Slice
 * Sprint 7-8: Redux state management for AI chat
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import aiService from '../../services/aiService';

// Async Thunks
export const fetchConversations = createAsyncThunk(
  'ai/fetchConversations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await aiService.getConversations(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'ai/fetchConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await aiService.getConversation(conversationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }
);

export const createConversation = createAsyncThunk(
  'ai/createConversation',
  async (title = 'New Conversation', { rejectWithValue }) => {
    try {
      const response = await aiService.createConversation(title);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'ai/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await aiService.deleteConversation(conversationId);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete conversation');
    }
  }
);

export const updateConversationTitle = createAsyncThunk(
  'ai/updateConversationTitle',
  async ({ conversationId, title }, { rejectWithValue }) => {
    try {
      const response = await aiService.updateConversation(conversationId, { title });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update title');
    }
  }
);

export const fetchQuota = createAsyncThunk(
  'ai/fetchQuota',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiService.getQuota();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quota');
    }
  }
);

export const fetchContext = createAsyncThunk(
  'ai/fetchContext',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiService.getContext();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch context');
    }
  }
);

// Initial State
const initialState = {
  conversations: [],
  conversationsLoading: false,
  conversationsPagination: null,
  activeConversation: null,
  activeConversationLoading: false,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  pendingMessage: null,
  quota: null,
  quotaLoading: false,
  context: null,
  contextLoading: false,
  sidebarOpen: true,
  contextPanelOpen: false,
  error: null
};

// Slice
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      state.messages = action.payload?.messages || [];
    },
    clearActiveConversation: (state) => {
      state.activeConversation = null;
      state.messages = [];
      state.streamingContent = '';
      state.isStreaming = false;
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: `temp-${Date.now()}`,
        role: 'user',
        content: action.payload,
        created_at: new Date().toISOString()
      });
      state.pendingMessage = action.payload;
    },
    startStreaming: (state) => {
      state.isStreaming = true;
      state.streamingContent = '';
      state.messages.push({
        id: `streaming-${Date.now()}`,
        role: 'assistant',
        content: '',
        isStreaming: true,
        created_at: new Date().toISOString()
      });
    },
    appendStreamingContent: (state, action) => {
      state.streamingContent += action.payload;
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        lastMessage.content = state.streamingContent;
      }
    },
    endStreaming: (state, action) => {
      state.isStreaming = false;
      state.pendingMessage = null;
      
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        lastMessage.isStreaming = false;
        lastMessage.content = state.streamingContent || action.payload?.content || '';
        lastMessage.id = action.payload?.id || lastMessage.id;
      }
      
      state.streamingContent = '';

      if (action.payload?.usage && state.quota) {
        state.quota.today.messages += 1;
        state.quota.today.tokens += action.payload.usage.totalTokens || 0;
        state.quota.quota.remaining.daily = Math.max(0, state.quota.quota.remaining.daily - 1);
        state.quota.quota.remaining.hourly = Math.max(0, state.quota.quota.remaining.hourly - 1);
      }
    },
    streamingError: (state, action) => {
      state.isStreaming = false;
      state.error = action.payload;
      
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        state.messages.pop();
      }
      
      state.streamingContent = '';
      state.pendingMessage = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleContextPanel: (state) => {
      state.contextPanelOpen = !state.contextPanelOpen;
    },
    updateConversationInList: (state, action) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload };
      }
    },
    addConversationToList: (state, action) => {
      state.conversations.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload.conversations;
        state.conversationsPagination = action.payload.pagination;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchConversation.pending, (state) => {
        state.activeConversationLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.activeConversationLoading = false;
        state.activeConversation = action.payload;
        state.messages = action.payload.messages || [];
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.activeConversationLoading = false;
        state.error = action.payload;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.activeConversation = action.payload;
        state.messages = [];
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(c => c.id !== action.payload);
        if (state.activeConversation?.id === action.payload) {
          state.activeConversation = null;
          state.messages = [];
        }
      })
      .addCase(updateConversationTitle.fulfilled, (state, action) => {
        const index = state.conversations.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.conversations[index].title = action.payload.title;
        }
        if (state.activeConversation?.id === action.payload.id) {
          state.activeConversation.title = action.payload.title;
        }
      })
      .addCase(fetchQuota.pending, (state) => {
        state.quotaLoading = true;
      })
      .addCase(fetchQuota.fulfilled, (state, action) => {
        state.quotaLoading = false;
        state.quota = action.payload;
      })
      .addCase(fetchQuota.rejected, (state) => {
        state.quotaLoading = false;
      })
      .addCase(fetchContext.pending, (state) => {
        state.contextLoading = true;
      })
      .addCase(fetchContext.fulfilled, (state, action) => {
        state.contextLoading = false;
        state.context = action.payload;
      })
      .addCase(fetchContext.rejected, (state) => {
        state.contextLoading = false;
      });
  }
});

// Export actions
export const {
  clearError,
  setActiveConversation,
  clearActiveConversation,
  addUserMessage,
  startStreaming,
  appendStreamingContent,
  endStreaming,
  streamingError,
  toggleSidebar,
  toggleContextPanel,
  updateConversationInList,
  addConversationToList
} = aiSlice.actions;

// Selectors
export const selectConversations = (state) => state.ai.conversations;
export const selectActiveConversation = (state) => state.ai.activeConversation;
export const selectMessages = (state) => state.ai.messages;
export const selectIsStreaming = (state) => state.ai.isStreaming;
export const selectStreamingContent = (state) => state.ai.streamingContent;
export const selectQuota = (state) => state.ai.quota;
export const selectContext = (state) => state.ai.context;
export const selectSidebarOpen = (state) => state.ai.sidebarOpen;
export const selectContextPanelOpen = (state) => state.ai.contextPanelOpen;
export const selectError = (state) => state.ai.error;
export const selectConversationsLoading = (state) => state.ai.conversationsLoading;
export const selectContextLoading = (state) => state.ai.contextLoading;

export default aiSlice.reducer;