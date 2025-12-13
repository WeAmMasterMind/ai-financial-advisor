/**
 * AI Advisor Page
 * Sprint 7-8: Main chat interface for AI financial advisor
 */

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PanelLeftClose, 
  PanelLeft,
  Info,
  Sparkles
} from 'lucide-react';

import ChatSidebar from '../components/ai/ChatSidebar';
import ChatWindow from '../components/ai/ChatWindow';
import ContextPanel from '../components/ai/ContextPanel';

import {
  fetchConversations,
  fetchQuota,
  toggleSidebar,
  toggleContextPanel,
  selectSidebarOpen,
  selectContextPanelOpen,
  selectActiveConversation,
  selectQuota
} from '../store/features/aiSlice';

const AIAdvisor = () => {
  const dispatch = useDispatch();
  
  const sidebarOpen = useSelector(selectSidebarOpen);
  const contextPanelOpen = useSelector(selectContextPanelOpen);
  const activeConversation = useSelector(selectActiveConversation);
  const quota = useSelector(selectQuota);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchQuota());
  }, [dispatch]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleToggleContext = useCallback(() => {
    dispatch(toggleContextPanel());
  }, [dispatch]);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`
          ${sidebarOpen ? 'w-72' : 'w-0'} 
          transition-all duration-300 ease-in-out
          bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden
        `}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-gray-600" />
              ) : (
                <PanelLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {activeConversation?.title || 'Atlas AI Advisor'}
                </h1>
                <p className="text-xs text-gray-500">
                  {activeConversation 
                    ? `${activeConversation.message_count || 0} messages`
                    : 'Your personal financial advisor'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {quota && (
              <div className="text-sm text-gray-500 hidden sm:block">
                <span className="font-medium text-gray-700">
                  {quota.quota?.remaining?.daily || 0}
                </span>
                {' messages left today'}
              </div>
            )}

            <button
              onClick={handleToggleContext}
              className={`
                p-2 rounded-lg transition-colors
                ${contextPanelOpen 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
                }
              `}
              title="View financial context"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
      </div>

      {/* Context Panel */}
      <div 
        className={`
          ${contextPanelOpen ? 'w-80' : 'w-0'} 
          transition-all duration-300 ease-in-out
          bg-white border-l border-gray-200 flex-shrink-0 overflow-hidden
        `}
      >
        <ContextPanel />
      </div>
    </div>
  );
};

export default AIAdvisor;