
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface AbntFormatterProps {
    labels: any;
}

const AbntFormatter: React.FC<AbntFormatterProps> = ({ labels }) => {
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
            const prompt = `Act as an Academic Editor specializing in ABNT standards (Brazilian Technical Standards).
            Format the following text content according to strict ABNT rules.
            
            Content to Format: "${input}"
            
            IMPORTANT: Output the result as Clean HTML suitable for saving as a .doc file.
            Use standard HTML tags.
            Apply inline CSS to simulate ABNT formatting where possible:
            - Font: Arial or Times New Roman, size 12pt (use inline style).
            - Line spacing: 1.5 (line-height: 1.5).
            - Text alignment: Justified (text-align: justify).
            - First line indent: 1.25cm (text-indent: 1.25cm).
            - Titles: Bold, Uppercase for main sections.
            - Citations (if any found): Ensure (Author, Year) format.
            
            Do NOT wrap in markdown code blocks like \`\`\`html. Just return the raw HTML string starting with <html>.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text || '');
        } catch (e) {
            console.error("Error formatting ABNT:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document ABNT</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + result + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `Documento_ABNT.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-2 text-blue-400">{labels.abntFormatterTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.abntFormatterDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="abnt-input"
                    label="Text Content"
                    value={input}
                    placeholder={labels.abntFormatterPlaceholder}
                    onChange={setInput}
                />

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.abntFormatterButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div>
                            <div className="bg-white text-black p-8 rounded-md mb-4 max-h-96 overflow-y-auto border border-gray-300 shadow-inner font-serif" dangerouslySetInnerHTML={{ __html: result }} />
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors w-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                {labels.downloadDocx}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default AbntFormatter;
