
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface LogoGeneratorProps {
    labels: any;
}

const LogoGenerator: React.FC<LogoGeneratorProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setImages([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Design a professional logo. Description: ${input}. Ensure it has a clean background.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] }
            });

            const newImages = [];
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        newImages.push(part.inlineData.data);
                    }
                }
            }
            if (newImages.length === 0) throw new Error("No image generated");
            setImages(newImages);

        } catch (e) {
            console.error("Error generating logo:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-indigo-500/30">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.logoCreatorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.logoCreatorDescription}</p>

            <div className="space-y-4">
                <TextArea
                    id="logo-input"
                    label="Logo Description"
                    value={input}
                    placeholder={labels.logoCreatorPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.logoCreatorButton}
                </button>
            </div>

            {(images.length > 0 || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {images.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                            {images.map((img, idx) => (
                                <img key={idx} src={`data:image/png;base64,${img}`} alt="Generated Logo" className="w-full max-w-md rounded-lg shadow-md mx-auto" />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default LogoGenerator;
