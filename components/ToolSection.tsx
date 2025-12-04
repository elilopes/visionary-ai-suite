
import React, { useState } from 'react';

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ToolSection: React.FC<ToolSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-800/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200 border-b border-gray-700/50"
      >
        <h3 className="text-xl font-semibold text-indigo-400 text-left">{title}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      <div className={isOpen ? 'block' : 'hidden'}>
        <div className="p-6 space-y-12 bg-gray-900/20">
            {children}
        </div>
      </div>
    </div>
  );
};

export default ToolSection;
