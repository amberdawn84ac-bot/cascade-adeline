import React, { useState } from 'react';

interface PhotoBlockProps {
  blockData: {
    block_id: string;
    title: string;
    image_url: string;
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

  const handleSubmit = () => {
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        analysis
      });
    }
  };

  return (
    <div className="photo-block">
      <div className="photo-frame">
        <img src={blockData.image_url} alt={blockData.title} className="historical-photo" />
        <div className="photo-info">
          <h4>{blockData.title}</h4>
          {blockData.caption && <p className="caption">{blockData.caption}</p>}
          {blockData.date && <span className="date">{blockData.date}</span>}
          {blockData.creator && <span className="creator"> • by {blockData.creator}</span>}
        </div>
      </div>

      {blockData.citation && (
        <div className="photo-citation">
          <strong>Source:</strong> {blockData.citation}
        </div>
      )}

      {blockData.analysis_prompts && blockData.analysis_prompts.length > 0 && (
        <div className="analysis-section">
          <h5>Analyze This Image:</h5>
          {blockData.analysis_prompts.map((prompt, i) => (
            <p key={i} className="analysis-prompt">{prompt}</p>
          ))}
          <textarea
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            placeholder="What do you notice in this photograph?"
            rows={4}
          />
          {analysis && (
            <button onClick={handleSubmit} className="submit-analysis">
              Save Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
