"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, X } from 'lucide-react';
import { AdelineTyping } from '@/components/chat/AdelineTyping';
import { SketchnoteRenderer } from '@/components/sketchnote/SketchnoteRenderer';
import { ErrorDisplay } from '@/components/chat/ErrorDisplay';
import { DailyBreadWidget } from '@/components/daily-bread/DailyBreadWidget';
import { WhatsNextWidget } from '@/components/daily-bread/WhatsNextWidget';

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

function ActiveDot() {
  return (
    <span style={{
      width: 9, height: 9, borderRadius: '50%',
      backgroundColor: '#3FB673', display: 'inline-block',
      boxShadow: '0 0 0 5px rgba(63,182,115,0.15)',
    }} />
  );
}

function getMessageText(message: { content?: string; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === 'string' && message.content.length > 0) return message.content;
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts.filter(p => p?.type === 'text' && typeof p.text === 'string').map(p => p.text).join('');
}

export default function DashboardChatPage() {
  const { messages, input, handleSubmit, isLoading, error, append, setInput } = useChat({
    api: '/api/chat',
    onError: (e) => console.error('[DashboardChat] error:', e),
  });

  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract intent from latest assistant message
  useEffect(() => {
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    const meta = (last as any).metadata || {};
    const annotations = (last as any).annotations || [];
    let intent = meta.intent;
    for (const a of annotations) { if (a?.intent) intent = a.intent; }
    if (intent) setDetectedIntent(intent);
  }, [messages]);

  const handleSendPrompt = (prompt: string) => {
    setInput('');
    append({ role: 'user', content: prompt });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !pendingImageUrl) return;
    const body: Record<string, string> = {};
    if (pendingImageUrl) body.imageUrl = pendingImageUrl;
    handleSubmit(e, { body });
    clearImage();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      setPendingImageUrl(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setPendingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderedMessages = useMemo(() =>
    messages.filter(m => m.role !== 'system').map((m, idx) => {
      const isUser = m.role === 'user';
      return (
        <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <div style={{
            maxWidth: '78%',
            background: isUser ? PALM : '#FFFFFF',
            color: isUser ? '#FFFFFF' : '#121B13',
            padding: '11px 13px',
            borderRadius: isUser ? '14px 0 14px 14px' : '0 14px 14px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
            border: isUser ? '1px solid rgba(47,71,49,0.3)' : '1px solid #E7DAC3',
          }}>
            {isUser ? (
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Kalam, "Comic Sans MS", system-ui', fontSize: 14 }}>
                {getMessageText(m)}
              </div>
            ) : (
              <SketchnoteRenderer
                content={getMessageText(m)}
                mode={detectedIntent && ['INVESTIGATE', 'LIFE_LOG', 'BRAINSTORM', 'REFLECT', 'ASSESS', 'ANALOGY'].includes(detectedIntent) ? 'SKETCHNOTE' : 'CHAT'}
              />
            )}
          </div>
        </div>
      );
    }),
  [messages, detectedIntent]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: CREAM, overflow: 'hidden' }}>

      {/* ── Chat panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid #E7DAC3' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #E7DAC3',
          background: CREAM, flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: '"Emilys Candy", cursive', color: PALM, fontSize: '1.4rem' }}>
              Dear Adeline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B3424', fontSize: 11 }}>
              <ActiveDot />
              <span>Adeline is here</span>
            </div>
          </div>
          <button
            onClick={() => setShowSidebar(v => !v)}
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            style={{
              padding: '6px 10px', borderRadius: 8, border: '1px solid #E7DAC3',
              background: showSidebar ? '#FDF6E9' : '#FFF', color: PALM,
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
            }}
          >
            {showSidebar ? 'Hide panel' : 'Daily Bread ✦'}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4B3424', opacity: 0.5 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
              <p style={{ fontFamily: '"Emilys Candy", cursive', fontSize: 18, margin: '0 0 6px' }}>Hello, dear learner!</p>
              <p style={{ fontSize: 13, margin: 0 }}>I&apos;m Adeline, your learning companion. What shall we discover together today?</p>
            </div>
          )}
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={() => {
                const last = [...messages].reverse().find(m => m.role === 'user');
                if (last) append({ role: 'user', content: getMessageText(last) });
              }}
            />
          )}
          {renderedMessages}
          {isLoading && <AdelineTyping intent={detectedIntent ?? undefined} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleFormSubmit} style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid #E7DAC3',
          background: 'rgba(255,254,247,0.97)',
          flexShrink: 0,
        }}>
          {imagePreview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <img src={imagePreview} alt="preview" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '2px solid #E7DAC3' }} />
              <span style={{ fontSize: 12, color: '#4B3424' }}>📸 Image attached</span>
              <button type="button" onClick={clearImage} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4B3424', opacity: 0.6 }}>
                <X size={14} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} title="Attach image" style={{
              padding: '10px 12px', borderRadius: 12, border: '1px solid #E7DAC3',
              background: imagePreview ? '#FFF3E7' : '#FFF', color: '#4B3424', cursor: 'pointer', fontSize: 16, flexShrink: 0,
            }}>📷</button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e as any); } }}
              placeholder="Share what you explored today…"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1px solid #E7DAC3', background: '#FFFDF5',
                fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                fontSize: 14, outline: 'none', resize: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !pendingImageUrl)}
              style={{
                padding: '10px 16px', borderRadius: 12, border: 'none',
                background: PAPAYA, color: '#FFF', fontWeight: 700, cursor: 'pointer',
                opacity: isLoading || (!input.trim() && !pendingImageUrl) ? 0.6 : 1,
                boxShadow: '0 4px 10px rgba(189,104,9,0.3)', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Send size={14} /> Send
            </button>
          </div>
        </form>
      </div>

      {/* ── Right sidebar ── */}
      {showSidebar && (
        <div style={{
          width: 280, flexShrink: 0, overflowY: 'auto',
          background: '#FAF8F2', padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <DailyBreadWidget onStudy={handleSendPrompt} />
          <WhatsNextWidget onPrompt={handleSendPrompt} />
        </div>
      )}
    </div>
  );
}
