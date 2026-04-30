'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Loader2 } from 'lucide-react';

export interface TextChunk {
  text: string;
  illustrationPrompt?: string;
}

export interface IllustratedTextBlockProps {
  title?: string;
  chunks: TextChunk[];
  subject?: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

function useIllustration(prompt: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!prompt) return;
    setLoading(true);
    setError(false);
    fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setUrl(data.url);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [prompt]);

  return { url, loading, error };
}

function ChunkIllustration({ prompt }: { prompt: string }) {
  const { url, loading, error } = useIllustration(prompt);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F0E8D8',
        border: `1px dashed ${PAPAYA}`,
        borderRadius: 10,
        height: 140,
        gap: 8,
        color: PAPAYA,
        fontSize: '0.82rem',
      }}>
        <Loader2 size={18} className="animate-spin" />
        Generating illustration…
      </div>
    );
  }

  if (error || !url) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F0E8D8',
        border: `1px dashed #E7DAC3`,
        borderRadius: 10,
        height: 100,
        gap: 6,
        color: '#4B3424',
        fontSize: '0.78rem',
        opacity: 0.6,
      }}>
        <ImageIcon size={20} />
        Illustration unavailable
      </div>
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      src={url}
      alt={prompt}
      style={{
        width: '100%',
        borderRadius: 10,
        border: `1px solid #E7DAC3`,
        objectFit: 'cover',
        maxHeight: 220,
      }}
    />
  );
}

export function IllustratedTextBlock({ title, chunks, subject }: IllustratedTextBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        padding: '20px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      {title && (
        <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>
          {title}
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        {chunks.map((chunk, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              display: 'grid',
              gridTemplateColumns: chunk.illustrationPrompt ? '1fr 1fr' : '1fr',
              gap: 14,
              alignItems: 'start',
            }}
          >
            {/* Text side */}
            <div style={{
              color: '#2C1A0E',
              fontSize: '0.95rem',
              lineHeight: 1.65,
            }}>
              {chunk.text}
            </div>

            {/* Illustration side */}
            {chunk.illustrationPrompt && (
              <ChunkIllustration
                prompt={`${subject ? `${subject}: ` : ''}${chunk.illustrationPrompt}`}
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
