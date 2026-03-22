import React from 'react';

/**
 * TextBlock displays instructional text with various styling options
 */
export default function TextBlock({ blockData }) {
  const getClassName = () => {
    let className = 'text-block';
    if (blockData.visual_style) {
      className += ` style-${blockData.visual_style}`;
    }
    if (blockData.emphasis) {
      className += ` emphasis-${blockData.emphasis}`;
    }
    return className;
  };

  return (
    <div className={getClassName()}>
      <div dangerouslySetInnerHTML={{ __html: convertMarkdown(blockData.content) }} />
    </div>
  );
}

// Simple markdown converter (or use a library like marked/react-markdown)
function convertMarkdown(text) {
  return text
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>');
}
