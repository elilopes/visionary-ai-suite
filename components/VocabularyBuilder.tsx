
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface VocabularyBuilderProps {
    labels: any;
}

const VocabularyBuilder: React.FC<VocabularyBuilderProps> = ({ labels }) => {
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
            const prompt = `Create a practical vocabulary exercise for the following list of words (or topic) in the target language implied by the input.
            For each word/concept, provide:
            1. **Definition**: Clear and concise.
            2. **Visual Association**: Describe an image to help memorize it.
            3. **Context Sentence**: A sentence using the word, but with the word blanked out (Cloze test) for practice. (Provide the answer key at the bottom).
            4. **Spaced Repetition Tip**: When should I review this word next?
            
            Input Words/Topic: "${input}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error building vocabulary:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-green-500/30">
            <h3 className="text-2xl font-bold mb-2 text-green-400">{labels.vocabularyBuilderTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.vocabularyBuilderDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="vocab-input"
                    label="Words or Topic"
                    value={input}
                    placeholder={labels.vocabularyBuilderPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.vocabularyBuilderButton : labels.vocabularyBuilderButton}
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

export default VocabularyBuilder;
