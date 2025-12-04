
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface BackgroundReplacerProps {
    labels: any;
}

const BackgroundReplacer: React.FC<BackgroundReplacerProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [instruction, setInstruction] = useState('');
    const [image, setImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setImage('');
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
        setImage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            let prompt = "";
            if (instruction.trim()) {
                // Replacement mode
                prompt = `Change the background of this image to: ${instruction}. Keep the foreground subject exactly as is. Blend naturally.`;
            } else {
                // Removal mode
                prompt = `Remove the background completely. Isolate the main subject. The output should have a transparent background if possible, or a solid white background if transparency is not supported by the output format. Focus on high quality edge detection.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [filePart, { text: prompt }]
                },
                config: { responseModalities: [Modality.IMAGE] }
            });

             if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setImage(response.candidates[0].content.parts[0].inlineData.data);
            } else {
                throw new Error("Failed to generate image.");
            }

        } catch (e: any) {
            console.error("Error editing background:", e);
            let msg = labels.error || "Background edit failed.";
            if (e.message) {
                if (e.message.includes("429")) msg = "Quota Exceeded: Please wait a moment.";
                else if (e.message.includes("SAFETY")) msg = "Safety Block: The image triggered safety filters.";
                else if (e.message.includes("403")) msg = "Access Denied: Check API Key or permissions.";
                else msg = `Error: ${e.message}`;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (format: 'png' | 'jpg' | 'webp' | 'psd') => {
        if (!image) return;

        // PSD and PNG (base) are handled directly from the base64
        if (format === 'psd') {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${image}`; // PSD usually wraps the PNG/bitmap in this context
            link.download = `background-edit.psd`;
            link.click();
            return;
        }

        if (format === 'png') {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${image}`;
            link.download = `background-edit.png`;
            link.click();
            return;
        }

        // For JPG and WEBP, we need to convert using a canvas
        const img = new Image();
        img.src = `data:image/png;base64,${image}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                // JPG doesn't support transparency, so we fill with white first
                if (format === 'jpg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(img, 0, 0);
                
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/webp';
                const dataUrl = canvas.toDataURL(mimeType, 0.9); // 0.9 quality
                
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `background-edit.${format}`;
                link.click();
            }
        };
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-teal-500/30">
            <h3 className="text-2xl font-bold mb-2 text-teal-400">{labels.backgroundReplacerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.backgroundReplacerDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
                
                {file && (
                    <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="max-h-48 rounded-md object-contain mx-auto border border-gray-700" 
                    />
                )}

                <TextArea
                    id="bg-instruction"
                    label={labels.backgroundReplacerPlaceholder}
                    value={instruction}
                    placeholder="e.g. A futuristic city, A sunny beach..."
                    onChange={setInstruction}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.backgroundReplacerButton}
                </button>
            </div>

            {(image || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {image && (
                        <div className="flex flex-col items-center">
                            <img src={`data:image/png;base64,${image}`} alt="Background Edit Result" className="w-full max-w-md rounded-lg shadow-md mb-4" />
                             
                             <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                                {/* PNG Button */}
                                <button
                                    onClick={() => handleDownload('png')}
                                    className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm font-bold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {instruction.trim() ? 'PNG' : 'PNG (Transp.)'}
                                </button>

                                {/* PSD Button */}
                                <button
                                    onClick={() => handleDownload('psd')}
                                    className="flex items-center justify-center px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-bold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    PSD
                                </button>

                                {/* JPG Button */}
                                <button
                                    onClick={() => handleDownload('jpg')}
                                    className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors text-sm font-bold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                    </svg>
                                    JPG
                                </button>

                                {/* WEBP Button */}
                                <button
                                    onClick={() => handleDownload('webp')}
                                    className="flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors text-sm font-bold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                    </svg>
                                    WEBP
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default BackgroundReplacer;
