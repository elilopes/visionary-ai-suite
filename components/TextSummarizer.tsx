
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface TextSummarizerProps {
    labels: any;
}

const TextSummarizer: React.FC<TextSummarizerProps> = ({ labels }) => {
    const [inputText, setInputText] = useState('');
    const [summaryLength, setSummaryLength] = useState(labels.summarizerLengths ? labels.summarizerLengths[1] : "Medium");
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSummarize = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Summarize the following text in a ${summaryLength.toLowerCase()} format. Text: "${inputText}"`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
            });
            setResult(response.text || "No summary generated.");
        } catch (e) {
            console.error("Error summarizing text:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-[var(--bg-panel)] p-6 rounded-lg shadow-lg border border-[var(--border-main)]">
            <h3 className="text-2xl font-bold mb-2 text-[var(--accent)]">{labels.summarizerTitle || "Resumidor de Texto"}</h3>
            <p className="text-[var(--text-muted)] mb-6">{labels.summarizerDescription || "Crie resumos rápidos de grandes volumes de texto."}</p>
            
            <div className="space-y-4">
                <TextArea
                    id="summarizer-input"
                    label={labels.summarizerInputLabel || "Texto Original"}
                    value={inputText}
                    placeholder={labels.summarizerPlaceholder || "Cole seu texto aqui..."}
                    onChange={setInputText}
                />
                <div>
                    <label htmlFor="summary-length" className="block text-sm font-medium text-[var(--text-muted)] mb-2">{labels.summarizerLengthLabel || "Tamanho do Resumo"}</label>
                    <select
                      id="summary-length"
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value)}
                      className="w-full sm:w-1/3 bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] rounded-md focus:ring-[var(--accent)] p-3 text-base outline-none"
                    >
                        {(labels.summarizerLengths || ["Concise", "Medium", "Detailed"]).map((len: string) => <option key={len} value={len}>{len}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText.trim()}
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : (labels.summarizerButton || "Resumir Texto")}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-[var(--border-main)]">
                    <h4 className="text-lg font-semibold text-[var(--text-main)] mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <p className="text-[var(--text-main)] whitespace-pre-wrap bg-[var(--bg-input)] p-4 rounded-md border border-[var(--border-main)]">{result}</p>}
                </div>
            )}
        </section>
    );
};

export default TextSummarizer;
