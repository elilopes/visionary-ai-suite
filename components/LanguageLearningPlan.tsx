
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface LanguageLearningPlanProps {
    labels: any;
}

const LanguageLearningPlan: React.FC<LanguageLearningPlanProps> = ({ labels }) => {
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
            const prompt = `Create a fun and efficient 30-Day Language Learning Challenge for: "${input}".
            Format as a Markdown table with columns: Day, Theme/Topic, Vocabulary Focus, Listening/Activity (Mini-task).
            Ensure a mix of:
            - Essential vocabulary.
            - Listening practice (suggest types of content).
            - Speaking/Shadowing exercises.
            - Fun "real world" tasks.
            Include a motivational quote at the start.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating plan:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-yellow-500/30">
            <h3 className="text-2xl font-bold mb-2 text-yellow-400">{labels.languagePlanTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.languagePlanDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="lang-plan-input"
                    label="Language and Level"
                    value={input}
                    placeholder={labels.languagePlanPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.languagePlanButton : labels.languagePlanButton}
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

export default LanguageLearningPlan;
