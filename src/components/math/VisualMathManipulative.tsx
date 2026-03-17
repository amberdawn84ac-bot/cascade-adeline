'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

export interface MathVariable {
  name: string;
  min: number;
  max: number;
  value: number;
  label?: string;
}

export interface VisualMathProps {
  wordProblem: string;
  formula: string;
  variables: MathVariable[];
  targetAnswer: number;
  problemType: 'area' | 'perimeter' | 'fraction' | 'division' | 'multiplication' | 'generic';
  onCorrect?: () => void;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const EMERALD = '#2F7A54';

export function VisualMathManipulative({
  wordProblem,
  formula,
  variables: initialVariables,
  targetAnswer,
  problemType,
  onCorrect,
}: VisualMathProps) {
  const [variables, setVariables] = useState<MathVariable[]>(initialVariables);
  const [currentAnswer, setCurrentAnswer] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Calculate current answer based on problem type
  useEffect(() => {
    let answer = 0;
    const varMap = variables.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {} as Record<string, number>);

    switch (problemType) {
      case 'area':
        answer = (varMap.width || 0) * (varMap.height || 0);
        break;
      case 'perimeter':
        answer = 2 * ((varMap.width || 0) + (varMap.height || 0));
        break;
      case 'fraction':
        answer = (varMap.numerator || 0) / (varMap.denominator || 1);
        break;
      case 'division':
        answer = (varMap.dividend || 0) / (varMap.divisor || 1);
        break;
      case 'multiplication':
        answer = (varMap.factor1 || 0) * (varMap.factor2 || 0);
        break;
      default:
        // Generic: try to evaluate formula
        try {
          const formulaWithValues = formula.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
            return varMap[match]?.toString() || match;
          });
          answer = eval(formulaWithValues);
        } catch {
          answer = 0;
        }
    }

    setCurrentAnswer(Math.round(answer * 100) / 100);
    
    // Check if correct
    const tolerance = 0.01;
    const correct = Math.abs(answer - targetAnswer) < tolerance;
    setIsCorrect(correct);
    
