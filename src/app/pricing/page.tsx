'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

const TIERS = [
  {
    id: 'FREE',
    name: 'Try It',
    price: { monthly: 0 },
    description: 'Perfect for trying Adeline',
    features: [
      '10 messages per month',
      '1 student profile',
      'All learning intents',
      'Join unlimited clubs',
      'Chat history (7 days)',
    ],
    cta: 'Start Free',
    productId: null,
  },
  {
    id: 'STUDENT',
    productId: 'STUDENT_MONTHLY',
    name: 'Student',
    price: { monthly: 9.99 },
    description: 'Unlimited learning for one',
    features: [
      '✨ Unlimited messages',
      '1 student profile',
      'Create clubs',
      'Full conversation history',
      'Basic highlights',
    ],
    cta: 'Upgrade',
    popular: false,
  },
  {
    id: 'PARENT',
    productId: 'PARENT_MONTHLY',
    name: 'Parent',
    price: { monthly: 14.99 },
    description: 'Track one learner deeply',
    features: [
      'Everything in Student, plus:',
      '📊 Parent dashboard',
      '📁 Portfolio builder',
      'Learning timeline',
      'Weekly progress emails',
    ],
    cta: 'Upgrade',
    popular: false,
  },
  {
    id: 'FAMILY',
    productId: 'FAMILY_MONTHLY',
    name: 'Family',
    price: { monthly: 19.99 },
    description: 'For multi-child families',
    features: [
      'Everything in Parent, plus:',
      '👨‍👩‍👧‍👦 Up to 6 students',
      '📄 PDF transcript exports',
      '✨ Advanced highlights',
      'Priority support',
    ],
    cta: 'Upgrade',
    popular: true,
  },
  {
    id: 'COOP',
    productId: null,
    name: 'Co-op',
    price: { monthly: 49.99 },
    description: 'For classrooms & co-ops',
    features: [
      'Everything in Family, plus:',
      '🏫 Up to 40 students',
      'Classroom management',
      'Bulk progress reports',
      'Dedicated support',
    ],
    cta: 'Contact Us',
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [checkoutProductId, setCheckoutProductId] = useState<string | null>(null);

  const handleUpgrade = (tier: typeof TIERS[0]) => {
    if (tier.id === 'FREE') {
      router.push('/chat');
      return;
    }
    if (tier.id === 'COOP') {
      router.push('mailto:hello@dearadeline.com');
      return;
    }
    if (tier.productId) {
      setCheckoutProductId(tier.productId);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF7', padding: '40px 24px' }}>
      {/* Stripe Embedded Checkout Modal */}
      {checkoutProductId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCheckoutProductId(null); }}
        >
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCheckoutProductId(null)}
              className="absolute top-4 right-4 z-10 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2">
              <CheckoutForm productId={checkoutProductId} />
            </div>
          </div>
        </div>
      )}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontFamily: '"Emilys Candy", cursive',
            fontSize: '3rem',
            color: '#2F4731',
            marginBottom: 16,
          }}>
            Choose Your Plan
          </h1>
          <p style={{
            fontFamily: 'Kalam',
            fontSize: '1.2rem',
            color: '#4B3424',
            marginBottom: 24,
          }}>
            Start free, upgrade anytime. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {TIERS.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              style={{
                background: '#FFFFFF',
                border: tier.popular ? '3px solid #BD6809' : '1px solid #E7DAC3',
                borderRadius: 16,
                padding: 24,
                position: 'relative',
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#BD6809',
                  color: '#FFF',
                  padding: '4px 16px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{
                fontFamily: 'Kranky',
                fontSize: '1.5rem',
                color: '#2F4731',
                marginBottom: 8,
              }}>
                {tier.name}
              </h3>

              <div style={{ marginBottom: 16 }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: '#2F4731',
                }}>
                  ${tier.price.monthly}
                </span>
                {tier.price.monthly > 0 && (
                  <span style={{ color: '#4B3424', fontSize: '1rem' }}>
                    /mo
                  </span>
                )}
              </div>

              <p style={{
                fontFamily: 'Kalam',
                color: '#4B3424',
                marginBottom: 24,
              }}>
                {tier.description}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {tier.features.map((feature, idx) => (
                  <li key={idx} style={{
                    fontFamily: 'Kalam',
                    color: '#121B13',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <span style={{ color: '#BD6809', fontSize: 18 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: tier.popular ? '#BD6809' : '#2F4731',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

