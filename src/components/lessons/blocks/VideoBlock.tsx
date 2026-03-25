import React, { useState } from 'react';

interface VideoBlockProps {
  blockData: {
    block_id: string;
    title: string;
    video_url: string;
    duration?: string;
    transcript_available?: boolean;
    viewing_prompts?: string[];
    analysis_prompts?: string[];
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function VideoBlock({ blockData, onResponse, studentResponse }: VideoBlockProps) {
  const [notes, setNotes] = useState(studentResponse?.notes || '');
  const [showTranscript, setShowTranscript] = useState(false);

  const handleSubmit = () => {
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        notes
      });
    }
  };

  return (
    <div className="video-block">
      <div className="video-container">
        <div className="video-frame">
          <video controls className="historical-video">
            <source src={blockData.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {blockData.duration && (
            <div className="video-duration">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {blockData.duration}
            </div>
          )}
        </div>
        
        <div className="video-info">
          <h4>{blockData.title}</h4>
          {blockData.transcript_available && (
            <button 
              className="transcript-toggle"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </button>
          )}
        </div>
      </div>

      {showTranscript && (
        <div className="transcript-section">
          <h5>Transcript:</h5>
          <div className="transcript-content">
            <p>Transcript would be displayed here when available...</p>
          </div>
        </div>
      )}

      {blockData.viewing_prompts && blockData.viewing_prompts.length > 0 && (
        <div className="viewing-prompts">
          <h5>While Watching:</h5>
          {blockData.viewing_prompts.map((prompt, i) => (
            <p key={i} className="viewing-prompt">{prompt}</p>
          ))}
        </div>
      )}

      {blockData.analysis_prompts && blockData.analysis_prompts.length > 0 && (
        <div className="analysis-section">
          <h5>After Watching:</h5>
          {blockData.analysis_prompts.map((prompt, i) => (
            <p key={i} className="analysis-prompt">{prompt}</p>
          ))}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you observe in this footage?"
            rows={4}
          />
          {notes && (
            <button onClick={handleSubmit} className="submit-notes">
              Save Notes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
