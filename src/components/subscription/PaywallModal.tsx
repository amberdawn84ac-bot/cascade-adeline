'use client';

import { motion } from 'framer-motion';
import { WheatStalk } from '@/components/illustrations';

type Props = {
  open: boolean;
  onClose: () => void;
  remaining: number;
  limit: number;
};

export function PaywallModal({ open, onClose, remaining, limit }: Props) {
  if (!open) return null;

  const handleUpgrade = (tier: string) => {
    window.location.href = `/pricing?tier=${tier}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(47,71,49,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFEF7',
          borderRadius: 24,
          padding: 40,
          maxWidth: 500,
          textAlign: 'center',
        }}
      >
        <WheatStalk size={80} color="#BD6809" />

        <h2 style={{
          fontFamily: 'Kranky',
          fontSize: '2rem',
          color: '#2F4731',
          marginTop: 16,
          marginBottom: 8,
        }}>
          You&apos;ve Used All {limit} Free Messages
        </h2>

        <p style={{
          fontFamily: 'Kalam',
          color: '#4B3424',
          fontSize: '1.1rem',
          marginBottom: 32,
        }}>
          Upgrade to continue your learning journey with unlimited messages!
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <button
            onClick={() => handleUpgrade('STUDENT')}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#BD6809',
              color: '#FFF',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            Upgrade for $2.99/mo →
          </button>

          <button
            onClick={() => handleUpgrade('FAMILY')}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: '2px solid #2F4731',
              background: 'transparent',
              color: '#2F4731',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            See All Plans
          </button>

          <button
            onClick={onClose}
            style={{
              marginTop: 8,
              padding: '8px',
              background: 'none',
              border: 'none',
              color: '#4B3424',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
