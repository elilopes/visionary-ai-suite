
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import ImageInput from './ImageInput';
import BeforeAfterSlider from './BeforeAfterSlider';

interface SketchToImageProps {
    labels: any;
}

const SketchToImage: React.FC<SketchToImageProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [style, setStyle] = useState(labels.sketchToImageStyles?.[0] || 'Photorealistic');
    const [prompt, setPrompt] = useState('');
    const [resultImage, setResultImage] = useState<string>('');
    const [originalUrl, setOriginalUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
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
        setResultImage('');
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
        setResultImage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            const systemPrompt = `Act as a professional digital artist and 3D renderer. 
            Your task is to transform the provided hand-drawn sketch (pencil on paper) into a high-quality computer-generated image.
            
            CONSTRAINTS:
            - Maintain the exact composition, silhouette, and proportions of the sketch.
            - Interpret the lines as actual objects.
            - Style: ${style}.
            - Details: ${prompt}.
            - Add professional lighting, global illumination, high-resolution textures, and depth of field.
            - Return ONLY the rendered image part.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [filePart, { text: systemPrompt }]
                },
                config: { responseModalities: [Modality.IMAGE] }
            });

             if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setResultImage(response.candidates[0].content.parts[0].inlineData.data);
            } else {
                throw new Error("Failed to generate digital version of the sketch.");
            }

        } catch (e: any) {
            console.error("Error transforming sketch:", e);
            let msg = labels.error || "Generation failed.";
            if (e.message?.includes("SAFETY")) msg = "Safety Block: The sketch or details triggered safety filters.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                <h3 className="text-2xl font-bold text-cyan-400">{labels.sketchToImageTitle}</h3>
            </div>
            <p className="text-gray-400 mb-6">{labels.sketchToImageDescription}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <ImageInput onChange={handleFileChange} labels={labels} />
                    </div>
                    
                    {file && !resultImage && originalUrl && (
                        <div className="text-center">
                            <img 
                                src={originalUrl} 
                                alt="Sketch original" 
                                className="max-h-64 rounded-md object-contain mx-auto border border-gray-700 shadow-sm" 
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Target Style</label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 p-3 text-base"
                            >
                                {labels.sketchToImageStyles?.map((s: string) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <TextArea
                            id="sketch-prompt"
                            label="Extra Context / Colors"
                            value={prompt}
                            placeholder={labels.sketchToImagePlaceholder}
                            onChange={setPrompt}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !file}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-bold rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <Spinner /> : null}
                        {isLoading ? labels.generatingPreview : labels.sketchToImageButton}
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center bg-black/30 rounded-lg p-4 border border-gray-700 min-h-[400px]">
                    {resultImage && originalUrl ? (
                        <div className="w-full h-full flex flex-col items-center">
                            <BeforeAfterSlider 
                                original={originalUrl}
                                processed={`data:image/png;base64,${resultImage}`}
                                originalLabel="Papel"
                                processedLabel="Digital"
                            />
                            <div className="mt-6 w-full flex gap-4">
                                <a
                                    href={`data:image/png;base64,${resultImage}`}
                                    download="digital-render.png"
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {labels.download}
                                </a>
                                <button
                                    onClick={() => setResultImage('')}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-20">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <p>{isLoading ? "Processando traços do desenho..." : "Renderização digital aparecerá aqui"}</p>
                        </div>
                    )}
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </div>
            </div>
        </section>
    );
};

export default SketchToImage;
