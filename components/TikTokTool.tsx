
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SOCIAL_TOOLS_LABELS } from '../constants';
import { TikTokPost } from '../types';
import Spinner from './Spinner';
import SocialAnalysisModal from './SocialAnalysisModal';

interface TikTokToolProps {
    labels: any;
}

const TikTokTool: React.FC<TikTokToolProps> = ({ labels }) => {
    const t = SOCIAL_TOOLS_LABELS[labels.language || 'en'] || SOCIAL_TOOLS_LABELS['en'];
    
    const [token, setToken] = useState('');
    const [posts, setPosts] = useState<TikTokPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState('');

    // Mock Data for Demo
    const mockPosts: TikTokPost[] = [
        { 
            id: '1', 
            desc: 'Trying the new viral dance challenge! 💃 #dance #viral #trending', 
            createTime: Date.now() / 1000, 
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happy-in-a-field-of-flowers-4663-large.mp4', // Placeholder
            coverUrl: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8',
            author: 'dance_queen',
            stats: { plays: 150000, digg: 25000, comment: 1200, share: 5000 }
        },
        { 
            id: '2', 
            desc: '5 Tips to stay productive working from home 🏠✨ #productivity #wfh #tips', 
            createTime: (Date.now() - 86400000) / 1000,
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-her-laptop-at-home-436-large.mp4',
            coverUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
            author: 'prod_guru',
            stats: { plays: 8500, digg: 1200, comment: 45, share: 80 }
        }
    ];

    const fetchTikTokPosts = async () => {
        // Real TikTok API requires complex OAuth & signatures. 
        // We simulate the fetch or use the demo for this frontend-focused suite.
        if (!token) return;
        setLoading(true);
        setIsDemo(false);
        
        // Simulating API delay
        setTimeout(() => {
            setLoading(false);
            alert("To fetch real TikTok data, a backend proxy with valid OAuth signatures is required. Loading Demo data for now.");
            setIsDemo(true);
            setPosts(mockPosts);
        }, 1500);
    };

    const loadDemo = () => {
        setIsDemo(true);
        setPosts(mockPosts);
    };

    const analyzeVideoWithAI = async (post: TikTokPost) => {
        setAnalyzing(true);
        setCurrentAnalysis('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `Act as a TikTok Viral Expert. Analyze this video post data:
            
            Description: "${post.desc}"
            Views: ${post.stats.plays}
            Likes: ${post.stats.digg}
            Shares: ${post.stats.share}
            
            Please provide a "Viral Audit":
            1. **Hook Analysis**: Is the description/hook strong?
            2. **Engagement Rate**: Calculate approximate engagement rate ((Likes+Comments+Shares)/Views) and rate it.
            3. **Trend Potential**: Does this content leverage current trends?
            4. **Next Video Idea**: Suggest a follow-up video concept based on this one.
            
            Format the output clearly.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setCurrentAnalysis(response.text || "No analysis generated.");
            setIsModalOpen(true);

        } catch (error) {
            console.error("AI Analysis Error:", error);
            alert("Failed to analyze post.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-black">
                    {t.tiktokFeedTitle}
                </h2>
                <p className="text-gray-400 mt-2">{t.tiktokFeedDesc}</p>
            </header>

            {/* Auth / Input Section */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t.inputToken}</label>
                        <input 
                            type="text" 
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder={t.tokenPlaceholder}
                            className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-3 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t.tokenHelp}</p>
                    </div>
                    <button 
                        onClick={fetchTikTokPosts}
                        disabled={!token || loading}
                        className="px-6 py-3 bg-gradient-to-r from-black to-teal-600 hover:from-gray-800 hover:to-teal-700 text-white font-bold rounded-md disabled:opacity-50 transition-all border border-gray-700"
                    >
                        {loading ? <Spinner /> : t.fetch}
                    </button>
                    <button 
                        onClick={loadDemo}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-md transition-colors border border-gray-600"
                    >
                        {t.loadDemo}
                    </button>
                </div>
                {isDemo && (
                    <div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-200 text-sm text-center">
                        ⚠️ {t.demoMode}
                    </div>
                )}
            </div>

            {/* Feed Grid */}
            {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-black rounded-xl border border-gray-800 shadow-lg flex flex-col h-full overflow-hidden relative group">
                            {/* Video Cover / Placeholder */}
                            <div className="aspect-[9/16] bg-gray-800 relative">
                                <img src={post.coverUrl} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white font-bold drop-shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    {post.stats.plays.toLocaleString()}
                                </div>
                            </div>

                            <div className="p-4 flex-grow flex flex-col">
                                <p className="text-gray-300 text-xs font-bold mb-1">@{post.author}</p>
                                <p className="text-white text-sm line-clamp-2 mb-3">
                                    {post.desc}
                                </p>
                                
                                <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-gray-400 border-t border-gray-800 pt-3">
                                    <div className="text-center">
                                        <span className="block text-white font-bold">{post.stats.digg}</span>
                                        Likes
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-white font-bold">{post.stats.comment}</span>
                                        Cmts
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-white font-bold">{post.stats.share}</span>
                                        Shares
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-900 border-t border-gray-800">
                                <button 
                                    onClick={() => analyzeVideoWithAI(post)}
                                    disabled={analyzing}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors text-sm font-bold disabled:opacity-50"
                                >
                                    {analyzing ? <Spinner /> : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                            </svg>
                                            {t.viralCheckBtn}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-800">
                    <p>{t.noPosts}</p>
                </div>
            )}

            <SocialAnalysisModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                content={currentAnalysis}
                labels={t}
            />
        </div>
    );
};

export default TikTokTool;