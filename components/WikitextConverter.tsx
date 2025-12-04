
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface WikitextConverterProps {
    labels: any;
}

const WikitextConverter: React.FC<WikitextConverterProps> = ({ labels }) => {
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
            const prompt = `Convert the following text into Wikipedia Wikitext format (MediaWiki syntax).
            - Use '''bold''' for the first occurrence of the subject.
            - Use [[links]] for relevant terms.
            - Use == Headings == for sections.
            - Use * for lists.
            - Do not include any preamble or markdown formatting blocks (like \`\`\`), just the raw wikitext.
            
            Text: "${input}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text || "No text generated.");
        } catch (e) {
            console.error("Error converting wikitext:", e);
            setError("Error converting text.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-gray-200">{labels.wikitextTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.wikitextDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="wikitext-input"
                    label="Plain Text"
                    value={input}
                    placeholder={labels.wikitextPlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : labels.wikitextButton}
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

export default WikitextConverter;
