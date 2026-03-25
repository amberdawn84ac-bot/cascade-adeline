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
        <h3>{blockData.activity_title}</h3>
      </div>

      <p className="activity-description">{blockData.description}</p>

      {blockData.materials_needed && blockData.materials_needed.length > 0 && (
        <div className="materials-section">
          <h4>Materials Needed:</h4>
          <ul className="materials-list">
            {blockData.materials_needed.map((material, i) => (
              <li key={i}>{material}</li>
            ))}
          </ul>
        </div>
      )}

      {blockData.safety_notes && blockData.safety_notes.length > 0 && (
        <div className="safety-notes">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
            <path d="M11 7h2v6h-2zm0 8h2v2h-2z" fill="white"/>
          </svg>
          <strong>Safety:</strong>
          <ul>
            {blockData.safety_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {blockData.steps && blockData.steps.length > 0 && (
        <div className="steps-section">
          <h4>Steps:</h4>
          <ol className="steps-list">
            {blockData.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {blockData.documentation_prompts && blockData.documentation_prompts.length > 0 && (
        <div className="documentation-section">
          <h4>Document Your Work:</h4>
          {blockData.documentation_prompts.map((prompt, i) => (
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
