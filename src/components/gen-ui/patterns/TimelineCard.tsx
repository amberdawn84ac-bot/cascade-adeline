'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export interface TimelineCardProps {
  title: string;
  events: Array<{
    date: string;
    title: string;
    description: string;
  }>;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function TimelineCard({ title, events }: TimelineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        padding: '16px 18px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar size={20} color={PAPAYA} />
        <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem' }}>
          {title}
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute',
          left: 8,
          top: 8,
          bottom: 8,
          width: 2,
          background: '#E7DAC3',
        }} />

        <div style={{ display: 'grid', gap: 16 }}>
          {events.map((event, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{ position: 'relative' }}
            >
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: -20,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: PAPAYA,
                border: `2px solid ${CREAM}`,
                boxShadow: '0 0 0 2px #E7DAC3',
              }} />

              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E7DAC3',
                borderRadius: 10,
                padding: '10px 12px',
              }}>
                <div style={{ color: PAPAYA, fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  {event.date}
                </div>
                <div style={{ color: PALM, fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                  {event.title}
                </div>
                <div style={{ color: '#4B3424', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  {event.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
