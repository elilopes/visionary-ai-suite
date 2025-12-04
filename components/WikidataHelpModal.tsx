
import React from 'react';

interface WikidataHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: any;
}

const WikidataHelpModal: React.FC<WikidataHelpModalProps> = ({ isOpen, onClose, labels }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
          <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            {labels.helpModal.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-blue-300 mb-2">{labels.helpModal.qTitle}</h3>
                <p className="text-gray-300 mb-2">{labels.helpModal.qDesc}</p>
                <p className="text-sm text-blue-400 font-mono bg-gray-900 p-2 rounded">{labels.helpModal.qExample}</p>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-green-300 mb-2">{labels.helpModal.pTitle}</h3>
                <p className="text-gray-300 mb-2">{labels.helpModal.pDesc}</p>
                <p className="text-sm text-green-400 font-mono bg-gray-900 p-2 rounded">{labels.helpModal.pExample}</p>
            </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 bg-gray-900/30 rounded-b-lg flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default WikidataHelpModal;
