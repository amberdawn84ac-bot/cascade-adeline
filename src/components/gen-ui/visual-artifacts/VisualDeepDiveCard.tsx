'use client';

import { useState } from 'react';
import { VisualDeepDiveData, VisualDeepDiveSection } from '@/types/lesson';

type Props = VisualDeepDiveData;

function SectionCard({
  section,
  index,
  initialExpanded = false,
}: {
  section: VisualDeepDiveSection;
  index: number;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1.5px solid #2F4731',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Section header strip */}
      <div
        style={{
          backgroundColor: '#2F4731',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#BD6809',
              color: '#FFFEF7',
              fontWeight: '800',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#FFFEF7',
              fontFamily: "'Permanent Marker', Georgia, serif",
              letterSpacing: '0.3px',
            }}
          >
            {section.header}
          </span>
        </div>

        {/* Expand / collapse toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none',
            border: '1px solid rgba(255,254,247,0.35)',
            borderRadius: '20px',
            color: '#FFFEF7',
            fontSize: '11px',
            fontWeight: '600',
            padding: '3px 10px',
            cursor: 'pointer',
            letterSpacing: '0.4px',
            flexShrink: 0,
          }}
        >
          {expanded ? 'Less' : 'Deeper ↓'}
        </button>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* ── Visual Summary ── always visible */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#BD6809',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              marginBottom: '6px',
              fontFamily: 'Georgia, serif',
            }}
          >
            At a Glance
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {section.visual_summary.map((bullet, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  color: '#121B13',
                  marginBottom: '3px',
                  lineHeight: 1.55,
                  fontWeight: '500',
                }}
              >
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration idea — always visible */}
        {section.visual && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: '#f0f4f0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#2F4731',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>🖼</span>
            {section.visual}
          </div>
        )}

        {/* ── Expanded depth layers ── */}
        {expanded && (
          <>
            {/* Deep explanation */}
            <div
              style={{
                borderTop: '1px dashed #c8d4c9',
                paddingTop: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#2F4731',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  marginBottom: '6px',
                  fontFamily: 'Georgia, serif',
                }}
              >
                The Teaching
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#121B13',
                  lineHeight: 1.75,
                  margin: 0,
                  fontFamily: 'Georgia, serif',
                }}
              >
                {section.deep_explanation}
              </p>
            </div>

            {/* Why it matters */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#3D1419',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#BD6809',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  marginBottom: '5px',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Why It Matters
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: '#FFFEF7',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {section.why_it_matters}
              </p>
            </div>

            {/* Activity — optional */}
            {section.activity && (
              <div
                style={{
                  padding: '10px 14px',
                  border: '1.5px solid #9A3F4A',
                  borderRadius: '8px',
                  backgroundColor: '#fdf5f6',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#9A3F4A',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    marginBottom: '5px',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  Try It / Think About It
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#121B13',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {section.activity}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function VisualDeepDiveCard({ title, subtitle, sections = [] }: Props) {
  const [allExpanded, setAllExpanded] = useState(false);

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
      {/* Title band */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2F4731 0%, #3a5c3d 100%)',
          padding: '22px 24px 18px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: '#BD6809',
            marginBottom: '6px',
            fontFamily: 'Georgia, serif',
            fontWeight: '700',
          }}
        >
          Visual Deep Dive
        </div>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#FFFEF7',
            margin: '0 0 4px',
            fontFamily: "'Permanent Marker', Georgia, serif",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,254,247,0.7)',
              margin: '4px 0 0',
              fontStyle: 'italic',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Global expand toggle */}
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={() => setAllExpanded(e => !e)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,254,247,0.45)',
              borderRadius: '20px',
              color: '#FFFEF7',
              fontSize: '11px',
              fontWeight: '600',
              padding: '5px 14px',
              cursor: 'pointer',
              letterSpacing: '0.3px',
            }}
          >
            {allExpanded ? 'Collapse all sections' : 'Expand all — read the full lesson'}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {sections.map((section, i) => (
          // Remount when allExpanded changes so useState picks up the new initialExpanded value
          <SectionCard
            key={`${allExpanded}-${i}`}
            section={section}
            index={i}
            initialExpanded={allExpanded}
          />
        ))}
      </div>

      {/* Footer legend */}
      <div
        style={{
          padding: '10px 16px 14px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          borderTop: '1px solid #e8ede8',
        }}
      >
        {[
          { color: '#BD6809', label: 'At a Glance' },
          { color: '#2F4731', label: 'The Teaching' },
          { color: '#3D1419', label: 'Why It Matters' },
          { color: '#9A3F4A', label: 'Activity' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '10px', color: '#6b7a6c', fontFamily: 'Georgia, serif' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
