
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface WikidataExtractorProps {
    labels: any;
}

const WikidataExtractor: React.FC<WikidataExtractorProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'human' | 'quickstatements'>('human');
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
            
            let prompt = "";
            
            if (mode === 'human') {
                prompt = `Extract facts from the following text suitable for Wikidata.
                Format the output as a human-readable list of potential Property-Value pairs. 
                If possible, suggest the P-number (Property ID) for the relationship (e.g., P569 for Date of Birth).
                
                Format example:
                - Date of Birth (P569): 1990-01-01
                - Place of Birth (P19): London
                - Occupation (P106): Writer
                
                Text: "${input}"`;
            } else {
                prompt = `Extract facts from the following text and format them as QuickStatements V1 commands.
                The format is: Entity|Property|Value (e.g., Q42|P31|Q5).
                
                Rules:
                1. Identify the main subject Entity ID (Q-number) if mentioned or context implies it (use 'LAST' if referring to a newly created item in a batch, or a placeholder like 'Q??' if unknown).
                2. Use correct P-numbers for properties.
                3. Use correct Q-numbers for values that are items.
                4. Use correct syntax for dates (+YYYY-MM-DDT00:00:00Z/11) and strings ("value").
                5. Return ONLY the code block.
                
                Text: "${input}"`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            setResult(response.text || "No data extracted.");
        } catch (e) {
            console.error("Error extracting wikidata:", e);
            setError("Error extracting data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenQuickStatements = () => {
        window.open('https://quickstatements.toolforge.org/', '_blank');
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-green-400">{labels.wikidataTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.wikidataDescription}</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.wikidataModeLabel}</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="wikidata-mode"
                                value="human"
                                checked={mode === 'human'}
                                onChange={() => setMode('human')}
                                className="h-4 w-4 border-gray-600 bg-gray-900 text-green-600 focus:ring-green-600"
                            />
                            <span className="text-gray-300 text-sm">{labels.wikidataModes?.human || 'Human'}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="wikidata-mode"
                                value="quickstatements"
                                checked={mode === 'quickstatements'}
                                onChange={() => setMode('quickstatements')}
                                className="h-4 w-4 border-gray-600 bg-gray-900 text-green-600 focus:ring-green-600"
                            />
                            <span className="text-gray-300 text-sm">{labels.wikidataModes?.quickstatements || 'QuickStatements'}</span>
                        </label>
                    </div>
                </div>

                <TextArea
                    id="wikidata-input"
                    label="Biography / Text"
                    value={input}
                    placeholder={labels.wikidataPlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : (labels.wikidataButton || 'Extract Data')}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div className="space-y-4">
                            <div className="h-64">
                                 {mode === 'quickstatements' ? (
                                    <CodeBlock code={result.replace(/```/g, '')} />
                                 ) : (
                                    <div className="text-gray-300 prose prose-invert bg-black/30 p-4 rounded-md whitespace-pre-wrap h-full overflow-auto">
                                        {result}
                                    </div>
                                 )}
                            </div>
                            {mode === 'quickstatements' && (
                                <button
                                    onClick={handleOpenQuickStatements}
                                    className="flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 transition-colors w-full"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                    {labels.openQuickStatements || 'Open Tool'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default WikidataExtractor;
