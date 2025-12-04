import React from 'react';
import type { GrammarCheckResult } from '../types';
import Spinner from './Spinner';

interface GrammarCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GrammarCheckResult | null;
  isLoading: boolean;
  error: string | null;
  labels: {
    modalTitle: string;
    summary: string;
    suggestions: string;
    noIssues: string;
    original: string;
    corrected: string;
    explanation: string;
  };
}

const GrammarCheckModal: React.FC<GrammarCheckModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  error,
  labels,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="grammar-modal-title">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 id="grammar-modal-title" className="text-xl font-bold text-white">{labels.modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Spinner />
            </div>
          )}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {!isLoading && !error && result && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-indigo-400 mb-2">{labels.summary}</h3>
                <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{result.summary}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-indigo-400 mb-2">{labels.suggestions}</h3>
                {result.suggestions.length > 0 ? (
                  <ul className="space-y-4">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                        <div className="mb-2">
                          <strong className="text-gray-400">{labels.original}:</strong>
                          <p className="text-red-400/80 italic">"{suggestion.original}"</p>
                        </div>
                        <div className="mb-2">
                          <strong className="text-gray-400">{labels.corrected}:</strong>
                          <p className="text-green-400/80 italic">"{suggestion.corrected}"</p>
                        </div>
                        <div>
                           <strong className="text-gray-400">{labels.explanation}:</strong>
                           <p className="text-gray-300">{suggestion.explanation}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{labels.noIssues}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarCheckModal;
