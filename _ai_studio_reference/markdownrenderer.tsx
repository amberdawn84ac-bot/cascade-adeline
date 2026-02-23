import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose prose-stone prose-p:font-serif prose-headings:font-display prose-headings:font-normal prose-a:text-sage-dark prose-strong:font-semibold max-w-none">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl mb-4 border-b border-gold pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl mb-3 mt-6 text-sage-dark italic" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg mb-2 mt-4 font-bold text-ink/80" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 marker:text-gold" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 marker:text-gold" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-sage pl-4 italic my-4 text-ink/70" {...props} />,
          code: ({node, ...props}) => <code className="bg-sepia px-1 py-0.5 rounded text-sm font-mono text-sage-dark" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};