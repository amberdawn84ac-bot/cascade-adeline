'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';

export interface ConceptNode {
  id: string;
  label: string;
  isBlank: boolean;
  correctLabel?: string;
  connectedTo?: string[];
  hint?: string;
}

export interface InteractiveConceptMapProps {
  title: string;
  description?: string;
  nodes: ConceptNode[];
  wordBank: string[];
  onComplete?: (score: number, timeMs: number) => void;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const PARADISE = '#9A3F4A';

export function InteractiveConceptMap({
  title,
  description,
  nodes,
  wordBank,
  onComplete,
}: InteractiveConceptMapProps) {
  const [fills, setFills] = useState<Record<string, string>>({});
  const [bank, setBank] = useState<string[]>(wordBank);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState<string | null>(null);

  const blanks = nodes.filter((n) => n.isBlank);

  const handleDragStart = (word: string) => setDraggedWord(word);
  const handleDragEnd = () => setDraggedWord(null);

  const handleDrop = useCallback(
    (nodeId: string) => {
      if (!draggedWord) return;
      const prev = fills[nodeId];
      setFills((f) => ({ ...f, [nodeId]: draggedWord }));
      setBank((b) => {
        const next = b.filter((w) => w !== draggedWord);
        if (prev) next.push(prev);
        return next;
      });
      setDraggedWord(null);
    },
    [draggedWord, fills]
  );

  const handleRemoveFill = (nodeId: string) => {
    const word = fills[nodeId];
    if (!word) return;
    setFills((f) => {
      const next = { ...f };
      delete next[nodeId];
      return next;
    });
    setBank((b) => [...b, word]);
  };

  const handleCheck = () => {
    setChecked(true);
    const correct = blanks.filter(
      (n) => fills[n.id]?.trim().toLowerCase() === n.correctLabel?.trim().toLowerCase()
    ).length;
    const score = Math.round((correct / blanks.length) * 100);
    onComplete?.(score, Date.now() - startTime);
  };

  const handleReset = () => {
    setFills({});
    setBank(wordBank);
    setChecked(false);
    setShowHint(null);
  };

  const allFilled = blanks.every((n) => fills[n.id]);

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
        {description && (
          <div style={{ color: '#4B3424', fontSize: '0.88rem', marginTop: 4, opacity: 0.8 }}>
            {description}
          </div>
        )}
        <div style={{ color: PAPAYA, fontSize: '0.8rem', marginTop: 6, fontStyle: 'italic' }}>
          Drag words from the word bank into the blank nodes to complete the concept map.
        </div>
      </div>

      {/* Concept nodes grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {nodes.map((node) => {
          const filled = fills[node.id];
          const isCorrect = checked && filled?.trim().toLowerCase() === node.correctLabel?.trim().toLowerCase();
          const isWrong = checked && node.isBlank && !isCorrect;

          return (
            <div
              key={node.id}
              onDragOver={(e) => { if (node.isBlank) e.preventDefault(); }}
              onDrop={() => node.isBlank && handleDrop(node.id)}
              onClick={() => node.isBlank && filled && !checked && handleRemoveFill(node.id)}
              aria-label={node.isBlank ? `Blank node: drop a concept here` : `Concept: ${node.label}`}
              style={{
                background: node.isBlank
                  ? filled
                    ? isCorrect
                      ? '#D4EDDA'
                      : isWrong
                      ? '#F8D7DA'
                      : '#FFF9E6'
                    : '#F0E8D8'
                  : '#FFFFFF',
                border: `2px dashed ${
                  node.isBlank
                    ? filled
                      ? isCorrect
                        ? '#28A745'
                        : isWrong
                        ? '#DC3545'
                        : PAPAYA
                      : PAPAYA
                    : PALM
                }`,
                borderRadius: 12,
                padding: '12px 14px',
                minHeight: 64,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: node.isBlank ? (filled ? 'pointer' : 'default') : 'default',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              {node.isBlank ? (
                <>
                  {filled ? (
                    <div style={{ color: PALM, fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                      {filled}
                    </div>
                  ) : (
                    <div style={{ color: PAPAYA, fontSize: '0.8rem', opacity: 0.7, textAlign: 'center' }}>
                      Drop here
                    </div>
                  )}
                  {checked && isCorrect && <CheckCircle size={16} color="#28A745" style={{ marginTop: 4 }} />}
                  {checked && isWrong && (
                    <div style={{ textAlign: 'center' }}>
                      <XCircle size={16} color="#DC3545" style={{ marginTop: 4 }} />
                      <div style={{ color: '#DC3545', fontSize: '0.75rem', marginTop: 2 }}>
                        → {node.correctLabel}
                      </div>
                    </div>
                  )}
                  {node.hint && !checked && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowHint(showHint === node.id ? null : node.id); }}
                      aria-label="Show hint"
                      style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Lightbulb size={14} color={PAPAYA} />
                    </button>
                  )}
                  <AnimatePresence>
                    {showHint === node.id && node.hint && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                          position: 'absolute',
                          bottom: '110%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: PALM,
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: '0.78rem',
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {node.hint}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div style={{ color: PALM, fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                  {node.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Word bank */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: PALM, fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>
          Word Bank
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {bank.map((word) => (
            <div
              key={word}
              draggable
              onDragStart={() => handleDragStart(word)}
              onDragEnd={handleDragEnd}
              tabIndex={0}
              aria-label={`Drag concept: ${word}`}
              style={{
                background: draggedWord === word ? PALM : '#FFFFFF',
                color: draggedWord === word ? '#fff' : PALM,
                border: `2px solid ${PALM}`,
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'grab',
                userSelect: 'none',
                transition: 'all 0.15s',
              }}
            >
              {word}
            </div>
          ))}
          {bank.length === 0 && (
            <div style={{ color: '#4B3424', fontSize: '0.85rem', opacity: 0.6, fontStyle: 'italic' }}>
              All words placed
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={!allFilled}
            aria-label="Check answers"
            style={{
              background: allFilled ? PALM : '#E7DAC3',
              color: allFilled ? '#fff' : '#4B3424',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: allFilled ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            Check Answers
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

      {/* Result summary */}
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 14,
              background: '#F0FFF4',
              border: `1px solid #28A745`,
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div style={{ color: PALM, fontWeight: 700, fontSize: '0.95rem' }}>
              {blanks.filter((n) => fills[n.id]?.trim().toLowerCase() === n.correctLabel?.trim().toLowerCase()).length}
              /{blanks.length} correct
            </div>
            <div style={{ color: '#4B3424', fontSize: '0.85rem', marginTop: 4 }}>
              {blanks.every((n) => fills[n.id]?.trim().toLowerCase() === n.correctLabel?.trim().toLowerCase())
                ? '🌟 Perfect! You completed the concept map!'
                : 'Review the highlighted nodes and try again to strengthen your understanding.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
