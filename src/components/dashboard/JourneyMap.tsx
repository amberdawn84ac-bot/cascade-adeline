"use client";

import { useEffect, useState } from 'react';

interface JourneyData {
  mode: 'annual' | 'graduation';
  pct: number;
  earned: number;
  target: number;
  milestone: string;
  gradeLevel: string;
}

// ── Trail waypoints ─────────────────────────────────────────────────────────
const ANNUAL_WAYPOINTS = [
  { label: 'Autumn\nSowing',  pct: 0,   cx: 44,  cy: 148 },
  { label: 'Winter\nRoots',   pct: 25,  cx: 108, cy: 112 },
  { label: 'Early\nBloom',    pct: 50,  cx: 156, cy: 72  },
  { label: 'Spring\nGrowth',  pct: 75,  cx: 212, cy: 48  },
  { label: 'Spring\nHarvest', pct: 100, cx: 272, cy: 24  },
];

const GRADUATION_WAYPOINTS = [
  { label: 'Basecamp',          pct: 0,   cx: 44,  cy: 152 },
  { label: 'The\nTraverse',     pct: 25,  cx: 100, cy: 108 },
  { label: 'The\nRidge',        pct: 60,  cx: 168, cy: 60  },
  { label: 'The\nSummit',       pct: 85,  cx: 224, cy: 30  },
  { label: 'Graduation\nDefense', pct: 100, cx: 276, cy: 12 },
];

// SVG path through the waypoints (cubic bezier winding trail)
const ANNUAL_PATH =
  'M44,148 C60,140 88,124 108,112 C128,100 140,84 156,72 C172,60 196,52 212,48 C228,44 252,32 272,24';

const GRADUATION_PATH =
  'M44,152 C60,140 84,120 100,108 C116,96 140,80 168,60 C184,48 208,36 224,30 C240,24 260,16 276,12';

// Interpolate a point along the path at a given percentage
function lerpWaypoints(
  waypoints: typeof ANNUAL_WAYPOINTS,
  pct: number
): { cx: number; cy: number } {
  if (pct <= 0) return { cx: waypoints[0].cx, cy: waypoints[0].cy };
  if (pct >= 100) return { cx: waypoints[waypoints.length - 1].cx, cy: waypoints[waypoints.length - 1].cy };

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (pct >= a.pct && pct <= b.pct) {
      const t = (pct - a.pct) / (b.pct - a.pct);
      return { cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t };
    }
  }
  return { cx: waypoints[waypoints.length - 1].cx, cy: waypoints[waypoints.length - 1].cy };
}

