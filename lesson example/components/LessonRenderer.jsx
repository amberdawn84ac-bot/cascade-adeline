import React, { useState } from 'react';
import TextBlock from './blocks/TextBlock';
import ScriptureBlock from './blocks/ScriptureBlock';
import PrimarySourceBlock from './blocks/PrimarySourceBlock';
import InvestigationBlock from './blocks/InvestigationBlock';
import QuizBlock from './blocks/QuizBlock';
import HandsOnBlock from './blocks/HandsOnBlock';
import PhotoBlock from './blocks/PhotoBlock';
import VideoBlock from './blocks/VideoBlock';
import FlashcardBlock from './blocks/FlashcardBlock';
import InfographicBlock from './blocks/InfographicBlock';
import GameBlock from './blocks/GameBlock';
import WorksheetBlock from './blocks/WorksheetBlock';
import FieldNotesWrapper from './FieldNotesWrapper';

/**
 * Main lesson renderer that displays blocks in sequence with field notes aesthetic
 */
export default function LessonRenderer({ lessonData }) {
  const [studentResponses, setStudentResponses] = useState({});
  const [visibleBlocks, setVisibleBlocks] = useState(
    lessonData.blocks.map(b => b.block_id)
  );

  // Block type to component mapping
  const blockComponents = {
    text: TextBlock,
    scripture: ScriptureBlock,
    primary_source: PrimarySourceBlock,
    investigation: InvestigationBlock,
    quiz: QuizBlock,
    hands_on: HandsOnBlock,
    photo: PhotoBlock,
    video: VideoBlock,
    flashcard: FlashcardBlock,
    infographic: InfographicBlock,
    game: GameBlock,
    worksheet: WorksheetBlock,
  };

  // Handle student responses that might trigger branching
  const handleResponse = (blockId, response) => {
    setStudentResponses(prev => ({
      ...prev,
      [blockId]: response
    }));

    // Check branching logic
    if (lessonData.branching_logic?.decision_points) {
      lessonData.branching_logic.decision_points.forEach(point => {
        if (point.trigger_block === blockId) {
          handleBranching(point, response);
        }
      });
    }
  };

  // Handle branching logic
  const handleBranching = (branchPoint, response) => {
    // Example: Show/hide blocks based on quiz score
    if (branchPoint.conditions?.if_score_above) {
      if (response.score > branchPoint.conditions.if_score_above) {
        setVisibleBlocks(prev => [
          ...prev,
          ...(branchPoint.conditions.show_blocks || [])
        ]);
      }
    }

    // Example: Branch based on student choice
    if (branchPoint.conditions?.if_student_chooses) {
      const chosenPath = branchPoint.conditions.branches_to?.[response.choice];
      if (chosenPath) {
        // Add blocks from chosen path
        // Implementation depends on your data structure
      }
    }
  };

  // Render individual block
  const renderBlock = (block) => {
    const BlockComponent = blockComponents[block.block_type];
    
    if (!BlockComponent) {
      console.warn(`Unknown block type: ${block.block_type}`);
      return null;
    }

    if (!visibleBlocks.includes(block.block_id)) {
      return null;
    }

    return (
      <BlockComponent
        key={block.block_id}
        blockData={block}
        onResponse={(response) => handleResponse(block.block_id, response)}
        studentResponse={studentResponses[block.block_id]}
      />
    );
  };

  return (
    <FieldNotesWrapper
      lessonTitle={lessonData.title}
      subjectTrack={lessonData.subject_track}
      scriptureFoundation={lessonData.scripture_foundation}
    >
      <div className="lesson-container">
        {/* Lesson Header */}
        <div className="lesson-header">
          <div className="decorative-line-left"></div>
          <h1 className="lesson-title">{lessonData.title}</h1>
          <div className="decorative-line-right"></div>
        </div>

        {/* Subject Track Badge */}
        <div className="subject-badge">
          {lessonData.subject_track.replace(/-/g, ' ')}
        </div>

        {/* Learning Objectives */}
        <div className="objectives-box">
          <h3>Today's Investigation:</h3>
          <ul>
            {lessonData.learning_objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>

        {/* Render all blocks */}
        <div className="lesson-blocks">
          {lessonData.blocks
            .sort((a, b) => a.order - b.order)
            .map(renderBlock)}
        </div>

        {/* Lesson Footer - Credits */}
        <div className="lesson-footer">
          <div className="credits-earned">
            <h4>Credits Earned:</h4>
            {lessonData.credits.map((credit, i) => (
              <div key={i} className="credit-item">
                <span className="credit-subject">{credit.subject}</span>
                <span className="credit-hours">{credit.hours} hours</span>
              </div>
            ))}
          </div>
          
          {/* Decorative footer elements */}
          <div className="footer-decorations">
            <svg className="wheat-icon" viewBox="0 0 24 24">
              <path d="M12 2L8 6l4 4 4-4-4-4zm0 8l-4 4 4 4 4-4-4-4z"/>
            </svg>
          </div>
        </div>
      </div>
    </FieldNotesWrapper>
  );
}
