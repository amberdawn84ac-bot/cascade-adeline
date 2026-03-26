import React, { useState } from 'react';

interface FlashcardBlockProps {
  blockData: {
    block_id: string;
    cards: Array<{
      front: string;
      back: string;
      etymology?: string;
    }>;
    style?: 'flip' | 'swipe' | 'quiz';
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function FlashcardBlock({ blockData, onResponse, studentResponse }: FlashcardBlockProps) {
  // Normalise: agent emits individual blocks with content/interactive; legacy format uses cards[]
  const cards: Array<{ front: string; back: string; etymology?: string }> =
    blockData.cards?.length
      ? blockData.cards
      : [{
          front: typeof (blockData as any).content === 'string'
            ? (blockData as any).content
            : (blockData as any).interactive?.term || 'Term',
          back: (blockData as any).interactive?.definition || '',
          etymology: (blockData as any).interactive?.example,
        }];

  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(studentResponse?.completed || []);
  const [showEtymology, setShowEtymology] = useState(false);

  const handleNext = () => {
    if (!completed.includes(currentCard)) {
      setCompleted([...completed, currentCard]);
    }
    setFlipped(false);
    setShowEtymology(false);
    setCurrentCard((prev) => (prev + 1) % cards.length);
  };

  const handlePrevious = () => {
    setFlipped(false);
    setShowEtymology(false);
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const card = cards[currentCard];

  if (!card) return null;

  return (
    <div className="flashcard-block">
      <div className="flashcard-header">
        <h4>Vocabulary Flashcards</h4>
        <span className="card-counter">
          {currentCard + 1} / {cards.length}
        </span>
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
          <div className="flashcard-face front">
            <div className="card-content">
              <div className="card-label">Term</div>
              <div className="card-text">{card.front}</div>
              <div className="flip-hint">Click to flip</div>
            </div>
          </div>
          <div className="flashcard-face back">
            <div className="card-content">
              <div className="card-label">Definition</div>
              <div className="card-text">{card.back}</div>
              {card.etymology && (
                <button 
                  className="etymology-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEtymology(!showEtymology);
                  }}
                >
                  {showEtymology ? 'Hide' : 'Show'} Etymology
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {flipped && card.etymology && showEtymology && (
        <div className="etymology-section">
          <h5>Etymology:</h5>
          <p>{card.etymology}</p>
        </div>
      )}

      <div className="flashcard-controls">
        <button onClick={handlePrevious} disabled={currentCard === 0}>
          ← Previous
        </button>
        <button onClick={handleFlip}>
          {flipped ? 'Show Front' : 'Show Back'}
        </button>
        <button onClick={handleNext}>
          Next →
        </button>
      </div>

      {completed.length > 0 && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(completed.length / cards.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            {completed.length} of {cards.length} completed
          </span>
        </div>
      )}
    </div>
  );
}
