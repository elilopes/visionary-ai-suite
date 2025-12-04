
import React, { useState, useEffect, useCallback } from 'react';
import PromptCard from './PromptCard';
import type { SharedPrompt } from '../types';
import { getSharedPrompts, updatePromptVote, incrementCommunityTested } from '../communityApi';
import Spinner from './Spinner';
import GoogleAd from './GoogleAd';

interface CommunityFeedProps {
    labels: any;
    onUsePrompt: (prompt: SharedPrompt) => void;
}

type SortType = 'new' | 'popular';

interface SortButtonProps {
    sortType: SortType;
    label: string;
    activeSort: SortType;
    onClick: (sortType: SortType) => void;
}

const SortButton: React.FC<SortButtonProps> = ({ sortType, label, activeSort, onClick }) => (
    <button
        onClick={() => onClick(sortType)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
            ${activeSort === sortType
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
    >
        {label}
    </button>
);

interface EmptyStateProps {
  labels: any;
}

const EmptyState: React.FC<EmptyStateProps> = ({ labels }) => (
    <div className="text-center py-12 px-6 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">
        <h3 className="text-xl font-semibold text-indigo-400 mb-2">{labels.communityFeatureTitle}</h3>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6">{labels.communityFeatureDescription}</p>
        <div className="bg-gray-800 p-4 rounded-lg max-w-2xl mx-auto">
            <h4 className="font-bold text-teal-400">{labels.proTip}</h4>
            <p className="text-sm text-gray-300 mt-1">{labels.proTipDescription}</p>
        </div>
         <p className="mt-8 text-gray-500">{labels.noCommunityPrompts}</p>
    </div>
);

const CommunityFeed: React.FC<CommunityFeedProps> = ({ labels, onUsePrompt }) => {
    const [prompts, setPrompts] = useState<SharedPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSort, setActiveSort] = useState<SortType>('new');
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const forceUpdate = () => setUpdateTrigger(prev => prev + 1);

    const fetchPrompts = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedPrompts = await getSharedPrompts(activeSort);
            setPrompts(fetchedPrompts);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activeSort]);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts, updateTrigger]);
    
    const handleVote = async (promptId: string, voteType: 'up' | 'down') => {
        // Optimistic update (optional, but good for UX) or just wait for refresh
        await updatePromptVote(promptId, voteType);
        forceUpdate(); 
    };

    const handleTested = async (promptId: string) => {
        await incrementCommunityTested(promptId);
        forceUpdate();
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <div className="flex justify-center items-center gap-4 mb-8">
                <SortButton sortType="new" label={labels.newestPrompts} activeSort={activeSort} onClick={setActiveSort} />
                <SortButton sortType="popular" label={labels.popularPrompts} activeSort={activeSort} onClick={setActiveSort} />
            </div>

            {/* Sponsored Content Area */}
            <GoogleAd 
                slot="0987654321" // Replace with real slot ID
                testMode={true}
                format="horizontal"
                className="mb-8"
            />

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                </div>
            ) : prompts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prompts.map(prompt => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            labels={labels}
                            onVote={handleVote}
                            onTested={handleTested}
                            onUsePrompt={onUsePrompt}
                        />
                    ))}
                </div>
            ) : (
               <EmptyState labels={labels} />
            )}
        </div>
    );
};

export default CommunityFeed;
