import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface CitationGeneratorProps {
    labels: any;
}

const CitationGenerator: React.FC<CitationGeneratorProps> = ({ labels }) => {
    const [authors, setAuthors] = useState('');
    const [title, setTitle] = useState('');
    const [year, setYear] = useState('');
    const [source, setSource] = useState('');
    const [style, setStyle] = useState(labels.citationGeneratorStyles[0]);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!title.trim() || !authors.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Generate a citation in ${style} style with the following information:
            - Author(s): ${authors}
            - Title: ${title}
            - Publication Year: ${year}
            - Source Details (Journal, Book, Website, etc.): ${source}
            
            Return only the formatted citation.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating citation:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.citationGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.citationGeneratorDescription}</p>
            
            <div className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="authors" className="block text-sm font-medium text-gray-400">{labels.citationGeneratorAuthorsLabel}</label>
                        <input id="authors" type="text" value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder={labels.citationGeneratorAuthorsPlaceholder} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-base"/>
                    </div>
                     <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-400">{labels.citationGeneratorYearLabel}</label>
                        <input id="year" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2023" className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-base"/>
                    </div>
                </div>
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-400">{labels.citationGeneratorTitleLabel}</label>
                    <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.citationGeneratorTitlePlaceholder} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-base"/>
                </div>
                 <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-400">{labels.citationGeneratorSourceLabel}</label>
                    <input id="source" type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder={labels.citationGeneratorSourcePlaceholder} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-base"/>
                </div>
                 <div>
                    <label htmlFor="citation-style" className="block text-sm font-medium text-gray-400 mb-2">{labels.citationGeneratorStyleLabel}</label>
                    <select id="citation-style" value={style} onChange={(e) => setStyle(e.target.value)} className="w-full sm:w-1/3 bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-base">
                        {labels.citationGeneratorStyles.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !title.trim() || !authors.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.citationGeneratorButtonLoading : labels.citationGeneratorButton}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <p className="text-gray-300 bg-gray-900/50 p-4 rounded-md">{result}</p>}
                </div>
            )}
        </section>
    );
};

export default CitationGenerator;