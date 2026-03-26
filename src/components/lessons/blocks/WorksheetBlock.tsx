'use client';

import React, { useState } from 'react';
import DOMPurify from 'dompurify';

interface WorksheetBlockProps {
  blockData: {
    block_id: string;
    title: string;
    format: 'pdf' | 'interactive';
    sections: Array<{
      section_id: string;
      title: string;
      type: 'text' | 'drawing' | 'table' | 'questions';
      content?: string;
      questions?: Array<{
        question: string;
        type: 'short-answer' | 'essay' | 'multiple-choice';
        options?: string[];
      }>;
    }>;
    downloadable?: boolean;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function WorksheetBlock({ blockData, onResponse, studentResponse }: WorksheetBlockProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(studentResponse?.answers || {});
  const [completed, setCompleted] = useState(studentResponse?.completed || false);

  const handleAnswerChange = (sectionId: string, questionIndex: number, answer: string) => {
    const key = `${sectionId}_${questionIndex}`;
    setAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  const handleSubmit = () => {
    setCompleted(true);
    if (onResponse) {
      onResponse({
        blockId: blockData.block_id,
        answers,
        completed: true
      });
    }
  };

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'text':
        return (
          <div className="worksheet-text">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content || '') }} />
          </div>
        );
      
      case 'drawing':
        return (
          <div className="worksheet-drawing">
            <div className="drawing-area">
              <p className="drawing-prompt">Draw your response here:</p>
              <div className="drawing-canvas">
                {/* Drawing canvas placeholder */}
                <div className="canvas-placeholder">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" fill="none" strokeWidth="2"/>
                  </svg>
                  <span>Drawing area</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="worksheet-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'questions':
        return (
          <div className="worksheet-questions">
            {section.questions?.map((question: any, qIndex: number) => {
              const key = `${section.section_id}_${qIndex}`;
              return (
                <div key={qIndex} className="question-item">
                  <p className="question-text">{question.question}</p>
                  
                  {question.type === 'short-answer' && (
                    <textarea
                      value={answers[key] || ''}
                      onChange={(e) => handleAnswerChange(section.section_id, qIndex, e.target.value)}
                      placeholder="Your answer..."
                      rows={3}
                    />
                  )}
                  
                  {question.type === 'essay' && (
                    <textarea
                      value={answers[key] || ''}
                      onChange={(e) => handleAnswerChange(section.section_id, qIndex, e.target.value)}
                      placeholder="Write your essay here..."
                      rows={6}
                    />
                  )}
                  
                  {question.type === 'multiple-choice' && (
                    <div className="multiple-choice">
                      {question.options?.map((option: any, oIndex: number) => (
                        <label key={oIndex} className="choice-option">
                          <input
                            type="radio"
                            name={key}
                            value={option}
                            checked={answers[key] === option}
                            onChange={(e) => handleAnswerChange(section.section_id, qIndex, e.target.value)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="worksheet-block">
      <div className="worksheet-header">
        <h4>{blockData.title}</h4>
        <div className="worksheet-format">{blockData.format}</div>
      </div>

      <div className="worksheet-content">
        {blockData.sections.map((section) => (
          <div key={section.section_id} className="worksheet-section">
            <h5 className="section-title">{section.title}</h5>
            {renderSection(section)}
          </div>
        ))}
      </div>

      <div className="worksheet-actions">
        {blockData.downloadable && (
          <button className="download-btn">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" fill="none" strokeWidth="2"/>
            </svg>
            Download PDF
          </button>
        )}
        
        <button 
          className="submit-worksheet"
          onClick={handleSubmit}
          disabled={completed}
        >
          {completed ? '✓ Submitted' : 'Submit Worksheet'}
        </button>
      </div>
    </div>
  );
}
