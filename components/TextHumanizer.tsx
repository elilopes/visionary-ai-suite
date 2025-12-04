
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface TextHumanizerProps {
    labels: any;
}

const TextHumanizer: React.FC<TextHumanizerProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleHumanize = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Rewrite the following text to sound more human. 
            - Vary sentence structure and length.
            - Use more natural, conversational transitions.
            - Inject mild emotion or personal tone where appropriate.
            - Remove robotic or overly repetitive phrasing.
            Text to humanize: "${input}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error humanizing text:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-teal-500/30">
            <h3 className="text-2xl font-bold mb-2 text-teal-400">{labels.textHumanizerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.textHumanizerDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="humanizer-input"
                    label="AI Text"
                    value={input}
                    placeholder={labels.textHumanizerPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleHumanize}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.textHumanizerButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <div className="h-64"><CodeBlock code={result} /></div>}
                </div>
            )}
        </section>
    );
};

export default TextHumanizer;
