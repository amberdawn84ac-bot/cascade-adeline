'use client';

import { motion } from 'framer-motion';

export interface BarChartCardProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function BarChartCard({ title, data, xAxisLabel, yAxisLabel }: BarChartCardProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

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
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
        {title}
      </div>
      {yAxisLabel && (
        <div style={{ color: '#4B3424', fontSize: '0.85rem', marginBottom: 12, opacity: 0.7 }}>
          {yAxisLabel}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {data.map((item, idx) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ color: PALM, fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</span>
                <span style={{ color: PAPAYA, fontWeight: 700, fontSize: '0.95rem' }}>{item.value}</span>
              </div>
              <div style={{ background: '#E7DAC3', height: 24, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  style={{
                    background: `linear-gradient(90deg, ${PAPAYA} 0%, #D4580A 100%)`,
                    height: '100%',
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {xAxisLabel && (
        <div style={{ color: '#4B3424', fontSize: '0.85rem', marginTop: 12, textAlign: 'center', opacity: 0.7 }}>
          {xAxisLabel}
        </div>
      )}
    </motion.div>
  );
}
