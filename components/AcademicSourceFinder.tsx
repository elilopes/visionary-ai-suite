
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface AcademicSourceFinderProps {
    labels: any;
}

const AcademicSourceFinder: React.FC<AcademicSourceFinderProps> = ({ labels }) => {
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
            const prompt = `Act as a research librarian. For the research topic "${input}", provide:
            1. **Specific Search Terms**: Use Boolean operators (AND, OR, NOT) and synonyms.
            2. **Recommended Databases**: Which academic repositories are best for this field (e.g., PubMed, JSTOR, IEEE Xplore)?
            3. **Key Authors**: List 3-5 seminal authors or experts in this specific field.
            4. **Credibility Check**: Briefly list 3 questions the student should ask to verify if a source in this field is reliable.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error finding sources:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-2 text-blue-400">{labels.academicSourceTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.academicSourceDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="academic-input"
                    label="Research Topic"
                    value={input}
                    placeholder={labels.academicSourcePlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.academicSourceButton : labels.academicSourceButton}
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

export default AcademicSourceFinder;
