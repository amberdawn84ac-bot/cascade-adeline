import React from 'react';

/**
 * FieldNotesWrapper provides the overall "nature journal" aesthetic
 * with handwritten fonts, cream backgrounds, and decorative elements
 */
export default function FieldNotesWrapper({ lessonTitle, subjectTrack, scriptureFoundation, children }) {
  return (
    <div className="field-notes-wrapper">
      {/* Background texture */}
      <div className="paper-texture"></div>
      
      {/* Scripture foundation banner */}
      {scriptureFoundation && (
        <div className="scripture-banner">
          <svg className="banner-decoration-left" viewBox="0 0 50 30">
            <path d="M5,15 Q25,5 45,15" stroke="currentColor" fill="none" strokeWidth="2"/>
          </svg>
          <div className="scripture-text">
            <span className="reference">{scriptureFoundation.primary_passage}</span>
            <span className="divider">•</span>
            <span className="foundation-text">{scriptureFoundation.connection}</span>
          </div>
          <svg className="banner-decoration-right" viewBox="0 0 50 30">
            <path d="M5,15 Q25,25 45,15" stroke="currentColor" fill="none" strokeWidth="2"/>
          </svg>
        </div>
      )}

      {/* Main content */}
      <div className="field-notes-content">
        {children}
      </div>

      {/* Bottom border decorations */}
      <div className="bottom-border">
        <BorderDecoration />
      </div>
    </div>
  );
}

// Decorative bottom border with botanical elements
function BorderDecoration() {
  return (
    <svg className="border-decoration" viewBox="0 0 1200 80" preserveAspectRatio="none">
      {/* Soil/ground line */}
      <line x1="0" y1="60" x2="1200" y2="60" stroke="#8B7355" strokeWidth="2"/>
      
      {/* Repeating botanical elements */}
      {[0, 150, 300, 450, 600, 750, 900, 1050].map((x, i) => (
        <g key={i} transform={`translate(${x}, 0)`}>
          {/* Wheat stalk */}
          <path
            d="M75,60 L75,20 M70,25 L75,20 L80,25 M70,30 L75,25 L80,30 M70,35 L75,30 L80,35"
            stroke="#D4A574"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Small plant */}
          <path
            d="M50,60 Q48,50 50,40 M50,50 Q45,48 42,50 M50,50 Q55,48 58,50"
            stroke="#7BA05B"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Pebbles */}
          <circle cx="30" cy="65" r="3" fill="#9B8B7E" opacity="0.6"/>
          <circle cx="40" cy="67" r="2" fill="#9B8B7E" opacity="0.5"/>
          <circle cx="100" cy="66" r="2.5" fill="#9B8B7E" opacity="0.6"/>
        </g>
      ))}
    </svg>
  );
}
