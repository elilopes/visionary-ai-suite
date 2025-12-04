
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface StudyGuideGeneratorProps {
    labels: any;
}

const StudyGuideGenerator: React.FC<StudyGuideGeneratorProps> = ({ labels }) => {
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
            const prompt = `Act as an expert tutor. Transform the following lecture notes into a structured study guide.
            The guide must include:
            1. **Key Concepts**: Highlight the most important definitions and ideas.
            2. **Memory Devices**: Create mnemonics or analogies to help remember complex terms.
            3. **Practice Questions**: 5 short-answer or multiple-choice questions with answers hidden or at the end.
            4. **Visual Structure**: Describe how a mind map or diagram for this topic should look.
            
            Notes: "${input}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating study guide:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-indigo-500/30">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.studyGuideTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.studyGuideDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="study-input"
                    label="Lecture Notes"
                    value={input}
                    placeholder={labels.studyGuidePlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.studyGuideButton : labels.studyGuideButton}
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

export default StudyGuideGenerator;
