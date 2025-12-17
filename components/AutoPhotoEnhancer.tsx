
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';
import BeforeAfterSlider from './BeforeAfterSlider';

interface AutoPhotoEnhancerProps {
    labels: any;
}

const AutoPhotoEnhancer: React.FC<AutoPhotoEnhancerProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [image, setImage] = useState<string>('');
    const [originalUrl, setOriginalUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [textResponse, setTextResponse] = useState('');
    
    // Options
    const [options, setOptions] = useState({
        blemishes: true,
        smile: false,
        skinTone: true,
        oiliness: true,
        lighting: true,
        makeup: false,
        wrinkles: false,
        sharpen: false
    });

    React.useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setOriginalUrl('');
        }
    }, [file]);

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setImage('');
        setError('');
        setTextResponse('');
    };

    const handleOptionChange = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
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
        setTextResponse('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            const features = [];
            if (options.blemishes) features.push("smoother skin texture");
            if (options.smile) features.push("a slightly warmer expression");
            if (options.skinTone) features.push("balanced skin tone");
            if (options.oiliness) features.push("matte skin finish");
            if (options.lighting) features.push("improved professional lighting");
            if (options.makeup) features.push("subtle grooming");
            if (options.wrinkles) features.push("softened fine lines");
            if (options.sharpen) features.push("sharpen details and improve overall clarity");

            const prompt = `Generate a high-quality, photorealistic retouch of this image. Apply these enhancements: ${features.join(', ')}. Preserve the person's identity and key facial features exactly. Do not change the background. This is a professional photo editing request.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: {
                    parts: [filePart, { text: prompt }]
                },
                config: { 
                  imageConfig: { aspectRatio: "1:1" }
                }
            });

             let foundImage = false;
             if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        setImage(part.inlineData.data);
                        foundImage = true;
                    } else if (part.text) {
                        setTextResponse(part.text);
                    }
                }
            }
            
            if (!foundImage && !textResponse) {
                throw new Error("Failed to generate image.");
            }

        } catch (e: any) {
            console.error("Error enhancing photo:", e);
            let msg = labels.error || "Error processing image.";
            if (e.message) {
                 if (e.message.includes("429")) msg = "System Busy (Quota Exceeded). Please wait.";
                 if (e.message.includes("SAFETY")) msg = "Safety Block: The AI refused to edit this specific face/image.";
                 if (e.message.includes("403")) msg = "Access Denied: Check API Key.";
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.autoEnhancerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.autoEnhancerDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <ImageInput onChange={handleFileChange} labels={labels} />
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-2">
                        <label className="text-sm text-gray-400 font-semibold block mb-2">Enhancement Options:</label>
                        {Object.keys(options).map((key) => (
                            <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options[key as keyof typeof options]}
                                    onChange={() => handleOptionChange(key as keyof typeof options)}
                                    className="form-checkbox h-4 w-4 text-purple-600 rounded bg-gray-700 border-gray-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-300 text-sm">{labels.autoEnhancerOptions?.[key] || key}</span>
                            </label>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !file}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <Spinner /> : null}
                        {isLoading ? labels.generatingPreview : labels.autoEnhancerButton}
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center bg-black/30 rounded-lg p-2 min-h-[300px]">
                    {image && originalUrl ? (
                        <div className="w-full max-w-md">
                            <BeforeAfterSlider 
                                original={originalUrl}
                                processed={`data:image/png;base64,${image}`}
                                originalLabel="Original"
                                processedLabel="Enhanced"
                            />
                            <div className="mt-4 text-center">
                                <a
                                    href={`data:image/png;base64,${image}`}
                                    download="enhanced-photo.png"
                                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {labels.download}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm text-center w-full px-4">
                            {!file && !error && "Upload an image to start."}
                            {file && !error && !textResponse && "Ready to enhance."}
                            
                            {error && (
                                <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded text-left mt-2">
                                    <strong className="block mb-1">Error:</strong>
                                    {error}
                                </div>
                            )}
                            
                            {textResponse && (
                                <div className="mt-4 bg-gray-800 border border-gray-600 p-3 rounded text-left">
                                    <p className="text-yellow-400 text-xs font-bold mb-1">AI Feedback:</p>
                                    <p className="text-gray-300 italic">"{textResponse}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AutoPhotoEnhancer;
