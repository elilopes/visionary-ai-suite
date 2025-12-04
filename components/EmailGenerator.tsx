
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface EmailGeneratorProps {
    labels: any;
}

const EmailGenerator: React.FC<EmailGeneratorProps> = ({ labels }) => {
    const [recipient, setRecipient] = useState('');
    const [tone, setTone] = useState('');
    const [points, setPoints] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!points.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Write a professional email.
            Recipient: ${recipient || "General"}
            Tone: ${tone || "Professional"}
            Key Points to Cover: ${points}
            
            Provide:
            1. **Subject Line Options** (3 variations)
            2. **Email Body**`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating email:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-slate-500/30">
            <h3 className="text-2xl font-bold mb-2 text-slate-300">{labels.emailWriterTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.emailWriterDescription}</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{labels.emailWriterRecipient}</label>
                        <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" placeholder="e.g. Hiring Manager, Client"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{labels.emailWriterTone}</label>
                        <input type="text" value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" placeholder="e.g. Formal, Apologetic"/>
                    </div>
                </div>
                
                <TextArea
                    id="email-points"
                    label={labels.emailWriterPoints}
                    value={points}
                    placeholder="e.g. Project delayed by 2 days due to server issues."
                    onChange={setPoints}
                />

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !points.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.emailWriterButton}
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

export default EmailGenerator;
