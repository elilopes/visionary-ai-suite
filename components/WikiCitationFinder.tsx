
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
            const prompt = `Valide as afirmações a seguir para a Wikipedia. Encontre fontes confiáveis e acadêmicas para: "${input}". Retorne os pontos que precisam de citação e as fontes sugeridas.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            setResult(response.text || "Nenhuma sugestão encontrada.");
            
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                setGroundingChunks(response.candidates[0].groundingMetadata.groundingChunks);
            }

        } catch (e) {
            console.error("Error finding citations:", e);
            setError(labels.error || "Erro ao pesquisar fontes.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-[var(--bg-panel)] p-6 rounded-lg border border-[var(--border-main)]">
            <h3 className="text-xl font-bold mb-2 text-[var(--accent)]">{labels.citationFinderTitle || "Validador de Citações"}</h3>
            <p className="text-[var(--text-muted)] mb-4 text-sm">{labels.citationFinderDescription || "Valide afirmações buscando fontes reais na internet."}</p>

            <div className="space-y-4">
                <TextArea
                    id="citation-input"
                    label="Afirmação ou URL do Artigo"
                    value={input}
                    placeholder="Ex: A Grande Muralha da China é visível da Lua..."
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.searching : (labels.citationFinderButton || "Validar com Gemini 3")}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-[var(--border-main)]">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div className="text-[var(--text-main)] prose bg-[var(--bg-input)] p-4 rounded-md border border-[var(--border-main)]" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />
                            
                            {groundingChunks.length > 0 && (
                                <div className="mt-4 bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-main)]">
                                    <h5 className="text-sm font-bold text-[var(--accent)] mb-2 flex items-center gap-2">Fontes Encontradas:</h5>
                                    <ul className="space-y-2">
                                        {groundingChunks.map((chunk, idx) => (
                                            chunk.web?.uri && (
                                                <li key={idx}>
                                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--accent)] text-xs flex items-start gap-2 transition-colors">
                                                        <span className="text-[var(--accent)] mt-0.5">•</span>
                                                        <span>{chunk.web.title}</span>
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

export default WikiCitationFinder;
