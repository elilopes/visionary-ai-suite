
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface MindMapGeneratorProps {
    labels: any;
}

const MindMapGenerator: React.FC<MindMapGeneratorProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Create a Mind Map for the following topic: "${input}".
            Return ONLY valid Mermaid.js code for a mindmap (starting with 'mindmap'). 
            Do not include markdown formatting like \`\`\`mermaid or \`\`\`. Just the code.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text.replace(/```mermaid|```/g, '').trim());
        } catch (e) {
            console.error("Error generating mind map:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.mindMapTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.mindMapDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="mindmap-input"
                    label="Central Topic"
                    value={input}
                    placeholder={labels.mindMapPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.mindMapButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div className="h-64"><CodeBlock code={result} /></div>
                            <p className="text-xs text-gray-500">Copy this code and paste it into <a href="https://mermaid.live" target="_blank" className="text-purple-400 hover:underline">Mermaid Live Editor</a> to visualize.</p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default MindMapGenerator;
