
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface VideoToPdfProps {
    labels: any;
}

const VideoToPdf: React.FC<VideoToPdfProps> = ({ labels }) => {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!url.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Analyze the YouTube video at this URL: ${url}. 
            Create a comprehensive, well-structured study guide suitable for saving as a PDF.
            Structure it with:
            1. Title (Video Title)
            2. Executive Summary
            3. Key Takeaways (Bulleted list)
            4. Detailed Breakdown (Section by section)
            5. Conclusion
            Use HTML formatting (<h1>, <h2>, <ul>, <li>, <p>) directly in your response so it looks good when printed.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error summarizing video:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (printRef.current) {
            const printContent = printRef.current.innerHTML;
            const win = window.open('', '', 'height=700,width=700');
            if (win) {
                win.document.write('<html><head><title>Video Summary</title>');
                win.document.write('<style>body{font-family: sans-serif; line-height: 1.6; color: #333;} h1{color: #000;} h2{border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;}</style>');
                win.document.write('</head><body>');
                win.document.write(printContent);
                win.document.write('</body></html>');
                win.document.close();
                win.print();
            }
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-orange-500/30">
            <h3 className="text-2xl font-bold mb-2 text-orange-400">{labels.videoToPdfTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.videoToPdfDescription}</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="video-pdf-url" className="block text-sm font-medium text-gray-400">{labels.videoToPdfInputLabel}</label>
                    <input
                        id="video-pdf-url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={labels.videoToPdfPlaceholder}
                        className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 p-3 text-base"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !url.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.videoToPdfButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div>
                            <div className="bg-gray-200 text-black p-8 rounded-md mb-4 overflow-auto max-h-96" ref={printRef} dangerouslySetInnerHTML={{ __html: result }} />
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                                </svg>
                                Print / Save as PDF
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default VideoToPdf;
