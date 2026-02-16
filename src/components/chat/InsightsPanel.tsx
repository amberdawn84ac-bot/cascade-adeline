'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Telescope, WheatStalk } from '@/components/illustrations';

type InsightsData = {
  messageCount: number;
  totalCredits: number;
  creditsBySubject: Record<string, number>;
  reflectionCount: number;
  streak: number;
  topConcepts: Array<{ name: string; subject: string; mastery: number }>;
  subjectCount: number;
};

export function InsightsPanel() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      setInsights(data);
    } catch {
      // API may not be available
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#4B3424' }}>
        Gathering insights...
      </div>
    );
  }

  if (!insights) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Telescope size={80} color="#BD6809" />
        <p style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#4B3424', marginTop: 16 }}>
          Start learning to see your insights here!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: '"Emilys Candy", cursive', color: '#2F4731', marginBottom: 24, fontSize: '1.5rem' }}>
        Learning Insights
      </h2>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Messages" value={insights.messageCount} icon="💬" color="#2F4731" />
        <StatCard label="Credits" value={insights.totalCredits} icon="📜" color="#BD6809" />
        <StatCard label="Reflections" value={insights.reflectionCount} icon="💭" color="#9A3F4A" />
        <StatCard label="Day Streak" value={insights.streak} icon="🔥" color="#BD6809" />
        <StatCard label="Subjects" value={insights.subjectCount} icon="📚" color="#2F4731" />
      </div>

      {/* Credits by Subject */}
      {Object.keys(insights.creditsBySubject).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: '"Emilys Candy", cursive', color: '#2F4731', marginBottom: 12 }}>
            Credits by Subject
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(insights.creditsBySubject)
              .sort(([, a], [, b]) => b - a)
              .map(([subject, credits]) => {
                const maxCredits = Math.max(...Object.values(insights.creditsBySubject));
                const pct = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;
                return (
                  <div key={subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#121B13', fontSize: 14 }}>
                        {subject}
                      </span>
                      <span style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#BD6809', fontWeight: 700, fontSize: 14 }}>
                        {credits}
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#E7DAC3', borderRadius: 999, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: '#BD6809', borderRadius: 999 }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Top Concepts */}
      {insights.topConcepts.length > 0 && (
        <div>
          <h3 style={{ fontFamily: '"Emilys Candy", cursive', color: '#2F4731', marginBottom: 12 }}>
            Top Concepts
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {insights.topConcepts.map((concept) => (
              <motion.div
                key={concept.name}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: concept.mastery >= 70 ? 'rgba(47,71,49,0.1)' : 'rgba(189,104,9,0.1)',
                  border: `1px solid ${concept.mastery >= 70 ? '#2F4731' : '#BD6809'}40`,
                  fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                  fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 700, color: '#121B13' }}>{concept.name}</div>
                <div style={{ fontSize: 12, color: '#4B3424' }}>
                  {concept.mastery}% mastery
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {insights.messageCount === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <WheatStalk size={80} color="#BD6809" />
          <p style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#4B3424', marginTop: 16 }}>
            Your learning journey is just beginning! Start chatting to see insights.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{
        background: '#FFFEF7',
        border: `1px solid ${color}30`,
        borderRadius: 16,
        padding: 16,
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#4B3424', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>
        {label}
      </div>
    </motion.div>
  );
}
