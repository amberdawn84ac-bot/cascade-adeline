'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WheatStalk } from '@/components/illustrations';
import type { OnboardingData, OnboardingStep } from './types';

const GRADE_OPTIONS = ['K-2', '3-5', '6-8', '9-12'];

const INTEREST_SUGGESTIONS = [
  'Chickens & Poultry', 'Horses', 'Sheep & Wool', 'Goats', 'Rabbits',
  'Gardening', 'Canning & Preservation', 'Greenhouse', 'Soil & Composting',
  'Off-Grid Systems', 'Building & Woodworking', 'Welding & Metalwork',
  'Cooking & Baking', 'Soap & Candle Making', 'Sewing & Textiles',
  'Animals & Zoology', 'Science', 'History', 'Math', 'Art',
  'Music', 'Reading', 'Writing', 'Coding', 'Minecraft',
  'Debate', 'Film Making', 'Nature & Ecology', 'Entrepreneurship',
];

const LEARNING_STYLES = [
  { value: 'hands-on', emoji: '🔨', label: 'Hands-On', desc: 'Learning by doing, building, and experimenting' },
  { value: 'visual', emoji: '👁️', label: 'Visual', desc: 'Learning through diagrams, maps, and pictures' },
  { value: 'auditory', emoji: '🎧', label: 'Auditory', desc: 'Learning by listening and talking ideas through' },
  { value: 'reading-writing', emoji: '📖', label: 'Reading & Writing', desc: 'Learning through books, notes, and written work' },
];

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Meet Adeline",
    content: "Hi! I'm Adeline, your family's learning companion. I help turn everyday activities into real academic credit — from baking bread to building birdhouses.",
    illustration: <WheatStalk size={120} color="#BD6809" />,
  },
  {
    title: "Tell me about your learner",
    fields: [
      { name: 'childName', label: "What's your child's name?", type: 'text' },
      { name: 'gradeLevel', label: 'What grade level?', type: 'grade-selector' },
      { name: 'interests', label: 'What are they passionate about? (pick all that apply)', type: 'tag-input' },
    ],
  },
  {
    title: "How do they learn best?",
    fields: [
      { name: 'learningStyle', label: 'Pick the one that fits most naturally', type: 'learning-style' },
    ],
  },
];

export function WelcomeFlow({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const currentStep = ONBOARDING_STEPS[step];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    const updatedData = { ...data, interests: selectedInterests };
    setData(updatedData);
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(updatedData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(47,71,49,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 600,
        padding: 32,
        background: '#FFFEF7',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          height: 8,
          background: '#E7DAC3',
          borderRadius: 999,
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: '#BD6809' }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 style={{
              fontFamily: '"Emilys Candy", cursive',
              color: '#2F4731',
              fontSize: '2rem',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              {currentStep.title}
            </h2>

            {currentStep.illustration && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                {currentStep.illustration}
              </div>
            )}

            {currentStep.content && (
              <p style={{
                fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                color: '#4B3424',
                fontSize: '1.2rem',
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 1.6,
              }}>
                {currentStep.content}
              </p>
            )}

            {currentStep.fields && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                {currentStep.fields.map((field) => (
                  <div key={field.name}>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontWeight: 600,
                      color: '#2F4731',
                      fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                    }}>
                      {field.label}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={(data[field.name] as string) || ''}
                        onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 12,
                          border: '2px solid #E7DAC3',
                          fontSize: 16,
                          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    )}

                    {field.type === 'grade-selector' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {GRADE_OPTIONS.map((grade) => (
                          <motion.button
                            key={grade}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setData({ ...data, gradeLevel: grade })}
                            style={{
                              flex: 1,
                              padding: '12px 8px',
                              borderRadius: 12,
                              border: data.gradeLevel === grade ? '2px solid #BD6809' : '2px solid #E7DAC3',
                              background: data.gradeLevel === grade ? 'rgba(189,104,9,0.1)' : '#FFF',
                              color: data.gradeLevel === grade ? '#BD6809' : '#4B3424',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                              fontSize: 16,
                            }}
                          >
                            {grade}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {field.type === 'tag-input' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 220, overflowY: 'auto', padding: '4px 2px' }}>
                        {INTEREST_SUGGESTIONS.map((interest) => (
                          <motion.button
                            key={interest}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleInterest(interest)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 999,
                              border: selectedInterests.includes(interest) ? '2px solid #BD6809' : '2px solid #E7DAC3',
                              background: selectedInterests.includes(interest) ? 'rgba(189,104,9,0.15)' : '#FFF',
                              color: selectedInterests.includes(interest) ? '#BD6809' : '#4B3424',
                              cursor: 'pointer',
                              fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                              fontSize: 14,
                            }}
                          >
                            {interest}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {field.type === 'learning-style' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {LEARNING_STYLES.map((style) => {
                          const selected = data.learningStyle === style.value;
                          return (
                            <motion.button
                              key={style.value}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setData({ ...data, learningStyle: style.value })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '14px 18px',
                                borderRadius: 14,
                                border: selected ? '2px solid #BD6809' : '2px solid #E7DAC3',
                                background: selected ? 'rgba(189,104,9,0.08)' : '#FFF',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span style={{ fontSize: 28 }}>{style.emoji}</span>
                              <div>
                                <div style={{ fontWeight: 700, color: selected ? '#BD6809' : '#2F4731', fontFamily: 'Kalam, system-ui', fontSize: 16 }}>{style.label}</div>
                                <div style={{ color: '#7A6650', fontFamily: 'Kalam, system-ui', fontSize: 13, marginTop: 2 }}>{style.desc}</div>
                              </div>
                              {selected && <span style={{ marginLeft: 'auto', color: '#BD6809', fontSize: 20 }}>✓</span>}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: '#BD6809',
                color: '#FFF',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                boxShadow: '0 6px 16px rgba(189,104,9,0.3)',
              }}
            >
              {step < ONBOARDING_STEPS.length - 1 ? 'Next' : "Let's Start Learning!"}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

