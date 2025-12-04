
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface AssignmentAnalyzerProps {
    labels: any;
}

const AssignmentAnalyzer: React.FC<AssignmentAnalyzerProps> = ({ labels }) => {
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
            const prompt = `Analyze the following assignment prompt/instructions. 
            1. **Professor's Goal**: What specifically is the teacher looking for? (Implicit and explicit goals).
            2. **Potential Pitfalls**: What are common mistakes students might make with this specific prompt?
            3. **Step-by-Step Plan**: Create a high-level checklist to maximize points (e.g., "A" grade strategy).
            
            Assignment Instructions: "${input}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error analyzing assignment:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-red-500/30">
            <h3 className="text-2xl font-bold mb-2 text-red-400">{labels.assignmentAnalyzerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.assignmentAnalyzerDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="assignment-input"
                    label="Assignment Instructions"
                    value={input}
                    placeholder={labels.assignmentAnalyzerPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.assignmentAnalyzerButton : labels.assignmentAnalyzerButton}
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

export default AssignmentAnalyzer;
