
import React from 'react';
import { PARAMETER_DESCRIPTIONS } from '../constants';
import type { PromptCategory } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: any;
  categoryLabels: Record<PromptCategory, string>;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, labels, categoryLabels }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            {labels.helpModalTitle}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
                {Object.entries(PARAMETER_DESCRIPTIONS).map(([key, description]) => {
                    const label = categoryLabels[key as PromptCategory] || key;
                    return (
                        <div key={key} className="border-b border-gray-700/50 pb-3 last:border-0">
                            <h4 className="text-sm font-bold text-gray-200 mb-1">{label}</h4>
                            <p className="text-sm text-gray-400">{description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
