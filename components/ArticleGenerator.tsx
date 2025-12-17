
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface ArticleGeneratorProps {
    labels: any;
}

type ArticleMode = 'topic' | 'text';

const ArticleGenerator: React.FC<ArticleGeneratorProps> = ({ labels }) => {
    const [mode, setMode] = useState<ArticleMode>('topic');
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
            let prompt = '';
            if (mode === 'topic') {
                prompt = `Write a professional, comprehensive and engaging article about: "${input}". Use an authoritative business tone.`;
            } else {
                prompt = `Expand this technical summary into a professional article with clear structure, headers and professional tone: "${input}"`;
            }
            
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
            });
            setResult(response.text || "No article generated.");
        } catch (e) {
            console.error("Error generating article:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-[var(--bg-panel)] p-6 rounded-lg shadow-lg border border-[var(--border-main)]">
            <h3 className="text-2xl font-bold mb-2 text-[var(--accent)]">{labels.articleGeneratorTitle || "Gerador de Artigos"}</h3>
            <p className="text-[var(--text-muted)] mb-6">{labels.articleGeneratorDescription || "Crie artigos completos para blogs ou documentação técnica."}</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Modo de Operação</label>
                    <div className="flex gap-4">
                        {(['topic', 'text'] as ArticleMode[]).map(m => (
                            <label key={m} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="article-mode"
                                    value={m}
                                    checked={mode === m}
                                    onChange={() => { setMode(m); setInput(''); setResult(''); setError('') }}
                                    className="h-4 w-4 text-[var(--accent)] bg-[var(--bg-input)] border-[var(--border-main)] focus:ring-[var(--accent)]"
                                />
                                <span className="text-[var(--text-main)] text-sm">{m === 'topic' ? "Por Tópico" : "Por Texto-Base"}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {mode === 'topic' ? (
                     <div>
                        <label htmlFor="article-topic" className="block text-sm font-medium text-[var(--text-muted)]">Título ou Tema</label>
                        <input
                            id="article-topic"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ex: O futuro da IA na medicina"
                            className="mt-1 w-full bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] rounded-md focus:ring-[var(--accent)] p-3 text-base outline-none"
                        />
                    </div>
                ) : (
                    <TextArea
                        id="article-text"
                        label="Texto ou Resumo Base"
                        value={input}
                        placeholder="Cole aqui os pontos principais que deseja expandir..."
                        onChange={setInput}
                    />
                )}
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : (labels.articleGeneratorButton || "Gerar Artigo")}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-[var(--border-main)]">
                    <h4 className="text-lg font-semibold text-[var(--text-main)] mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <div className="text-[var(--text-main)] prose max-w-none bg-[var(--bg-input)] p-4 rounded-md border border-[var(--border-main)]" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />}
                </div>
            )}
        </section>
    );
};

export default ArticleGenerator;
