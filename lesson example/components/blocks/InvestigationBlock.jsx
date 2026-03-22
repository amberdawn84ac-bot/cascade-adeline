import React, { useState } from 'react';

/**
 * InvestigationBlock presents a research prompt with guiding questions
 */
export default function InvestigationBlock({ blockData, onResponse }) {
  const [findings, setFindings] = useState({});
  
  return (
    <div className="investigation-block">
      <h3>{blockData.prompt}</h3>
      <div className="investigation-type">{blockData.investigation_type}</div>
      
      {blockData.guiding_questions?.map((question, i) => (
        <div key={i} className="guiding-question">
          <p>{question}</p>
          <textarea
            onChange={(e) => setFindings({...findings, [i]: e.target.value})}
            placeholder="Your findings..."
          />
        </div>
      ))}
      
      <button onClick={() => onResponse(findings)}>Submit Findings</button>
    </div>
  );
}
