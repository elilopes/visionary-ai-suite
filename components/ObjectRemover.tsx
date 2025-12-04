


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import BeforeAfterSlider from './BeforeAfterSlider';
import ImageInput from './ImageInput';

interface ObjectRemoverProps {
    labels: any;
}

const ObjectRemover: React.FC<ObjectRemoverProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [objectDescription, setObjectDescription] = useState('');
    const [image, setImage] = useState<string>('');
    const [originalUrl, setOriginalUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Brush States
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setOriginalUrl('');
        }
    }, [file]);

    // Reset canvas when image changes or window resizes
    const resetCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (canvas && img && img.complete) {
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, []);

    useEffect(() => {
        if (originalUrl) {
            // Wait slightly for image to render/layout
            setTimeout(resetCanvas, 100);
            window.addEventListener('resize', resetCanvas);
            return () => window.removeEventListener('resize', resetCanvas);
        }
    }, [originalUrl, resetCanvas]);

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setImage('');
        setError('');
        setObjectDescription('');
    };

    // Drawing Logic
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Translucent Red
            ctx.lineWidth = brushSize;
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        e.preventDefault(); // Prevent scrolling on touch
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.closePath();
        }
    };

    const clearMask = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
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
            
            // Use the user's description or a generic one if they just painted
            const desc = objectDescription.trim() ? objectDescription : "the marked red area";
            
            const prompt = `Remove the following object from the image: ${desc}. Inpaint the area to match the surrounding background seamlessly. Return the edited image.`;

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

        } catch (e) {
            console.error("Error removing object:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-red-500/30">
            <h3 className="text-2xl font-bold mb-2 text-red-400">{labels.objectRemoverTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.objectRemoverDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
                
                {file && !image && originalUrl && (
                    <div className="space-y-4">
                        <div 
                            ref={containerRef} 
                            className="relative mx-auto w-fit max-w-full select-none touch-none"
                        >
                            <img 
                                ref={imageRef}
                                src={originalUrl} 
                                alt="To Edit" 
                                className="max-h-96 rounded-md object-contain border border-gray-700 pointer-events-none"
                                onLoad={resetCanvas}
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>

                        {/* Brush Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-sm text-gray-300 whitespace-nowrap">Brush Size:</span>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    value={brushSize} 
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <div 
                                    className="w-6 h-6 rounded-full bg-red-500/50 border border-white/20 flex-shrink-0" 
                                    style={{ width: Math.min(brushSize, 24), height: Math.min(brushSize, 24) }}
                                />
                            </div>
                            <button 
                                onClick={clearMask}
                                className="px-3 py-1.5 text-xs font-medium text-red-300 border border-red-500/30 rounded hover:bg-red-900/20 transition-colors whitespace-nowrap"
                            >
                                Clear Selection
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-500">Paint over the object you want to remove.</p>
                    </div>
                )}

                <TextArea
                    id="object-remover-desc"
                    label="Describe object (Optional if painted)"
                    value={objectDescription}
                    placeholder={labels.objectRemoverPlaceholder}
                    onChange={setObjectDescription}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.objectRemoverButton}
                </button>
            </div>

            {(image || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {image && originalUrl && (
                        <div className="space-y-4 text-center">
                             <BeforeAfterSlider 
                                original={originalUrl}
                                processed={`data:image/png;base64,${image}`}
                                originalLabel="Original"
                                processedLabel="Clean"
                             />
                             <div className="pt-2">
                                <a
                                    href={`data:image/png;base64,${image}`}
                                    download="object-removed.png"
                                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {labels.download}
                                </a>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ObjectRemover;