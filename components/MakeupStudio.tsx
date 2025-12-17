
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface MakeupStudioProps {
    labels: any; 
}

type MakeupTool = 
    | 'lipstick' | 'blush' | 'eyeshadow' | 'eyeliner' 
    | 'lashes' | 'foundation' | 'contour' 
    | 'whitening' | 'slim' | 'nose' | 'acne' | 'wrinkles'
    | 'openEyes' | 'smile' | 'brightness' | 'sharpen'
    | 'wig' | 'hat' | 'hairColor' | 'removeBg'
    | 'tan' | 'autoFix';

const MakeupStudio: React.FC<MakeupStudioProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [image, setImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedFace, setSelectedFace] = useState('main');
    const [activeTool, setActiveTool] = useState<MakeupTool>('lipstick');
    const [color, setColor] = useState('#ff0000');
    const [intensity, setIntensity] = useState(50);

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

    const handleApply = async () => {
        if (!file) return;
        setIsLoading(true);
        setError('');
        setImage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            const toolName = labels.tools?.[activeTool] || activeTool;
            const prompt = `Retoque Fotográfico Profissional: Aplicar ${toolName} com intensidade ${intensity}% e cor ${color} no rosto selecionado. Resultado fotorrealista.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [filePart, { text: prompt }] }
            });

             if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setImage(response.candidates[0].content.parts[0].inlineData.data);
            } else {
                throw new Error("Falha na geração.");
            }

        } catch (e: any) {
            setError(labels.errors?.api || "Erro na operação.");
        } finally {
            setIsLoading(false);
        }
    };

    const tools = [
        { id: 'lipstick', icon: '💋', hasColor: true },
        { id: 'blush', icon: '😊', hasColor: true },
        { id: 'foundation', icon: '✨', hasColor: false },
        { id: 'contour', icon: '🎨', hasColor: true },
        { id: 'whitening', icon: '🦷', hasColor: false },
        { id: 'slim', icon: '💆', hasColor: false },
        { id: 'autoFix', icon: '🪄', hasColor: false },
        { id: 'removeBg', icon: '🖼️', hasColor: false },
    ];

    return (
        <section className="bg-[var(--bg-panel)] p-6 rounded-lg shadow-lg border border-[var(--border-main)] max-w-6xl mx-auto pb-20">
            <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-2 text-[var(--accent)]">{labels.title || "Makeup Studio"}</h3>
                <p className="text-[var(--text-muted)]">{labels.description || "IA Facial."}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border-main)]">
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{labels.faceSelect || "Selecionar Rosto"}</label>
                        <select 
                            value={selectedFace} 
                            onChange={(e) => setSelectedFace(e.target.value)}
                            className="w-full bg-[var(--bg-panel)] border-[var(--border-main)] text-[var(--text-main)] rounded-md p-2"
                        >
                            <option value="main">{labels.faces?.main || "Principal"}</option>
                            <option value="all">{labels.faces?.all || "Todos"}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as MakeupTool)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                                    activeTool === tool.id 
                                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white' 
                                    : 'bg-[var(--bg-panel)] border-[var(--border-main)] text-[var(--text-muted)]'
                                }`}
                            >
                                <span className="text-2xl mb-1">{tool.icon}</span>
                                <span className="text-xs text-center truncate w-full">{labels.tools?.[tool.id] || tool.id}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border-main)] space-y-4">
                        {tools.find(t => t.id === activeTool)?.hasColor && (
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{labels.color || "Cor"}</label>
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded cursor-pointer bg-transparent border-0" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex justify-between">
                                <span>{labels.intensity || "Intensidade"}</span>
                                <span className="text-[var(--accent)] font-bold">{intensity}%</span>
                            </label>
                            <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full h-2 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
                        </div>

                        <button onClick={handleApply} disabled={isLoading || !file} className="w-full py-2 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-md shadow-lg transition-all flex justify-center items-center">
                            {isLoading ? <Spinner /> : (labels.apply || "Aplicar")}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border-main)] min-h-[400px] flex flex-col items-center justify-center relative">
                        {!file ? (
                            <ImageInput onChange={handleFileChange} labels={labels} className="w-full max-w-md" />
                        ) : (
                            <div className="relative w-full h-full flex flex-col items-center">
                                <img src={image ? `data:image/png;base64,${image}` : URL.createObjectURL(file)} alt="Preview" className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl" />
                                {image && (
                                    <div className="flex gap-4 mt-4">
                                        <button onClick={() => setImage('')} className="px-4 py-2 bg-[var(--bg-panel)] text-[var(--text-main)] rounded-md border border-[var(--border-main)]">Reset</button>
                                        <a href={`data:image/png;base64,${image}`} download="makeup.png" className="px-4 py-2 bg-green-600 text-white rounded-md">Download</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </div>
            </div>
        </section>
    );
};

export default MakeupStudio;
