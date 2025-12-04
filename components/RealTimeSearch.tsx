
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import DOMPurify from 'dompurify';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface RealTimeSearchProps {
    labels: any;
}

const RealTimeSearch: React.FC<RealTimeSearchProps> = ({ labels }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState('');
    const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');
        setGroundingChunks([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            setResult(response.text || 'No text generated.');
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                setGroundingChunks(response.candidates[0].groundingMetadata.groundingChunks);
            }
        } catch (e) {
            console.error("Error with real-time search:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    // Sanitize the HTML content before rendering
    const sanitizedContent = DOMPurify.sanitize(result.replace(/\n/g, '<br />'));

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-teal-500/30">
            <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-teal-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <h3 className="text-2xl font-bold text-teal-400">{labels.realTimeSearchTitle}</h3>
            </div>
            <p className="text-gray-400 mb-6">{labels.realTimeSearchDescription}</p>
            
            <div className="space-y-4">
                <TextArea
                    id="search-query"
                    label="Query"
                    value={query}
                    placeholder={labels.realTimeSearchPlaceholder}
                    onChange={setQuery}
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.realTimeSearchButtonLoading : labels.realTimeSearchButton}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div 
                                className="text-gray-300 prose prose-invert bg-gray-900/50 p-4 rounded-md" 
                                dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                            />
                            
                            {groundingChunks.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="text-sm font-semibold text-gray-400 mb-2">Sources found:</h5>
                                    <ul className="space-y-2">
                                        {groundingChunks.map((chunk, idx) => {
                                            if (chunk.web?.uri && chunk.web?.title) {
                                                return (
                                                    <li key={idx}>
                                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline text-sm flex items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                                            </svg>
                                                            {chunk.web.title}
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

export default RealTimeSearch;