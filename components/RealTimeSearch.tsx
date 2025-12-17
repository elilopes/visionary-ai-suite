
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
                model: 'gemini-3-flash-preview',
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            setResult(response.text || 'Nenhuma resposta gerada.');
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

    const sanitizedContent = DOMPurify.sanitize(result.replace(/\n/g, '<br />'));

    return (
        <section className="bg-[var(--bg-panel)] p-6 rounded-lg shadow-lg border border-[var(--border-main)]">
            <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-teal-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <h3 className="text-2xl font-bold text-teal-400">{labels.realTimeSearchTitle || "Pesquisa em Tempo Real"}</h3>
            </div>
            <p className="text-[var(--text-muted)] mb-6">{labels.realTimeSearchDescription || "Consulte fatos recentes e tendências da web."}</p>
            
            <div className="space-y-4">
                <TextArea
                    id="search-query"
                    label="Sua Pergunta"
                    value={query}
                    placeholder={labels.realTimeSearchPlaceholder || "Ex: Quais as ações mais valorizadas hoje?"}
                    onChange={setQuery}
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.realTimeSearchButtonLoading : (labels.realTimeSearchButton || "Pesquisar Agora")}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-[var(--border-main)]">
                    <h4 className="text-lg font-semibold text-[var(--text-main)] mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div 
                                className="text-[var(--text-main)] prose bg-[var(--bg-input)] p-4 rounded-md border border-[var(--border-main)]" 
                                dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                            />
                            
                            {groundingChunks.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="text-sm font-bold text-[var(--text-muted)] mb-2">Fontes Consultadas:</h5>
                                    <ul className="space-y-2">
                                        {groundingChunks.map((chunk, idx) => (
                                            chunk.web?.uri && (
                                                <li key={idx}>
                                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline text-xs flex items-center gap-2">
                                                        {chunk.web.title}
                                                    </a>
                                                </li>
                                            )
                                        ))}
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
