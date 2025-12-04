
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface StyleTransformerProps {
    labels: any;
}

const StyleTransformer: React.FC<StyleTransformerProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [style, setStyle] = useState(labels.styleTransformerStyles ? labels.styleTransformerStyles[0] : "Futuristic");
    const [instruction, setInstruction] = useState('');
    const [image, setImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleGenerate = async () => {
        if (!file) return;
        setIsLoading(true);
        setError('');
        setImage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            let stylePrompt = "";
            
            // Construct prompt based on selected style keyword
            // We check for English or Translated keywords to be robust
            const s = style.toLowerCase();
            let details = "";

            if (s.includes("futur") || s.includes("futurist")) {
                details = "sleek technology, bright lights, flying vehicles, utopia, clean lines, metallic surfaces.";
            } else if (s.includes("apocal") || s.includes("post")) {
                details = "ruined buildings, overgrown nature, dusty atmosphere, survival gear, cracked roads, muted colors.";
            } else if (s.includes("cyber")) {
                details = "neon lights, rain, high-tech low-life, dark city streets, holograms, cybernetic enhancements.";
            } else if (s.includes("war") || s.includes("guerra") || s.includes("torn")) {
                details = "rubble, fire, smoke, destroyed structures, gritty texture, soldiers, tanks in background.";
            } else if (s.includes("acid") || s.includes("ácida")) {
                details = "green toxic haze, corrosion, gas masks, danger, melting surfaces, radioactive glow.";
            } else if (s.includes("zombie") || s.includes("zumbi")) {
                details = "scary atmosphere, undead features on people, chaotic background, bloodstains, dark and gritty.";
            } else if (s.includes("desert") || s.includes("desértico")) {
                details = "vast sand dunes, dry heat, scorching sun, barren landscape, oasis, mirage, warm orange tones.";
            } else if (s.includes("mad max")) {
                details = "Dieselpunk aesthetic, rusted metal, high-octane, desert wasteland, dust, dirt, aggressive vehicle modifications, scavengers.";
            } else if (s.includes("stranger")) {
                details = "80s retro horror aesthetic, dark blue and red neon lighting, The Upside Down atmosphere, floating particles, mysterious, synthwave mood.";
            } else if (s.includes("ghost") || s.includes("fantasma")) {
                details = "Abandoned city, empty streets, broken windows, dusty, overgrowth, eerie silence, no people, fog.";
            } else if (s.includes("blackout")) {
                details = "Total darkness, pitch black environment, illuminated only by faint emergency lights or bioluminescence, high contrast, silhouettes.";
            }

            stylePrompt = `Transform this image into a "${style}" style. 
            Key visual elements to include: ${details}
            
            Additional User Instructions: ${instruction}
            
            Maintain the original composition and subject but completely change the atmosphere, lighting, and texture to match the theme. High quality, cinematic render.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [filePart, { text: stylePrompt }]
                },
                config: { responseModalities: [Modality.IMAGE] }
            });

             if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setImage(response.candidates[0].content.parts[0].inlineData.data);
            } else {
                throw new Error("Failed to generate image.");
            }

        } catch (e) {
            console.error("Error transforming style:", e);
            setError(labels.error || "Error generating image.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.styleTransformerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.styleTransformerDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
                
                {file && (
                    <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="max-h-48 rounded-md object-contain mx-auto border border-gray-700" 
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Theme / Style</label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 p-3 text-base"
                    >
                        {labels.styleTransformerStyles && labels.styleTransformerStyles.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.styleTransformerPlaceholder}</label>
                    <input 
                        type="text" 
                        value={instruction} 
                        onChange={(e) => setInstruction(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 p-3 text-base"
                        placeholder="e.g., make it darker, add rain..."
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.styleTransformerButton}
                </button>
            </div>

            {(image || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {image && (
                        <div className="flex flex-col items-center">
                            <img src={`data:image/png;base64,${image}`} alt="Transformed Style" className="w-full max-w-md rounded-lg shadow-md" />
                             <a
                                href={`data:image/png;base64,${image}`}
                                download={`style-${style}.png`}
                                className="flex items-center justify-center px-4 py-2 mt-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors w-full max-w-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                {labels.download}
                            </a>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default StyleTransformer;
