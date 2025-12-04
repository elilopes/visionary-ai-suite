
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface InterviewPrepProps {
    labels: any;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ labels }) => {
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
            const prompt = `Act as a Hiring Manager and Career Coach. Based on the following job description, generate:
            1. **5 Common Interview Questions** likely to be asked for this specific role.
            2. **3 "Curveball" or Behavioral Questions**.
            3. **Key Skills/Keywords** to emphasize in answers.
            4. **A Short Sample Answer** for the "Tell me about yourself" question tailored to this role.
            
            Job Description: "${input}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating interview prep:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-emerald-500/30">
            <h3 className="text-2xl font-bold mb-2 text-emerald-400">{labels.interviewPrepTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.interviewPrepDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="interview-input"
                    label="Job Description"
                    value={input}
                    placeholder={labels.interviewPrepPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.interviewPrepButton}
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

export default InterviewPrep;
