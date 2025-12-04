
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface BibliographyOrganizerProps {
    labels: any;
}

const BibliographyOrganizer: React.FC<BibliographyOrganizerProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [style, setStyle] = useState(labels.bibliographyOrganizerStyles[0]);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOrganize = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an academic librarian. Organize the following list of sources into a properly formatted bibliography using ${style} style. If a topic is provided instead of a list, generate a sample bibliography for that topic in ${style} style. Input: "${input}"`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error organizing bibliography:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.bibliographyOrganizerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.bibliographyOrganizerDescription}</p>
            
            <div className="space-y-4">
                <TextArea
                    id="bibliography-input"
                    label={labels.bibliographyOrganizerInputLabel}
                    value={input}
                    placeholder={labels.bibliographyOrganizerPlaceholder}
                    onChange={setInput}
                />
                <div>
                    <label htmlFor="bibliography-style" className="block text-sm font-medium text-gray-400 mb-2">{labels.bibliographyOrganizerStyleLabel}</label>
                    <select
                      id="bibliography-style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full sm:w-1/3 bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    >
                        {labels.bibliographyOrganizerStyles.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleOrganize}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.bibliographyOrganizerButtonLoading : labels.bibliographyOrganizerButton}
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

export default BibliographyOrganizer;
