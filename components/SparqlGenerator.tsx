
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface SparqlGeneratorProps {
    labels: any;
}

interface SparqlResult {
    head: {
        vars: string[];
    };
    results: {
        bindings: any[];
    };
}

const SparqlGenerator: React.FC<SparqlGeneratorProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Execution state
    const [isRunningQuery, setIsRunningQuery] = useState(false);
    const [queryResults, setQueryResults] = useState<SparqlResult | null>(null);
    const [queryError, setQueryError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');
        setQueryResults(null); // Reset previous results
        setQueryError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Generate a valid SPARQL query for the Wikidata Query Service based on this request: "${input}".
            - Include comments explaining the query.
            - Use standard prefixes (wd:, wdt:, etc.).
            - Return ONLY the code block.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const text = response.text;
            const codeMatch = text.match(/```sparql([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
            setResult(codeMatch ? codeMatch[1].trim() : text);
        } catch (e) {
            console.error("Error generating SPARQL:", e);
            setError("Error generating query.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunQuery = async () => {
        if (!result.trim()) return;
        
        setIsRunningQuery(true);
        setQueryError('');
        setQueryResults(null);

        try {
            // Basic cleanup of comments if necessary, though Wikidata usually handles them.
            const endpointUrl = 'https://query.wikidata.org/sparql';
            const fullUrl = endpointUrl + '?query=' + encodeURIComponent(result) + '&format=json';

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/sparql-results+json' }
            });

            if (!response.ok) {
                throw new Error(`Wikidata API Error: ${response.statusText}`);
            }

            const data: SparqlResult = await response.json();
            setQueryResults(data);

        } catch (e) {
            console.error("Error running SPARQL query:", e);
            setQueryError(labels.sparqlError + " (Check console or query validity)");
        } finally {
            setIsRunningQuery(false);
        }
    };

    const renderCellValue = (cell: any) => {
        if (!cell) return "";
        if (cell.type === 'uri') {
            // Make Wikidata entities clickable
            return <a href={cell.value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{cell.value}</a>;
        }
        return <span className="break-words">{cell.value}</span>;
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-blue-400">{labels.sparqlTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.sparqlDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="sparql-input"
                    label="Natural Language Query"
                    value={input}
                    placeholder={labels.sparqlPlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generating : labels.sparqlButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700 space-y-4">
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <>
                            <div className="h-64">
                                <CodeBlock code={result} />
                            </div>
                            <button 
                                onClick={handleRunQuery}
                                disabled={isRunningQuery}
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors w-full"
                            >
                                {isRunningQuery ? <Spinner /> : null}
                                {isRunningQuery ? labels.running : labels.sparqlRunButton}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Query Results Section */}
            {(queryResults || queryError) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-bold text-gray-300 mb-3">{labels.sparqlResultsTitle}</h4>
                    
                    {queryError && <p className="text-red-400 mb-4">{queryError}</p>}

                    {queryResults && (
                        <div className="overflow-x-auto rounded-lg border border-gray-700">
                            {queryResults.results.bindings.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-700 bg-gray-800 text-sm">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            {queryResults.head.vars.map((header) => (
                                                <th key={header} scope="col" className="px-6 py-3 text-left font-medium text-gray-400 uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {queryResults.results.bindings.map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}>
                                                {queryResults.head.vars.map((header) => (
                                                    <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-normal text-gray-300">
                                                        {renderCellValue(row[header])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="p-4 text-gray-400 text-center">{labels.noResults}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default SparqlGenerator;
