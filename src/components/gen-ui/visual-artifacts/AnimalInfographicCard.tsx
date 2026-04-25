'use client';

import { AnimalInfographicData } from '@/types/lesson';

type Props = AnimalInfographicData;

export function AnimalInfographicCard({
  animal,
  heroFact,
  stats = {},
  sections = [],
  funFacts = [],
}: Props) {
  const statEntries = Object.entries(stats);

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
      {/* Hero banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2F4731 0%, #3a5c3d 100%)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#BD6809',
            marginBottom: '6px',
            fontFamily: 'Georgia, serif',
          }}
        >
          Animal Infographic
        </div>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#FFFEF7',
            margin: '0 0 8px',
            fontFamily: "'Permanent Marker', Georgia, serif",
          }}
        >
          {animal}
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#BD6809',
            margin: 0,
            fontStyle: 'italic',
            fontWeight: '600',
          }}
        >
          {heroFact}
        </p>
      </div>

      {/* Stats row */}
      {statEntries.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1px',
            backgroundColor: '#2F4731',
            borderBottom: '2px solid #2F4731',
          }}
        >
          {statEntries.map(([key, value], i) => (
            <div
              key={i}
              style={{
                flex: '1 1 100px',
                backgroundColor: '#FFFEF7',
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#9A3F4A',
                  marginBottom: '4px',
                  fontFamily: 'Georgia, serif',
                  fontWeight: '600',
                }}
              >
                {key}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#121B13',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#fff',
              border: '1.5px solid #2F4731',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#BD6809',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {section.icon && <span>{section.icon}</span>}
              {section.header}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
              {section.content.map((item, j) => (
                <li key={j} style={{ fontSize: '14px', color: '#121B13', marginBottom: '2px' }}>
                  {item}
                </li>
              ))}
            </ul>
            {section.visual && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#2F4731',
                  fontStyle: 'italic',
                  padding: '4px 0',
                  borderTop: '1px dashed #c8d4c9',
                }}
              >
                Illustration idea: {section.visual}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fun facts */}
      {funFacts.length > 0 && (
        <div
          style={{
            margin: '0 16px 16px',
            backgroundColor: '#3D1419',
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#BD6809',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            Fun Facts
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {funFacts.map((fact, i) => (
              <li
                key={i}
                style={{ fontSize: '13px', color: '#FFFEF7', marginBottom: '4px', lineHeight: 1.5 }}
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
