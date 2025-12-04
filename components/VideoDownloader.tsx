
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface VideoDownloaderProps {
    labels: any;
}

const VideoDownloader: React.FC<VideoDownloaderProps> = ({ labels }) => {
    // Mode: 'script' = generate python/node code | 'server' = direct download from backend
    const [toolMode, setToolMode] = useState<'script' | 'server'>('server');
    
    // Script State
    const [url, setUrl] = useState('');
    const [mode, setMode] = useState<'video' | 'audio'>('video');
    const [resolution, setResolution] = useState('1080p');
    const [scriptType, setScriptType] = useState<'python' | 'node'>('python');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Server Download State
    const [videoInfo, setVideoInfo] = useState<any>(null);
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);

    // --- Script Generation Logic ---
    const handleGenerateScript = async () => {
        if (!url.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            let prompt = "";
            
            if (scriptType === 'python') {
                prompt = `Create a robust Python script using 'yt-dlp' to download content from this URL: "${url}".
                
                Requirements:
                - Mode: ${mode === 'video' ? `Video (Target Resolution: ${resolution})` : 'Audio Only (Best Quality MP3)'}.
                - Output filename template: "%(title)s.%(ext)s".
                - Handle errors gracefully.
                - If it's a playlist, download all.
                
                Return ONLY the Python code block.`;
            } else {
                prompt = `Create a robust Node.js script to download content from this URL: "${url}".
                
                Requirements:
                - Use a popular library like 'ytdl-core' (or appropriate alternative for social media if ytdl is youtube only).
                - If the URL is YouTube, use 'ytdl-core'. If it's Instagram/TikTok, suggest using 'instagram-url-direct' or similar via 'axios' to fetch the source if possible, or explain that a specialized lib is needed.
                - Mode: ${mode === 'video' ? 'Video' : 'Audio Only'}.
                - Handle errors gracefully with try/catch.
                
                Return ONLY the JavaScript code block.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            const cleanText = response.text?.replace(/```python|```javascript|```/g, '').trim();
            setResult(cleanText || "No script generated.");
        } catch (e) {
            console.error("Error generating download script:", e);
            setError("Error generating script.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Server Download Logic ---
    const fetchVideoInfo = async () => {
        if (!url.trim()) return;
        setIsFetchingInfo(true);
        setVideoInfo(null);
        setError('');

        try {
            // Using a local backend proxy if available
            // In a real deployed scenario, this points to your Node.js backend
            const response = await fetch(`http://localhost:3001/api/video/info?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error("Backend server not reachable or invalid URL");
            }
            const data = await response.json();
            setVideoInfo(data);
        } catch (e) {
            console.error("Error fetching video info:", e);
            setError("Failed to fetch video info. Ensure backend is running and URL is valid.");
        } finally {
            setIsFetchingInfo(false);
        }
    };

    const handleServerDownload = () => {
        if (!url) return;
        // Trigger browser download via backend stream
        const downloadUrl = `http://localhost:3001/api/video/download?url=${encodeURIComponent(url)}&type=${mode}`;
        window.location.href = downloadUrl;
    };

    return (
        <section className="bg-black p-6 rounded-lg border-2 border-gray-800 font-mono text-green-400 shadow-2xl relative overflow-hidden">
            {/* Terminal Header */}
            <div className="absolute top-0 left-0 w-full bg-gray-800 h-8 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400 text-xs ml-2">user@visionary-ai:~/downloads</span>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-green-500 flex items-center gap-2">
                    <span className="animate-pulse">_</span> {labels.videoDownloaderTitle}
                </h3>

                {/* Mode Toggles */}
                <div className="flex gap-4 mb-6 border-b border-gray-800 pb-4">
                    <button 
                        onClick={() => setToolMode('server')}
                        className={`text-sm font-bold px-4 py-2 rounded ${toolMode === 'server' ? 'bg-green-900/50 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {labels.serverDownloadDirect}
                    </button>
                    <button 
                        onClick={() => setToolMode('script')}
                        className={`text-sm font-bold px-4 py-2 rounded ${toolMode === 'script' ? 'bg-green-900/50 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {labels.serverDownloadScript}
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">TARGET_URL:</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-gray-900 border border-green-900 text-green-300 rounded-sm p-3 focus:outline-none focus:border-green-500 transition-colors placeholder-gray-700"
                        />
                    </div>

                    {/* Common Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">{labels.downloadModeLabel}:</label>
                            <select 
                                value={mode}
                                onChange={(e) => setMode(e.target.value as 'video' | 'audio')}
                                className="w-full bg-gray-900 border border-green-900 text-green-300 rounded-sm p-2 focus:outline-none focus:border-green-500"
                            >
                                <option value="video">{labels.downloadModeVideo}</option>
                                <option value="audio">{labels.downloadModeAudio}</option>
                            </select>
                        </div>
                        
                        {toolMode === 'script' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">{labels.scriptTypeLabel}:</label>
                                <select 
                                    value={scriptType}
                                    onChange={(e) => setScriptType(e.target.value as 'python' | 'node')}
                                    className="w-full bg-gray-900 border border-green-900 text-green-300 rounded-sm p-2 focus:outline-none focus:border-green-500"
                                >
                                    <option value="python">Python (Recommended)</option>
                                    <option value="node">Node.js (JavaScript)</option>
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* Action Buttons based on Mode */}
                    {toolMode === 'server' ? (
                        <div>
                            <button
                                onClick={fetchVideoInfo}
                                disabled={isFetchingInfo || !url.trim()}
                                className="w-full py-3 bg-blue-900/30 border border-blue-600 hover:bg-blue-800/50 text-blue-400 font-bold rounded-sm uppercase tracking-widest transition-all mb-4"
                            >
                                {isFetchingInfo ? <Spinner /> : `> ${labels.fetchInfo}`}
                            </button>

                            {videoInfo && (
                                <div className="bg-gray-900 p-4 border border-green-700 rounded animate-fade-in">
                                    <div className="flex gap-4">
                                        {videoInfo.thumbnail && (
                                            <img src={videoInfo.thumbnail} alt="Thumb" className="w-32 h-auto object-cover border border-gray-700" />
                                        )}
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold text-lg mb-1">{videoInfo.title}</h4>
                                            <p className="text-gray-400 text-xs mb-2">
                                                {labels.duration}: {videoInfo.duration} | Ext: {videoInfo.platform}
                                            </p>
                                            <button
                                                onClick={handleServerDownload}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded transition-colors"
                                            >
                                                {labels.downloadNow}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerateScript}
                            disabled={isLoading || !url.trim()}
                            className="w-full py-3 bg-green-900/30 border border-green-600 hover:bg-green-800/50 text-green-400 font-bold rounded-sm uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        >
                            {isLoading ? <Spinner /> : `> EXECUTE GENERATE_SCRIPT --${scriptType.toUpperCase()}`}
                        </button>
                    )}
                </div>

                {/* Script Output Area */}
                {(result || error) && toolMode === 'script' && (
                    <div className="mt-8 border-t border-gray-800 pt-6 animate-fade-in">
                        {error && <p className="text-red-500 bg-red-900/20 p-2 border border-red-900">ERROR: {error}</p>}
                        {result && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-full min-h-[300px] bg-gray-900 p-1 rounded border border-gray-700">
                                    <CodeBlock code={result} />
                                </div>
                                
                                <div className="bg-gray-900 p-4 rounded border border-gray-700 text-sm space-y-4 font-sans text-gray-300">
                                    <h4 className="font-bold text-white text-lg border-b border-gray-600 pb-2 mb-4">
                                        Terminal Instructions
                                    </h4>
                                    
                                    {scriptType === 'python' ? (
                                        <>
                                            <div>
                                                <span className="text-green-400 font-mono font-bold mr-2">$</span>
                                                <span>Install Library:</span>
                                                <div className="mt-1 bg-black p-2 rounded font-mono text-green-400 text-xs border border-gray-800">
                                                    pip install yt-dlp
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-green-400 font-mono font-bold mr-2">$</span>
                                                <span>Run Script:</span>
                                                <div className="mt-1 bg-black p-2 rounded font-mono text-green-400 text-xs border border-gray-800">
                                                    python download.py
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="text-green-400 font-mono font-bold mr-2">$</span>
                                                <span>Init Project:</span>
                                                <div className="mt-1 bg-black p-2 rounded font-mono text-green-400 text-xs border border-gray-800">
                                                    npm init -y
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-green-400 font-mono font-bold mr-2">$</span>
                                                <span>Install Dependencies:</span>
                                                <div className="mt-1 bg-black p-2 rounded font-mono text-green-400 text-xs border border-gray-800">
                                                    npm install ytdl-core fs
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-green-400 font-mono font-bold mr-2">$</span>
                                                <span>Run Script:</span>
                                                <div className="mt-1 bg-black p-2 rounded font-mono text-green-400 text-xs border border-gray-800">
                                                    node download.js
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded text-xs text-blue-200">
                                        <strong>Tip:</strong> Copy the code on the left, save it as a file (e.g., <code>download.{scriptType === 'python' ? 'py' : 'js'}</code>), and run the commands above in your computer's terminal.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Server Mode Error Display */}
                {toolMode === 'server' && error && (
                     <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded text-sm text-red-300">
                        ERROR: {error}
                    </div>
                )}
            </div>
        </section>
    );
};

export default VideoDownloader;
