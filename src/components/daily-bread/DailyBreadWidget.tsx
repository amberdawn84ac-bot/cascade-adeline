"use client";

import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface DailyBreadData {
  verse: string;
  reference: string;
  original: string;
  originalMeaning: string;
  translationNote: string | null;
  context: string;
}

interface DailyBreadWidgetProps {
  onStudy: (prompt: string) => void;
}

export function DailyBreadWidget({ onStudy }: DailyBreadWidgetProps) {
  const [data, setData] = useState<DailyBreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetch('/api/daily-bread')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(true); } else { setData(d); }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleStudy = () => {
    if (!data) return;
    onStudy(
      `I want my Daily Bread deep-dive study on ${data.reference} today. ` +
      `Translate it directly from the original ${data.original.includes('ה') || data.original.includes('א') ? 'Hebrew' : 'Greek'} text, ` +
      `keeping the original meaning and context. Note any differences with the translation we are used to hearing — ` +
      `especially around the word "${data.original}" which means "${data.originalMeaning}". ` +
      `Also share the historical and cultural context that makes this verse richer.`
    );
  };

  return (
    <div style={{
      background: '#FFFDF5',
      border: '1px solid #E7DAC3',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #E7DAC3' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BookOpen size={14} color="#2F4731" />
            <span style={{ fontWeight: 800, color: '#2F4731', fontSize: 13, letterSpacing: '0.04em' }}>
              Daily Bread
            </span>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#BD6809',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Restoring Truth
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#4B3424', margin: 0, opacity: 0.65, lineHeight: 1.3 }}>
          Get back to the original context and meaning.
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px 14px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
            <Loader2 size={16} color="#BD6809" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#4B3424', opacity: 0.55 }}>Loading today&apos;s verse…</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <p style={{ fontSize: 11, color: '#4B3424', opacity: 0.6, margin: '0 0 10px' }}>
              Could not load today&apos;s verse.
            </p>
            <button onClick={load} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: '#BD6809', background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 700,
            }}>
              <RefreshCw size={11} /> Try again
            </button>
          </div>
        ) : data ? (
          <>
            {/* Verse card */}
            <div style={{
              background: '#FDF6E9', border: '1px solid #E7DAC3',
              borderRadius: 12, padding: '12px 14px', marginBottom: 10,
            }}>
              <p style={{
                fontStyle: 'italic', color: '#2F4731', fontSize: 13,
                lineHeight: 1.65, margin: '0 0 8px',
              }}>
                &ldquo;{data.verse}&rdquo;
              </p>
              <p style={{
                fontWeight: 700, color: '#BD6809', fontSize: 11, margin: 0,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                — {data.reference}
              </p>
            </div>

            {/* Original language note */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#2F4731', margin: '0 0 3px', fontWeight: 700 }}>
                {data.original}
              </p>
              <p style={{ fontSize: 11, color: '#4B3424', margin: '0 0 4px', opacity: 0.8, lineHeight: 1.4 }}>
                <em>{data.originalMeaning}</em>
              </p>
              {data.translationNote && (
                <p style={{ fontSize: 11, color: '#4B3424', margin: 0, opacity: 0.65, lineHeight: 1.4 }}>
                  {data.translationNote}
                </p>
              )}
            </div>

            {/* CTA */}
            <button onClick={handleStudy} style={{
              width: '100%', background: '#BD6809', color: '#FFF',
              border: 'none', borderRadius: 10, padding: '11px 14px',
              fontWeight: 800, fontSize: 11, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 10px rgba(189,104,9,0.25)',
            }}>
              Start Deep Dive Study <ArrowRight size={13} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

