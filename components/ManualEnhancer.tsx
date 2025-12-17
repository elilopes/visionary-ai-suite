
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ImageInput from './ImageInput';

interface ManualEnhancerProps {
    labels: any;
}

const ManualEnhancer: React.FC<ManualEnhancerProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [gamma, setGamma] = useState(1);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        img.onload = () => {
            imageRef.current = img;
            resetAdjustments();
            // Need to wait for next render cycle or call render explicitly
            setTimeout(renderCanvas, 50);
        };
    };

    const resetAdjustments = () => {
        setBrightness(100);
        setContrast(100);
        setGamma(1);
    };

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Set dimensions (limit max size for performance)
        const maxWidth = 800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Apply standard filters first
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none'; // Reset filter

        // Apply Gamma manually via pixel manipulation
        if (gamma !== 1) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const gammaCorrection = 1 / gamma;

            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 * Math.pow((data[i] / 255), gammaCorrection);
                data[i+1] = 255 * Math.pow((data[i+1] / 255), gammaCorrection);
                data[i+2] = 255 * Math.pow((data[i+2] / 255), gammaCorrection);
            }
            ctx.putImageData(imgData, 0, 0);
        }
    }, [brightness, contrast, gamma]);

    useEffect(() => {
        renderCanvas();
    }, [brightness, contrast, gamma, renderCanvas]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'edited-photo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-2 text-blue-400">{labels.manualEnhancerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.manualEnhancerDescription}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <ImageInput onChange={handleFileChange} labels={labels} />
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-gray-400">{labels.manualEnhancerBrightness}</label>
                                <span className="text-xs text-blue-400">{brightness}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="200" 
                                value={brightness} 
                                onChange={(e) => setBrightness(Number(e.target.value))} 
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-gray-400">{labels.manualEnhancerContrast}</label>
                                <span className="text-xs text-blue-400">{contrast}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="200" 
                                value={contrast} 
                                onChange={(e) => setContrast(Number(e.target.value))} 
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-gray-400">{labels.manualEnhancerGamma}</label>
                                <span className="text-xs text-blue-400">{gamma}</span>
                            </div>
                            <input 
                                type="range" min="0.1" max="3" step="0.1" 
                                value={gamma} 
                                onChange={(e) => setGamma(Number(e.target.value))} 
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={resetAdjustments}
                                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                            >
                                {labels.manualEnhancerReset}
                            </button>
                            <button 
                                onClick={handleDownload}
                                disabled={!file}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {labels.manualEnhancerDownload}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-black/30 rounded-lg p-2 flex items-center justify-center min-h-[400px] border border-gray-700">
                    <canvas 
                        ref={canvasRef} 
                        className="max-w-full max-h-[500px] object-contain rounded shadow-lg"
                    />
                    {!file && <p className="text-gray-500 text-sm absolute">Preview Area</p>}
                </div>
            </div>
        </section>
    );
};

export default ManualEnhancer;
