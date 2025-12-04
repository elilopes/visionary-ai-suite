
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface ImageSonifierProps {
    labels: any;
}

const ImageSonifier: React.FC<ImageSonifierProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState('');
    
    // Audio Context Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Stop audio on unmount
    useEffect(() => {
        return () => stopAudio();
    }, []);

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setImageSrc(url);
        setAnalysis('');
        setError('');
        stopAudio();
    };

    const stopAudio = () => {
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch (e) { /* ignore */ }
            oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setIsPlaying(false);
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

    const handleAnalyzeAndPlay = async () => {
        if (!file) return;
        setIsLoading(true);
        setError('');
        stopAudio();

        try {
            // 1. AI Analysis
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            const prompt = `Analyze this image in terms of "Music of Colors" (Synesthesia).
            Describe the musical feeling of this image.
            - What genre fits best? (e.g., Jazz, Ambient, Classical)
            - What is the estimated tempo?
            - What instruments would represent the dominant colors?
            - Suggest a musical key (e.g., C Major for bright, A Minor for sad).
            Keep it poetic but concise.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [filePart, { text: prompt }]
                }
            });
            setAnalysis(response.text || "No analysis available.");

            // 2. Start Sonification (Web Audio API)
            startSonification();

        } catch (e: any) {
            console.error("Error sonifying image:", e);
            setError("Error processing image.");
        } finally {
            setIsLoading(false);
        }
    };

    const startSonification = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = imageSrc;
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            // Init Audio
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioCtx = audioCtxRef.current;
            
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.value = 0.1; // Low volume initially
            gainNodeRef.current = gainNode;

            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.connect(gainNode);
            osc.start();
            oscillatorRef.current = osc;

            setIsPlaying(true);
            
            // Scanning Loop
            let y = 0;
            const scanSpeed = 2; // Rows per frame

            const scan = () => {
                if (!ctx || y >= canvas.height) {
                    stopAudio();
                    return;
                }

                // Get average color of the row
                const rowData = ctx.getImageData(0, y, canvas.width, 1).data;
                let r = 0, g = 0, b = 0;
                for (let i = 0; i < rowData.length; i += 4) {
                    r += rowData[i];
                    g += rowData[i+1];
                    b += rowData[i+2];
                }
                const pixelCount = rowData.length / 4;
                r = Math.floor(r / pixelCount);
                g = Math.floor(g / pixelCount);
                b = Math.floor(b / pixelCount);

                // Map Color to Sound
                // Hue/Brightness mapping logic
                // Simple mapping: 
                // Red contributes to low freq
                // Green contributes to mid freq
                // Blue contributes to high freq
                
                // Frequency range: 100Hz to 1000Hz
                const frequency = 100 + (r * 0.5) + (g * 1.5) + (b * 2.5);
                
                // Volume based on brightness
                const brightness = (r + g + b) / 3;
                const volume = Math.min(0.3, Math.max(0.01, brightness / 255 * 0.3));

                if (oscillatorRef.current && gainNodeRef.current) {
                    // Smooth transition
                    oscillatorRef.current.frequency.setTargetAtTime(frequency, audioCtx.currentTime, 0.1);
                    gainNodeRef.current.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.1);
                }

                // Draw scan line visual
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Expensive, but needed to redraw image clean + line
                // Ideally we'd use layers but for simple visual:
                // Just let it run unseen on the hidden canvas, maybe show a progress bar in UI
                
                y += scanSpeed;
                animationFrameRef.current = requestAnimationFrame(scan);
            };
            
            scan();
        };
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.imageSonifierTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.imageSonifierDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
                
                <canvas ref={canvasRef} className="hidden" />

                {imageSrc && (
                    <div className="relative mx-auto w-full max-w-md">
                        <img 
                            src={imageSrc} 
                            alt="Visual" 
                            className={`rounded-md object-contain border border-gray-700 mx-auto max-h-64 transition-opacity ${isPlaying ? 'opacity-80' : 'opacity-100'}`} 
                        />
                        {isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-4xl animate-bounce">🎵</div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={isPlaying ? stopAudio : handleAnalyzeAndPlay}
                    disabled={isLoading || !file}
                    className={`flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white transition-colors w-full ${
                        isPlaying 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed'
                    }`}
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? "Analyzing..." : (isPlaying ? "Stop Music" : labels.imageSonifierButton)}
                </button>
            </div>

            {(analysis || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">Musical Analysis</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {analysis && (
                        <div className="text-gray-300 prose prose-invert bg-gray-900/50 p-4 rounded-md whitespace-pre-wrap">
                            {analysis}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ImageSonifier;
