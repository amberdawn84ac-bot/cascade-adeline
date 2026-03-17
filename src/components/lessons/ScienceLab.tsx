'use client';

import { useState } from 'react';
import { FlaskConical, Plus, Minus, RotateCcw, Beaker, Thermometer, Droplet } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScienceVariable {
  name: string;
  label: string;
  icon?: 'plus' | 'minus' | 'heat' | 'cool' | 'add' | 'remove';
  effect: number; // How much this changes the state
}

interface ScienceLabProps {
  concept: string;
  description: string;
  variables: ScienceVariable[];
  visualType: 'ph-scale' | 'temperature' | 'concentration' | 'growth';
  initialValue: number;
  minValue: number;
  maxValue: number;
  optimalRange?: [number, number];
  labels?: { [key: number]: string };
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const EMERALD = '#2F7A54';

export function ScienceLab({
  concept,
  description,
  variables,
  visualType,
  initialValue,
  minValue,
  maxValue,
  optimalRange,
  labels = {},
}: ScienceLabProps) {
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [history, setHistory] = useState<number[]>([initialValue]);

  const handleVariableClick = (effect: number) => {
    setCurrentValue(prev => {
      const newValue = Math.max(minValue, Math.min(maxValue, prev + effect));
      setHistory(h => [...h, newValue]);
      return newValue;
    });
  };

  const handleReset = () => {
    setCurrentValue(initialValue);
    setHistory([initialValue]);
  };

  const getColor = (value: number) => {
    if (visualType === 'ph-scale') {
      // pH scale: 0-6 acidic (red), 7 neutral (green), 8-14 basic (blue)
      if (value < 4) return '#DC2626'; // Strong acid - red
      if (value < 7) return '#F59E0B'; // Weak acid - orange
      if (value === 7) return EMERALD; // Neutral - green
      if (value < 11) return '#3B82F6'; // Weak base - blue
      return '#6366F1'; // Strong base - indigo
    } else if (visualType === 'temperature') {
      // Temperature scale
      const percent = (value - minValue) / (maxValue - minValue);
      if (percent < 0.33) return '#3B82F6'; // Cold - blue
      if (percent < 0.66) return EMERALD; // Moderate - green
      return '#DC2626'; // Hot - red
    } else if (visualType === 'concentration') {
      // Concentration scale
      const percent = (value - minValue) / (maxValue - minValue);
      return `rgba(189, 104, 9, ${0.2 + percent * 0.8})`; // Papaya with varying opacity
    } else {
      // Growth scale
      return EMERALD;
    }
  };

  const getLabel = (value: number) => {
    if (labels[value]) return labels[value];
    if (visualType === 'ph-scale') {
      if (value < 7) return 'Acidic';
      if (value === 7) return 'Neutral';
      return 'Basic';
    }
    return value.toString();
  };

  const isInOptimalRange = optimalRange 
    ? currentValue >= optimalRange[0] && currentValue <= optimalRange[1]
    : false;

  const getVariableIcon = (iconType?: string) => {
    switch (iconType) {
      case 'plus':
        return <Plus style={{ width: 16, height: 16 }} />;
      case 'minus':
        return <Minus style={{ width: 16, height: 16 }} />;
      case 'heat':
        return <Thermometer style={{ width: 16, height: 16 }} />;
      case 'cool':
        return <Droplet style={{ width: 16, height: 16 }} />;
      case 'add':
        return <Beaker style={{ width: 16, height: 16 }} />;
      default:
        return <Plus style={{ width: 16, height: 16 }} />;
    }
  };

  return (
    <div style={{
      background: CREAM,
      border: `2px solid ${PALM}40`,
      borderRadius: 16,
      padding: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: `2px solid ${PALM}20`,
      }}>
        <FlaskConical style={{ width: 24, height: 24, color: PAPAYA }} />
        <h3 style={{
          color: PALM,
          fontWeight: 700,
          fontSize: '1.1rem',
          margin: 0,
        }}>
          Science Lab: {concept}
        </h3>
      </div>

      {/* Description */}
      <p style={{
        color: PALM,
        fontSize: '0.95rem',
        lineHeight: 1.6,
        marginBottom: 20,
      }}>
        {description}
      </p>

      {/* Visual Display */}
      <div style={{
        background: '#FFFFFF',
        border: `2px solid ${PALM}20`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
      }}>
        {/* Scale/Meter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: '0.85rem',
            color: `${PALM}60`,
            fontWeight: 600,
          }}>
            <span>{minValue}</span>
            <span style={{ color: PALM, fontSize: '1.1rem', fontWeight: 700 }}>
              {getLabel(currentValue)}
            </span>
            <span>{maxValue}</span>
          </div>

          {/* Visual Bar */}
          <div style={{
            height: 40,
            background: '#E7DAC3',
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
            border: `2px solid ${PALM}20`,
          }}>
            <motion.div
              animate={{
                width: `${((currentValue - minValue) / (maxValue - minValue)) * 100}%`,
                background: getColor(currentValue),
              }}
              transition={{ type: 'spring', stiffness: 100 }}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 12,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                style={{
                  width: 24,
                  height: 24,
                  background: '#FFFFFF',
                  borderRadius: '50%',
                  border: `3px solid ${getColor(currentValue)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
            </motion.div>

            {/* Optimal Range Indicator */}
            {optimalRange && (
              <div style={{
                position: 'absolute',
                left: `${((optimalRange[0] - minValue) / (maxValue - minValue)) * 100}%`,
                width: `${((optimalRange[1] - optimalRange[0]) / (maxValue - minValue)) * 100}%`,
                height: '100%',
                background: `${EMERALD}20`,
                border: `2px dashed ${EMERALD}`,
                top: 0,
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Current Value Display */}
          <div style={{
            marginTop: 12,
            textAlign: 'center',
            padding: 12,
            background: isInOptimalRange ? `${EMERALD}10` : `${PAPAYA}10`,
            border: `2px solid ${isInOptimalRange ? EMERALD : PAPAYA}40`,
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: `${PALM}60`,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
            }}>
              Current Value
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: getColor(currentValue),
              fontFamily: 'monospace',
            }}>
              {currentValue}
            </div>
            {isInOptimalRange && (
              <div style={{
                fontSize: '0.8rem',
                color: EMERALD,
                fontWeight: 600,
                marginTop: 4,
              }}>
                ✓ Optimal Range
              </div>
            )}
          </div>
        </div>

        {/* pH Scale Reference (if applicable) */}
        {visualType === 'ph-scale' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginTop: 16,
            fontSize: '0.75rem',
          }}>
            <div style={{ textAlign: 'center', padding: 8, background: '#FEE2E2', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: '#DC2626' }}>0-6</div>
              <div style={{ color: PALM, opacity: 0.7 }}>Acidic</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8, background: `${EMERALD}20`, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: EMERALD }}>7</div>
              <div style={{ color: PALM, opacity: 0.7 }}>Neutral</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8, background: '#DBEAFE', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: '#3B82F6' }}>8-14</div>
              <div style={{ color: PALM, opacity: 0.7 }}>Basic</div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        {variables.map((variable, index) => (
          <button
            key={index}
            onClick={() => handleVariableClick(variable.effect)}
            disabled={
              (variable.effect > 0 && currentValue >= maxValue) ||
              (variable.effect < 0 && currentValue <= minValue)
            }
            style={{
              padding: '12px 16px',
              background: variable.effect > 0 ? PAPAYA : '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 
                (variable.effect > 0 && currentValue >= maxValue) ||
                (variable.effect < 0 && currentValue <= minValue)
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                (variable.effect > 0 && currentValue >= maxValue) ||
                (variable.effect < 0 && currentValue <= minValue)
                  ? 0.5
                  : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {getVariableIcon(variable.icon)}
            {variable.label}
          </button>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          color: PALM,
          border: `2px solid ${PALM}40`,
          borderRadius: 8,
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <RotateCcw style={{ width: 16, height: 16 }} />
        Reset Experiment
      </button>

      {/* Experiment History */}
      {history.length > 1 && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#F5F5F0',
          borderRadius: 8,
          fontSize: '0.8rem',
          color: `${PALM}60`,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Experiment History:</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {history.map((value, index) => (
              <span
                key={index}
                style={{
                  padding: '2px 8px',
                  background: getColor(value),
                  color: '#FFFFFF',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
