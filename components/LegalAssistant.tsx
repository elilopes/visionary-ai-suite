
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface LegalAssistantProps {
    labels: any;
}

const LegalAssistant: React.FC<LegalAssistantProps> = ({ labels }) => {
    const [type, setType] = useState(labels.legalAssistantTypes[0]);
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

            if (type === labels.legalAssistantTypes[0]) { // Translate/Analyze
                prompt = `Act as a legal expert. Translate/Analyze the following service contract snippet. Highlight the obligations of the contracted company, key deadlines, and penalties for non-compliance. Be precise. Text: "${input}"`;
            } else { // Checklist
                prompt = `Act as an operations manager. Create a detailed checklist for the contract approval flow, from drafting to digital signature. Incorporate automation best practices. Context/Specifics provided: "${input}"`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error with legal assistant:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-2 text-blue-400">{labels.legalAssistantTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.legalAssistantDescription}</p>

            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.legalAssistantTypeLabel}</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                    >
                        {labels.legalAssistantTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <TextArea
                    id="legal-input"
                    label="Content"
                    value={input}
                    placeholder={labels.legalAssistantPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.legalAssistantButtonLoading : labels.legalAssistantButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <div className="text-gray-300 prose prose-invert bg-gray-900/50 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />}
                </div>
            )}
        </section>
    );
};

export default LegalAssistant;
