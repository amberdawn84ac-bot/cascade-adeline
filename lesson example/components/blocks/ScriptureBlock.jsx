import React, { useState } from 'react';

/**
 * ScriptureBlock displays biblical passages with Hebrew/Greek notes
 * and reflection prompts, styled like a nature journal entry
 */
export default function ScriptureBlock({ blockData, onResponse }) {
  const [reflection, setReflection] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleReflectionSubmit = () => {
    if (onResponse) {
      onResponse({ reflection, blockId: blockData.block_id });
    }
  };

  return (
    <div className="scripture-block">
      {/* Decorative frame */}
      <div className="scripture-frame">
        {/* Scripture reference header */}
        <div className="scripture-header">
          <svg className="scroll-icon" viewBox="0 0 24 24" width="30" height="30">
            <path
              d="M6 2 L6 22 M18 2 L18 22 M6 2 Q4 2 4 4 L4 20 Q4 22 6 22 M18 2 Q20 2 20 4 L20 20 Q20 22 18 22"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
          <h3 className="scripture-reference">{blockData.reference}</h3>
          <span className="translation-badge">{blockData.translation}</span>
        </div>

        {/* The passage itself */}
        <blockquote className="scripture-passage">
          <div className="quotation-mark-open">"</div>
          {blockData.passage}
          <div className="quotation-mark-close">"</div>
        </blockquote>

        {/* Hebrew/Greek notes (expandable) */}
        {blockData.hebrew_notes || blockData.hebrew_greek_notes && (
          <div className="language-notes">
            <button
              className="expand-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              <svg viewBox="0 0 12 12" width="12" height="12">
                <path d="M2 4 L6 8 L10 4" stroke="currentColor" fill="none" strokeWidth="2"/>
              </svg>
              Word Study
            </button>
            
            {expanded && (
              <div className="notes-content">
                <div className="hebrew-icon">א ב ג</div>
                <p>{blockData.hebrew_notes || blockData.hebrew_greek_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Reflection prompt */}
        {blockData.reflection_prompt && (
          <div className="reflection-section">
            <div className="prompt-header">
              <svg className="thought-bubble" viewBox="0 0 24 24" width="20" height="20">
                <circle cx="12" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8" cy="18" r="2" fill="currentColor"/>
                <circle cx="5" cy="20" r="1" fill="currentColor"/>
              </svg>
              <label>Reflection:</label>
            </div>
            <p className="prompt-text">{blockData.reflection_prompt}</p>
            
            {/* Student reflection input */}
            <textarea
              className="reflection-input"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={4}
            />
            
            {reflection && (
              <button className="submit-reflection" onClick={handleReflectionSubmit}>
                Save Reflection
              </button>
            )}
          </div>
        )}

        {/* Decorative corner flourishes */}
        <svg className="corner-flourish top-left" viewBox="0 0 40 40">
          <path d="M0,20 Q10,10 20,0" stroke="currentColor" fill="none" strokeWidth="1.5"/>
        </svg>
        <svg className="corner-flourish top-right" viewBox="0 0 40 40">
          <path d="M40,20 Q30,10 20,0" stroke="currentColor" fill="none" strokeWidth="1.5"/>
        </svg>
        <svg className="corner-flourish bottom-left" viewBox="0 0 40 40">
          <path d="M0,20 Q10,30 20,40" stroke="currentColor" fill="none" strokeWidth="1.5"/>
        </svg>
        <svg className="corner-flourish bottom-right" viewBox="0 0 40 40">
          <path d="M40,20 Q30,30 20,40" stroke="currentColor" fill="none" strokeWidth="1.5"/>
        </svg>
      </div>
    </div>
  );
}
