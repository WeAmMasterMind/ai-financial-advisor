/**
 * AI Service
 * Sprint 7-8: API client with SSE streaming support
 */

import axios from 'axios';

const API_URL = '/api/ai';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const aiApi = axios.create({
  baseURL: API_URL
});

aiApi.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...getAuthHeader() };
  return config;
});

// Conversation Management
const getConversations = async (params = {}) => {
  const response = await aiApi.get('/conversations', { params });
  return response.data;
};

const getConversation = async (conversationId) => {
  const response = await aiApi.get(`/conversations/${conversationId}`);
  return response.data;
};

const createConversation = async (title = 'New Conversation') => {
  const response = await aiApi.post('/conversations', { title });
  return response.data;
};

const deleteConversation = async (conversationId) => {
  const response = await aiApi.delete(`/conversations/${conversationId}`);
  return response.data;
};

const updateConversation = async (conversationId, data) => {
  const response = await aiApi.patch(`/conversations/${conversationId}`, data);
  return response.data;
};

// Quota & Context
const getQuota = async () => {
  const response = await aiApi.get('/quota');
  return response.data;
};

const getContext = async () => {
  const response = await aiApi.get('/context');
  return response.data;
};

// Non-streaming chat
const chatSimple = async (conversationId, message) => {
  const response = await aiApi.post('/chat/simple', { conversationId, message });
  return response.data;
};

/**
 * Streaming chat using SSE
 */
const chatStream = (conversationId, message, callbacks = {}) => {
  const { onStart, onToken, onDone, onError } = callbacks;
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    onError?.('Not authenticated');
    return () => {};
  }

  const abortController = new AbortController();

  const fetchStream = async () => {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ conversationId, message }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        const data = await response.json();
        if (data.success) {
          onStart?.();
          onToken?.(data.data.message.content);
          onDone?.({ content: data.data.message.content, usage: data.data.usage });
        } else {
          throw new Error(data.message || 'Request failed');
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let usage = {};

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Event type handled with data
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta' && data.content) {
                fullContent += data.content;
                onToken?.(data.content);
              } else if (data.type === 'start' || data.messageId) {
                onStart?.(data.messageId);
              } else if (data.usage) {
                usage = data.usage;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (line.slice(6).trim() !== '{}') {
                console.warn('SSE parse warning:', e.message);
              }
            }
          }
        }
      }

      onDone?.({ content: fullContent, usage });

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }
      console.error('Streaming error:', error);
      onError?.(error.message || 'Streaming failed');
    }
  };

  fetchStream();

  return () => {
    abortController.abort();
  };
};

const aiService = {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  updateConversation,
  chatSimple,
  chatStream,
  getQuota,
  getContext
};

export default aiService;