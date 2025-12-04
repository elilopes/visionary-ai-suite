
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';
import { MAKEUP_TOOLS_LABELS } from '../constants';

interface MakeupStudioProps {
    labels: any; // We will pass currentMakeupLabels here
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
    
    // Config State
    const [selectedFace, setSelectedFace] = useState('main');
    const [activeTool, setActiveTool] = useState<MakeupTool>('lipstick');
    const [color, setColor] = useState('#ff0000');
    const [intensity, setIntensity] = useState(50);
    const [selectedStyle, setSelectedStyle] = useState('');

    // Set default style when tool changes if needed
    useEffect(() => {
        if (activeTool === 'wig' && labels.wigStyles) {
            setSelectedStyle(Object.keys(labels.wigStyles)[0]);
        } else if (activeTool === 'hat' && labels.hatStyles) {
            setSelectedStyle(Object.keys(labels.hatStyles)[0]);
        } else {
            setSelectedStyle('');
        }
        
        // Reset intensity defaults based on tool
        if (activeTool === 'sharpen') {
            setIntensity(100); // Default for sharpen usually higher perception
        } else {
            setIntensity(50);
        }
    }, [activeTool, labels]);

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
            
            let instruction = "";
            const faceTarget = labels.faces[selectedFace as keyof typeof labels.faces] || "the main face";
            const toolName = labels.tools[activeTool];

            // Construct prompt based on tool type
            if (['lipstick', 'blush', 'eyeshadow', 'eyeliner', 'contour'].includes(activeTool)) {
                instruction = `Apply ${toolName} with color ${color} and intensity ${intensity}% to ${faceTarget}. Make it look realistic and professional.`;
            } else if (['foundation', 'whitening', 'nose', 'wrinkles'].includes(activeTool)) {
                instruction = `Apply ${toolName} effect with intensity ${intensity}% to ${faceTarget}. Maintain natural skin texture but improve appearance.`;
            } else if (activeTool === 'slim') {
                // Specific prompt for Slimming with slider
                instruction = `Slim the face of ${faceTarget}. Intensity: ${intensity}% (where 0% is original and 100% is significantly slimmer). Maintain natural proportions and background warping.`;
            } else if (activeTool === 'sharpen') {
                // Specific prompt for Sharpening with 0-300 range
                instruction = `Sharpen the details of the image. Intensity: ${intensity}% (where 100% is standard sharpening and 300% is extreme high-definition detail). Enhance texture and edges.`;
            } else if (['lashes'].includes(activeTool)) {
                 instruction = `Apply false eyelashes to ${faceTarget}. Intensity: ${intensity}%.`;
            } else if (activeTool === 'acne') {
                instruction = `Remove acne and blemishes from ${faceTarget}. Keep skin looking natural.`;
            } else if (activeTool === 'smile') {
                instruction = `Make ${faceTarget} smile naturally. Intensity: ${intensity}%.`;
            } else if (activeTool === 'openEyes') {
                instruction = `Open the eyes of ${faceTarget} naturally. Fix blinking or closed eyes.`;
            } else if (activeTool === 'brightness') {
                instruction = `Adjust the brightness of ${faceTarget}. Increase lighting by ${intensity}%.`;
            } else if (activeTool === 'hairColor') {
                instruction = `Change the hair color of ${faceTarget} to ${color}. Keep the hairstyle exactly the same.`;
            } else if (activeTool === 'wig') {
                const styleLabel = labels.wigStyles[selectedStyle] || "stylish";
                instruction = `Apply a realistic ${styleLabel} wig to ${faceTarget}. Color: ${color}. Ensure it fits the head shape perfectly.`;
            } else if (activeTool === 'hat') {
                const styleLabel = labels.hatStyles[selectedStyle] || "stylish";
                instruction = `Put a ${styleLabel} on ${faceTarget}. Color: ${color}. Make sure it fits realistically.`;
            } else if (activeTool === 'removeBg') {
                instruction = `Remove the background completely. Isolate the main subject. The output should have a transparent background if possible, or a solid white background if transparency is not supported by the output format. Focus on high quality edge detection.`;
            } else if (activeTool === 'tan') {
                instruction = `Apply a natural sun-kissed tan to the skin of ${faceTarget}. Intensity: ${intensity}%. Ensure realistic skin tone change.`;
            } else if (activeTool === 'autoFix') {
                instruction = `Automatically retouch ${faceTarget}: smooth skin, fix lighting, remove blemishes, whiten teeth slightly, and balance colors for a professional portrait look.`;
            }

