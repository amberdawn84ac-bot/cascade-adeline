'use client';

import React, { useState } from 'react';

interface PrimarySourceBlockProps {
  blockData: {
    block_id?: string;
    // Flat schema (legacy / LessonBlockRenderer path)
    source_type?: 'document' | 'photo' | 'audio' | 'video' | 'artifact';
    title?: string;
    date?: string;
    creator?: string;
    context?: string;
    excerpt?: string;
    image_url?: string;
    caption?: string;
    citation?: string;
    investigation_prompts?: string[];
    // LessonBlock schema from lessonState.ts
    content?: string | Record<string, unknown>;
    interactive?: {
      sourceType?: 'document' | 'photo' | 'audio' | 'artifact' | 'court_record' | 'speech' | 'newspaper';
      narrativeRole?: string;
      citation?: string;
      creator?: string;
      date?: string;
      investigationPrompts?: string[];
      collection?: string;
      url?: string;
    };
  };
  onResponse?: (response: unknown) => void;
  studentResponse?: { annotations?: Array<{ prompt: string; response: string; timestamp: string }> };
}

export default function PrimarySourceBlock({ blockData, onResponse, studentResponse }: PrimarySourceBlockProps) {
  const [annotations, setAnnotations] = useState<Array<{ prompt: string; response: string; timestamp: string }>>(
    studentResponse?.annotations ?? []
  );
  const [currentAnnotation, setCurrentAnnotation] = useState('');

  // Normalise across both field schemas
  const sourceType = blockData.source_type ?? blockData.interactive?.sourceType ?? 'document';
  const title =
    blockData.title ??
    (typeof blockData.content === 'string' ? blockData.content.slice(0, 80) : undefined) ??
    'Primary Source';
  const date = blockData.date ?? blockData.interactive?.date;
  const creator = blockData.creator ?? blockData.interactive?.creator;
  const citation = blockData.citation ?? blockData.interactive?.citation ?? blockData.interactive?.collection ?? '';
  const investigationPrompts =
    blockData.investigation_prompts ?? blockData.interactive?.investigationPrompts ?? [];
  const excerpt =
    blockData.excerpt ??
    (typeof blockData.content === 'string' ? blockData.content : undefined);

  const addAnnotation = (prompt: string) => {
    if (currentAnnotation.trim()) {
      const newAnnotation = { prompt, response: currentAnnotation, timestamp: new Date().toISOString() };
      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      setCurrentAnnotation('');
      if (onResponse) {
        onResponse({ blockId: blockData.block_id, annotations: updatedAnnotations });
      }
    }
  };

  const sourceIcon =
    sourceType === 'photo' ? '📷' :
    sourceType === 'audio' || sourceType === 'speech' ? '🎙️' :
    sourceType === 'artifact' ? '🏺' :
    sourceType === 'video' ? '🎬' :
    sourceType === 'court_record' ? '⚖️' :
    sourceType === 'newspaper' ? '📰' : '📜';

  return (
    <div className="primary-source-block">
      <div className="source-header">
        <div className="source-type-badge">
          {sourceIcon}
          <span>{sourceType.replace(/_/g, ' ')}</span>
        </div>

        <h3 className="source-title">{title}</h3>

        <div className="source-metadata">
          {date && <span className="date">{date}</span>}
          {creator && (
            <>
              <span className="divider">•</span>
              <span className="creator">by {creator}</span>
            </>
          )}
        </div>
      </div>

      {blockData.context && (
        <div className="context-box">
          <svg className="lightbulb-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M9 21h6M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1m20 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <p>{blockData.context}</p>
        </div>
      )}

      <div className="source-content">
        {blockData.image_url && (
          <div className="photo-container">
            <img src={blockData.image_url} alt={title} />
            <div className="photo-caption">{blockData.caption ?? title}</div>
          </div>
        )}

        {excerpt && sourceType !== 'photo' && (
          <div className="document-excerpt">
            <div className="paper-curl" />
            <pre className="document-text">{excerpt}</pre>
            <div className="document-footer">
              <em>Excerpt from original source</em>
            </div>
          </div>
        )}
      </div>

      {citation && (
        <div className="citation">
          <strong>Source:</strong> {citation}
        </div>
      )}

      {investigationPrompts.length > 0 && (
        <div className="investigation-prompts">
          <h4 className="prompts-header">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" />
            </svg>
            Investigate:
          </h4>

          {investigationPrompts.map((prompt, index) => (
            <div key={index} className="prompt-item">
              <div className="prompt-marker">
                <svg viewBox="0 0 12 12" width="12" height="12">
                  <path d="M0,6 L12,6 M6,0 L6,12" stroke="currentColor" strokeWidth="2" />
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

      {annotations.length > 0 && (
        <div className="annotations-list">
          <h5>Your Notes:</h5>
          {annotations.map((annotation, index) => (
            <div key={index} className="annotation-item">
              <div className="annotation-prompt">&ldquo;{annotation.prompt}&rdquo;</div>
              <div className="annotation-response">{annotation.response}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tape-corner top-left" />
      <div className="tape-corner top-right" />
      <div className="tape-corner bottom-left" />
      <div className="tape-corner bottom-right" />
    </div>
  );
}
