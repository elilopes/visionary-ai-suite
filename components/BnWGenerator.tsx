
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface BnWGeneratorProps {
    labels: any;
}

const BnWGenerator: React.FC<BnWGeneratorProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<{style: string, data: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const styles = [
        { name: "Film Noir", prompt: "Transform this image into a dramatic Film Noir style. High contrast, deep shadows, moody lighting, 1940s cinema look." },
        { name: "High Contrast", prompt: "Transform this image into stark High Contrast Black and White. Pure blacks and whites, minimal grays, graphic look." },
        { name: "Sepia Vintage", prompt: "Transform this image into a vintage Sepia tone photograph. Aged paper look, warm brown tints, nostalgic feel." },
        { name: "Silverscreen", prompt: "Transform this image into a classic Hollywood Silverscreen style. Soft glow, metallic silver tones, glamorous lighting." }
    ];

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setImages([]);
        setError('');
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
        if (!file) return;
        setIsLoading(true);
        setError('');
        setImages([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);

            const promises = styles.map(async (style) => {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [filePart, { text: style.prompt }]
                    },
                    config: { responseModalities: [Modality.IMAGE] }
                });
                
                if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    return { style: style.name, data: response.candidates[0].content.parts[0].inlineData.data };
                }
                return null;
            });

            const results = await Promise.all(promises);
            const validImages = results.filter((img): img is {style: string, data: string} => img !== null);
            
            if (validImages.length === 0) throw new Error("Failed to generate images.");
            setImages(validImages);

        } catch (e) {
            console.error("Error generating B&W images:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-500/30">
            <h3 className="text-2xl font-bold mb-2 text-gray-300">{labels.bnwGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.bnwGeneratorDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
                
                {file && (
                    <img 
                        src={URL.createObjectURL(file)} 
                        alt="Original" 
                        className="max-h-48 rounded-md object-contain mx-auto border border-gray-700 mb-4" 
                    />
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.bnwGeneratorButton}
                </button>
            </div>

            {(images.length > 0 || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-4">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {images.map((img, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-lg p-2 border border-gray-700 flex flex-col items-center">
                                <h5 className="text-sm font-semibold text-gray-300 mb-2">{img.style}</h5>
                                <img src={`data:image/png;base64,${img.data}`} alt={img.style} className="w-full h-auto rounded-md mb-2" />
                                <a
                                    href={`data:image/png;base64,${img.data}`}
                                    download={`bnw-${img.style.replace(/\s+/g, '-').toLowerCase()}.png`}
                                    className="flex items-center justify-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors w-full mt-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {labels.download}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default BnWGenerator;
