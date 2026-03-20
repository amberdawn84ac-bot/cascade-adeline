'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const CREAM = '#FFFEF7';

function getMessageText(message: { content?: string; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === 'string' && message.content.length > 0) return message.content;
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts.filter(p => p?.type === 'text' && typeof p.text === 'string').map(p => p.text).join('');
}

export function AdelineOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
    onError: (e) => console.error('[AdelineOrb] chat error:', e),
  });

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating orb button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Chat with Adeline"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: PALM,
          border: `3px solid ${PAPAYA}`,
          boxShadow: '0 4px 20px rgba(47,71,49,0.4)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(47,71,49,0.55)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(47,71,49,0.4)';
        }}
      >
        {isOpen ? <X size={24} color={CREAM} /> : '🌿'}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              width: 380,
              height: 560,
              backgroundColor: CREAM,
              borderRadius: 16,
              border: `2px solid ${PAPAYA}`,
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ backgroundColor: PALM, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🌿</span>
              <div>
                <p style={{ color: CREAM, fontWeight: 700, fontSize: 14, margin: 0 }}>Adeline</p>
                <p style={{ color: `${CREAM}99`, fontSize: 11, margin: 0 }}>Your homeschool mentor</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: `${PALM}80`, fontSize: 13, marginTop: 20 }}>
                  <p>Ask me anything — a subject question, what to do next, or just talk.</p>
                </div>
              )}
              {messages.map((msg) => {
                const text = getMessageText(msg);
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: isUser ? PALM : '#F0EDE3',
                      color: isUser ? CREAM : PALM,
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '8px 12px',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {text}
                  </div>
                );
              })}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', backgroundColor: '#F0EDE3', borderRadius: '16px 16px 16px 4px', padding: '8px 12px' }}>
                  <span style={{ color: `${PALM}80`, fontSize: 13 }}>Adeline is thinking…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              style={{ padding: '10px 12px', borderTop: `1px solid ${PAPAYA}40`, display: 'flex', gap: 8 }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Adeline…"
                disabled={isLoading}
                style={{
                  flex: 1,
                  border: `1px solid ${PALM}40`,
                  borderRadius: 20,
                  padding: '8px 14px',
                  fontSize: 13,
                  backgroundColor: '#fff',
                  color: PALM,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: input.trim() ? PAPAYA : `${PAPAYA}60`,
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Send size={15} color={CREAM} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
