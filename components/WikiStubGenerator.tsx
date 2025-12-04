
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface WikiStubGeneratorProps {
    labels: any;
}

const WikiStubGenerator: React.FC<WikiStubGeneratorProps> = ({ labels }) => {
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
            const prompt = `Write a Wikipedia stub article based on the following information: "${input}".
            - Adopt a Neutral Point of View (NPOV). Avoid promotional language, adjectives like "great", "famous", "unique" unless attributed.
            - Use Wikitext format (bolding the title, etc.).
            - Structure it as: Introduction, Section 1, References header.
            - Do not invent facts. Only use what is provided or generally known fact.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating stub:", e);
            setError("Error generating stub.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-gray-200">{labels.stubTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.stubDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="stub-input"
                    label="Topic and Facts"
                    value={input}
                    placeholder={labels.stubPlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : labels.stubButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="h-64">
                            <CodeBlock code={result} />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default WikiStubGenerator;
