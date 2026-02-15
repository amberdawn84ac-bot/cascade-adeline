"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { WheatStalk } from '@/components/illustrations';
import { SketchnoteRenderer } from '@/components/sketchnote/SketchnoteRenderer';

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

function ActiveDot() {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: '#3FB673',
        display: 'inline-block',
        boxShadow: '0 0 0 6px rgba(63,182,115,0.15)',
      }}
      aria-label="Adeline is active"
    />
  );
}

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, data, setInput, append } = useChat({ api: '/api/chat' });
  const [gapNudge, setGapNudge] = useState<string | null>(null);
  const [genUIPayload, setGenUIPayload] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, genUIPayload]);

  useEffect(() => {
    if (!data) return;
    const payload = data as any;
    if (payload.gapNudge) setGapNudge(payload.gapNudge as string);
    if (payload.genUIPayload) setGenUIPayload(payload.genUIPayload);
  }, [data]);

  const renderedMessages = useMemo(
    () =>
      messages.filter((m) => m.role !== 'system').map((m, idx) => {
        const isUser = m.role === 'user';
        return (
          <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '78%',
                background: isUser ? PALM : '#FFFFFF',
                color: isUser ? '#FFFFFF' : '#121B13',
                padding: '12px 14px',
                borderRadius: isUser ? '14px 0 14px 14px' : '0 14px 14px 14px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                border: isUser ? `1px solid rgba(47,71,49,0.3)` : '1px solid #E7DAC3',
              }}
            >
              {isUser ? (
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>{m.content}</div>
              ) : (
                <SketchnoteRenderer content={m.content} mode={gapNudge ? 'SKETCHNOTE' : 'CHAT'} genUIPayload={genUIPayload || undefined} />
              )}
            </div>
          </div>
        );
      }),
    [messages, genUIPayload, gapNudge],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: CREAM,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid #E7DAC3',
          position: 'sticky',
          top: 0,
          background: CREAM,
          zIndex: 10,
        }}
      >
        <WheatStalk size={40} color={PAPAYA} />
        <div>
          <div style={{ fontFamily: '"Emilys Candy", cursive', color: PALM, fontSize: '1.5rem' }}>Dear Adeline</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B3424', fontSize: 12 }}>
            <ActiveDot />
            <span>Adeline is here</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {gapNudge && (
          <div
            style={{
              background: '#FFF3E7',
              border: `1px solid ${PAPAYA}`,
              color: '#4B3424',
              padding: '10px 12px',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            Gap Nudge: {gapNudge}
          </div>
        )}
        {renderedMessages}
        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={handleSubmit}
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'rgba(255,254,247,0.95)',
          padding: '10px 14px',
          borderTop: '1px solid #E7DAC3',
          display: 'flex',
          gap: 10,
        }}
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Share what you explored today..."
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid #E7DAC3',
            background: '#FFFDF5',
            fontFamily: 'Kalam, "Comic Sans MS", system-ui',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 18px',
            borderRadius: 14,
            border: 'none',
            background: PAPAYA,
            color: '#FFFFFF',
            fontWeight: 700,
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.7 : 1,
            boxShadow: '0 6px 12px rgba(189,104,9,0.3)',
          }}
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => setInput('')}
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid #E7DAC3',
            background: '#FFFFFF',
            color: '#4B3424',
          }}
        >
          Clear
        </button>
      </form>
    </div>
  );
}
