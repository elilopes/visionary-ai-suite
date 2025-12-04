import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface TextSummarizerProps {
    labels: any;
}

const TextSummarizer: React.FC<TextSummarizerProps> = ({ labels }) => {
    const [inputText, setInputText] = useState('');
    const [summaryLength, setSummaryLength] = useState(labels.summarizerLengths[1]);
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
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error summarizing text:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.summarizerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.summarizerDescription}</p>
            
            <div className="space-y-4">
                <TextArea
                    id="summarizer-input"
                    label={labels.summarizerInputLabel}
                    value={inputText}
                    placeholder={labels.summarizerPlaceholder}
                    onChange={setInputText}
                />
                <div>
                    <label htmlFor="summary-length" className="block text-sm font-medium text-gray-400 mb-2">{labels.summarizerLengthLabel}</label>
                    <select
                      id="summary-length"
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value)}
                      className="w-full sm:w-1/3 bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    >
                        {labels.summarizerLengths.map((len: string) => <option key={len} value={len}>{len}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.summarizerButtonLoading : labels.summarizerButton}
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

export default TextSummarizer;
