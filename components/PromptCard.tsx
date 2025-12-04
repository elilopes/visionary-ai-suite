
import React, { useState } from 'react';
import type { SharedPrompt, VoteType } from '../types';
import CodeBlock from './CodeBlock';

interface PromptCardProps {
    prompt: SharedPrompt;
    labels: any;
    onVote: (promptId: string, voteType: VoteType) => void;
    onTested: (promptId: string) => void;
    onUsePrompt: (prompt: SharedPrompt) => void;
}

const IconButton: React.FC<{ onClick: () => void; icon: React.ReactElement; count: number; title: string; }> = ({ onClick, icon, count, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors group"
    >
        <span className="p-1.5 bg-gray-700/50 rounded-full group-hover:bg-gray-600">
            {icon}
        </span>
        <span>{count}</span>
    </button>
);

const PromptCard: React.FC<PromptCardProps> = ({ prompt, labels, onVote, onTested, onUsePrompt }) => {
    const [showJson, setShowJson] = useState(false);

    const formattedDate = new Date(prompt.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden border border-gray-700/50">
            {prompt.testImageBase64 && (
                <img
                    src={`data:image/png;base64,${prompt.testImageBase64}`}
                    alt="Test Preview"
                    className="w-full h-48 object-cover"
                />
            )}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs text-gray-400">
                            {labels.by} <span className="font-semibold text-gray-300">{prompt.author}</span>
                        </p>
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                    </div>
                    {prompt.isTestedByAuthor && (
                         <div className="flex items-center gap-1 text-xs text-teal-400 bg-teal-900/50 px-2 py-1 rounded-full" title={labels.testedByAuthor}>
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .75.75v3.542l2.623.875a.75.75 0 1 1-.5 1.414l-3-1A.75.75 0 0 1 7.25 8V2.5A.75.75 0 0 1 8 1.75ZM2.508 11.08a.75.75 0 0 1 .492.912l-.339 1.128a.75.75 0 0 1-1.402-.422l.339-1.128a.75.75 0 0 1 .91-.49Zm11.004-.49a.75.75 0 0 1 .91.49l.339 1.128a.75.75 0 1 1-1.402.422l-.339-1.128a.75.75 0 0 1 .492-.912ZM9.43 2.658a.75.75 0 0 1 .912-.492l1.128.339a.75.75 0 1 1-.422 1.402l-1.128-.339a.75.75 0 0 1-.492-.91Zm-4.324-.912a.75.75 0 0 1 .492.912l-1.128.339a.75.75 0 0 1-.422-1.402l1.128-.339a.75.75 0 0 1 .91-.492Z" clipRule="evenodd" /></svg>
                             <span>{labels.testedByAuthor}</span>
                        </div>
                    )}
                </div>

                <div className="my-4 border-t border-gray-700/50">
                     <button
                        onClick={() => setShowJson(!showJson)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 mt-2"
                    >
                        {showJson ? labels.hidePrompt : labels.showPrompt}
                    </button>
                    {showJson && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-md">
                           <CodeBlock code={prompt.promptJson} />
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <IconButton 
                            onClick={() => onVote(prompt.id, 'up')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-pink-400"><path d="M7.435 2.339a1.5 1.5 0 0 1 1.13 0l4.053 2.29a1.5 1.5 0 0 1 .82 1.325v4.452a1.5 1.5 0 0 1-.82 1.325l-4.053 2.29a1.5 1.5 0 0 1-1.13 0l-4.053-2.29a1.5 1.5 0 0 1-.82-1.325V5.954a1.5 1.5 0 0 1 .82-1.325L7.435 2.34Z" /></svg>}
                            count={prompt.votes.up}
                            title={labels.amei}
                        />
                         <IconButton 
                            onClick={() => onVote(prompt.id, 'down')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-gray-500"><path d="M4.707 5.293a1 1 0 0 0-1.414 1.414L6.586 10l-3.293 3.293a1 1 0 1 0 1.414 1.414L8 11.414l3.293 3.293a1 1 0 0 0 1.414-1.414L9.414 10l3.293-3.293a1 1 0 0 0-1.414-1.414L8 8.586 4.707 5.293Z" /></svg>}
                            count={prompt.votes.down}
                            title={labels.naoGostei}
                        />
                         <IconButton 
                            onClick={() => onTested(prompt.id)}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-blue-400"><path fillRule="evenodd" d="M3.75 2a.75.75 0 0 0-1.5 0v1.144c-.755.23-1.3.82-1.3 1.522V6.25c0 .774.634 1.422 1.422 1.536A3.012 3.012 0 0 0 5 8.75a3.012 3.012 0 0 0 .128 1.036C4.316 9.898 3.682 10.546 3 10.75v1.57c0 .702.545 1.292 1.3 1.522V15.5a.75.75 0 0 0 1.5 0v-1.144c.755-.23 1.3-.82 1.3-1.522V11.25c0-.774-.634-1.422-1.422-1.536A3.012 3.012 0 0 0 5 8.75a3.012 3.012 0 0 0-.128-1.036C5.684 7.602 6.318 6.954 7 6.75V5.18c0-.702-.545-1.292-1.3-1.522V2.5a.75.75 0 0 0-1.5 0v.644c-.18.046-.356.1-.525.162A2.002 2.002 0 0 1 5 4.25c0 .546.216 1.048.57 1.418.177.185.38.344.596.472v.11a.75.75 0 0 0 1.5 0v-.11c.216-.128.42-.287.596-.472.354-.37.57-.872.57-1.418a2.002 2.002 0 0 1-1.045-1.444A3.492 3.492 0 0 0 6.25 2.644V2ZM12.5 8a.5.5 0 0 1 .5.5v5a.5.5 0 0 1 -1 0v-5a.5.5 0 0 1 .5-.5Z" clipRule="evenodd" /></svg>}
                            count={prompt.communityTestedCount}
                            title={labels.iTestedIt}
                        />
                    </div>
                     <button
                        onClick={() => onUsePrompt(prompt)}
                        className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors"
                    >
                        {labels.usePrompt}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptCard;
