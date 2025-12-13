/**
 * Message Bubble
 * Sprint 7-8: Individual message display with markdown support
 */

import React, { useMemo } from 'react';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isStreaming = false }) => {
  const [copied, setCopied] = React.useState(false);
  
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formattedContent = useMemo(() => {
    if (!message.content) return '';
    
    let content = message.content;
    
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/__(.*?)__/g, '<strong>$1</strong>');
    content = content.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    content = content.replace(/```([\s\S]*?)```/g, 
      '<pre class="bg-gray-100 rounded p-3 my-2 overflow-x-auto text-sm"><code>$1</code></pre>'
    );
    content = content.replace(/`([^`]+)`/g, 
      '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm">$1</code>'
    );
    content = content.replace(/^- (.*?)$/gm, '• $1');
    content = content.replace(/^\* (.*?)$/gm, '• $1');
    content = content.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, 
      '<span class="font-semibold text-green-700">$$1</span>'
    );
    content = content.replace(/(\d+(?:\.\d+)?%)/g, 
      '<span class="font-semibold">$1</span>'
    );
    content = content.replace(/\n/g, '<br />');
    
    return content;
  }, [message.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`
        w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
        ${isUser 
          ? 'bg-gray-200' 
          : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-gray-600" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-500">
            {isUser ? 'You' : 'Atlas'}
          </span>
          {message.created_at && (
            <span className="text-xs text-gray-400">
              {formatTime(message.created_at)}
            </span>
          )}
        </div>

        <div className={`
          relative group rounded-2xl px-4 py-3
          ${isUser 
            ? 'bg-blue-600 text-white rounded-tr-sm' 
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
          }
        `}>
          <div 
            className={`
              prose prose-sm max-w-none
              ${isUser ? 'prose-invert' : ''}
            `}
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
          
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}

          {isAssistant && message.content && !isStreaming && (
            <button
              onClick={handleCopy}
              className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100
                       flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700
                       transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        {isAssistant && message.tokens_used > 0 && !isStreaming && (
          <span className="text-xs text-gray-400 mt-1">
            {message.tokens_used} tokens
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;