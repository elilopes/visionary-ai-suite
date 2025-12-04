
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface VideoConverterProps {
    labels: any;
}

const VideoConverter: React.FC<VideoConverterProps> = ({ labels }) => {
    const [sourceFormat, setSourceFormat] = useState('mp4');
    const [targetFormat, setTargetFormat] = useState('gif');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const conversions = [
        { src: 'gif', tgt: 'mp4' },
        { src: 'mp4', tgt: 'gif' },
        { src: 'wmv', tgt: 'mp4' },
        { src: 'mp4', tgt: 'mkv' },
        { src: 'mp4', tgt: 'webm' },
        { src: 'webm', tgt: 'mp4' }
    ];

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `Create a robust FFmpeg command line script to convert a video file from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}.
            Include comments explaining what the flags do.
            Optimize for high quality and compatibility.
            Also provide a simple Python script using 'moviepy' library to do the same thing as an alternative.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setResult(response.text || "No script generated.");
        } catch (e) {
            console.error("Error generating script:", e);
            setError("Error generating conversion script.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-orange-400">{labels.converterTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.converterDescription}</p>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{labels.sourceFormat}</label>
                        <select 
                            value={sourceFormat}
                            onChange={(e) => setSourceFormat(e.target.value)}
                            className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-2"
                        >
                            {['mp4', 'gif', 'wmv', 'webm'].map(f => (
                                <option key={f} value={f}>{f.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{labels.targetFormat}</label>
                        <select 
                            value={targetFormat}
                            onChange={(e) => setTargetFormat(e.target.value)}
                            className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-2"
                        >
                            {['gif', 'mp4', 'mkv', 'webm'].map(f => (
                                <option key={f} value={f}>{f.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : labels.generate}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="h-64 bg-black/50 p-2 rounded overflow-auto">
                            <CodeBlock code={result} />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default VideoConverter;
