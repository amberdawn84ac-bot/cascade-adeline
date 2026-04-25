'use client';

import { InfographicPosterData } from '@/types/lesson';

interface Props {
  title: string;
  subtitle?: string;
  sections: InfographicPosterData['sections'];
  colorPalette?: string[];
  layout?: 'vertical' | 'grid';
  callToAction?: string;
}

export function InfographicPosterCard({
  title,
  subtitle,
  sections = [],
  layout = 'vertical',
  callToAction,
}: Props) {
  return (
    <div
      style={{
        backgroundColor: '#FFFEF7',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: "'Swanky and Moo Moo', Georgia, serif",
        color: '#121B13',
      }}
    >
      {/* Header band */}
      <div
        style={{
          backgroundColor: '#2F4731',
          padding: '20px 24px 16px',
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
          Visual Learning Artifact
        </div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#FFFEF7',
            margin: 0,
            lineHeight: 1.2,
            fontFamily: "'Permanent Marker', Georgia, serif",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: '#BD6809', fontSize: '14px', margin: '6px 0 0', fontStyle: 'italic' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Sections */}
      <div
        style={{
          padding: '20px',
          display: layout === 'grid' ? 'grid' : 'flex',
          flexDirection: layout === 'vertical' ? 'column' : undefined,
          gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fit, minmax(220px, 1fr))' : undefined,
          gap: '16px',
        }}
      >
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#fff',
              border: '1.5px solid #2F4731',
              borderRadius: '12px',
              padding: '16px',
              position: 'relative',
            }}
          >
            {/* Section header */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#BD6809',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {section.icon && <span>{section.icon}</span>}
              {section.header}
            </div>

            {/* Bullet points */}
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
              {section.content.map((item, j) => (
                <li
                  key={j}
                  style={{ fontSize: '14px', color: '#121B13', marginBottom: '4px' }}
                >
                  {item}
                </li>
              ))}
            </ul>

            {/* Visual suggestion tag */}
            {section.visual && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '4px 10px',
                  backgroundColor: '#f0f4f0',
                  borderRadius: '20px',
                  fontSize: '11px',
                  color: '#2F4731',
                  display: 'inline-block',
                  fontStyle: 'italic',
                }}
              >
                {section.visual}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call to action */}
      {callToAction && (
        <div
          style={{
            margin: '0 20px 20px',
            padding: '14px 20px',
            backgroundColor: '#9A3F4A',
            borderRadius: '10px',
            color: '#FFFEF7',
            fontWeight: '700',
            fontSize: '15px',
            textAlign: 'center',
          }}
        >
          {callToAction}
        </div>
      )}
    </div>
  );
}
