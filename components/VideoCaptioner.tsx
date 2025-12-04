
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface VideoCaptionerProps {
    labels: any;
}

const VideoCaptioner: React.FC<VideoCaptionerProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult('');
            setError('');
        }
    };

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            const prompt = `Analyze this video and generate subtitles for it in standard SRT format. 
            Include the timecodes. Ensure the text matches the spoken audio exactly.
            Return ONLY the SRT content.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [filePart, { text: prompt }]
                }
            });
            setResult(response.text || "No captions generated.");
        } catch (e) {
            console.error("Error generating captions:", e);
            setError("Error analyzing video. Ensure it is under 20MB/1min for this demo, or check API limits.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'captions.srt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-indigo-400">{labels.captionerTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.captionerDescription}</p>

            <div className="space-y-4">
                <input 
                    type="file" 
                    accept="video/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-700"
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : labels.generate}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-2">
                            <div className="h-64 bg-black/50 p-2 rounded overflow-auto">
                                <CodeBlock code={result} />
                            </div>
                            <button 
                                onClick={handleDownload}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold w-full"
                            >
                                {labels.download} .SRT
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default VideoCaptioner;
