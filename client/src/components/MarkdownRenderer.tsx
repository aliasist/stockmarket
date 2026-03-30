import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-left">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline" />,
          code: ({node, ...props}) => <code className="bg-muted px-1 rounded" {...props} />,
          pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
