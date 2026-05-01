'use client';

import React, { useState } from 'react';

interface InvestigationBlockProps {
  blockData: {
    block_id?: string;
    // Flat schema (legacy / LessonBlockRenderer)
    prompt?: string;
    investigation_type?: string;
    guiding_questions?: string[];
    expected_duration?: string;
    // LessonBlock schema from lessonState.ts
    content?: string | Record<string, unknown>;
    interactive?: {
      investigationType?: string;
      guidingQuestions?: string[];
    };
  };
  onResponse?: (response: unknown) => void;
  studentResponse?: { findings?: Record<number, string> };
}

export default function InvestigationBlock({ blockData, onResponse, studentResponse }: InvestigationBlockProps) {
  const [findings, setFindings] = useState<Record<number, string>>(studentResponse?.findings ?? {});

  // Normalise across both field schemas
  const prompt =
    blockData.prompt ??
    (typeof blockData.content === 'string' ? blockData.content : undefined) ??
    'What do you discover when you follow the evidence?';
  const investigationType =
    blockData.investigation_type ??
    blockData.interactive?.investigationType ??
    'compare-sources';
  const guidingQuestions =
    blockData.guiding_questions ??
    blockData.interactive?.guidingQuestions ??
    [];
  const expectedDuration = blockData.expected_duration;

  const handleSubmit = () => {
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        findings,
        investigationType,
      });
    }
  };

  return (
    <div className="investigation-block">
      <h3 className="investigation-prompt">{prompt}</h3>
      <div className="investigation-type">{investigationType.replace(/-/g, ' ')}</div>

      {expectedDuration && (
        <div className="expected-duration">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>{expectedDuration}</span>
        </div>
      )}

      {guidingQuestions.length > 0 && (
        <div className="guiding-questions">
          {guidingQuestions.map((question, i) => (
            <div key={i} className="guiding-question">
              <p className="question-text">{question}</p>
              <textarea
                value={findings[i] ?? ''}
                onChange={(e) => setFindings({ ...findings, [i]: e.target.value })}
                placeholder="Your findings..."
                rows={3}
              />
            </div>
          ))}
        </div>
      )}

      <button
        className="submit-findings"
        onClick={handleSubmit}
        disabled={Object.keys(findings).length === 0}
      >
        Submit Findings
      </button>
    </div>
  );
}
