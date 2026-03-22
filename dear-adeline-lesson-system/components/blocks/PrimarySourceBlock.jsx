import React, { useState } from 'react';

/**
 * PrimarySourceBlock displays historical documents, photos, or artifacts
 * with investigation prompts in field notes style
 */
export default function PrimarySourceBlock({ blockData, onResponse }) {
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState('');

  const addAnnotation = (prompt) => {
    if (currentAnnotation.trim()) {
      const newAnnotation = {
        prompt,
        response: currentAnnotation,
        timestamp: new Date().toISOString()
      };
      
      setAnnotations([...annotations, newAnnotation]);
      setCurrentAnnotation('');
      
      if (onResponse) {
        onResponse({
          blockId: blockData.block_id,
          annotations: [...annotations, newAnnotation]
        });
      }
    }
  };

  return (
    <div className="primary-source-block">
      {/* Source header with metadata */}
      <div className="source-header">
        <div className="source-type-badge">
          {blockData.source_type === 'document' && '📜'}
          {blockData.source_type === 'photo' && '📷'}
          {blockData.source_type === 'audio' && '🎙️'}
          {blockData.source_type === 'artifact' && '🏺'}
          <span>{blockData.source_type}</span>
        </div>
        
        <h3 className="source-title">{blockData.title}</h3>
        
        <div className="source-metadata">
          <span className="date">{blockData.date}</span>
          {blockData.creator && (
            <>
              <span className="divider">•</span>
              <span className="creator">by {blockData.creator}</span>
            </>
          )}
        </div>
      </div>

      {/* Context box */}
      {blockData.context && (
        <div className="context-box">
          <svg className="lightbulb-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M9 21h6M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1m20 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <p>{blockData.context}</p>
        </div>
      )}

      {/* The primary source content */}
      <div className="source-content">
        {blockData.source_type === 'photo' && blockData.image_url && (
          <div className="photo-container">
            <img src={blockData.image_url} alt={blockData.title} />
            <div className="photo-caption">{blockData.caption || blockData.title}</div>
          </div>
        )}

        {blockData.source_type === 'document' && blockData.excerpt && (
          <div className="document-excerpt">
            <div className="paper-curl"></div>
            <pre className="document-text">{blockData.excerpt}</pre>
            <div className="document-footer">
              <em>Excerpt from original document</em>
            </div>
          </div>
        )}
      </div>

      {/* Citation */}
      <div className="citation">
        <strong>Source:</strong> {blockData.citation}
      </div>

      {/* Investigation prompts */}
      {blockData.investigation_prompts && blockData.investigation_prompts.length > 0 && (
        <div className="investigation-prompts">
          <h4 className="prompts-header">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Investigate:
          </h4>
          
          {blockData.investigation_prompts.map((prompt, index) => (
            <div key={index} className="prompt-item">
              <div className="prompt-marker">
                <svg viewBox="0 0 12 12" width="12" height="12">
                  <path d="M0,6 L12,6 M6,0 L6,12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="prompt-content">
                <p className="prompt-question">{prompt}</p>
                <textarea
                  className="prompt-response"
                  value={currentAnnotation}
                  onChange={(e) => setCurrentAnnotation(e.target.value)}
                  placeholder="Your observations..."
                  rows={2}
                />
                <button
                  className="add-annotation-btn"
                  onClick={() => addAnnotation(prompt)}
                  disabled={!currentAnnotation.trim()}
                >
                  Add Note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student annotations display */}
      {annotations.length > 0 && (
        <div className="annotations-list">
          <h5>Your Notes:</h5>
          {annotations.map((annotation, index) => (
            <div key={index} className="annotation-item">
              <div className="annotation-prompt">"{annotation.prompt}"</div>
              <div className="annotation-response">{annotation.response}</div>
            </div>
          ))}
        </div>
      )}

      {/* Decorative tape corners (like photo mounting) */}
      <div className="tape-corner top-left"></div>
      <div className="tape-corner top-right"></div>
      <div className="tape-corner bottom-left"></div>
      <div className="tape-corner bottom-right"></div>
    </div>
  );
}
