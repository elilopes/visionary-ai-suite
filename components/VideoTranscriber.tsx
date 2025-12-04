
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface VideoTranscriberProps {
    labels: any;
}

const VideoTranscriber: React.FC<VideoTranscriberProps> = ({ labels }) => {
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
            
            const prompt = `Transcribe the audio from this video into clear, readable text. Identify speakers if possible.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [filePart, { text: prompt }]
                }
            });
            setResult(response.text || "No transcription generated.");
        } catch (e) {
            console.error("Error transcribing video:", e);
            setError("Error analyzing video. File might be too large or format unsupported.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-teal-400">{labels.transcriberTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.transcriberDescription}</p>

            <div className="space-y-4">
                <input 
                    type="file" 
                    accept="video/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-teal-600 file:text-white
                    hover:file:bg-teal-700"
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : labels.generate}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="text-gray-300 whitespace-pre-wrap bg-black/30 p-4 rounded-md max-h-96 overflow-y-auto">
                            {result}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default VideoTranscriber;
