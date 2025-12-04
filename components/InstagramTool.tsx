
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { SOCIAL_TOOLS_LABELS } from '../constants';
import { InstagramPost } from '../types';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface InstagramToolProps {
    labels: any;
}

const InstagramTool: React.FC<InstagramToolProps> = ({ labels }) => {
    const t = SOCIAL_TOOLS_LABELS[labels.language || 'en'] || SOCIAL_TOOLS_LABELS['en'];
    
    const [token, setToken] = useState('');
    const [posts, setPosts] = useState<InstagramPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ id: string, text: string } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    // Mock Data for Demo
    const mockPosts: InstagramPost[] = [
        { id: '1', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a', permalink: '#', timestamp: new Date().toISOString(), caption: 'Morning coffee vibes ☕ #coffee #morning' },
        { id: '2', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', permalink: '#', timestamp: new Date().toISOString(), caption: 'Team meeting at the office 🚀' },
        { id: '3', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec', permalink: '#', timestamp: new Date().toISOString(), caption: 'Marketing strategy planning 📊' },
        { id: '4', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1493612276216-ee3925520721', permalink: '#', timestamp: new Date().toISOString(), caption: 'Product launch day! 🎉' }
    ];

    const fetchInstagramMedia = async () => {
        if (!token) return;
        setLoading(true);
        setIsDemo(false);
        try {
            const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username";
            const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${token}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.data) {
                setPosts(data.data);
            } else {
                console.error("Instagram API Error:", data);
                alert("Error fetching posts. Check your token.");
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

    const analyzePostWithAI = async (post: InstagramPost, mode: 'caption' | 'analysis') => {
        setAnalyzing(true);
        setAiAnalysis(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // For real integration, we'd fetch the image blob. For demo/url, we send the URL if supported or text.
            // Since 2.5 flash supports image URLs via some integrations, but safely here we will rely on text description or image bytes if we had them.
            // Simplified: Analyze the caption and metadata.
            
            let prompt = "";
            if (mode === 'caption') {
                prompt = `Act as a Social Media Manager. Rewrite this caption to be more engaging, include trending hashtags, and improve emoji usage. Current caption: "${post.caption || 'No caption'}". Context: Posted at ${post.timestamp}.`;
            } else {
                prompt = `Analyze this post for potential engagement. Based on the caption "${post.caption || 'No caption'}" and the time ${post.timestamp}. Suggest 3 ways to improve engagement for the next post.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setAiAnalysis({ id: post.id, text: response.text });

        } catch (error) {
            console.error("AI Analysis Error:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    {t.instaFeedTitle}
                </h2>
                <p className="text-gray-400 mt-2">{t.instaFeedDesc}</p>
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
                            className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-3 focus:ring-pink-500 focus:border-pink-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t.tokenHelp}</p>
                    </div>
                    <button 
                        onClick={fetchInstagramMedia}
                        disabled={!token || loading}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-md disabled:opacity-50 transition-all"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-pink-500/50 transition-all shadow-lg group">
                            <div className="relative aspect-square bg-black">
                                {post.media_type === 'VIDEO' ? (
                                    <video src={post.media_url} controls className="w-full h-full object-cover" />
                                ) : (
                                    <img src={post.media_url} alt={post.caption} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                    {new Date(post.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                <p className="text-sm text-gray-300 line-clamp-3 h-12">
                                    {post.caption || "No caption"}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button 
                                        onClick={() => analyzePostWithAI(post, 'caption')}
                                        className="text-xs bg-gray-700 hover:bg-pink-600 text-white py-2 rounded transition-colors"
                                    >
                                        ✨ {t.captionBtn}
                                    </button>
                                    <button 
                                        onClick={() => analyzePostWithAI(post, 'analysis')}
                                        className="text-xs bg-gray-700 hover:bg-purple-600 text-white py-2 rounded transition-colors"
                                    >
                                        📊 {t.analyzeBtn}
                                    </button>
                                </div>
                            </div>

                            {/* AI Analysis Overlay */}
                            {aiAnalysis && aiAnalysis.id === post.id && (
                                <div className="p-4 bg-gray-900 border-t border-gray-700 text-sm animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-pink-400">AI Insight</h4>
                                        <button onClick={() => setAiAnalysis(null)} className="text-gray-500 hover:text-white">&times;</button>
                                    </div>
                                    {analyzing ? (
                                        <div className="flex justify-center py-4"><Spinner /></div>
                                    ) : (
                                        <div className="text-gray-300 max-h-32 overflow-y-auto custom-scrollbar">
                                            <CodeBlock code={aiAnalysis.text} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-800">
                    <p>{t.noPosts}</p>
                </div>
            )}
        </div>
    );
};

export default InstagramTool;
