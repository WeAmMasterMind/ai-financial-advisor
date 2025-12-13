/**
 * Chat Sidebar
 * Sprint 7-8: Conversation list and management
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  deleteConversation,
  updateConversationTitle,
  fetchConversation,
  clearActiveConversation,
  selectConversations,
  selectActiveConversation,
  selectConversationsLoading
} from '../../store/features/aiSlice';

const ChatSidebar = () => {
  const dispatch = useDispatch();
  
  const conversations = useSelector(selectConversations);
  const activeConversation = useSelector(selectActiveConversation);
  const isLoading = useSelector(selectConversationsLoading);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleNewChat = () => {
    dispatch(clearActiveConversation());
  };

  const handleSelectConversation = (conversation) => {
    if (conversation.id === activeConversation?.id) return;
    dispatch(fetchConversation(conversation.id));
  };

  const handleStartEdit = (e, conversation) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async (e) => {
    e.stopPropagation();
    if (editTitle.trim() && editTitle !== conversations.find(c => c.id === editingId)?.title) {
      await dispatch(updateConversationTitle({ conversationId: editingId, title: editTitle.trim() }));
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    setDeletingId(conversationId);
    await dispatch(deleteConversation(conversationId));
    setDeletingId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                     font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start a new chat to get financial advice
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`
                  group relative p-3 rounded-lg cursor-pointer transition-colors
                  ${activeConversation?.id === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-100 border border-transparent'
                  }
                `}
              >
                {editingId === conversation.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(e);
                        if (e.key === 'Escape') handleCancelEdit(e);
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 
                                 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <MessageSquare className={`
                        w-4 h-4 mt-0.5 flex-shrink-0
                        ${activeConversation?.id === conversation.id 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                        }
                      `} />
                      <div className="flex-1 min-w-0">
                        <p className={`
                          text-sm font-medium truncate
                          ${activeConversation?.id === conversation.id 
                            ? 'text-blue-900' 
                            : 'text-gray-900'
                          }
                        `}>
                          {conversation.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {conversation.message_count || 0} messages
                          {conversation.last_message_at && (
                            <span> · {formatDate(conversation.last_message_at)}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className={`
                      absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1
                      opacity-0 group-hover:opacity-100 transition-opacity
                    `}>
                      <button
                        onClick={(e) => handleStartEdit(e, conversation)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 
                                   hover:bg-white rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, conversation.id)}
                        disabled={deletingId === conversation.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 
                                   hover:bg-white rounded transition-colors"
                        title="Delete"
                      >
                        {deletingId === conversation.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Powered by Claude AI
        </p>
      </div>
    </div>
  );
};

export default ChatSidebar;