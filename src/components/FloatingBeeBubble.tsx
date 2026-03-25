'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

interface FloatingBeeBubbleProps {
  onLessonStream?: (blocks: any[]) => void;
  userId: string;
}

export function FloatingBeeBubble({ onLessonStream, userId }: FloatingBeeBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      userId,
      contextType: 'lesson'
    },
    onResponse: async (response) => {
      // Handle streaming lesson blocks
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'lesson_block' && onLessonStream) {
                onLessonStream([data.block]);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    if (bubbleRef.current) {
      bubbleRef.current.style.right = 'auto';
      bubbleRef.current.style.bottom = 'auto';
      bubbleRef.current.style.left = `${e.clientX - position.x}px`;
      bubbleRef.current.style.top = `${e.clientY - position.y}px`;
    }
  };

  return (
    <>
      {/* Floating Bee Bubble */}
      <div
        ref={bubbleRef}
        className="fixed bottom-6 right-6 z-[9999]"
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseDown={handleDragStart}
          className="relative w-16 h-16 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-110 group"
          aria-label="Chat with Adeline"
        >
          {/* Bee Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-10 h-10">
              {/* Bee body */}
              <ellipse cx="32" cy="36" rx="14" ry="18" fill="#FFD700" />
              {/* Black stripes */}
              <rect x="18" y="28" width="28" height="3" fill="#000" opacity="0.8" />
              <rect x="18" y="36" width="28" height="3" fill="#000" opacity="0.8" />
              <rect x="18" y="44" width="28" height="3" fill="#000" opacity="0.8" />
              {/* Head */}
              <circle cx="32" cy="20" r="8" fill="#FFD700" />
              {/* Eyes */}
              <circle cx="28" cy="19" r="2" fill="#000" />
              <circle cx="36" cy="19" r="2" fill="#000" />
              {/* Antennae */}
              <line x1="28" y1="14" x2="24" y2="8" stroke="#000" strokeWidth="1.5" />
              <line x1="36" y1="14" x2="40" y2="8" stroke="#000" strokeWidth="1.5" />
              <circle cx="24" cy="8" r="2" fill="#000" />
              <circle cx="40" cy="8" r="2" fill="#000" />
              {/* Wings */}
              <ellipse cx="22" cy="26" rx="8" ry="12" fill="#fff" opacity="0.6" className="group-hover:animate-pulse" />
              <ellipse cx="42" cy="26" rx="8" ry="12" fill="#fff" opacity="0.6" className="group-hover:animate-pulse" />
            </svg>
          </div>

          {/* Notification badge */}
          {!isOpen && messages.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
              !
            </div>
          )}

          {/* Sparkle effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-70 group-hover:animate-ping"></div>
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse"></div>
          </div>
        </button>
      </div>

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-[9998] flex flex-col overflow-hidden border-4 border-amber-400">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Adeline</h3>
                <p className="text-xs text-amber-100">Your Learning Companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-amber-50/30"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">👋 Hi there! I'm Adeline.</p>
                <p className="text-sm mt-2">Ask me to start a lesson or help with anything!</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      handleInputChange({ target: { value: 'Start a lesson on butterflies' } } as any);
                      setTimeout(() => handleSubmit({ preventDefault: () => {} } as any), 100);
                    }}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    🦋 Start a lesson on butterflies
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({ target: { value: 'Teach me about the American Revolution' } } as any);
                      setTimeout(() => handleSubmit({ preventDefault: () => {} } as any), 100);
                    }}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    🏛️ American Revolution lesson
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-amber-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-amber-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-amber-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Adeline anything..."
                className="flex-1 px-4 py-2 border border-amber-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-amber-500 text-white rounded-full p-2 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
