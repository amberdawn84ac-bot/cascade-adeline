'use client';

import { IllustratedRecipeData, RecipeIngredient, RecipeStep } from '@/types/lesson';

type Props = IllustratedRecipeData;

export function IllustratedRecipeCard({ title, steps = [], ingredients = }: Props) {
  return (
    <div
      style={{
        backgroundColor: '#FFFEF7',
        borderRadius: '16px',
        overflow: 'hidden',
        color: '#121B13',
        fontFamily: "'Swanky and Moo Moo', Georgia, serif",
      }}
    >
      {/* Title band */}
      <div
        style={{
          backgroundColor: '#9A3F4A',
          padding: '20px 24px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#FFFEF7',
            opacity: 0.75,
            marginBottom: '6px',
            fontFamily: 'Georgia, serif',
          }}
        >
          Illustrated Recipe
        </div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#FFFEF7',
            margin: 0,
            fontFamily: "'Permanent Marker', Georgia, serif",
          }}
        >
          {title}
        </h2>
      </div>

      {/* Ingredients grid */}
      {ingredients.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#9A3F4A',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
              fontFamily: 'Georgia, serif',
            }}
          >
            Ingredients
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '8px',
            }}
          >
            {ingredients.map((ing: RecipeIngredient, i: number) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#fff',
                  border: '1.5px solid #9A3F4A',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {ing.icon && (
                  <span style={{ fontSize: '18px' }}>{ing.icon}</span>
                )}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#121B13' }}>
                    {ing.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9A3F4A' }}>{ing.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#2F4731',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: 'Georgia, serif',
          }}
        >
          Steps
        </div>
        {steps.map((s: RecipeStep, i: number) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '14px',
              backgroundColor: '#fff',
              border: '1.5px solid #2F4731',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            {/* Step number bubble */}
            <div
              style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#2F4731',
                color: '#FFFEF7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '16px',
              }}
            >
              {s.step}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#121B13',
                  marginBottom: '4px',
                }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: '13px', color: '#121B13', lineHeight: 1.6 }}>
                {s.instruction}
              </div>
              {s.visual && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#BD6809',
                    fontStyle: 'italic',
                  }}
                >
                  {s.visual}
                </div>
              )}
              {s.tip && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    backgroundColor: '#BD680915',
                    borderLeft: '3px solid #BD6809',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '12px',
                    color: '#BD6809',
                    fontWeight: '600',
                  }}
                >
                  Tip: {s.tip}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
