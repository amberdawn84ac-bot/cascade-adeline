'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

type BillingInterval = 'monthly' | 'yearly';

const TIERS = [
  {
    id: 'FREE',
    name: 'Free Student',
    price: { monthly: 0, yearly: 0 },
    description: 'Try Adeline with limited features',
    features: [
      '✨ Unlimited chat messages',
      '1 student profile',
      'All learning subjects',
      'Join clubs',
      '❌ No Learning Path',
      '❌ No Daily Journal',
      '❌ No Transcripts',
    ],
    cta: 'Start Free',
    productId: { monthly: null, yearly: null },
    trial: false,
  },
  {
    id: 'STUDENT',
    productId: { monthly: 'STUDENT_MONTHLY', yearly: 'STUDENT_YEARLY' },
    name: 'Student',
    price: { monthly: 2.99, yearly: 32.29 },
    description: 'Full access for one learner',
    features: [
      'Everything in Free, plus:',
      '✅ Learning Path',
      '✅ Daily Journal',
      '📚 Full conversation history',
      '🎯 Personalized curriculum',
      '📈 Progress tracking',
    ],
    cta: 'Start 7-Day Trial',
    popular: true,
    trial: true,
  },
  {
    id: 'PARENT',
    productId: { monthly: 'PARENT_MONTHLY', yearly: 'PARENT_YEARLY' },
    name: 'Parent',
    price: { monthly: 9.99, yearly: 107.89 },
    description: 'For homeschool families',
    features: [
      'Everything in Student, plus:',
      '👨‍👩‍👧 Up to 5 students',
      '📊 Parent dashboard',
      '📄 PDF transcripts',
      '📝 Portfolio builder',
      '+ $2.99/mo per extra student',
    ],
    cta: 'Start 7-Day Trial',
    popular: false,
    trial: true,
  },
  {
    id: 'TEACHER',
    productId: { monthly: 'TEACHER_MONTHLY', yearly: 'TEACHER_YEARLY' },
    name: 'Teacher',
    price: { monthly: 29.99, yearly: 323.89 },
    description: 'For classrooms & co-ops',
    features: [
      'Everything in Parent, plus:',
      '🏫 Up to 40 students',
      '📊 Classroom management',
      '📈 Bulk progress reports',
      '👥 Student grouping',
      '+ $2.99/mo per extra student',
    ],
    cta: 'Start 7-Day Trial',
    popular: false,
    trial: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [checkoutProductId, setCheckoutProductId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleUpgrade = (tier: typeof TIERS[0]) => {
    if (tier.id === 'FREE') {
      router.push('/chat');
      return;
    }
    const productId = typeof tier.productId === 'object' 
      ? tier.productId[billingInterval]
      : tier.productId;
    if (productId) {
      setCheckoutProductId(productId);
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
            Start with a free account or try any paid plan with a 7-day free trial.
          </p>

          {/* Billing Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}>
            <button
              onClick={() => setBillingInterval('monthly')}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: billingInterval === 'monthly' ? '2px solid #BD6809' : '2px solid #E7DAC3',
                background: billingInterval === 'monthly' ? '#BD6809' : '#FFF',
                color: billingInterval === 'monthly' ? '#FFF' : '#2F4731',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: billingInterval === 'yearly' ? '2px solid #BD6809' : '2px solid #E7DAC3',
                background: billingInterval === 'yearly' ? '#BD6809' : '#FFF',
                color: billingInterval === 'yearly' ? '#FFF' : '#2F4731',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              Yearly
              <span style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#2F4731',
                color: '#FFF',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 999,
                fontWeight: 700,
              }}>
                Save 10%
              </span>
            </button>
          </div>
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
                  ${billingInterval === 'monthly' ? tier.price.monthly : tier.price.yearly}
                </span>
                {tier.price.monthly > 0 && (
                  <span style={{ color: '#4B3424', fontSize: '1rem' }}>
                    {billingInterval === 'monthly' ? '/mo' : '/yr'}
                  </span>
                )}
                {billingInterval === 'yearly' && tier.price.yearly > 0 && (
                  <div style={{ fontSize: '0.875rem', color: '#BD6809', fontWeight: 600, marginTop: 4 }}>
                    ${(tier.price.yearly / 12).toFixed(2)}/mo billed annually
                  </div>
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

