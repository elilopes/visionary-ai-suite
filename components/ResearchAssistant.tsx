import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface ResearchAssistantProps {
    labels: any;
}

const ResearchAssistant: React.FC<ResearchAssistantProps> = ({ labels }) => {
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResearch = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as a research assistant. Provide a concise summary, a few key points (as bullet points), and suggest 2-3 potential sources or authors for further reading on the following topic: "${topic}"`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error with research assistant:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.researchAssistantTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.researchAssistantDescription}</p>
            
            <div className="space-y-4">
                <TextArea
                    id="research-topic"
                    label={labels.researchAssistantInputLabel}
                    value={topic}
                    placeholder={labels.researchAssistantPlaceholder}
                    onChange={setTopic}
                />
                <button
                    onClick={handleResearch}
                    disabled={isLoading || !topic.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.researchAssistantButtonLoading : labels.researchAssistantButton}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <p className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-md">{result}</p>}
                </div>
            )}
        </section>
    );
};

export default ResearchAssistant;