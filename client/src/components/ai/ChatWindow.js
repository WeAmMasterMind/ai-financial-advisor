/**
 * Chat Window
 * Sprint 7-8: Message display and input with streaming support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Send, 
  Loader2, 
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import MessageBubble from './MessageBubble';
import aiService from '../../services/aiService';

import {
  selectMessages,
  selectActiveConversation,
  selectIsStreaming,
  selectError,
  selectQuota,
  addUserMessage,
  startStreaming,
  appendStreamingContent,
  endStreaming,
  streamingError,
  clearError
} from '../../store/features/aiSlice';

const ChatWindow = () => {
  const dispatch = useDispatch();
  
  const messages = useSelector(selectMessages);
  const activeConversation = useSelector(selectActiveConversation);
  const isStreaming = useSelector(selectIsStreaming);
  const error = useSelector(selectError);
  const quota = useSelector(selectQuota);

  const [inputValue, setInputValue] = useState('');
  const [abortFn, setAbortFn] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isStreaming) {
      inputRef.current?.focus();
    }
  }, [isStreaming]);

  const handleSend = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || isStreaming) return;

    if (quota && quota.quota?.remaining?.daily <= 0) {
      dispatch(streamingError('Daily message limit reached. Try again tomorrow.'));
      return;
    }

    setInputValue('');
    dispatch(addUserMessage(message));
    dispatch(startStreaming());

    const conversationId = activeConversation?.id || null;

    const abort = aiService.chatStream(conversationId, message, {
      onStart: (messageId) => {},
      onToken: (token) => {
        dispatch(appendStreamingContent(token));
      },
      onDone: (result) => {
        dispatch(endStreaming(result));
      },
      onError: (errorMessage) => {
        dispatch(streamingError(errorMessage));
      }
    });

    setAbortFn(() => abort);
  }, [inputValue, isStreaming, activeConversation, quota, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    if (abortFn) {
      abortFn();
      dispatch(endStreaming({ content: '' }));
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const isQuotaExhausted = quota && quota.quota?.remaining?.daily <= 0;

  // Empty state
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 
                          rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Hi, I'm Atlas
            </h2>
            <p className="text-gray-600 mb-6">
              Your personal AI financial advisor. I can help you with budgeting, 
              debt strategies, investment decisions, and achieving your financial goals.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "How can I pay off my debt faster?",
                "Review my spending this month",
                "Is my portfolio well-balanced?",
                "Help me create a savings plan"
              ].map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(prompt);
                    inputRef.current?.focus();
                  }}
                  className="p-3 text-left text-sm text-gray-700 bg-white 
                           border border-gray-200 rounded-lg hover:border-blue-300 
                           hover:bg-blue-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg 
                          flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
              <button onClick={handleClearError} className="text-red-500 hover:text-red-700">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isQuotaExhausted 
                  ? "Daily limit reached. Try again tomorrow." 
                  : "Ask me anything about your finances..."
                }
                disabled={isStreaming || isQuotaExhausted}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl
                         resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming || isQuotaExhausted}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                       disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat with messages
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.id || index} 
            message={message}
            isStreaming={message.isStreaming}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg 
                        flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button onClick={handleClearError} className="text-red-500 hover:text-red-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming 
                  ? "Waiting for response..." 
                  : isQuotaExhausted
                    ? "Daily limit reached"
                    : "Type your message..."
              }
              disabled={isStreaming || isQuotaExhausted}
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl
                       resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-transparent disabled:bg-gray-100"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />
          </div>
          
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isQuotaExhausted}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                       disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {quota && (
            <span>{quota.quota?.remaining?.daily || 0} messages remaining today</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;