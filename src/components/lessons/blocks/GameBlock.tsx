import React, { useState } from 'react';

interface GameBlockProps {
  blockData: {
    block_id: string;
    game_type: 'matching' | 'sorting' | 'timeline' | 'map-placement';
    instructions: string;
    items: Array<{
      id: string;
      content: string;
      match?: string;
      year?: number;
      position?: { x: number; y: number };
    }>;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function GameBlock({ blockData, onResponse, studentResponse }: GameBlockProps) {
  const [score, setScore] = useState(studentResponse?.score || 0);
  const [completed, setCompleted] = useState(studentResponse?.completed || false);

  const handleComplete = (finalScore: number) => {
    setScore(finalScore);
    setCompleted(true);
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        score: finalScore,
        completed: true
      });
    }
  };

  const renderGameContent = () => {
    switch (blockData.game_type) {
      case 'matching':
        return <MatchingGame items={blockData.items} onComplete={handleComplete} />;
      case 'sorting':
        return <SortingGame items={blockData.items} onComplete={handleComplete} />;
      case 'timeline':
        return <TimelineGame items={blockData.items} onComplete={handleComplete} />;
      case 'map-placement':
        return <MapPlacementGame items={blockData.items} onComplete={handleComplete} />;
      default:
        return <div>Game type not implemented</div>;
    }
  };

  return (
    <div className="game-block">
      <div className="game-header">
        <h4>Interactive: {blockData.game_type.replace(/-/g, ' ')}</h4>
        <div className="game-instructions">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <p>{blockData.instructions}</p>
        </div>
      </div>

      <div className="game-content">
        {renderGameContent()}
      </div>

      {completed && (
        <div className="game-results">
          <h5>Game Complete!</h5>
          <div className="score-display">
            Score: {score} / {blockData.items.length}
          </div>
        </div>
      )}
    </div>
  );
}

// Game component placeholders
function MatchingGame({ items, onComplete }: { items: any[], onComplete: (score: number) => void }) {
  const [matches, setMatches] = useState(0);
  
  return (
    <div className="matching-game">
      <div className="game-board">
        {items.map((item, i) => (
          <div key={i} className="card">
            <div className="card-front">{item.content}</div>
            <div className="card-back">{item.match}</div>
          </div>
        ))}
      </div>
      <button onClick={() => onComplete(matches)}>Submit</button>
    </div>
  );
}

function SortingGame({ items, onComplete }: { items: any[], onComplete: (score: number) => void }) {
  return (
    <div className="sorting-game">
      <div className="sorting-area">
        {items.map((item, i) => (
          <div key={i} className="sortable-item">
            {item.content}
          </div>
        ))}
      </div>
      <button onClick={() => onComplete(items.length)}>Submit</button>
    </div>
  );
}

function TimelineGame({ items, onComplete }: { items: any[], onComplete: (score: number) => void }) {
  return (
    <div className="timeline-game">
      <div className="timeline-line">
        {items.map((item, i) => (
          <div key={i} className="timeline-event">
            <div className="event-year">{item.year}</div>
            <div className="event-content">{item.content}</div>
          </div>
        ))}
      </div>
      <button onClick={() => onComplete(items.length)}>Submit</button>
    </div>
  );
}

function MapPlacementGame({ items, onComplete }: { items: any[], onComplete: (score: number) => void }) {
  return (
    <div className="map-placement-game">
      <div className="map-container">
        <div className="map-background">
          {items.map((item, i) => (
            <div 
              key={i} 
              className="map-marker"
              style={{ left: item.position?.x || '50%', top: item.position?.y || '50%' }}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => onComplete(items.length)}>Submit</button>
    </div>
  );
}
