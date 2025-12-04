
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SOCIAL_TOOLS_LABELS } from '../constants';
import { FacebookPost } from '../types';
import Spinner from './Spinner';
import SocialAnalysisModal from './SocialAnalysisModal';

interface FacebookToolProps {
    labels: any;
}

const FacebookTool: React.FC<FacebookToolProps> = ({ labels }) => {
    const t = SOCIAL_TOOLS_LABELS[labels.language || 'en'] || SOCIAL_TOOLS_LABELS['en'];
    
    const [token, setToken] = useState('');
    const [posts, setPosts] = useState<FacebookPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState('');

    // Mock Data for Demo
    const mockPosts: FacebookPost[] = [
        { 
            id: '1', 
            message: 'Excited to announce our new product line! Check it out. #innovation #tech', 
            created_time: new Date().toISOString(), 
            full_picture: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
            shares: { count: 45 }
        },
        { 
            id: '2', 
            message: 'Community update: We reached 10k followers! Thank you all for the support.', 
            created_time: new Date(Date.now() - 86400000).toISOString(),
            shares: { count: 120 } 
        },
        { 
            id: '3', 
            message: 'Just a quick thought: AI is changing everything faster than we expected. What do you think?', 
            created_time: new Date(Date.now() - 172800000).toISOString(),
            shares: { count: 12 }
        }
    ];

    const fetchFacebookPosts = async () => {
        if (!token) return;
        setLoading(true);
        setIsDemo(false);
        try {
            const fields = "id,message,created_time,permalink_url,full_picture,shares,attachments";
            const url = `https://graph.facebook.com/me/feed?fields=${fields}&access_token=${token}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.data) {
                setPosts(data.data);
            } else {
                console.error("Facebook API Error:", data);
                alert("Error fetching posts. Check your token or permissions.");
            }
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDemo = () => {
        setIsDemo(true);
        setPosts(mockPosts);
    };

    const analyzePostWithAI = async (post: FacebookPost) => {
        setAnalyzing(true);
        setCurrentAnalysis('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `Act as a Social Media Strategist. Analyze this Facebook post:
            
            Content: "${post.message || '[No text content]'}"
            Posted at: ${post.created_time}
            Has Image: ${post.full_picture ? 'Yes' : 'No'}
            Shares: ${post.shares?.count || 0}
            
            Please provide a detailed report including:
            1. **Sentiment Analysis**: What is the emotional tone?
            2. **Engagement Prediction**: Why did it perform this way?
            3. **Improvement Strategy**: 3 specific actionable tips to improve reach or engagement for similar future posts.
            4. **Hashtag Suggestions**: 5 relevant hashtags for Facebook.
            
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
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                    {t.fbFeedTitle}
                </h2>
                <p className="text-gray-400 mt-2">{t.fbFeedDesc}</p>
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
                            className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t.tokenHelp}</p>
                    </div>
                    <button 
                        onClick={fetchFacebookPosts}
                        disabled={!token || loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-md disabled:opacity-50 transition-all"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg flex flex-col h-full">
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                <span className="text-xs text-gray-400">{new Date(post.created_time).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1 text-xs text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                    </svg>
                                    {post.shares ? post.shares.count : 0} Shares
                                </div>
                            </div>
                            
                            {post.full_picture && (
                                <div className="w-full h-48 bg-black">
                                    <img src={post.full_picture} alt="Post content" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="p-4 flex-grow">
                                <p className="text-gray-300 text-sm line-clamp-4">
                                    {post.message || <span className="italic text-gray-500">No text content</span>}
                                </p>
                            </div>

                            <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-lg">
                                <button 
                                    onClick={() => analyzePostWithAI(post)}
                                    disabled={analyzing}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-bold disabled:opacity-50"
                                >
                                    {analyzing ? <Spinner /> : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                                            </svg>
                                            {t.analyzeBtn}
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

export default FacebookTool;
