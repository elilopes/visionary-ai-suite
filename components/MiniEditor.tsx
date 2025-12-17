
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
    scale: number;
}

const MiniEditor: React.FC<MiniEditorProps> = ({ labels }) => {
    const lang = labels.editorTab === "Camadas" ? 'pt' : 'en';
    const t = EDITOR_LABELS[lang] || EDITOR_LABELS['en'];

    const [layer1, setLayer1] = useState<Layer>({ id: 1, file: null, image: null, x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1, scale: 1 });
    const [layer2, setLayer2] = useState<Layer>({ id: 2, file: null, image: null, x: 50, y: 50, width: 0, height: 0, rotation: 0, opacity: 1, scale: 1 });
    const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>('source-over');
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    
    // Drag states
    const draggingLayerId = useRef<number | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (id: number, file: File) => {
        const img = new Image();
        img.onload = () => {
            const maxWidth = 500;
            const scaleFactor = img.width > maxWidth ? maxWidth / img.width : 1;
            const width = img.width * scaleFactor;
            const height = img.height * scaleFactor;
            
            const update = { 
                file, 
                image: img, 
                x: id === 1 ? 0 : 100,
                y: id === 1 ? 0 : 100, 
                width, 
                height,
                rotation: 0,
                opacity: 1,
                scale: 1
            };

            if (id === 1) setLayer1(prev => ({ ...prev, ...update }));
            else setLayer2(prev => ({ ...prev, ...update }));
        };
        img.src = URL.createObjectURL(file);
    };

    const handleRemoveBg = async (id: number) => {
        const layer = id === 1 ? layer1 : layer2;
        if (!layer.file) return;

        setIsProcessing(id);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(layer.file!);
            });
            const base64 = await base64Promise;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64, mimeType: layer.file!.type } },
                        { text: "Remove the background completely. Return ONLY the image with the subject on a transparent or white background." }
                    ]
                },
                config: { responseModalities: [Modality.IMAGE] }
            });

            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (part?.inlineData) {
                const newImg = new Image();
                newImg.onload = () => {
                    const update = { image: newImg, file: null }; 
                    if (id === 1) setLayer1(prev => ({ ...prev, ...update }));
                    else setLayer2(prev => ({ ...prev, ...update }));
                    setIsProcessing(null);
                };
                newImg.src = `data:image/png;base64,${part.inlineData.data}`;
            }
        } catch (e) {
            console.error(e);
            setIsProcessing(null);
        }
    };

    const swapLayers = () => {
        const l1_new = { ...layer1, id: layer2.id };
        const l2_new = { ...layer2, id: layer1.id };
        setLayer1(l1_new);
        setLayer2(l2_new);
    };

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = 800;
        canvas.height = 600;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderLayer = (layer: Layer, isTop: boolean) => {
            if (!layer.image) return;
            ctx.save();
            
            const scaledW = layer.width * layer.scale;
            const scaledH = layer.height * layer.scale;
            const cx = layer.x + scaledW / 2;
            const cy = layer.y + scaledH / 2;
            
            ctx.translate(cx, cy);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.globalAlpha = layer.opacity;
            
            if (isTop) ctx.globalCompositeOperation = blendMode;
            
            ctx.drawImage(
                layer.image, 
                -scaledW / 2, 
                -scaledH / 2, 
                scaledW, 
                scaledH
            );
            ctx.restore();
        };

        // Renderiza na ordem ID 1 (fundo) depois ID 2 (topo)
        const layers = [layer1, layer2].sort((a, b) => a.id - b.id);
        renderLayer(layers[0], false);
        renderLayer(layers[1], true);
    }, [layer1, layer2, blendMode]);

    useEffect(() => {
        const handle = requestAnimationFrame(drawCanvas);
        return () => cancelAnimationFrame(handle);
    }, [drawCanvas]);

    // --- Interaction Handlers ---
    const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        // Converte coordenadas do mouse para coordenadas internas do canvas (800x600)
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const isInside = (px: number, py: number, layer: Layer) => {
        if (!layer.image) return false;
        const w = layer.width * layer.scale;
        const h = layer.height * layer.scale;
        return px >= layer.x && px <= layer.x + w && py >= layer.y && py <= layer.y + h;
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getPointerPos(e);
        
        // Prioridade para a camada que está no topo (ID mais alto)
        const layers = [layer1, layer2].sort((a, b) => b.id - a.id);
        
        for (const layer of layers) {
            if (isInside(x, y, layer)) {
                draggingLayerId.current = layer === layer1 ? 1 : 2;
                dragOffset.current = { x: x - layer.x, y: y - layer.y };
                return;
            }
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (draggingLayerId.current === null) return;
        
        if ('touches' in e) e.preventDefault(); // Previne scroll ao arrastar no mobile

        const { x, y } = getPointerPos(e);
        const newX = x - dragOffset.current.x;
        const newY = y - dragOffset.current.y;

        if (draggingLayerId.current === 1) {
            setLayer1(prev => ({ ...prev, x: newX, y: newY }));
        } else {
            setLayer2(prev => ({ ...prev, x: newX, y: newY }));
        }
    };

    const handlePointerUp = () => {
        draggingLayerId.current = null;
    };

    const ControlPanel = ({ layer, setLayer }: { layer: Layer, setLayer: React.Dispatch<React.SetStateAction<Layer>> }) => (
        <div className="bg-gray-900/50 p-3 rounded border border-gray-700 space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-gray-500 uppercase">Tamanho</label>
                    <input type="range" min="0.1" max="3" step="0.1" value={layer.scale} 
                           onChange={e => setLayer(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} 
                           className="w-full h-1 bg-gray-700 rounded-lg appearance-none accent-indigo-500" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase">Rotação</label>
                    <input type="range" min="-180" max="180" value={layer.rotation} 
                           onChange={e => setLayer(prev => ({ ...prev, rotation: parseInt(e.target.value) }))} 
                           className="w-full h-1 bg-gray-700 rounded-lg appearance-none accent-indigo-500" />
                </div>
            </div>
            <button 
                onClick={() => handleRemoveBg(layer === layer1 ? 1 : 2)}
                disabled={isProcessing !== null}
                className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold rounded border border-indigo-500/30 transition-colors flex justify-center items-center gap-2"
            >
                {isProcessing === (layer === layer1 ? 1 : 2) ? <Spinner /> : '✨ ' + t.removeBg}
            </button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <header className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-200">{t.title}</h2>
                <p className="text-gray-400 mt-1 uppercase text-xs tracking-widest">{t.description}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    {/* Layer 1 (Base/Bottom) */}
                    <div className={`bg-gray-800 p-4 rounded-lg border-2 transition-all ${layer1.image ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-gray-700'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">{t.layer1} {layer1.id === 2 && '(TOP)'}</label>
                        </div>
                        <ImageInput onChange={(f) => handleFileChange(1, f)} labels={labels} />
                        {layer1.image && <ControlPanel layer={layer1} setLayer={setLayer1} />}
                    </div>

                    {/* Swap Button */}
                    <button onClick={swapLayers} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-bold border border-gray-600 transition-transform active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                        </svg>
                        Inverter Ordem
                    </button>

                    {/* Layer 2 (Overlay/Top) */}
                    <div className={`bg-gray-800 p-4 rounded-lg border-2 transition-all ${layer2.image ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-gray-700'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">{t.layer2} {layer2.id === 2 && '(TOP)'}</label>
                        </div>
                        <ImageInput onChange={(f) => handleFileChange(2, f)} labels={labels} />
                        {layer2.image && <ControlPanel layer={layer2} setLayer={setLayer2} />}
                    </div>

                    {/* Global Settings */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <label className="text-xs text-gray-400 block mb-2 uppercase">Modo de Mesclagem</label>
                        <select value={blendMode} onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)} className="w-full bg-gray-900 border-gray-700 text-white rounded p-2 text-sm">
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiplicar</option>
                            <option value="screen">Tela (Screen)</option>
                            <option value="overlay">Sobrepor</option>
                            <option value="difference">Diferença</option>
                        </select>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-black rounded-xl p-4 flex items-center justify-center min-h-[600px] border border-gray-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full border border-white/20">
                            Arrastar habilitado (Mouse/Touch)
                        </span>
                    </div>
                    <canvas 
                        ref={canvasRef} 
                        onMouseDown={handlePointerDown}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                        className="max-w-full max-h-[75vh] object-contain shadow-2xl bg-gray-900 border border-gray-700 cursor-move touch-none"
                        style={{ backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)', backgroundSize: '20px 20px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MiniEditor;
