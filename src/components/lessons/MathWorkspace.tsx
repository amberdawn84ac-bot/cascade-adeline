'use client';

import { useState, useEffect } from 'react';
import { Calculator, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MathVariable {
  name: string;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
}

interface MathWorkspaceProps {
  problem: string;
  variables: MathVariable[];
  formula: string;
  expectedAnswer: number;
  tolerance?: number;
  onCorrect?: () => void;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const EMERALD = '#2F7A54';

export function MathWorkspace({
  problem,
  variables,
  formula,
  expectedAnswer,
  tolerance = 0.01,
  onCorrect,
}: MathWorkspaceProps) {
  const [values, setValues] = useState<Record<string, number>>(
    variables.reduce((acc, v) => ({ ...acc, [v.name]: v.defaultValue }), {})
  );
  const [calculatedResult, setCalculatedResult] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Calculate result whenever variables change
  useEffect(() => {
    try {
      // Replace variable names in formula with actual values
      let evaluableFormula = formula;
      Object.entries(values).forEach(([name, value]) => {
        evaluableFormula = evaluableFormula.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
      });
      
      // Evaluate the formula
      const result = eval(evaluableFormula);
      setCalculatedResult(Math.round(result * 100) / 100);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      setCalculatedResult(0);
    }
  }, [values, formula]);

  const handleVariableChange = (name: string, value: number) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setResult(null); // Reset result when variables change
  };

  const handleCheckAnswer = () => {
    setIsChecking(true);
    setAttempts(prev => prev + 1);

    setTimeout(() => {
      const userValue = parseFloat(userAnswer);
      const isCorrect = Math.abs(userValue - expectedAnswer) <= tolerance;
      
      setResult(isCorrect ? 'correct' : 'incorrect');
      setIsChecking(false);

      if (isCorrect && onCorrect) {
        setTimeout(() => onCorrect(), 1000);
      }
    }, 500);
  };

  const handleReset = () => {
    setValues(variables.reduce((acc, v) => ({ ...acc, [v.name]: v.defaultValue }), {}));
    setUserAnswer('');
    setResult(null);
    setAttempts(0);
  };

  return (
    <div style={{
      background: CREAM,
      border: `2px solid ${PALM}40`,
      borderRadius: 16,
      padding: 20,
    }}>
      {/* Problem Statement */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: `2px solid ${PALM}20`,
      }}>
        <Calculator style={{ width: 24, height: 24, color: PAPAYA }} />
        <h3 style={{
          color: PALM,
          fontWeight: 700,
          fontSize: '1.1rem',
          margin: 0,
        }}>
          Math Workspace
        </h3>
      </div>

      <p style={{
        color: PALM,
        fontSize: '1rem',
        lineHeight: 1.6,
        marginBottom: 20,
        fontWeight: 500,
      }}>
        {problem}
      </p>

      {/* Interactive Variables */}
      <div style={{
        background: '#FFFFFF',
        border: `2px solid ${PALM}20`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <h4 style={{
          color: PALM,
          fontSize: '0.9rem',
          fontWeight: 700,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Adjust Variables
        </h4>

        <div style={{ display: 'grid', gap: 16 }}>
          {variables.map((variable) => (
            <div key={variable.name}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                alignItems: 'center',
              }}>
                <label style={{
                  color: PALM,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}>
                  {variable.label}
                </label>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: PAPAYA,
                }}>
                  {values[variable.name]}{variable.unit || ''}
                </span>
              </div>
              <input
                type="range"
                min={variable.min}
                max={variable.max}
                value={values[variable.name]}
                onChange={(e) => handleVariableChange(variable.name, Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  background: `linear-gradient(to right, ${PAPAYA} 0%, ${PAPAYA} ${((values[variable.name] - variable.min) / (variable.max - variable.min)) * 100}%, #E7DAC3 ${((values[variable.name] - variable.min) / (variable.max - variable.min)) * 100}%, #E7DAC3 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Live Calculation Display */}
      <div style={{
        background: `${PAPAYA}10`,
        border: `2px solid ${PAPAYA}40`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{
            color: PALM,
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Formula
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: PALM,
            opacity: 0.7,
          }}>
            {formula}
          </span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            color: PALM,
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Calculated Result
          </span>
          <motion.span
            key={calculatedResult}
            initial={{ scale: 1.2, color: PAPAYA }}
            animate={{ scale: 1, color: PALM }}
            style={{
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {calculatedResult}
          </motion.span>
        </div>
      </div>

      {/* Answer Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block',
          color: PALM,
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: 8,
        }}>
          Your Final Answer
        </label>
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Enter your answer..."
          disabled={result === 'correct'}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '1.1rem',
            fontFamily: 'monospace',
            fontWeight: 600,
            border: `2px solid ${result === 'correct' ? EMERALD : result === 'incorrect' ? '#DC2626' : PALM}40`,
            borderRadius: 8,
            outline: 'none',
            background: result === 'correct' ? `${EMERALD}10` : '#FFFFFF',
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleCheckAnswer}
          disabled={!userAnswer || isChecking || result === 'correct'}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: result === 'correct' ? EMERALD : PAPAYA,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.95rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: !userAnswer || isChecking || result === 'correct' ? 'not-allowed' : 'pointer',
            opacity: !userAnswer || isChecking || result === 'correct' ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isChecking ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} />
              </motion.div>
              Checking...
            </>
          ) : result === 'correct' ? (
            <>
              <CheckCircle style={{ width: 16, height: 16 }} />
              Correct!
            </>
          ) : (
            'Check Answer'
          )}
        </button>

        {attempts > 0 && (
          <button
            onClick={handleReset}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              color: PALM,
              border: `2px solid ${PALM}40`,
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Reset
          </button>
        )}
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginTop: 16,
              padding: 12,
              background: result === 'correct' ? `${EMERALD}20` : '#FEE2E2',
              border: `2px solid ${result === 'correct' ? EMERALD : '#DC2626'}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {result === 'correct' ? (
              <>
                <CheckCircle style={{ width: 20, height: 20, color: EMERALD }} />
                <span style={{ color: EMERALD, fontWeight: 600, fontSize: '0.9rem' }}>
                  Perfect! You've mastered this problem.
                </span>
              </>
            ) : (
              <>
                <XCircle style={{ width: 20, height: 20, color: '#DC2626' }} />
                <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>
                  Not quite. Try adjusting the variables and recalculating. Expected: {expectedAnswer}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attempt Counter */}
      {attempts > 0 && (
        <div style={{
          marginTop: 12,
          textAlign: 'center',
          color: `${PALM}60`,
          fontSize: '0.8rem',
        }}>
          Attempts: {attempts}
        </div>
      )}
    </div>
  );
}
