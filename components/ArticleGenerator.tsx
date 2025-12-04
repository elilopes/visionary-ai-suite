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
                prompt = `Write a comprehensive and engaging article about the following topic: "${input}". The article should be well-structured with an introduction, body, and conclusion.`;
            } else {
                prompt = `Expand the following text into a comprehensive and engaging article. Use the provided text as the core idea or starting point. The article should be well-structured with an introduction, body, and conclusion. Base text: "${input}"`;
            }
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating article:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.articleGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.articleGeneratorDescription}</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.articleGeneratorModeLabel}</label>
                    <div className="flex gap-4">
                        {(['topic', 'text'] as ArticleMode[]).map(m => (
                            <label key={m} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="article-mode"
                                    value={m}
                                    checked={mode === m}
                                    onChange={() => { setMode(m); setInput(''); setResult(''); setError('') }}
                                    className="h-4 w-4 border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-600"
                                />
                                <span className="text-gray-300">{labels[m === 'topic' ? 'articleGeneratorModeTopic' : 'articleGeneratorModeText']}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {mode === 'topic' ? (
                     <div>
                        <label htmlFor="article-topic" className="block text-sm font-medium text-gray-400">{labels.articleGeneratorTopicLabel}</label>
                        <input
                            id="article-topic"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={labels.articleGeneratorTopicPlaceholder}
                            className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                        />
                    </div>
                ) : (
                    <TextArea
                        id="article-text"
                        label={labels.articleGeneratorTextLabel}
                        value={input}
                        placeholder={labels.articleGeneratorTextPlaceholder}
                        onChange={setInput}
                    />
                )}
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.articleGeneratorButtonLoading : labels.articleGeneratorButton}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <p className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-md">{result}</p>}
                </div>
            )}
        </section>
    );
};

export default ArticleGenerator;
