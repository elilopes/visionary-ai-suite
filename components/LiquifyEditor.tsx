
import React, { useState, useRef, useEffect } from 'react';
import ImageInput from './ImageInput';

interface LiquifyEditorProps {
    labels: any;
}

const LiquifyEditor: React.FC<LiquifyEditorProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [brushSize, setBrushSize] = useState(50);
    const [strength, setStrength] = useState(0.5);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageRef = useRef<HTMLImageElement | null>(null);
    const isDragging = useRef(false);
    const lastPos = useRef<{x: number, y: number} | null>(null);

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        img.onload = () => {
            originalImageRef.current = img;
            resetCanvas();
        };
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        const img = originalImageRef.current;
        if (canvas && img) {
            // Cap max size for performance
            const maxWidth = 800;
            const scale = img.width > maxWidth ? maxWidth / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    };

    const liquify = (x: number, y: number, prevX: number, prevY: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (!canvas || !ctx) return;

        const radius = brushSize;
        const radiusSq = radius * radius;
        
        // Get image data for the affected area
        const startX = Math.max(0, x - radius);
        const startY = Math.max(0, y - radius);
        const endX = Math.min(canvas.width, x + radius);
        const endY = Math.min(canvas.height, y + radius);
        const w = endX - startX;
        const h = endY - startY;

        if (w <= 0 || h <= 0) return;

        const imageData = ctx.getImageData(startX, startY, w, h);
        const data = imageData.data;
        const newImageData = ctx.createImageData(w, h);
        const newData = newImageData.data;

        // Simple Warp: Push pixels in direction of movement
        const dx = x - prevX;
        const dy = y - prevY;
        const distMoved = Math.sqrt(dx*dx + dy*dy);
        if (distMoved === 0) return;

        for (let ly = 0; ly < h; ly++) {
            for (let lx = 0; lx < w; lx++) {
                const gx = startX + lx;
                const gy = startY + ly;
                const distSq = (gx - x)*(gx - x) + (gy - y)*(gy - y);

                if (distSq < radiusSq) {
                    const power = Math.pow(1 - distSq / radiusSq, 2) * strength; // Falloff
                    
                    // Source lookup coordinates (inverse mapping)
                    const srcX = Math.round(lx - dx * power * 0.5); // 0.5 factor to temper speed
                    const srcY = Math.round(ly - dy * power * 0.5);

                    // Clamp
                    const clampedSrcX = Math.min(Math.max(srcX, 0), w - 1);
                    const clampedSrcY = Math.min(Math.max(srcY, 0), h - 1);

                    const targetIdx = (ly * w + lx) * 4;
                    const srcIdx = (clampedSrcY * w + clampedSrcX) * 4;

                    newData[targetIdx] = data[srcIdx];
                    newData[targetIdx + 1] = data[srcIdx + 1];
                    newData[targetIdx + 2] = data[srcIdx + 2];
                    newData[targetIdx + 3] = data[srcIdx + 3];
                } else {
                    // Copy original if outside circle
                    const idx = (ly * w + lx) * 4;
                    newData[idx] = data[idx];
                    newData[idx + 1] = data[idx + 1];
                    newData[idx + 2] = data[idx + 2];
                    newData[idx + 3] = data[idx + 3];
                }
            }
        }
        
        ctx.putImageData(newImageData, startX, startY);
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return {x:0, y:0};
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
            y: (clientY - rect.top) * (canvasRef.current.height / rect.height)
        };
    };

    const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDragging.current = true;
        lastPos.current = getPos(e);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging.current || !lastPos.current) return;
        e.preventDefault(); // Stop scrolling on touch
        const currentPos = getPos(e);
        liquify(currentPos.x, currentPos.y, lastPos.current.x, lastPos.current.y);
        lastPos.current = currentPos;
    };

    const handleUp = () => {
        isDragging.current = false;
        lastPos.current = null;
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'liquified.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-pink-500/30">
            <h3 className="text-2xl font-bold mb-2 text-pink-400">{labels.liquifyTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.liquifyDescription}</p>

            {!file ? (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center justify-center bg-gray-900 p-3 rounded-lg border border-gray-700">
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400">{labels.liquifyBrushSize}: {brushSize}</label>
                            <input type="range" min="10" max="200" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-32 accent-pink-500"/>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400">{labels.liquifyStrength}: {Math.round(strength*100)}%</label>
                            <input type="range" min="0.1" max="1" step="0.1" value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-32 accent-pink-500"/>
                        </div>
                        <button onClick={resetCanvas} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">{labels.liquifyReset}</button>
                    </div>

                    <div className="relative overflow-hidden rounded-lg border border-gray-700 cursor-crosshair touch-none flex justify-center bg-black/50">
                        <canvas 
                            ref={canvasRef}
                            onMouseDown={handleDown}
                            onMouseMove={handleMove}
                            onMouseUp={handleUp}
                            onMouseLeave={handleUp}
                            onTouchStart={handleDown}
                            onTouchMove={handleMove}
                            onTouchEnd={handleUp}
                            className="max-w-full max-h-[600px] object-contain"
                        />
                    </div>

                    <button 
                        onClick={handleDownload}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                    >
                        {labels.liquifyDownload}
                    </button>
                </div>
            )}
        </section>
    );
};

export default LiquifyEditor;
