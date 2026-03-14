"use client";

import { useState, useEffect, useCallback } from 'react';
import { Brain, CheckCircle, RefreshCw, ChevronRight } from 'lucide-react';

interface DueReview {
  reviewId: string;
  conceptId: string;
  conceptName: string;
  conceptDescription: string;
  subjectArea: string;
  interval: number;
  repetitions: number;
  overdueDays: number;
}

type ReviewPhase = 'idle' | 'showing' | 'rating' | 'done';

const QUALITY_LABELS = [
  { value: 0, label: 'Blank', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 2, label: 'Wrong', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 3, label: 'Hard', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 4, label: 'Good', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 5, label: 'Easy', color: 'bg-green-100 text-green-700 border-green-200' },
];

export function SpacedRepWidget() {
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>('idle');
  const [loading, setLoading] = useState(true);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const fetchDue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) return;
      const data = await res.json();
      setDueReviews(data.reviews ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDue(); }, [fetchDue]);

  const current = dueReviews[currentIdx];

  const startReview = () => {
    if (!dueReviews.length) return;
    setCurrentIdx(0);
    setPhase('showing');
    setCreditsEarned(0);
    setReviewed(0);
  };

  const revealAnswer = () => setPhase('rating');

  const submitRating = async (quality: number) => {
    if (!current) return;

    // Record the review result
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId: current.conceptId, quality }),
    }).catch(console.error);

    // Award microcredits
    const creditRes = await fetch('/api/arcade/award-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'review',
        result: { conceptName: current.conceptName, quality },
      }),
    }).catch(() => null);

    if (creditRes?.ok) {
      const { creditsEarned: earned } = await creditRes.json().catch(() => ({ creditsEarned: 0 }));
      setCreditsEarned(prev => prev + (earned ?? 0));
    }

    setReviewed(prev => prev + 1);
    const next = currentIdx + 1;
    if (next < dueReviews.length) {
      setCurrentIdx(next);
      setPhase('showing');
    } else {
      setPhase('done');
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#FFFEF7', border: '1px solid #E7DAC3', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2F4731', fontSize: 13, fontWeight: 700 }}>
          <Brain size={15} /> Memory Review
        </div>
        <p style={{ color: '#2F4731', opacity: 0.4, fontSize: 12, marginTop: 8 }}>Loading…</p>
      </div>
    );
  }

  if (!dueReviews.length) {
    return (
      <div style={{ background: '#FFFEF7', border: '1px solid #E7DAC3', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2F4731', fontSize: 13, fontWeight: 700 }}>
          <Brain size={15} /> Memory Review
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: '#2F4731', fontSize: 12 }}>
          <CheckCircle size={13} className="text-green-500" style={{ color: '#22c55e' }} />
          <span style={{ opacity: 0.7 }}>Nothing due — all caught up! 🌿</span>
        </div>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div style={{ background: '#FFFEF7', border: '1px solid #E7DAC3', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2F4731', fontSize: 13, fontWeight: 700 }}>
            <Brain size={15} /> Memory Review
          </div>
          <span style={{
            background: '#BD6809', color: '#fff', borderRadius: 20,
            padding: '2px 8px', fontSize: 11, fontWeight: 700,
          }}>{dueReviews.length} due</span>
        </div>
        <p style={{ color: '#2F4731', opacity: 0.65, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
          Concepts due for spaced-repetition review. Each recall earns microcredits.
        </p>
        <button
          onClick={startReview}
          style={{
            marginTop: 10, width: '100%', background: '#2F4731', color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px 12px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          Review Now <ChevronRight size={13} />
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div style={{ background: '#FFFEF7', border: '1px solid #E7DAC3', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2F4731', fontSize: 13, fontWeight: 700 }}>
          <Brain size={15} /> Memory Review
        </div>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 22 }}>🎉</div>
          <p style={{ color: '#2F4731', fontWeight: 700, fontSize: 13, marginTop: 4 }}>
            {reviewed} concepts reviewed!
          </p>
          <p style={{ color: '#BD6809', fontWeight: 700, fontSize: 12 }}>
            +{creditsEarned.toFixed(3)} microcredits earned
          </p>
        </div>
        <button
          onClick={() => { fetchDue(); setPhase('idle'); }}
          style={{
            marginTop: 4, width: '100%', background: '#E7DAC3', color: '#2F4731',
            border: 'none', borderRadius: 10, padding: '7px 12px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFEF7', border: '1px solid #E7DAC3', borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2F4731', fontSize: 13, fontWeight: 700 }}>
          <Brain size={15} /> Memory Review
        </div>
        <span style={{ color: '#2F4731', opacity: 0.5, fontSize: 11 }}>
          {currentIdx + 1} / {dueReviews.length}
        </span>
      </div>

      {/* Concept card */}
      <div style={{
        background: '#fff', border: '1px solid #E7DAC3', borderRadius: 12,
        padding: '12px 14px', marginBottom: 10,
      }}>
        <p style={{ color: '#2F4731', fontWeight: 700, fontSize: 13, margin: 0 }}>
          {current?.conceptName}
          {current?.overdueDays > 0 && (
            <span style={{ color: '#BD6809', fontSize: 10, marginLeft: 6 }}>
              {Math.round(current.overdueDays)}d overdue
            </span>
          )}
        </p>
        {phase === 'rating' && current?.conceptDescription && (
          <p style={{ color: '#2F4731', opacity: 0.7, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            {current.conceptDescription}
          </p>
        )}
      </div>

      {phase === 'showing' ? (
        <button
          onClick={revealAnswer}
          style={{
            width: '100%', background: '#BD6809', color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px 12px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          How well did you remember?
        </button>
      ) : (
        <div>
          <p style={{ color: '#2F4731', opacity: 0.6, fontSize: 11, marginBottom: 6, textAlign: 'center' }}>
            Rate your recall:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {QUALITY_LABELS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => submitRating(value)}
                className={`border rounded-lg py-1 text-xs font-bold cursor-pointer transition-opacity hover:opacity-80 ${color}`}
                style={{ border: '1px solid', padding: '4px 2px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