    if (correct && hasAttempted && onCorrect) {
      onCorrect();
    }
  }, [variables, problemType, formula, targetAnswer, hasAttempted, onCorrect]);

  const handleVariableChange = (name: string, value: number) => {
    setHasAttempted(true);
    setVariables(prev => prev.map(v => v.name === name ? { ...v, value } : v));
  };

  const renderVisual = () => {
    const varMap = variables.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {} as Record<string, number>);

    switch (problemType) {
      case 'area':
      case 'perimeter':
        return <AreaPerimeterVisual width={varMap.width || 5} height={varMap.height || 5} type={problemType} />;
      
      case 'fraction':
        return <FractionVisual numerator={varMap.numerator || 1} denominator={varMap.denominator || 4} />;
      
      case 'division':
        return <DivisionVisual dividend={varMap.dividend || 12} divisor={varMap.divisor || 3} />;
      
      case 'multiplication':
        return <MultiplicationVisual factor1={varMap.factor1 || 3} factor2={varMap.factor2 || 4} />;
      
      default:
        return <GenericVisual variables={variables} />;
    }
  };

  return (
    <div style={{ background: CREAM, border: `2px solid ${PALM}40`, borderRadius: 16, padding: 20 }}>
      {/* Word Problem */}
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, lineHeight: 1.5 }}>
        {wordProblem}
      </div>

      {/* Visual Canvas */}
      <div style={{ 
        background: '#FFFFFF', 
        border: '2px solid #E7DAC3', 
        borderRadius: 12, 
        padding: 24,
        marginBottom: 20,
        minHeight: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {renderVisual()}
      </div>

      {/* Interactive Sliders */}
      <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
        {variables.map((variable) => (
          <div key={variable.name}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 8,
              color: PALM,
              fontWeight: 600,
            }}>
              <span>{variable.label || variable.name}</span>
              <span style={{ fontFamily: 'monospace', color: PAPAYA }}>{variable.value}</span>
            </div>
            <input
              type="range"
              min={variable.min}
              max={variable.max}
              value={variable.value}
              onChange={(e) => handleVariableChange(variable.name, Number(e.target.value))}
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(to right, ${PAPAYA} 0%, ${PAPAYA} ${((variable.value - variable.min) / (variable.max - variable.min)) * 100}%, #E7DAC3 ${((variable.value - variable.min) / (variable.max - variable.min)) * 100}%, #E7DAC3 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
        ))}
      </div>

      {/* Formula Display */}
      <div style={{
        background: '#F5F5F0',
        border: '1px solid #E7DAC3',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontFamily: 'monospace',
        fontSize: '1rem',
        color: PALM,
        textAlign: 'center',
      }}>
        {formula}
      </div>

      {/* Answer Check */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: isCorrect 
            ? `linear-gradient(135deg, ${EMERALD}20 0%, ${EMERALD}10 100%)`
            : hasAttempted 
              ? '#FEF3E7'
              : '#F5F5F0',
          border: `2px solid ${isCorrect ? EMERALD : hasAttempted ? PAPAYA : '#E7DAC3'}`,
          borderRadius: 12,
          padding: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 8,
          marginBottom: 8,
        }}>
          {isCorrect ? (
            <CheckCircle style={{ color: EMERALD, width: 24, height: 24 }} />
          ) : hasAttempted ? (
            <XCircle style={{ color: PAPAYA, width: 24, height: 24 }} />
          ) : null}
          <span style={{ 
            color: isCorrect ? EMERALD : PALM, 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: 1,
          }}>
            {isCorrect ? 'Correct!' : 'Your Answer'}
          </span>
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '1.5rem',
          color: PALM,
          fontWeight: 700,
        }}>
          {currentAnswer}
        </div>
        {isCorrect && (
          <div style={{ 
            color: EMERALD, 
            fontSize: '0.9rem', 
            marginTop: 8,
            fontWeight: 600,
          }}>
            You found the answer using the visual manipulative!
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Visual Components for Different Problem Types

function AreaPerimeterVisual({ width, height, type }: { width: number; height: number; type: 'area' | 'perimeter' }) {
  const scale = 20; // pixels per unit
  const maxDimension = 300;
  const displayWidth = Math.min(width * scale, maxDimension);
  const displayHeight = Math.min(height * scale, maxDimension);

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        animate={{ width: displayWidth, height: displayHeight }}
        transition={{ type: 'spring', stiffness: 100 }}
        style={{
          background: type === 'area' 
            ? `repeating-linear-gradient(45deg, ${PAPAYA}30, ${PAPAYA}30 10px, ${PAPAYA}20 10px, ${PAPAYA}20 20px)`
            : `${PAPAYA}20`,
          border: `3px solid ${PAPAYA}`,
          borderRadius: 8,
          position: 'relative',
        }}
      >
        {/* Dimension Labels */}
        <div style={{
          position: 'absolute',
          top: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          color: PALM,
          fontWeight: 700,
          fontSize: '0.9rem',
        }}>
          {width}
        </div>
        <div style={{
          position: 'absolute',
          right: -40,
          top: '50%',
          transform: 'translateY(-50%)',
          color: PALM,
          fontWeight: 700,
          fontSize: '0.9rem',
        }}>
          {height}
        </div>
      </motion.div>
    </div>
  );
}

function FractionVisual({ numerator, denominator }: { numerator: number; denominator: number }) {
  const filled = Math.min(numerator, denominator);
  
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 400 }}>
      {Array.from({ length: denominator }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          style={{
            width: 60,
            height: 60,
            background: i < filled ? PAPAYA : '#E7DAC3',
            border: `2px solid ${PALM}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          {i < filled ? '✓' : ''}
        </motion.div>
      ))}
    </div>
  );
}

function DivisionVisual({ dividend, divisor }: { dividend: number; divisor: number }) {
  const groups = divisor;
  const itemsPerGroup = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {Array.from({ length: groups }).map((_, groupIdx) => (
        <div key={groupIdx} style={{
          background: '#F5F5F0',
          border: `2px dashed ${PAPAYA}`,
          borderRadius: 8,
          padding: 8,
          minWidth: 80,
        }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: itemsPerGroup }).map((_, itemIdx) => (
              <motion.div
                key={itemIdx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (groupIdx * itemsPerGroup + itemIdx) * 0.02 }}
                style={{
                  width: 20,
                  height: 20,
                  background: PAPAYA,
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
        </div>
      ))}
      {remainder > 0 && (
        <div style={{
          background: '#FEF3E7',
          border: `2px dashed ${PALM}40`,
          borderRadius: 8,
          padding: 8,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: remainder }).map((_, i) => (
              <div key={i} style={{
                width: 20,
                height: 20,
                background: `${PALM}40`,
                borderRadius: '50%',
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiplicationVisual({ factor1, factor2 }: { factor1: number; factor2: number }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {Array.from({ length: factor2 }).map((_, row) => (
        <div key={row} style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: factor1 }).map((_, col) => (
            <motion.div
              key={col}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (row * factor1 + col) * 0.02 }}
              style={{
                width: 24,
                height: 24,
                background: PAPAYA,
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function GenericVisual({ variables }: { variables: MathVariable[] }) {
  return (
    <div style={{ textAlign: 'center', color: PALM }}>
      <div style={{ fontSize: '0.9rem', marginBottom: 12, opacity: 0.7 }}>
        Adjust the sliders to find the answer
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {variables.map((v) => (
          <div key={v.name} style={{
            background: `${PAPAYA}20`,
            border: `2px solid ${PAPAYA}`,
            borderRadius: 8,
            padding: 12,
            minWidth: 80,
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 4 }}>
              {v.label || v.name}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {v.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
