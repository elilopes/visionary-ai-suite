
import React, { useState } from 'react';

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ToolSection: React.FC<ToolSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--border-main)] rounded-lg overflow-hidden shadow-md bg-[var(--bg-panel)]/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-input)] transition-colors duration-200 border-b border-[var(--border-main)]/50"
      >
        <h3 className="text-xl font-bold text-[var(--accent)] text-left">{title}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      <div className={isOpen ? 'block' : 'hidden'}>
        <div className="p-6 space-y-12 bg-[var(--bg-main)]/5">
            {children}
        </div>
      </div>
    </div>
  );
};

export default ToolSection;
