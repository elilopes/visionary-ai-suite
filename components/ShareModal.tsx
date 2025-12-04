import React, { useState } from 'react';
import Spinner from './Spinner';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (author: string, isTested: boolean, includeImage: boolean) => void;
    labels: any;
    hasImage: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onConfirm, labels, hasImage }) => {
    const [author, setAuthor] = useState('');
    const [isTested, setIsTested] = useState(false);
    const [includeImage, setIncludeImage] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate a delay for showing feedback
        setTimeout(() => {
            onConfirm(author, isTested, hasImage && includeImage);
            setIsLoading(false);
            // Reset state for next time
            setAuthor('');
            setIsTested(false);
            setIncludeImage(true);
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                 <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="share-modal-title" className="text-xl font-bold text-white">{labels.shareModalTitle}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label htmlFor="author-name" className="block text-sm font-medium text-gray-400">{labels.authorLabel}</label>
                        <div className="mt-1">
                            <input
                                id="author-name"
                                name="author"
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder={labels.authorPlaceholder}
                                className="w-full bg-gray-900 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                            />
                        </div>
                    </div>
                     <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                                id="is-tested"
                                name="is-tested"
                                type="checkbox"
                                checked={isTested}
                                onChange={(e) => setIsTested(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-600"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor="is-tested" className="font-medium text-gray-300">{labels.iTestedThis}</label>
                        </div>
                    </div>
                    {hasImage && (
                        <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                                <input
                                    id="include-image"
                                    name="include-image"
                                    type="checkbox"
                                    checked={includeImage}
                                    onChange={(e) => setIncludeImage(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-600"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="include-image" className="font-medium text-gray-300">{labels.includeTestImage}</label>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-4">
                         <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <Spinner /> : labels.confirmShare}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareModal;
