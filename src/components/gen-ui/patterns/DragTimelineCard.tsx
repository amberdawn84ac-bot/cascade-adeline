'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, GripVertical } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  connection?: string;
}

export interface DragTimelineCardProps {
  title: string;
  events: TimelineEvent[];
  onComplete?: (correct: boolean, attempts: number, timeMs: number) => void;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const PARADISE = '#9A3F4A';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DragTimelineCard({ title, events, onComplete }: DragTimelineCardProps) {
  const [items, setItems] = useState<TimelineEvent[]>(() => shuffleArray(events));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const correctIds = events.map((e) => e.id);
  const currentIds = items.map((e) => e.id);
  const isCorrect = JSON.stringify(correctIds) === JSON.stringify(currentIds);

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }
      setItems((prev) => {
        const next = [...prev];
        const [removed] = next.splice(dragIndex, 1);
        next.splice(dropIndex, 0, removed);
        return next;
      });
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex]
  );

  const handleCheck = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setChecked(true);
    onComplete?.(isCorrect, newAttempts, Date.now() - startTime);
  };

  const handleReset = () => {
    setItems(shuffleArray(events));
    setChecked(false);
    setDragIndex(null);
    setOverIndex(null);
  };

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
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem' }}>{title}</div>
        <div style={{ color: PAPAYA, fontSize: '0.8rem', marginTop: 4, fontStyle: 'italic' }}>
          Drag the events into chronological order — earliest first.
        </div>
      </div>

      {/* Draggable list */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {items.map((event, idx) => {
          const correctPos = correctIds.indexOf(event.id);
          const isRight = checked && idx === correctPos;
          const isWrong = checked && idx !== correctPos;
          const isDragging = dragIndex === idx;
          const isOver = overIndex === idx && dragIndex !== idx;

          return (
            <motion.div
              key={event.id}
              layout
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              aria-label={`Event: ${event.title}. Drag to reorder.`}
              style={{
                background: isRight ? '#D4EDDA' : isWrong ? '#F8D7DA' : '#FFFFFF',
                border: `2px solid ${
                  isOver ? PAPAYA : isRight ? '#28A745' : isWrong ? '#DC3545' : '#E7DAC3'
                }`,
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: checked ? 'default' : 'grab',
                opacity: isDragging ? 0.4 : 1,
                transform: isOver ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
            >
              {!checked && (
                <GripVertical size={18} color={PAPAYA} style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              {checked && isRight && <CheckCircle size={18} color="#28A745" style={{ marginTop: 2, flexShrink: 0 }} />}
              {checked && isWrong && <XCircle size={18} color="#DC3545" style={{ marginTop: 2, flexShrink: 0 }} />}

              <div style={{ flex: 1 }}>
                <div style={{ color: PAPAYA, fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>
                  {event.date}
                </div>
                <div style={{ color: PALM, fontWeight: 700, fontSize: '0.95rem' }}>{event.title}</div>
                <div style={{ color: '#4B3424', fontSize: '0.85rem', lineHeight: 1.4, marginTop: 2 }}>
                  {event.description}
                </div>
                {checked && isRight && event.connection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      marginTop: 6,
                      padding: '6px 10px',
                      background: '#E8F5E9',
                      borderRadius: 8,
                      color: PALM,
                      fontSize: '0.82rem',
                      fontStyle: 'italic',
                    }}
                  >
                    ↗ {event.connection}
                  </motion.div>
                )}
              </div>

              {/* Position indicator */}
              <div style={{
                background: PALM,
                color: '#fff',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {idx + 1}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!checked ? (
          <button
            onClick={handleCheck}
            aria-label="Check order"
            style={{
              background: PALM,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Check Order
          </button>
        ) : (
          <button
            onClick={handleReset}
            aria-label="Try again"
            style={{
              background: PARADISE,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RotateCcw size={14} /> Try Again
          </button>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 14,
              background: isCorrect ? '#F0FFF4' : '#FFF9E6',
              border: `1px solid ${isCorrect ? '#28A745' : PAPAYA}`,
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div style={{ color: PALM, fontWeight: 700 }}>
              {isCorrect
                ? '🌟 Perfect chronological order!'
                : `Not quite — look at the highlighted events. Try ${attempts > 1 ? 'once more' : 'again'}!`}
            </div>
            {isCorrect && (
              <div style={{ color: '#4B3424', fontSize: '0.85rem', marginTop: 4 }}>
                You can see how each event connects to the next. History is a chain of cause and effect.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
