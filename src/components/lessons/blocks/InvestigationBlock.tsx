import React, { useState } from 'react';

interface InvestigationBlockProps {
  blockData: {
    block_id: string;
    prompt: string;
    investigation_type: 'follow-the-money' | 'compare-sources' | 'timeline' | 'network-map' | 'propaganda-analysis';
    guiding_questions?: string[];
    resources?: any[];
    expected_duration?: string;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function InvestigationBlock({ blockData, onResponse, studentResponse }: InvestigationBlockProps) {
  const [findings, setFindings] = useState<Record<number, string>>(studentResponse?.findings || {});
  
  const handleSubmit = () => {
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        findings,
        investigationType: blockData.investigation_type
      });
    }
  };

  return (
    <div className="investigation-block">
      <h3 className="investigation-prompt">{blockData.prompt}</h3>
      <div className="investigation-type">{blockData.investigation_type.replace(/-/g, ' ')}</div>
      
      {blockData.expected_duration && (
        <div className="expected-duration">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>{blockData.expected_duration}</span>
        </div>
      )}
      
      {blockData.guiding_questions && blockData.guiding_questions.length > 0 && (
        <div className="guiding-questions">
          {blockData.guiding_questions.map((question, i) => (
            <div key={i} className="guiding-question">
              <p className="question-text">{question}</p>
              <textarea
                value={findings[i] || ''}
                onChange={(e) => setFindings({...findings, [i]: e.target.value})}
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
