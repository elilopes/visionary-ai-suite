import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import ImageInput from './ImageInput';
import Spinner from './Spinner';

interface ExpressionGeneratorProps {
    labels: any;
}

const ExpressionGenerator: React.FC<ExpressionGeneratorProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<{style: string, data: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const expressions = [
        { name: "Smiling", prompt: "Modify this person's face to be smiling happily. Keep the identity, lighting, and background exactly the same." },
        { name: "Sad", prompt: "Modify this person's face to look sad or crying. Keep the identity, lighting, and background exactly the same." },
        { name: "Scared", prompt: "Modify this person's face to look scared or terrified. Keep the identity, lighting, and background exactly the same." },
        { name: "Angry", prompt: "Modify this person's face to look angry or furious. Keep the identity, lighting, and background exactly the same." }
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

            const promises = expressions.map(async (exp) => {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [filePart, { text: exp.prompt }]
                    },
                    config: { responseModalities: [Modality.IMAGE] }
                });
                
                if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    return { style: exp.name, data: response.candidates[0].content.parts[0].inlineData.data };
                }
                return null;
            });

            const results = await Promise.all(promises);
            const validImages = results.filter((img): img is {style: string, data: string} => img !== null);
            
            if (validImages.length === 0) throw new Error("Failed to generate images.");
            setImages(validImages);

        } catch (e) {
            console.error("Error generating expressions:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadCollage = () => {
        if (images.length < 4) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load images to get dimensions (assuming uniform)
        const imgElements = images.map(img => {
            const i = new Image();
            i.src = `data:image/png;base64,${img.data}`;
            return i;
        });

        // Wait for first to load to set size (simple approximation)
        imgElements[0].onload = () => {
            const w = imgElements[0].width;
            const h = imgElements[0].height;
            canvas.width = w * 2;
            canvas.height = h * 2;

            ctx.drawImage(imgElements[0], 0, 0, w, h); // Top Left
            ctx.drawImage(imgElements[1], w, 0, w, h); // Top Right
            ctx.drawImage(imgElements[2], 0, h, w, h); // Bottom Left
            ctx.drawImage(imgElements[3], w, h, w, h); // Bottom Right

            const link = document.createElement('a');
            link.download = 'expressions-montage.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.expressionGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.expressionGeneratorDescription}</p>

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
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.expressionGeneratorButton}
                </button>
            </div>

            {(images.length > 0 || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-4">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    
                    {images.length === 4 && (
                        <button 
                            onClick={downloadCollage}
                            className="mb-6 w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                            {labels.downloadMontage}
                        </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {images.map((img, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-lg p-2 border border-gray-700 flex flex-col items-center">
                                <h5 className="text-sm font-semibold text-purple-400 mb-2">{img.style}</h5>
                                <img src={`data:image/png;base64,${img.data}`} alt={img.style} className="w-full h-auto rounded-md mb-2" />
                                <a
                                    href={`data:image/png;base64,${img.data}`}
                                    download={`expression-${img.style.replace(/\s+/g, '-').toLowerCase()}.png`}
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

export default ExpressionGenerator;