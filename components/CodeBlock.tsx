
import React, { useState, useEffect } from 'react';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
    });
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className="bg-black/80 rounded-lg relative font-mono text-sm h-full">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors duration-200"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375v-3.375c0-.621-.504-1.125-1.125-1.125h-1.5c-1.125 0-2.25-.504-3-1.372M6.75 11.25l1.5-1.5m-1.5 1.5v-3.375c0-.621.504-1.125 1.125-1.125h1.5l1.293-1.293c.132-.132.28-.25.44-.352M6.75 11.25l-1.5-1.5m-1.5 1.5v-3.375c0-.621.504-1.125 1.125-1.125h1.5l1.293-1.293c.132-.132.28-.25.44-.352" />
            </svg>
          )}
        </button>
      <pre className="p-4 pt-12 overflow-auto h-full rounded-lg">
        <code className="text-green-300 whitespace-pre-wrap break-words">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
