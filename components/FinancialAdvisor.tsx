
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface FinancialAdvisorProps {
    labels: any;
}

const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ labels }) => {
    const [type, setType] = useState(labels.financialAdvisorTypes[0]);
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

            if (type === labels.financialAdvisorTypes[0]) { // Income Tax
                prompt = `Act as a tax expert for Brazil (or relevant region based on language). Explain in detail how to declare freelancer work in the Income Tax Return (IR 2025) for someone who is also a CLT employee. Address specific fields, codes, and common pitfalls based on this user context: "${input}"`;
            } else if (type === labels.financialAdvisorTypes[1]) { // Sales Plan
                prompt = `Act as a business strategist. Create a sales plan considering expenses and a realistic net profit scenario. Use the following business details: "${input}". Include a step-by-step strategy.`;
            } else { // Emergency Fund
                prompt = `Act as a financial planner. Help organize finances to build an emergency fund in 6 months. Based on the following financial details (income/expenses): "${input}", create a monthly saving plan and suggest expense cuts.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating financial plan:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-green-500/30">
            <h3 className="text-2xl font-bold mb-2 text-green-400">{labels.financialAdvisorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.financialAdvisorDescription}</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.financialAdvisorTypeLabel}</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3 text-base"
                    >
                        {labels.financialAdvisorTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <TextArea
                    id="financial-input"
                    label="Details"
                    value={input}
                    placeholder={labels.financialAdvisorPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.financialAdvisorButtonLoading : labels.financialAdvisorButton}
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

export default FinancialAdvisor;
