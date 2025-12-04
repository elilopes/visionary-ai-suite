
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import ImageInput from './ImageInput';
import Spinner from './Spinner';
import { EDITOR_LABELS } from '../constants';

interface MiniEditorProps {
    labels: any;
}

interface Layer {
    id: number;
    file: File | null;
    image: HTMLImageElement | null;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    scaleX: number;
    scaleY: number;
}

type ToolMode = 'move' | 'resize' | 'wand' | 'rotate';

interface ClipboardItem {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}

const MiniEditor: React.FC<MiniEditorProps> = ({ labels }) => {
    const lang = labels.editorTab === "Editor de Camadas" ? 'pt' : 
                 labels.editorTab === "Layer Editor" ? 'en' :
                 labels.editorTab === "Éditeur de Calques" ? 'fr' :
                 labels.editorTab === "परत संपादक" ? 'hi' : 'ru';
    
    const t = EDITOR_LABELS[lang] || EDITOR_LABELS['en'];

    const [layer1, setLayer1] = useState<Layer>({ id: 1, file: null, image: null, x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 });
    const [layer2, setLayer2] = useState<Layer>({ id: 2, file: null, image: null, x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 });
    const [activeLayerId, setActiveLayerId] = useState<number>(2);
    const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>('source-over');
    const [tool, setTool] = useState<ToolMode>('move');
    const [isLoading, setIsLoading] = useState(false);
    
    // Live Adjustments
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [gamma, setGamma] = useState(1);
    const [sharpness, setSharpness] = useState(0);

    // Wand & Selection
    const [tolerance, setTolerance] = useState(20);
    const [selectionMask, setSelectionMask] = useState<Uint8ClampedArray | null>(null);
    const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragStartRotation, setDragStartRotation] = useState(0);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [initialResizeState, setInitialResizeState] = useState<{w: number, h: number, x: number, y: number} | null>(null);

    const handleFileChange = (id: number, file: File) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const update = { 
                file, 
                image: img, 
                x: 50, 
                y: 50, 
                width: img.width > 600 ? 600 : img.width, 
                height: img.width > 600 ? (600 * img.height / img.width) : img.height,
                rotation: 0,
                opacity: 1,
                scaleX: 1,
                scaleY: 1
            };
            if (id === 1) setLayer1(prev => ({ ...prev, ...update }));
            else setLayer2(prev => ({ ...prev, ...update }));
        };
    };

    const swapLayers = () => {
        const temp = { ...layer1, id: 2 };
        setLayer1({ ...layer2, id: 1 });
        setLayer2(temp);
    };

    // --- Image Processing Utilities ---

    const applyPixelFilters = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (gamma === 1 && sharpness === 0) return;

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Gamma Correction
        if (gamma !== 1) {
            const gammaCorrection = 1 / gamma;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 * Math.pow((data[i] / 255), gammaCorrection);
                data[i+1] = 255 * Math.pow((data[i+1] / 255), gammaCorrection);
                data[i+2] = 255 * Math.pow((data[i+2] / 255), gammaCorrection);
            }
        }

        // Sharpness (Simple Convolution)
        if (sharpness > 0) {
            const w = width;
            const h = height;
            const mix = sharpness / 100; // 0 to 1
            const copy = new Uint8ClampedArray(data);
            
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const i = (y * w + x) * 4;
                    const up = ((y - 1) * w + x) * 4;
                    const down = ((y + 1) * w + x) * 4;
                    const left = (y * w + (x - 1)) * 4;
                    const right = (y * w + (x + 1)) * 4;

                    for (let c = 0; c < 3; c++) {
                        const val = 5 * copy[i+c] - copy[up+c] - copy[down+c] - copy[left+c] - copy[right+c];
                        data[i+c] = Math.min(255, Math.max(0, val * mix + copy[i+c] * (1-mix)));
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    };

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const width = 800;
        const height = 600;
        
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        ctx.clearRect(0, 0, width, height);

        const drawLayer = (layer: Layer, isTop: boolean) => {
            if (!layer.image) return;
            
            // Temporary canvas for filter application on raw image data
            // To support rotation correctly with filters, we ideally apply filters first, then transform.
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = layer.width;
            tempCanvas.height = layer.height;
            const tCtx = tempCanvas.getContext('2d');
            if (!tCtx) return;

            // Apply standard filters
            if (activeLayerId === layer.id) {
                tCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
            }
            
            // Draw image to temp canvas
            tCtx.drawImage(layer.image, 0, 0, layer.width, layer.height);
            
            // Apply Pixel Filters (Gamma/Sharpness) if active
            if (activeLayerId === layer.id) {
                applyPixelFilters(tCtx, layer.width, layer.height);
            }

            // Draw to main context with transforms
            ctx.save();
            
            // Move to center of image
            const cx = layer.x + layer.width / 2;
            const cy = layer.y + layer.height / 2;
            ctx.translate(cx, cy);
            
            // Rotate
            ctx.rotate(layer.rotation * Math.PI / 180);
            
            // Scale (Flip)
            ctx.scale(layer.scaleX, layer.scaleY);
            
            // Draw centered
            ctx.globalAlpha = layer.opacity;
            if (isTop) ctx.globalCompositeOperation = blendMode;
            else ctx.globalCompositeOperation = 'source-over';
            
            ctx.drawImage(tempCanvas, -layer.width / 2, -layer.height / 2);
            
            ctx.restore();

            // Draw Resize Handles (Untransformed coordinates usually, but if rotated, bounding box is complex)
            // Simplified: Only draw handles if not rotated for basic resizing, or draw loose rect
            if (tool === 'resize' && activeLayerId === layer.id && layer.rotation === 0) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
                
                const handles = [
                    { x: layer.x, y: layer.y },
                    { x: layer.x + layer.width, y: layer.y },
                    { x: layer.x, y: layer.y + layer.height },
                    { x: layer.x + layer.width, y: layer.y + layer.height }
                ];
                
                ctx.fillStyle = '#ffffff';
                handles.forEach(h => {
                    ctx.fillRect(h.x - 5, h.y - 5, 10, 10);
                    ctx.strokeRect(h.x - 5, h.y - 5, 10, 10);
                });
            }
            
            // Draw Selection Overlay
            if (activeLayerId === layer.id && selectionMask) {
                const maskData = ctx.createImageData(width, height);
                for (let i = 0; i < selectionMask.length; i++) {
                    if (selectionMask[i] === 1) {
                        const idx = i * 4;
                        maskData.data[idx] = 100;   // R
                        maskData.data[idx+1] = 149; // G
                        maskData.data[idx+2] = 237; // B
                        maskData.data[idx+3] = 100; // Alpha
                    }
                }
                ctx.globalCompositeOperation = 'source-over';
                const tempMaskCanvas = document.createElement('canvas');
                tempMaskCanvas.width = width;
                tempMaskCanvas.height = height;
                tempMaskCanvas.getContext('2d')?.putImageData(maskData, 0, 0);
                ctx.drawImage(tempMaskCanvas, 0, 0);
            }
        };

        drawLayer(layer1, false);
        drawLayer(layer2, true);

    }, [layer1, layer2, blendMode, activeLayerId, tool, brightness, contrast, gamma, sharpness, selectionMask]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // --- Actions ---

    const updateLayer = (id: number, updates: Partial<Layer>) => {
        if (id === 1) setLayer1(prev => ({ ...prev, ...updates }));
        else setLayer2(prev => ({ ...prev, ...updates }));
    };

    const performFloodFill = (startX: number, startY: number) => {
        // ... existing flood fill logic ...
        // Simplified for brevity, assume existing implementation works on visual buffer
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const targetIdx = (Math.floor(startY) * w + Math.floor(startX)) * 4;
        const targetColor = [data[targetIdx], data[targetIdx+1], data[targetIdx+2], data[targetIdx+3]];
        const mask = new Uint8ClampedArray(w * h).fill(0);
        const stack = [[Math.floor(startX), Math.floor(startY)]];
        const visited = new Set();
        const tol = tolerance; 
        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            const idx = (y * w + x) * 4;
            const key = `${x},${y}`;
            if (x < 0 || x >= w || y < 0 || y >= h || visited.has(key)) continue;
            const rDiff = Math.abs(data[idx] - targetColor[0]);
            const gDiff = Math.abs(data[idx+1] - targetColor[1]);
            const bDiff = Math.abs(data[idx+2] - targetColor[2]);
            const aDiff = Math.abs(data[idx+3] - targetColor[3]);
            if (rDiff <= tol && gDiff <= tol && bDiff <= tol && aDiff <= tol) {
                mask[y * w + x] = 1;
                visited.add(key);
                stack.push([x+1, y]);
                stack.push([x-1, y]);
                stack.push([x, y+1]);
                stack.push([x, y-1]);
            }
        }
        setSelectionMask(mask);
    };

    const handleCut = () => {
        setSelectionMask(null);
    };

    const handleCopy = () => {
        if (!selectionMask || !canvasRef.current) return;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const ctx = canvasRef.current.getContext('2d');
        if(!ctx) return;
        const currentData = ctx.getImageData(0,0, width, height).data;
        const newData = new Uint8ClampedArray(width * height * 4);
        let hasPixels = false;
        for(let i=0; i<selectionMask.length; i++) {
            if(selectionMask[i] === 1) {
                const idx = i*4;
                newData[idx] = currentData[idx];
                newData[idx+1] = currentData[idx+1];
                newData[idx+2] = currentData[idx+2];
                newData[idx+3] = currentData[idx+3];
                hasPixels = true;
            }
        }
        if (hasPixels) {
            setClipboard({ width, height, data: newData });
        }
    };

    const handlePaste = () => {
        if (!clipboard) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = clipboard.width;
        tempCanvas.height = clipboard.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        const iData = new ImageData(clipboard.data, clipboard.width, clipboard.height);
        ctx.putImageData(iData, 0, 0);
        const newImg = new Image();
        newImg.src = tempCanvas.toDataURL();
        newImg.onload = () => {
            const update = { image: newImg, width: clipboard.width, height: clipboard.height };
            updateLayer(activeLayerId, update);
        }
    };

    const handleClearSelection = () => setSelectionMask(null);

    const handleFlip = (direction: 'H' | 'V') => {
        const layer = activeLayerId === 1 ? layer1 : layer2;
        if (direction === 'H') {
            updateLayer(activeLayerId, { scaleX: layer.scaleX * -1 });
        } else {
            updateLayer(activeLayerId, { scaleY: layer.scaleY * -1 });
        }
    };

    // --- Interaction ---

    const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
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
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPointerPos(e);
        const targetLayer = activeLayerId === 1 ? layer1 : layer2;

        if (tool === 'wand') {
            performFloodFill(pos.x, pos.y);
            return;
        }

        if (tool === 'rotate') {
            setIsDragging(true);
            const cx = targetLayer.x + targetLayer.width / 2;
            const cy = targetLayer.y + targetLayer.height / 2;
            // Store initial angle relative to center
            setDragStartRotation(Math.atan2(pos.y - cy, pos.x - cx) - (targetLayer.rotation * Math.PI / 180));
            return;
        }

        if (tool === 'resize') {
            const hitDist = 15;
            const corners = [
                { id: 'tl', x: targetLayer.x, y: targetLayer.y },
                { id: 'tr', x: targetLayer.x + targetLayer.width, y: targetLayer.y },
                { id: 'bl', x: targetLayer.x, y: targetLayer.y + targetLayer.height },
                { id: 'br', x: targetLayer.x + targetLayer.width, y: targetLayer.y + targetLayer.height }
            ];
            const hit = corners.find(c => Math.abs(c.x - pos.x) < hitDist && Math.abs(c.y - pos.y) < hitDist);
            if (hit) {
                setIsResizing(true);
                setResizeHandle(hit.id);
                setInitialResizeState({ w: targetLayer.width, h: targetLayer.height, x: targetLayer.x, y: targetLayer.y });
                setDragStart(pos);
                return;
            }
        }

        setIsDragging(true);
        setDragStart({ x: pos.x - targetLayer.x, y: pos.y - targetLayer.y });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPointerPos(e);
        const targetLayer = activeLayerId === 1 ? layer1 : layer2;

        if (tool === 'rotate' && isDragging) {
            e.preventDefault();
            const cx = targetLayer.x + targetLayer.width / 2;
            const cy = targetLayer.y + targetLayer.height / 2;
            const angleRad = Math.atan2(pos.y - cy, pos.x - cx);
            const rotation = (angleRad - dragStartRotation) * 180 / Math.PI;
            updateLayer(activeLayerId, { rotation });
            return;
        }

        if (isResizing && initialResizeState && resizeHandle) {
            e.preventDefault();
            let newW = initialResizeState.w;
            let newH = initialResizeState.h;
            if (resizeHandle === 'br') {
                newW = Math.max(10, pos.x - initialResizeState.x);
                newH = Math.max(10, pos.y - initialResizeState.y);
            }
            updateLayer(activeLayerId, { width: newW, height: newH });
            return;
        }

        if (isDragging && tool === 'move') {
            e.preventDefault();
            const newX = pos.x - dragStart.x;
            const newY = pos.y - dragStart.y;
            updateLayer(activeLayerId, { x: newX, y: newY });
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    };

    const handleRemoveBackground = async () => {
        const targetLayer = activeLayerId === 1 ? layer1 : layer2;
        if (!targetLayer.file) return;
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(targetLayer.file as File);
            });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { mimeType: targetLayer.file.type, data: base64Data } }, { text: "Remove background, return transparent PNG." }] },
                config: { responseModalities: [Modality.IMAGE] }
            });
            if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const newImg = new Image();
                newImg.src = `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}`;
                newImg.onload = () => updateLayer(activeLayerId, { image: newImg });
            }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleDownload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Try File System Access API
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: 'composition.png',
                    types: [{
                        description: 'PNG Image',
                        accept: { 'image/png': ['.png'] },
                    }],
                });
                
                const writable = await handle.createWritable();
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
                if (blob) {
                    await writable.write(blob);
                    await writable.close();
                }
                return;
            } catch (err) {
                // Fallback if user cancels or error
                console.log("File picker cancelled or failed, falling back to download.");
            }
        }

        // Fallback
        const link = document.createElement('a');
        link.download = 'composition.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-200">{t.title}</h2>
                <p className="text-gray-400 mt-2">{t.description}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {/* Tool Bar */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 grid grid-cols-4 gap-2">
                        <button onClick={() => setTool('move')} className={`p-2 rounded ${tool === 'move' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`} title={t.tools.move}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
                        </button>
                        <button onClick={() => setTool('rotate')} className={`p-2 rounded ${tool === 'rotate' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`} title={t.tools.rotate}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992a8.25 8.25 0 0 0-11.667 0v4.992m16.66-4.992l-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 5.006m16.66 4.992h-4.992" /></svg>
                        </button>
                        <button onClick={() => setTool('resize')} className={`p-2 rounded ${tool === 'resize' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`} title={t.tools.resize}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                        </button>
                        <button onClick={() => setTool('wand')} className={`p-2 rounded ${tool === 'wand' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`} title={t.tools.wand}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
                        </button>
                    </div>

                    {/* Wand Settings */}
                    {tool === 'wand' && (
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <label className="text-xs text-gray-400">{t.wandTolerance}: {tolerance}%</label>
                            <input type="range" min="0" max="100" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded cursor-pointer" />
                            {selectionMask && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button onClick={handleCut} className="text-xs bg-red-600 text-white p-1 rounded">{t.actions.cut}</button>
                                    <button onClick={handleCopy} className="text-xs bg-blue-600 text-white p-1 rounded">{t.actions.copy}</button>
                                    <button onClick={handleClearSelection} className="text-xs bg-gray-600 text-white p-1 rounded col-span-2">{t.actions.clearSelection}</button>
                                </div>
                            )}
                            {clipboard && <button onClick={handlePaste} className="text-xs bg-green-600 text-white p-1 rounded w-full mt-2">{t.actions.paste}</button>}
                        </div>
                    )}

                    {/* Active Layer Adjustments (Rotate/Flip/Opacity) */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                        <label className="text-xs text-gray-400 font-bold block mb-1">Active Layer Controls</label>
                        <div className="flex gap-2">
                            <button onClick={() => handleFlip('H')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded">{t.actions.flipH}</button>
                            <button onClick={() => handleFlip('V')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded">{t.actions.flipV}</button>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">{t.opacity}: {Math.round((activeLayerId === 1 ? layer1.opacity : layer2.opacity) * 100)}%</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={(activeLayerId === 1 ? layer1.opacity : layer2.opacity) * 100} 
                                onChange={(e) => updateLayer(activeLayerId, { opacity: Number(e.target.value) / 100 })}
                                className="w-full h-1 bg-gray-600 rounded cursor-pointer accent-white" 
                            />
                        </div>
                    </div>

                    {/* Layer 1 Control */}
                    <div className={`p-4 rounded-lg border ${activeLayerId === 1 ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-300 text-sm">{t.layer1}</h4>
                            <input type="radio" checked={activeLayerId === 1} onChange={() => setActiveLayerId(1)} className="accent-indigo-500 h-4 w-4" />
                        </div>
                        <ImageInput onChange={(file) => handleFileChange(1, file)} labels={{ takePhoto: t.upload }} className="mb-2" />
                    </div>

                    {/* Swap */}
                    <div className="flex justify-center">
                        <button onClick={swapLayers} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg></button>
                    </div>

                    {/* Layer 2 Control */}
                    <div className={`p-4 rounded-lg border ${activeLayerId === 2 ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-300 text-sm">{t.layer2}</h4>
                            <input type="radio" checked={activeLayerId === 2} onChange={() => setActiveLayerId(2)} className="accent-indigo-500 h-4 w-4" />
                        </div>
                        <ImageInput onChange={(file) => handleFileChange(2, file)} labels={{ takePhoto: t.upload }} className="mb-2" />
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                        <select value={blendMode} onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)} className="w-full bg-gray-900 text-white rounded p-2 text-sm">
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                            <option value="overlay">Overlay</option>
                        </select>
                        <button onClick={handleRemoveBackground} disabled={isLoading} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">{isLoading ? t.processing : t.removeBg}</button>
                        <button 
                            onClick={handleDownload} 
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            {t.download}
                        </button>
                    </div>
                </div>

                {/* Canvas & Live Adjustments */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="bg-black/50 rounded-lg border border-dashed border-gray-700 flex items-center justify-center p-4 relative min-h-[500px] overflow-hidden">
                        <div ref={containerRef} className="relative shadow-2xl border border-gray-800 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')]">
                            <canvas 
                                ref={canvasRef}
                                onMouseDown={handlePointerDown}
                                onMouseMove={handlePointerMove}
                                onMouseUp={handlePointerUp}
                                onMouseLeave={handlePointerUp}
                                onTouchStart={handlePointerDown}
                                onTouchMove={handlePointerMove}
                                onTouchEnd={handlePointerUp}
                                className={`max-w-full max-h-[70vh] object-contain touch-none ${tool === 'move' ? 'cursor-move' : tool === 'wand' ? 'cursor-crosshair' : tool === 'rotate' ? 'cursor-ew-resize' : 'cursor-default'}`}
                            />
                        </div>
                    </div>

                    {/* Live Adjustments Bar */}
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block">{t.adjustments.brightness}</label>
                            <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded cursor-pointer accent-yellow-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block">{t.adjustments.contrast}</label>
                            <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded cursor-pointer accent-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block">{t.adjustments.gamma}</label>
                            <input type="range" min="0.1" max="3" step="0.1" value={gamma} onChange={(e) => setGamma(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded cursor-pointer accent-green-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block">{t.adjustments.sharpness}</label>
                            <input type="range" min="0" max="100" value={sharpness} onChange={(e) => setSharpness(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded cursor-pointer accent-red-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniEditor;