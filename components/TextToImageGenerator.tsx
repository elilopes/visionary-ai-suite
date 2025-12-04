
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface TextToImageGeneratorProps {
    labels: any;
}

const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({ labels }) => {
    const [input, setInput] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');

    // Crop State
    const [isCropping, setIsCropping] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [selection, setSelection] = useState<{x:number, y:number, w:number, h:number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState<{x:number, y:number}>({x:0, y:0});
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setImages([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = input;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { 
                    responseModalities: [Modality.IMAGE],
                    imageConfig: { aspectRatio: aspectRatio as any }
                }
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

        } catch (e: any) {
            console.error("Error generating image:", e);
            
            let errorMsg = labels.error || "Error generating image.";
            if (e.message) {
                if (e.message.includes('SAFETY') || e.message.includes('blocked')) {
                    errorMsg = "Generation Blocked: The prompt triggered safety filters. Please try a different description.";
                } else if (e.message.includes('429')) {
                    errorMsg = "System Busy: Rate limit exceeded. Please try again in a moment.";
                } else if (e.message.includes('403')) {
                    errorMsg = "Permission Denied: Check your API Key.";
                }
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Crop Logic ---

    useEffect(() => {
        if (isCropping && canvasRef.current && images[activeImageIndex]) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = `data:image/png;base64,${images[activeImageIndex]}`;
            
            img.onload = () => {
                // Reset canvas size to match image
                if (canvas.width !== img.width || canvas.height !== img.height) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }

                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                ctx?.drawImage(img, 0, 0);
                
                // Draw Overlay
                if (selection && ctx) {
                    // Darken entire area
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Clear selection (make it bright)
                    ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
                    ctx.drawImage(img, selection.x, selection.y, selection.w, selection.h, selection.x, selection.y, selection.w, selection.h);
                    
                    // Draw Border
                    ctx.strokeStyle = '#3b82f6'; // Blue-500
                    ctx.lineWidth = 2;
                    ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
                    
                    // Draw Dimensions
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(selection.x, selection.y - 20, 80, 20);
                    ctx.fillStyle = 'white';
                    ctx.font = '12px sans-serif';
                    ctx.fillText(`${Math.round(selection.w)}x${Math.round(selection.h)}`, selection.x + 5, selection.y - 5);
                }
            };
        }
    }, [isCropping, images, activeImageIndex, selection]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoords(e);
        setStartPos({ x, y });
        setSelection({ x, y, w: 0, h: 0 });
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        const w = x - startPos.x;
        const h = y - startPos.y;

        setSelection({
            x: w > 0 ? startPos.x : x,
            y: h > 0 ? startPos.y : y,
            w: Math.abs(w),
            h: Math.abs(h)
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const applyCrop = () => {
        if (!canvasRef.current || !selection || selection.w < 10 || selection.h < 10) {
            setIsCropping(false);
            return;
        }
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = selection.w;
        tempCanvas.height = selection.h;
        const ctx = tempCanvas.getContext('2d');
        
        const img = new Image();
        img.src = `data:image/png;base64,${images[activeImageIndex]}`;
        img.onload = () => {
            ctx?.drawImage(img, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);
            const croppedBase64 = tempCanvas.toDataURL('image/png').split(',')[1];
            
            const newImages = [...images];
            newImages[activeImageIndex] = croppedBase64;
            setImages(newImages);
            setIsCropping(false);
            setSelection(null);
        };
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-2 text-blue-400">{labels.textToImageTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.textToImageDescription}</p>

            <div className="space-y-4">
                <div className="flex flex-wrap gap-3 mb-2 items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <span className="text-sm font-medium text-gray-400">Aspect Ratio:</span>
                    <div className="flex flex-wrap gap-2">
                        {aspectRatios.map(ratio => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                    aspectRatio === ratio 
                                    ? 'bg-blue-600 text-white shadow-md scale-105' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>

                <TextArea
                    id="text-image-input"
                    label="Image Description"
                    value={input}
                    placeholder={labels.textToImagePlaceholder}
                    onChange={setInput}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim() || isCropping}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.textToImageButton}
                </button>
            </div>

            {(images.length > 0 || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded-md p-3 mb-4">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}
                    
                    {isCropping ? (
                        <div className="bg-black/80 p-4 rounded-lg border border-blue-500/50 flex flex-col items-center">
                            <p className="text-sm text-gray-300 mb-2">Draw a rectangle to crop</p>
                            <div className="overflow-auto max-w-full max-h-[500px] border border-gray-700">
                                <canvas 
                                    ref={canvasRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={handleMouseDown}
                                    onTouchMove={handleMouseMove}
                                    onTouchEnd={handleMouseUp}
                                    className="cursor-crosshair touch-none"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setIsCropping(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm">Cancel</button>
                                <button onClick={applyCrop} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-bold">Confirm Crop</button>
                            </div>
                        </div>
                    ) : (
                        images.length > 0 && (
                            <div className="grid grid-cols-1 gap-6">
                                {images.map((img, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <img src={`data:image/png;base64,${img}`} alt="Generated" className="w-full max-w-md rounded-lg shadow-md mb-3" />
                                        <div className="flex gap-3">
                                            <a
                                                href={`data:image/png;base64,${img}`}
                                                download={`generated-image-${idx}.png`}
                                                className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                                Download
                                            </a>
                                            <button
                                                onClick={() => { setActiveImageIndex(idx); setIsCropping(true); setSelection(null); }}
                                                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>
                                                Crop
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </section>
    );
};

export default TextToImageGenerator;
