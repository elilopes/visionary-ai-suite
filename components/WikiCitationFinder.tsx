
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface WikiCitationFinderProps {
    labels: any;
}

const WikiCitationFinder: React.FC<WikiCitationFinderProps> = ({ labels }) => {
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
            const prompt = `I am working on improving the Wikipedia article at this URL (or based on this text): "${input}".
            
            Your task:
            1. Identify 3 to 5 specific claims, sentences, or paragraphs in this content that likely need a citation (e.g., controversial statements, specific figures, or claims missing an inline citation).
            2. For each claim, perform a Google Search to find a reliable, high-quality source.
            
            CRITICAL CONSTRAINTS:
            - DO NOT cite blogs, social media (Twitter, Reddit, LinkedIn, Facebook), forums, or user-generated content.
            - Prioritize: Academic journals, major reputable news outlets (NYT, BBC, etc.), official government websites, and published books.
            
            Format the output as a list:
            - **Claim needing citation**: [The text from the article]
            - **Suggested Source**: [Title of the source]
            - **Reason**: Why this source validates the claim.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            setResult(response.text || "No suggestions found.");
            
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                setGroundingChunks(response.candidates[0].groundingMetadata.groundingChunks);
            }

        } catch (e) {
            console.error("Error finding citations:", e);
            setError("Error finding citations.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-teal-400">{labels.citationFinderTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.citationFinderDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="citation-input"
                    label="Wikipedia Article URL or Text Snippet"
                    value={input}
                    placeholder={labels.citationFinderPlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.searching : labels.citationFinderButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div className="text-gray-300 prose prose-invert bg-black/30 p-4 rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />
                            
                            {groundingChunks.length > 0 && (
                                <div className="mt-4 bg-gray-800/50 p-4 rounded-lg">
                                    <h5 className="text-sm font-semibold text-teal-400 mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                        Found Sources (Click to Verify):
                                    </h5>
                                    <ul className="space-y-2">
                                        {groundingChunks.map((chunk, idx) => {
                                            if (chunk.web?.uri && chunk.web?.title) {
                                                return (
                                                    <li key={idx}>
                                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline text-xs flex items-start gap-2 transition-colors">
                                                            <span className="text-teal-500 mt-0.5">•</span>
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

export default WikiCitationFinder;
