import React, { useState } from 'react';

interface ScriptureBlockProps {
  blockData: {
    block_id: string;
    reference: string;
    translation?: string;
    passage: string;
    hebrew_notes?: string;
    hebrew_greek_notes?: string;
    reflection_prompt?: string;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function ScriptureBlock({ blockData, onResponse, studentResponse }: ScriptureBlockProps) {
  // Normalise: contentAgent emits { type:'scripture', content:'Ref — context' }
  // Legacy format has reference/passage/translation as separate fields.
  const raw = blockData as any;
  
  // Defensive: ensure content is always a string
  let rawContent: string = '';
  if (raw.content && typeof raw.content === 'string') {
    rawContent = raw.content;
  } else if (raw.content && typeof raw.content === 'object') {
    // If content is an object, try to extract meaningful text
    rawContent = raw.content.primary_passage || raw.content.text || JSON.stringify(raw.content);
  } else {
    rawContent = '';
  }
  
  // Try to split "Book 1:2 — passage text" into reference + passage
  // Only call .search() if we're sure rawContent is a string
  let dashIdx = -1;
  try {
    dashIdx = rawContent.search(/\s[—–-]\s/);
  } catch (err) {
    console.warn('[ScriptureBlock] Failed to search content:', err, 'content:', rawContent);
    dashIdx = -1;
  }
  
  const reference = blockData.reference || (dashIdx > 0 ? rawContent.slice(0, dashIdx).trim() : rawContent);
  const passage = blockData.passage || (dashIdx > 0 ? rawContent.slice(dashIdx + 3).trim() : '');
  const translation = blockData.translation || raw.interactive?.translation || 'ESV';

  const [reflection, setReflection] = useState(studentResponse?.reflection || '');
  const [expanded, setExpanded] = useState(false);

  const handleReflectionSubmit = () => {
    if (onResponse) {
      onResponse({ reflection, blockId: blockData.block_id });
    }
  };

  const hebrewNotes = blockData.hebrew_notes || blockData.hebrew_greek_notes;

  return (
    <div className="scripture-block">
      <div className="scripture-frame">
        <div className="scripture-header">
          <svg className="scroll-icon" viewBox="0 0 24 24" width="30" height="30">
            <path
              d="M6 2 L6 22 M18 2 L18 22 M6 2 Q4 2 4 4 L4 20 Q4 22 6 22 M18 2 Q20 2 20 4 L20 20 Q20 22 18 22"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
          <h3 className="scripture-reference">{reference}</h3>
          <span className="translation-badge">{translation}</span>
        </div>

        <blockquote className="scripture-passage">
          <div className="quotation-mark-open">"</div>
          {passage || reference}
          <div className="quotation-mark-close">"</div>
        </blockquote>

        {hebrewNotes && (
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
                <p>{hebrewNotes}</p>
              </div>
            )}
          </div>
        )}

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
