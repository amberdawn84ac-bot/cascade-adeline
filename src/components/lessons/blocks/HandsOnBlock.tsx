import React, { useState } from 'react';

interface HandsOnBlockProps {
  blockData: {
    block_id: string;
    activity_title: string;
    description: string;
    materials_needed?: string[];
    steps?: string[];
    safety_notes?: string[];
    documentation_prompts?: string[];
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function HandsOnBlock({ blockData, onResponse, studentResponse }: HandsOnBlockProps) {
  const [completed, setCompleted] = useState(studentResponse?.completed || false);
  const [documentation, setDocumentation] = useState(studentResponse?.documentation || '');

  // Normalize: activityAgent stores structured data as JSON string in content
  const raw = blockData as any;
  let activity_title: string = raw.activity_title || raw.title || '';
  let description: string = raw.description || '';
  let steps: string[] = raw.steps || [];
  let materials_needed: string[] = raw.materials_needed || [];
  let documentation_prompts: string[] = raw.documentation_prompts || [];
  let safety_notes: string[] = raw.safety_notes || [];

  if (raw.content && !activity_title) {
    try {
      const parsed = JSON.parse(raw.content);
      activity_title = parsed.title || activity_title;
      description = parsed.fullInstructions || description;
      materials_needed = parsed.supplies || materials_needed;
      steps = parsed.steps || steps;
    } catch {
      description = raw.content;
    }
  }

  // If fullInstructions is long, split numbered lines into steps
  if (description && steps.length === 0) {
    const lines = description.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 2) {
      steps = lines;
      description = '';
    }
  }

  const handleComplete = () => {
    setCompleted(true);
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        completed: true,
        documentation
      });
    }
  };

  return (
    <div className="hands-on-block">
      <div className="activity-header">
        <svg viewBox="0 0 24 24" width="24" height="24" className="hands-icon">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" fill="none" strokeWidth="2"/>
        </svg>
        <h3>{activity_title || 'Hands-On Activity'}</h3>
      </div>

      {description && <p className="activity-description">{description}</p>}

      {materials_needed.length > 0 && (
        <div className="materials-section">
          <h4>Materials Needed:</h4>
          <ul className="materials-list">
            {materials_needed.map((material, i) => (
              <li key={i}>{material}</li>
            ))}
          </ul>
        </div>
      )}

      {safety_notes.length > 0 && (
        <div className="safety-notes">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
            <path d="M11 7h2v6h-2zm0 8h2v2h-2z" fill="white"/>
          </svg>
          <strong>Safety:</strong>
          <ul>
            {safety_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {steps.length > 0 && (
        <div className="steps-section">
          <h4>Steps:</h4>
          <ol className="steps-list">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {documentation_prompts.length > 0 && (
        <div className="documentation-section">
          <h4>Document Your Work:</h4>
          {documentation_prompts.map((prompt, i) => (
            <p key={i} className="doc-prompt">{prompt}</p>
          ))}
          <textarea
            value={documentation}
            onChange={(e) => setDocumentation(e.target.value)}
            placeholder="Describe what you did and what you learned..."
            rows={4}
          />
        </div>
      )}

      <button
        className="complete-activity-btn"
        onClick={handleComplete}
        disabled={completed}
      >
        {completed ? '✓ Activity Completed' : 'Mark as Complete'}
      </button>
    </div>
  );
}
