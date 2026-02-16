'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Scroll } from '@/components/illustrations';

type Highlight = {
  id: string;
  userId: string;
  content: string;
  type: string;
  source: 'auto' | 'manual';
  impact?: string;
  userNote?: string;
  intent?: string;
  createdAt: string;
};

const INTENT_COLORS: Record<string, string> = {
  LIFE_LOG: '#BD6809',
  REFLECT: '#9A3F4A',
  INVESTIGATE: '#3D1419',
  BRAINSTORM: '#2F4731',
};

const TYPE_COLORS: Record<string, string> = {
  DEEP_REFLECTION: '#9A3F4A',
  CREDIT_EARNED: '#BD6809',
  MANUAL: '#2F4731',
};

export function HighlightsPanel() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<'all' | 'manual' | 'auto'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      const response = await fetch('/api/highlights');
      const data = await response.json();
      setHighlights(data);
    } catch {
      // API may not be available
    }
    setLoading(false);
  };

  const filteredHighlights = highlights.filter((h) =>
    filter === 'all' || h.source === filter
  );

  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#4B3424' }}>
        Loading highlights...
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <h2 style={{ fontFamily: '"Emilys Candy", cursive', color: '#2F4731', margin: 0, fontSize: '1.5rem' }}>
          Highlights
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'auto', 'manual'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: filter === f ? '2px solid #BD6809' : '1px solid #E7DAC3',
                background: filter === f ? 'rgba(189,104,9,0.1)' : '#FFF',
                cursor: 'pointer',
                fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                textTransform: 'capitalize',
                color: filter === f ? '#BD6809' : '#4B3424',
                fontSize: 14,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {filteredHighlights.map((highlight) => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </div>

      {filteredHighlights.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Scroll size={80} color="#BD6809" />
          <p style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#4B3424', marginTop: 16 }}>
            No highlights yet. Keep learning and they'll appear here!
          </p>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
  const borderColor = highlight.intent
    ? INTENT_COLORS[highlight.intent] || '#BD6809'
    : TYPE_COLORS[highlight.type] || '#BD6809';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: '#FFFEF7',
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#4B3424', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>
          {format(new Date(highlight.createdAt), 'MMM d, yyyy')}
        </span>
        {highlight.source === 'manual' && (
          <span style={{
            background: '#BD6809',
            color: '#FFF',
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
          }}>
            Manual
          </span>
        )}
      </div>

      <div style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#121B13', marginBottom: 12 }}>
        {highlight.content}
      </div>

      {highlight.impact && (
        <div style={{
          background: 'rgba(189,104,9,0.1)',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 14,
          color: '#4B3424',
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        }}>
          <strong>Impact:</strong> {highlight.impact}
        </div>
      )}

      {highlight.userNote && (
        <div style={{
          marginTop: 8,
          fontStyle: 'italic',
          color: '#4B3424',
          fontSize: 14,
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        }}>
          Note: {highlight.userNote}
        </div>
      )}
    </motion.div>
  );
}
