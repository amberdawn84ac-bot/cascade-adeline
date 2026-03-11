"use client";

import { useState, useEffect } from 'react';
import { Compass, ArrowRight, Loader2 } from 'lucide-react';

interface Suggestion {
  label: string;
  subject: string;
  prompt: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  Science: '#3B7A57',
  Math: '#4A6FA5',
  Reading: '#8B5E3C',
  History: '#7B4F12',
  Writing: '#6B3FA0',
  English: '#8B5E3C',
  default: '#2F4731',
};

interface WhatsNextWidgetProps {
  onPrompt: (prompt: string) => void;
}

export function WhatsNextWidget({ onPrompt }: WhatsNextWidgetProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/whats-next')
      .then(r => r.json())
      .then(d => { setSuggestions(d.suggestions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{
      background: '#FFFDF5',
      border: '1px solid #E7DAC3',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #E7DAC3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <Compass size={14} color="#2F4731" />
          <span style={{ fontWeight: 800, color: '#2F4731', fontSize: 13, letterSpacing: '0.04em' }}>
            What&apos;s Next
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#4B3424', margin: 0, opacity: 0.65, lineHeight: 1.3 }}>
          Pick up where you left off.
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 8 }}>
            <Loader2 size={15} color="#BD6809" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : suggestions.length === 0 ? (
          <p style={{ fontSize: 11, color: '#4B3424', opacity: 0.55, textAlign: 'center', padding: '12px 0', margin: 0 }}>
            Start exploring to build your learning plan!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {suggestions.map((s, i) => {
              const color = SUBJECT_COLORS[s.subject] || SUBJECT_COLORS.default;
              return (
                <button
                  key={i}
                  onClick={() => onPrompt(s.prompt)}
                  style={{
                    width: '100%',
                    background: '#FFFEF7',
                    border: '1px solid #E7DAC3',
                    borderRadius: 10,
                    padding: '9px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FDF6E9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FFFEF7')}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 9, fontWeight: 800,
                      color, background: `${color}18`,
                      borderRadius: 5, padding: '2px 6px',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      marginBottom: 4,
                    }}>
                      {s.subject}
                    </span>
                    <p style={{
                      fontSize: 11, color: '#2F4731', margin: 0,
                      lineHeight: 1.35, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {s.label}
                    </p>
                  </div>
                  <ArrowRight size={13} color="#BD6809" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

