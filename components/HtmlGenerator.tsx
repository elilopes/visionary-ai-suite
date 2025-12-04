
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface HtmlGeneratorProps {
    labels: any;
}

const HtmlGenerator: React.FC<HtmlGeneratorProps> = ({ labels }) => {
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
            const prompt = `Create a complete, single-file index.html (HTML5) based on this description: "${input}".
            Include internal CSS for styling (modern, responsive, Flexbox/Grid) and basic internal JS if needed. 
            The code should be ready to run.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            // Extract code block if wrapped
            const text = response.text;
            const codeMatch = text.match(/```html([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
            setResult(codeMatch ? codeMatch[1].trim() : text);

        } catch (e) {
            console.error("Error generating HTML:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-yellow-500/30">
            <h3 className="text-2xl font-bold mb-2 text-yellow-400">{labels.htmlGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.htmlGeneratorDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="html-input"
                    label="Page Description"
                    value={input}
                    placeholder={labels.htmlGeneratorPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.htmlGeneratorButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <div className="h-96"><CodeBlock code={result} /></div>}
                </div>
            )}
        </section>
    );
};

export default HtmlGenerator;