function TrailSVG({ data, animated }: { data: JourneyData; animated: boolean }) {
  const isGrad = data.mode === 'graduation';
  const waypoints = isGrad ? GRADUATION_WAYPOINTS : ANNUAL_WAYPOINTS;
  const path = isGrad ? GRADUATION_PATH : ANNUAL_PATH;
  const marker = lerpWaypoints(waypoints, animated ? data.pct : 0);

  // Topographic contour lines (decorative)
  const contours = isGrad
    ? ['M20,170 Q80,165 160,155 Q220,145 300,150', 'M20,185 Q90,178 170,170 Q240,162 300,168']
    : ['M20,165 Q80,162 160,158 Q220,150 300,155', 'M20,180 Q90,176 170,170 Q240,160 300,168'];

  return (
    <svg
      viewBox="0 0 320 180"
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="Journey Map trail"
    >
      {/* Parchment background */}
      <rect width="320" height="180" rx="12" fill="#FFFEF7" />

      {/* Topographic contour lines */}
      {contours.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#C8B89A" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 6" />
      ))}

      {/* Terrain shading (soft hills) */}
      <ellipse cx="80" cy="155" rx="50" ry="18" fill="#E8DCC8" opacity="0.3" />
      <ellipse cx="200" cy="130" rx="60" ry="20" fill="#D4C4A0" opacity="0.25" />
      <ellipse cx="260" cy="40" rx="40" ry="28" fill="#C8B484" opacity="0.18" />

      {/* Trail shadow (slightly offset, blurred) */}
      <path d={path} fill="none" stroke="#8B7355" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" transform="translate(1,2)" />

      {/* Completed trail segment (warm amber) */}
      <path
        d={path}
        fill="none"
        stroke="#E7DAC3"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {animated && data.pct > 0 && (
        <path
          d={path}
          fill="none"
          stroke="#BD6809"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          strokeDashoffset={1000 - (1000 * data.pct) / 100}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      )}

      {/* Waypoint dots */}
      {waypoints.map((wp, i) => {
        const reached = data.pct >= wp.pct;
        const isCurrent = i > 0 && data.pct >= waypoints[i - 1].pct && data.pct < wp.pct;
        return (
          <g key={i}>
            <circle
              cx={wp.cx} cy={wp.cy} r={reached ? 6 : 5}
              fill={reached ? '#BD6809' : '#E7DAC3'}
              stroke={reached ? '#8B5E0A' : '#C8B89A'}
              strokeWidth="1.5"
              style={{ transition: 'all 0.4s ease' }}
            />
            {isCurrent && (
              <circle cx={wp.cx} cy={wp.cy} r={9} fill="none" stroke="#BD6809" strokeWidth="1.5" opacity="0.5" />
            )}
          </g>
        );
      })}

      {/* Waypoint labels (above/below trail depending on position) */}
      {waypoints.map((wp, i) => {
        const lines = wp.label.split('\n');
        const above = wp.cy < 90;
        const yBase = above ? wp.cy + 14 : wp.cy - 10;
        return (
          <g key={`lbl-${i}`}>
            {lines.map((line, li) => (
              <text
                key={li}
                x={wp.cx}
                y={yBase + li * 10}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight={data.milestone === wp.label.replace('\n', '\n') ? '700' : '500'}
                fill={data.pct >= wp.pct ? '#5C3D0A' : '#9C8870'}
                style={{ transition: 'fill 0.4s ease' }}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Animated avatar marker */}
      {animated && (
        <g style={{ transition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          transform={`translate(${marker.cx}, ${marker.cy})`}>
          {/* Glow */}
          <circle r="10" fill="#BD6809" opacity="0.15" />
          {/* Pin drop shadow */}
          <ellipse cx="0" cy="14" rx="5" ry="2.5" fill="#8B5E0A" opacity="0.2" />
          {/* Marker body */}
          <circle r="7" fill="#2F4731" stroke="#FFFEF7" strokeWidth="2" />
          {/* Marker icon (hiker silhouette as simple dot) */}
          <circle r="2.5" fill="#FFFEF7" />
          {/* Pulse ring */}
          <circle r="11" fill="none" stroke="#2F4731" strokeWidth="1" opacity="0.4">
            <animate attributeName="r" from="7" to="14" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Mountain peak decoration for graduation mode */}
      {isGrad && (
        <g opacity="0.2">
          <polygon points="276,12 262,36 290,36" fill="#5C3D0A" />
          <polygon points="276,12 269,28 283,28" fill="#FFFEF7" opacity="0.5" />
        </g>
      )}

      {/* Harvest icon for annual mode */}
      {!isGrad && (
        <text x="272" y="18" fontSize="12" textAnchor="middle" opacity="0.35">🌾</text>
      )}
    </svg>
  );
}

export default function JourneyMap() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [animated, setAnimated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/progress/journey')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: JourneyData) => {
        setData(d);
        // Delay animation start slightly so CSS transition fires
        setTimeout(() => setAnimated(true), 80);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  if (!data) {
    return (
      <div style={{
        background: '#FFFEF7', border: '1px solid #E7DAC3', borderRadius: 16,
        padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 80, opacity: 0.5,
      }}>
        <span style={{ fontSize: 11, color: '#4B3424', fontStyle: 'italic' }}>Plotting your trail…</span>
      </div>
    );
  }

  const destination = data.mode === 'graduation' ? 'Graduation Defense' : 'Annual Harvest';

  return (
    <div style={{
      background: '#FFFEF7',
      border: '1.5px solid #E7DAC3',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(47,71,49,0.07)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 6px',
        background: 'linear-gradient(135deg, #2F4731 0%, #1e3020 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: '"Emilys Candy", cursive', color: '#FFFEF7', fontSize: '0.85rem', letterSpacing: 1 }}>
            {data.mode === 'graduation' ? 'Graduation Ascent' : 'The Annual Trail'}
          </div>
          <div style={{ color: '#BD6809', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginTop: 1 }}>
            Grade {data.gradeLevel} · {data.mode === 'graduation' ? '4-Year Journey' : 'School Year'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#FFFEF7', fontSize: '1.1rem', fontWeight: 800 }}>{data.pct}%</div>
          <div style={{ color: '#C8B89A', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {data.earned} / {data.target} cr
          </div>
        </div>
      </div>

      {/* Trail */}
      <div style={{ padding: '8px 12px 4px' }}>
        <TrailSVG data={data} animated={animated} />
      </div>

      {/* Current milestone */}
      <div style={{
        padding: '6px 14px 10px',
        borderTop: '1px solid #F0E8D8',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>
          {data.mode === 'graduation' ? '⛰' : '🌿'}
        </span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#BD6809', textTransform: 'uppercase', letterSpacing: 1 }}>
            {data.milestone}
          </div>
          <div style={{ fontSize: 9.5, color: '#5C3D0A', marginTop: 1, lineHeight: 1.4, fontStyle: 'italic' }}>
            You are {data.pct}% of the way to your {destination}.{' '}
            {data.pct < 100 ? 'Let us keep climbing.' : 'You made it. Well done.'}
          </div>
        </div>
      </div>
    </div>
  );
}

