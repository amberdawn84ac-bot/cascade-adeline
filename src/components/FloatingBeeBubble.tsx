'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Send, Sparkles } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

interface FloatingBeeBubbleProps {
  onLessonStream?: (blocks: any[]) => void;
  onLessonRequest?: (topic: string) => void;
  userId: string;
}

export function FloatingBeeBubble({ onLessonStream, onLessonRequest, userId }: FloatingBeeBubbleProps) {
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
          className="relative w-16 h-16 bg-[#FFFEF7] border-2 border-[#2F4731] rounded-full shadow-2xl hover:shadow-[#2F4731]/30 transition-all duration-300 hover:scale-110 group overflow-hidden"
          aria-label="Chat with Adeline"
        >
          <Image
            src="/bee-flower.jpg"
            alt="Adeline"
            fill
            className="object-cover rounded-full"
          />

          {/* Notification badge */}
          {!isOpen && messages.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
              !
            </div>
          )}
        </button>
      </div>

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-[9998] flex flex-col overflow-hidden border-4 border-[#2F4731]">
          {/* Header */}
          <div className="bg-[#2F4731] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#BD6809]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Adeline</h3>
                <p className="text-xs text-white/70">Your Learning Companion</p>
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
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFEF7]"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">👋 Hi there! I'm Adeline.</p>
                <p className="text-sm mt-2">Ask me to start a lesson or help with anything!</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      if (onLessonRequest) {
                        onLessonRequest('Butterflies of North America');
                        setIsOpen(false);
                      } else {
                        handleInputChange({ target: { value: 'Start a lesson on butterflies' } } as any);
                        setTimeout(() => handleSubmit({ preventDefault: () => {} } as any), 100);
                      }
                    }}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-[#2F4731] hover:bg-[#2F4731]/5 transition-colors border border-[#E7DAC3]"
                  >
                    🦋 Start a lesson on butterflies
                  </button>
                  <button
                    onClick={() => {
                      if (onLessonRequest) {
                        onLessonRequest('The American Revolution');
                        setIsOpen(false);
                      } else {
                        handleInputChange({ target: { value: 'Teach me about the American Revolution' } } as any);
                        setTimeout(() => handleSubmit({ preventDefault: () => {} } as any), 100);
                      }
                    }}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-[#2F4731] hover:bg-[#2F4731]/5 transition-colors border border-[#E7DAC3]"
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
                      ? 'bg-[#2F4731] text-white'
                      : 'bg-white text-[#121B13] shadow-sm border border-[#E7DAC3]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#E7DAC3]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-[#E7DAC3]">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Adeline anything..."
                className="flex-1 px-4 py-2 border border-[#E7DAC3] rounded-full focus:outline-none focus:ring-2 focus:ring-[#BD6809] focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#BD6809] text-white rounded-full p-2 hover:bg-[#2F4731] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