            const prompt = `Professional Photo Retouching: ${instruction} Keep the identity of the person exactly the same. High quality, photorealistic result.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [filePart, { text: prompt }]
                }
            });

             if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setImage(response.candidates[0].content.parts[0].inlineData.data);
            } else {
                throw new Error("Failed to generate image.");
            }

        } catch (e: any) {
            console.error("Error applying makeup:", e);
            let msg = "Failed to apply makeup.";
            if (e.message) {
                if (e.message.includes("403")) msg = "Access Denied: API Key issue or Region not supported for this model.";
                else if (e.message.includes("429")) msg = "System Busy: Too many requests. Please wait.";
                else if (e.message.includes("SAFETY")) msg = "Safety Block: The image or prompt triggered safety filters.";
                else if (e.message.includes("candidate")) msg = "Model Error: Could not generate a valid result for this face.";
                else msg = `Error: ${e.message}`;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const tools = [
        { id: 'lipstick', icon: '💋', hasColor: true },
        { id: 'blush', icon: '😊', hasColor: true },
        { id: 'eyeshadow', icon: '👁️', hasColor: true },
        { id: 'eyeliner', icon: '🖌️', hasColor: true },
        { id: 'lashes', icon: '👁️‍🗨️', hasColor: false },
        { id: 'foundation', icon: '✨', hasColor: false },
        { id: 'contour', icon: '🎨', hasColor: true },
        { id: 'whitening', icon: '🦷', hasColor: false },
        { id: 'slim', icon: '💆', hasColor: false },
        { id: 'nose', icon: '👃', hasColor: false },
        { id: 'acne', icon: '🧼', hasColor: false },
        { id: 'wrinkles', icon: '🧴', hasColor: false },
        { id: 'tan', icon: '☀️', hasColor: false },
        { id: 'openEyes', icon: '👀', hasColor: false },
        { id: 'smile', icon: '😄', hasColor: false },
        { id: 'brightness', icon: '💡', hasColor: false },
        { id: 'sharpen', icon: '📸', hasColor: false },
        { id: 'autoFix', icon: '🪄', hasColor: false },
        { id: 'hairColor', icon: '💈', hasColor: true },
        { id: 'wig', icon: '💇‍♀️', hasColor: true },
        { id: 'hat', icon: '🧢', hasColor: true },
        { id: 'removeBg', icon: '🖼️', hasColor: false },
    ];

    const getMaxIntensity = () => {
        if (activeTool === 'sharpen') return 300;
        return 100;
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-pink-500/30 max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-2 text-pink-400">{labels.title}</h3>
                <p className="text-gray-400">{labels.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="space-y-6">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <label className="block text-sm font-medium text-gray-400 mb-2">{labels.faceSelect}</label>
                        <select 
                            value={selectedFace} 
                            onChange={(e) => setSelectedFace(e.target.value)}
                            className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-2"
                        >
                            <option value="main">{labels.faces.main}</option>
                            <option value="all">{labels.faces.all}</option>
                            <option value="left">{labels.faces.left}</option>
                            <option value="right">{labels.faces.right}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as MakeupTool)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                                    activeTool === tool.id 
                                    ? 'bg-pink-600 border-pink-400 text-white' 
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                <span className="text-2xl mb-1">{tool.icon}</span>
                                <span className="text-xs text-center truncate w-full">{labels.tools[tool.id]}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="font-semibold text-pink-300 flex items-center gap-2">
                            {labels.tools[activeTool]}
                        </h4>
                        
                        {activeTool === 'wig' && labels.wigStyles && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Style</label>
                                <select
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-2 text-sm"
                                >
                                    {Object.entries(labels.wigStyles).map(([key, label]) => (
                                        <option key={key} value={key}>{label as string}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTool === 'hat' && labels.hatStyles && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Style</label>
                                <select
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="w-full bg-gray-800 border-gray-600 text-white rounded-md p-2 text-sm"
                                >
                                    {Object.entries(labels.hatStyles).map(([key, label]) => (
                                        <option key={key} value={key}>{label as string}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {tools.find(t => t.id === activeTool)?.hasColor && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">{labels.color}</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={color} 
                                        onChange={(e) => setColor(e.target.value)}
                                        className="h-10 w-10 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <span className="text-sm text-gray-300">{color}</span>
                                </div>
                            </div>
                        )}

                        {!['removeBg', 'autoFix'].includes(activeTool) && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 flex justify-between">
                                    <span>{labels.intensity}</span>
                                    <span className="text-pink-400 font-bold">{intensity}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={getMaxIntensity()} 
                                    value={intensity} 
                                    onChange={(e) => setIntensity(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                    <span>0%</span>
                                    <span>{getMaxIntensity()}%</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleApply}
                            disabled={isLoading || !file}
                            className="w-full py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-md shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading && <Spinner />}
                            {isLoading ? labels.applying : labels.apply}
                        </button>
                    </div>
                </div>

                {/* Right Column: Image Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-h-[400px] flex flex-col items-center justify-center relative">
                        {!file ? (
                            <ImageInput onChange={handleFileChange} labels={labels} className="w-full max-w-md" />
                        ) : (
                            <>
                                {image ? (
                                    <div className="relative w-full h-full flex flex-col items-center">
                                        <img src={`data:image/png;base64,${image}`} alt="Makeup Result" className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl" />
                                        <div className="flex gap-4 mt-4 flex-wrap justify-center">
                                            <button 
                                                onClick={() => setImage('')}
                                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                                            >
                                                Undo / Original
                                            </button>
                                            
                                            {activeTool === 'removeBg' ? (
                                                <>
                                                    <a
                                                        href={`data:image/png;base64,${image}`}
                                                        download="removed-bg.png"
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                        </svg>
                                                        <span className="font-bold">PNG (Transparent)</span>
                                                    </a>
                                                    <a
                                                        href={`data:image/png;base64,${image}`}
                                                        download="removed-bg.psd"
                                                        className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                        </svg>
                                                        <span className="font-bold">PSD</span>
                                                    </a>
                                                </>
                                            ) : (
                                                <a
                                                    href={`data:image/png;base64,${image}`}
                                                    download={`makeup-${activeTool}.png`}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                    </svg>
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full flex flex-col items-center">
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt="Original" 
                                            className="max-h-[500px] w-auto object-contain rounded-lg opacity-80" 
                                        />
                                        <button 
                                            onClick={() => setFile(null)}
                                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {isLoading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                                <Spinner />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-center font-medium">{error}</p>}
                </div>
            </div>
        </section>
    );
};

export default MakeupStudio;
