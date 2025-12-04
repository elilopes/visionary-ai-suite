


import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface MixMatchTryOnProps {
    labels: any;
}

const MixMatchTryOn: React.FC<MixMatchTryOnProps> = ({ labels }) => {
    const [personFile, setPersonFile] = useState<File | null>(null);
    const [clothFile, setClothFile] = useState<File | null>(null);
    const [image, setImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePersonFileChange = (selectedFile: File) => {
        setPersonFile(selectedFile);
    };

    const handleClothFileChange = (selectedFile: File) => {
        setClothFile(selectedFile);
    };

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const handleGenerate = async () => {
        if (!personFile || !clothFile) return;
        setIsLoading(true);
        setError('');
        setImage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const personPart = await fileToGenerativePart(personFile);
            const clothPart = await fileToGenerativePart(clothFile);
            
            const prompt = `Create a photorealistic composite image. Take the person from the first image and dress them in the exact clothing shown in the second image. Maintain the person's original pose, facial features, lighting, and background. Ensure the clothing fits naturally on the person's body.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [personPart, clothPart, { text: prompt }]
                },
                config: { responseModalities: [Modality.IMAGE] }
            });

             if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setImage(response.candidates[0].content.parts[0].inlineData.data);
            } else {
                throw new Error("Failed to generate image.");
            }

        } catch (e) {
            console.error("Error mixing match:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.mixMatchTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.mixMatchDescription}</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{labels.mixMatchPersonLabel}</label>
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <ImageInput onChange={handlePersonFileChange} labels={labels} />
                        </div>
                        {personFile && (
                            <img src={URL.createObjectURL(personFile)} alt="Person" className="mt-2 max-h-32 rounded-md mx-auto" />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{labels.mixMatchClothLabel}</label>
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <ImageInput onChange={handleClothFileChange} labels={labels} />
                        </div>
                        {clothFile && (
                            <img src={URL.createObjectURL(clothFile)} alt="Cloth" className="mt-2 max-h-32 rounded-md mx-auto" />
                        )}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !personFile || !clothFile}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.mixMatchButton}
                </button>
            </div>

            {(image || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {image && (
                        <div className="flex flex-col items-center">
                            <img src={`data:image/png;base64,${image}`} alt="Mix Match Result" className="w-full max-w-md rounded-lg shadow-md" />
                             <a
                                href={`data:image/png;base64,${image}`}
                                download="mix-match-result.png"
                                className="flex items-center justify-center px-4 py-2 mt-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors w-full max-w-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                {labels.download}
                            </a>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default MixMatchTryOn;