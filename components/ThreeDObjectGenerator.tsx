
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';
import ImageInput from './ImageInput';

interface ThreeDObjectGeneratorProps {
    labels: any;
}

const ThreeDObjectGenerator: React.FC<ThreeDObjectGeneratorProps> = ({ labels }) => {
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [image, setImage] = useState('');
    const [objContent, setObjContent] = useState('');
    const [gltfContent, setGltfContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setError('');
        setImage('');
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
        if (!prompt.trim() && !file) return;
        setIsLoading(true);
        setError('');
        setImage('');
        setObjContent('');
        setGltfContent('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            let filePart = null;
            if (file) {
                filePart = await fileToGenerativePart(file);
            }

            // Construct prompts based on input type
            const visualPrompt = filePart 
                ? `Analyze the geometry of the object in this image. Generate a new image showing a 3D Render of this exact object in a Low-Poly art style. Isolate on a clean background. ${prompt}` 
                : `A 3D render of ${prompt} on a plain background, isometric view, low poly style.`;

            // Prompt specifically tuned for Image-to-Geometry (Low Poly)
            const objPrompt = filePart
                ? `Analyze the main object in this image. Create a LOW-POLY 3D approximation of its geometry. 
                   Generate the content of a Wavefront .obj file.
                   - Focus on the main shape (silhouette).
                   - Keep vertex count low (under 500 vertices) to fit in the response.
                   - Output only vertices (v) and faces (f).
                   - Do not include materials, texture coordinates (vt), or normals (vn) to save space.
                   - Ensure the geometry is valid.
                   Return ONLY the .obj code block.`
                : `Generate the content of a Wavefront .obj file for a simple low-poly ${prompt}. Return ONLY the code block containing vertices (v) and faces (f). Keep it simple.`;

            const gltfPrompt = filePart
                ? `Analyze the main object in this image. Create a minimal glTF 2.0 JSON structure representing this object as a low-poly mesh.
                   - Use a simple buffer for position data.
                   - Keep it structurally valid but minimal.
                   Return ONLY the JSON code block.`
                : `Generate the JSON content for a simple .gltf file representing a ${prompt}. Return ONLY the JSON code block. Keep the geometry extremely simple.`;

            // 1. Generate Visual Preview (Image)
            const imagePromise = ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: filePart 
                    ? { parts: [filePart, { text: visualPrompt }] }
                    : { parts: [{ text: visualPrompt }] },
                config: { responseModalities: [Modality.IMAGE] }
            });

            // 2. Generate OBJ Content (Text)
            const objPromise = ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: filePart
                    ? { parts: [filePart, { text: objPrompt }] }
                    : { parts: [{ text: objPrompt }] }
            });

            // 3. Generate GLTF Content (JSON) - Optional/Parallel
            const gltfPromise = ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: filePart
                    ? { parts: [filePart, { text: gltfPrompt }] }
                    : { parts: [{ text: gltfPrompt }] }
            });

            const [imageRes, objRes, gltfRes] = await Promise.all([imagePromise, objPromise, gltfPromise]);

            if (imageRes.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                setImage(imageRes.candidates[0].content.parts[0].inlineData.data);
            }

            setObjContent(objRes.text?.replace(/```obj|```/g, '').trim() || "");
            setGltfContent(gltfRes.text?.replace(/```json|```/g, '').trim() || "");

        } catch (e: any) {
            console.error("Error generating 3D object:", e);
            
            let errorMsg = labels.error || "Error generating 3D assets.";
            
            if (e.message) {
                if (e.message.includes('403')) {
                    errorMsg = "Access Denied (403): Please check your API Key permissions.";
                } else if (e.message.includes('429')) {
                    errorMsg = "Quota Exceeded (429): The system is busy. Please wait a minute and try again.";
                } else if (e.message.includes('SAFETY') || e.message.includes('blocked')) {
                    errorMsg = "Safety Block: The prompt or image triggered safety filters. Please try a different object.";
                } else if (e.message.includes('candidate')) {
                    errorMsg = "Model Error: The AI could not generate a valid 3D representation for this input.";
                } else if (e.message.includes('500') || e.message.includes('503')) {
                    errorMsg = "Server Error: The AI service is temporarily unavailable.";
                } else {
                    errorMsg = `Error: ${e.message.substring(0, 100)}...`;
                }
            }
            
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-cyan-500/30">
            <h3 className="text-2xl font-bold mb-2 text-cyan-400">{labels.threeDObjectGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.threeDObjectGeneratorDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.threeDObjectGeneratorImageLabel}</label>
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>

                {file && (
                    <div className="flex justify-center">
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="Reference" 
                            className="h-32 rounded-md object-contain border border-gray-700" 
                        />
                    </div>
                )}

                <TextArea
                    id="3d-object-prompt"
                    label="Object Description / Details"
                    value={prompt}
                    placeholder={labels.threeDObjectGeneratorPlaceholder}
                    onChange={setPrompt}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || (!prompt.trim() && !file)}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.threeDObjectGeneratorButton}
                </button>
            </div>

            {(image || objContent || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded-md p-3 mb-4">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Visual Preview */}
                        {image && (
                            <div className="flex flex-col items-center">
                                <span className="text-sm text-gray-400 mb-2">Visual Reference (Low Poly Render)</span>
                                <img src={`data:image/png;base64,${image}`} alt="3D Preview" className="w-full max-w-xs rounded-lg shadow-md mb-2" />
                                <a 
                                    href={`data:image/png;base64,${image}`} 
                                    download="texture-reference.png"
                                    className="text-cyan-400 hover:underline text-sm"
                                >
                                    Download Texture / Render
                                </a>
                            </div>
                        )}

                        {/* 3D Files */}
                        <div className="flex flex-col space-y-4">
                            {objContent && (
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-300">Wavefront .obj (Low Poly)</span>
                                        <button 
                                            onClick={() => downloadFile(objContent, 'model.obj', 'text/plain')}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
                                        >
                                            Download .obj
                                        </button>
                                    </div>
                                    <div className="h-32 overflow-hidden">
                                        <CodeBlock code={objContent.substring(0, 500) + "..."} />
                                    </div>
                                </div>
                            )}

                            {gltfContent && (
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-300">GLTF (JSON)</span>
                                        <button 
                                            onClick={() => downloadFile(gltfContent, 'model.gltf', 'application/json')}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                                        >
                                            Download .gltf
                                        </button>
                                    </div>
                                    <div className="h-32 overflow-hidden">
                                        <CodeBlock code={gltfContent.substring(0, 500) + "..."} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ThreeDObjectGenerator;
