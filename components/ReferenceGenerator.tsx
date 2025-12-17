import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface ReferenceGeneratorProps {
    labels: any;
}

const ReferenceGenerator: React.FC<ReferenceGeneratorProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');
        setGroundingChunks([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert academic librarian. For the following phrase or topic: "${input}", provide a list of 5-7 high-quality bibliographic references.
            
            Categorize the results into:
            1. **Books**: Title, Author, Year (Standard format).
            2. **Academic Articles/PDFs**: Title, Journal, Author (Mention if a PDF might exist).
            3. **Reliable Websites**: Title, Organization/Author.
            
            Format the references in APA or ABNT style.
            IMPORTANT: Ensure the sources are real and widely recognized. Do not halluncinate fake URLs, just provide the titles/authors so the user can search for them.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            setResult(response.text || "No references found.");
            
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                setGroundingChunks(response.candidates[0].groundingMetadata.groundingChunks);
            }

        } catch (e) {
            console.error("Error generating references:", e);
            setError("Error generating references.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <h3 className="text-2xl font-bold text-indigo-400">{labels.referenceGeneratorTitle}</h3>
            </div>
            <p className="text-gray-400 mb-6">{labels.referenceGeneratorDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="reference-input"
                    label={labels.referenceGeneratorInputLabel}
                    value={input}
                    placeholder={labels.referenceGeneratorPlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.referenceGeneratorButtonLoading : labels.referenceGeneratorButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div className="text-gray-300 prose prose-invert bg-gray-900/50 p-4 rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />
                            
                            {groundingChunks.length > 0 && (
                                <div className="mt-4 bg-gray-800/50 p-4 rounded-lg">
                                    <h5 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                        Found Online Sources (Verification):
                                    </h5>
                                    <ul className="space-y-2">
                                        {groundingChunks.map((chunk, idx) => {
                                            if (chunk.web?.uri && chunk.web?.title) {
                                                return (
                                                    <li key={idx}>
                                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline text-xs flex items-start gap-2 transition-colors">
                                                            <span className="text-indigo-500 mt-0.5">•</span>
                                                            <span>{chunk.web.title}</span>
                                                        </a>
                                                    </li>
                                                );
                                            }
                                            return null;
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ReferenceGenerator;