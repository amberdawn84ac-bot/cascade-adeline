'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Send, Sparkles } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { GenUIRenderer } from './gen-ui/GenUIRenderer';

interface FloatingBeeBubbleProps {
  onLessonStream?: (blocks: any[]) => void;
  onLessonRequest?: (topic: string) => void;
  onLessonMount?: () => void;
  userId?: string;
  /** When true, renders as a full-height panel (no bubble toggle, no fixed position, no drag) */
  panelMode?: boolean;
}

export function FloatingBeeBubble({ onLessonStream, onLessonRequest, onLessonMount, userId = '', panelMode = false }: FloatingBeeBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: { userId, contextType: 'general' },
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Server-side adelineRouter classifies LESSON intent — no client-side intercept needed.
    handleSubmit(e);
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Restore lesson history from DB on first mount — fixes annotation amnesia across refreshes
  useEffect(() => {
    if (!userId || messages.length > 0) return;
    fetch('/api/lessons/history')
      .then(r => r.ok ? r.json() : [])
      .then((history: any[]) => {
        if (history.length > 0) setMessages(history);
      })
      .catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Annotation bridge: forward raw lesson_block / lesson_metadata annotations
  // from the chat stream to the left-pane StreamingLessonRenderer via window globals.
  const sentAnnotationCountRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const latestAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!latestAssistant) return;
    const annotations: any[] = Array.isArray((latestAssistant as any).annotations)
      ? (latestAssistant as any).annotations
      : [];
    const prevCount = sentAnnotationCountRef.current[latestAssistant.id] ?? 0;
    if (annotations.length <= prevCount) return;

    const newAnns = annotations.slice(prevCount);
    sentAnnotationCountRef.current[latestAssistant.id] = annotations.length;
    console.log('[FloatingBeeBubble] Processing', newAnns.length, 'new annotations from message', latestAssistant.id);

    for (const ann of newAnns) {
      if (ann?.type === 'lesson_metadata' && ann.data) {
        console.log('[FloatingBeeBubble] Annotation: lesson_metadata', ann.data);
        // Show the left pane as soon as lesson metadata arrives (before blocks render)
        onLessonMount?.();
        if (typeof window.__setLessonMetadata === 'function') {
          window.__setLessonMetadata(ann.data);
        } else {
          console.warn('[FloatingBeeBubble] window.__setLessonMetadata not registered!');
        }
      } else if (ann?.type === 'lesson_block' && ann.data?.block) {
        console.log('[FloatingBeeBubble] Annotation: lesson_block', ann.data.block.type || ann.data.block.block_type);
        // Direct bridge: push block to left-pane StreamingLessonRenderer.
        // onLessonMount ensures the pane is visible even if metadata was missed.
        onLessonMount?.();
        if (typeof window.__addLessonBlock === 'function') {
          window.__addLessonBlock(ann.data.block);
        } else {
          console.warn('[FloatingBeeBubble] window.__addLessonBlock not registered!');
        }
      }
    }
  }, [messages, onLessonMount]);

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

  // ─── Panel mode ─────────────────────────────────────────────────────────────
  // Renders the chat UI as a full-height panel (used by AdelineChatPanel).
  // No bubble toggle, no fixed position, no drag.
  if (panelMode) {
    return (
      <div className="flex flex-col h-full bg-[#FFFEF7]">
        {/* Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">👋 Hi! I&apos;m Adeline.</p>
              <p className="text-sm mt-2">Ask me to start a lesson or help with anything!</p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    handleInputChange({ target: { value: 'Start a lesson on butterflies of North America' } } as React.ChangeEvent<HTMLInputElement>);
                    setTimeout(() => handleSubmit({ preventDefault: () => {} } as React.FormEvent), 50);
                  }}
                  className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-[#2F4731] hover:bg-[#2F4731]/5 transition-colors border border-[#E7DAC3]"
                >
                  🦋 Start a lesson on butterflies
                </button>
                <button
                  onClick={() => {
                    handleInputChange({ target: { value: 'Start a lesson on the American Revolution' } } as React.ChangeEvent<HTMLInputElement>);
                    setTimeout(() => handleSubmit({ preventDefault: () => {} } as React.FormEvent), 50);
                  }}
                  className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-[#2F4731] hover:bg-[#2F4731]/5 transition-colors border border-[#E7DAC3]"
                >
                  🏛️ American Revolution lesson
                </button>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={message.role === 'user' ? 'max-w-[85%] rounded-2xl px-4 py-2 bg-[#2F4731] text-white' : 'w-full'}>
                {message.content && (
                  <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? '' : 'rounded-2xl px-4 py-2 bg-white text-[#121B13] shadow-sm border border-[#E7DAC3]'}`}>
                    {message.content}
                  </p>
                )}
                {Array.isArray((message as any).annotations) &&
                  (message as any).annotations.map((ann: any, i: number) =>
                    ann?.genUIPayload ? (
                      <div key={i} className="mt-2 w-full">
                        <GenUIRenderer payload={ann.genUIPayload} />
                      </div>
                    ) : null,
                  )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#E7DAC3]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Input */}
        <form onSubmit={handleCustomSubmit} className="p-3 bg-white border-t border-[#E7DAC3] shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Adeline anything…"
              className="flex-1 px-4 py-2 border border-[#E7DAC3] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#BD6809] focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#BD6809] text-white rounded-full p-2 hover:bg-[#2F4731] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

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
                      handleInputChange({ target: { value: 'Start a lesson on butterflies of North America' } } as React.ChangeEvent<HTMLInputElement>);
                      setTimeout(() => handleSubmit({ preventDefault: () => {} } as React.FormEvent), 50);
                    }}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-[#2F4731] hover:bg-[#2F4731]/5 transition-colors border border-[#E7DAC3]"
                  >
                    🦋 Start a lesson on butterflies
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({ target: { value: 'Start a lesson on the American Revolution' } } as React.ChangeEvent<HTMLInputElement>);
                      setTimeout(() => handleSubmit({ preventDefault: () => {} } as React.FormEvent), 50);
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
                <div className={message.role === 'user' ? 'max-w-[80%] rounded-2xl px-4 py-2 bg-[#2F4731] text-white' : 'w-full'}>
                  {message.content && (
                    <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? '' : 'rounded-2xl px-4 py-2 bg-white text-[#121B13] shadow-sm border border-[#E7DAC3]'}`}>
                      {message.content}
                    </p>
                  )}
                  {Array.isArray((message as any).annotations) &&
                    (message as any).annotations.map((ann: any, i: number) =>
                      ann?.genUIPayload ? (
                        <div key={i} className="mt-2 w-full">
                          <GenUIRenderer payload={ann.genUIPayload} />
                        </div>
                      ) : null,
                    )}
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
          <form onSubmit={handleCustomSubmit} className="p-4 bg-white border-t border-[#E7DAC3]">
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
