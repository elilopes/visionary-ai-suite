import type { SharedPrompt, VoteType } from './types';

const STORAGE_KEY = 'community-prompts';

// CONFIGURATION
// Set this to true when you have the Node.js + MySQL server running locally
const USE_API_BACKEND = false; 
const API_URL = 'http://localhost:3001/api';

// --- Helper Functions for Local Storage (Legacy/Demo Mode) ---

const getStoredPrompts = (): SharedPrompt[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse community prompts from localStorage", error);
        return [];
    }
};

const setStoredPrompts = (prompts: SharedPrompt[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch (error) {
        console.error("Failed to save community prompts to localStorage", error);
    }
};

// --- Public API Functions (Now Async) ---

export const getSharedPrompts = async (sortBy: 'new' | 'popular' = 'new'): Promise<SharedPrompt[]> => {
    if (USE_API_BACKEND) {
        try {
            const response = await fetch(`${API_URL}/prompts`);
            if (!response.ok) throw new Error('Network response was not ok');
            const prompts: SharedPrompt[] = await response.json();
            
            if (sortBy === 'popular') {
                return prompts.sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down));
            }
            // Default is new (descending by createdAt), which the SQL query usually handles, but sorting here allows safety
            return prompts.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    } else {
        // Local Storage Simulation
        return new Promise((resolve) => {
            const prompts = getStoredPrompts();
            let sorted = [];
            if (sortBy === 'popular') {
                sorted = prompts.sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down));
            } else {
                sorted = prompts.sort((a, b) => b.createdAt - a.createdAt);
            }
            resolve(sorted);
        });
    }
};

export const saveSharedPrompt = async (newPromptData: Omit<SharedPrompt, 'id' | 'createdAt' | 'votes' | 'communityTestedCount'>): Promise<void> => {
    const newPrompt: SharedPrompt = {
        ...newPromptData,
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        votes: { up: 0, down: 0 },
        communityTestedCount: 0,
    };

    if (USE_API_BACKEND) {
        try {
            await fetch(`${API_URL}/prompts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPrompt)
            });
        } catch (error) {
            console.error("API Error saving prompt:", error);
        }
    } else {
        // Local Storage
        return new Promise((resolve) => {
            const prompts = getStoredPrompts();
            prompts.unshift(newPrompt);
            setStoredPrompts(prompts);
            resolve();
        });
    }
};

export const updatePromptVote = async (promptId: string, voteType: VoteType): Promise<void> => {
    if (USE_API_BACKEND) {
        try {
            await fetch(`${API_URL}/prompts/${promptId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: voteType })
            });
        } catch (error) {
            console.error("API Error voting:", error);
        }
    } else {
        return new Promise((resolve) => {
            const prompts = getStoredPrompts();
            const promptIndex = prompts.findIndex(p => p.id === promptId);
            if (promptIndex !== -1) {
                prompts[promptIndex].votes[voteType]++;
                setStoredPrompts(prompts);
            }
            resolve();
        });
    }
};

export const incrementCommunityTested = async (promptId: string): Promise<void> => {
    if (USE_API_BACKEND) {
         try {
            await fetch(`${API_URL}/prompts/${promptId}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("API Error incrementing test:", error);
        }
    } else {
        return new Promise((resolve) => {
            const prompts = getStoredPrompts();
            const promptIndex = prompts.findIndex(p => p.id === promptId);
            if (promptIndex !== -1) {
                prompts[promptIndex].communityTestedCount++;
                setStoredPrompts(prompts);
            }
            resolve();
        });
    }
};
