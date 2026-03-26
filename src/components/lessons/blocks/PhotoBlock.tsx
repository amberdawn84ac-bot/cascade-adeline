'use client';

import React, { useState } from 'react';

interface PhotoBlockProps {
  blockData: {
    block_id: string;
    // Agent format: activityAgent puts photo prompt in content
    content?: string;
    metadata?: { title?: string };
    // Legacy format
    title?: string;
    image_url?: string;
    caption?: string;
    date?: string;
    creator?: string;
    citation?: string;
    analysis_prompts?: string[];
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function PhotoBlock({ blockData, onResponse, studentResponse }: PhotoBlockProps) {
  const [analysis, setAnalysis] = useState(studentResponse?.analysis || '');
  const [saved, setSaved] = useState(studentResponse?.saved || false);

  const handleSubmit = () => {
    setSaved(true);
    if (onResponse) {
      onResponse({ blockId: blockData.block_id, analysis, saved: true });
    }
  };

  const raw = blockData as any;
  const imageUrl: string = raw.image_url || '';
  const prompt: string = raw.content || '';
  const title: string = raw.title || raw.metadata?.title || '';

  // Case 1: has an actual image URL — display the image
  if (imageUrl) {
    return (
      <div className="photo-block">
        <div className="photo-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title || 'Historical photograph'} className="historical-photo" />
          <div className="photo-info">
            {title && <h4>{title}</h4>}
            {raw.caption && <p className="caption">{raw.caption}</p>}
            {raw.date && <span className="date">{raw.date}</span>}
            {raw.creator && <span className="creator"> • by {raw.creator}</span>}
          </div>
        </div>
        {raw.citation && (
          <div className="photo-citation">
            <strong>Source:</strong> {raw.citation}
          </div>
        )}
        {raw.analysis_prompts && raw.analysis_prompts.length > 0 && (
          <div className="analysis-section">
            <h5>Analyze This Image:</h5>
            {raw.analysis_prompts.map((p: string, i: number) => (
              <p key={i} className="analysis-prompt">{p}</p>
            ))}
            <textarea
              value={analysis}
              onChange={e => setAnalysis(e.target.value)}
              placeholder="What do you notice in this photograph?"
              rows={4}
            />
            {analysis && (
              <button onClick={handleSubmit} className="submit-analysis">Save Analysis</button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Case 2: activityAgent photo prompt — student documentation card
  return (
    <div
      className="rounded-xl border-2 border-dashed border-[#BD6809] bg-[#FFFEF7] p-5"
      style={{ boxShadow: '0 2px 8px rgba(61,20,25,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#BD6809]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#BD6809]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-[#2F4731] text-sm">Photo Documentation</p>
          <p className="text-xs text-[#2F4731]/60">Capture your work to show completion</p>
        </div>
      </div>

      {/* Prompt */}
      {prompt && (
        <div className="mb-4 p-3 rounded-lg bg-[#FAF5E4] border border-[#E7DAC3]">
          <p className="text-sm text-[#121B13] leading-relaxed">{prompt}</p>
        </div>
      )}

      {/* Notes area */}
      <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wide mb-2">Add a note about what you did</p>
      <textarea
        value={analysis}
        onChange={e => setAnalysis(e.target.value)}
        disabled={saved}
        placeholder="Describe what you made or did..."
        rows={3}
        className="w-full rounded-lg border border-[#E7DAC3] bg-white p-3 text-sm text-[#121B13] resize-none focus:outline-none focus:ring-2 focus:ring-[#BD6809]/40 disabled:opacity-60"
      />
      {!saved ? (
        <button
          onClick={handleSubmit}
          disabled={!analysis.trim()}
          className="mt-2 px-4 py-1.5 rounded-lg bg-[#BD6809] text-white text-sm font-bold hover:bg-[#2F4731] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Note
        </button>
      ) : (
        <p className="mt-2 text-xs text-[#2F4731]/60 italic">Note saved!</p>
      )}
    </div>
  );
}
