
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface ColorPaletteExtractorProps {
    labels: any;
}

const ColorPaletteExtractor: React.FC<ColorPaletteExtractorProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [focus, setFocus] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
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
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filePart = await fileToGenerativePart(file);
            
            const prompt = `Analyze the color palette of this image.
            1. List the 5 Dominant Colors with their approximate HEX codes and descriptive names.
            2. Describe the overall "Mood" or "Atmosphere" created by these colors (e.g., Melancholic, Energetic, Corporate).
            3. Suggest complementary colors that would work well with this palette for design purposes.
            
            Focus area: ${focus || "Overall Image"}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [filePart, { text: prompt }]
                }
            });
            setResult(response.text || "No palette generated.");
        } catch (e) {
            console.error("Error extracting palette:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-yellow-500/30">
            <h3 className="text-2xl font-bold mb-2 text-yellow-400">{labels.paletteExtractorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.paletteExtractorDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-yellow-600 file:text-white
                        hover:file:bg-yellow-700"
                    />
                </div>
                
                {file && (
                    <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="max-h-48 rounded-md object-contain mx-auto border border-gray-700" 
                    />
                )}

                <TextArea
                    id="palette-focus"
                    label="Focus Area (Optional)"
                    value={focus}
                    placeholder={labels.paletteExtractorPlaceholder}
                    onChange={setFocus}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.paletteExtractorButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <div className="text-gray-300 prose prose-invert bg-gray-900/50 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />}
                </div>
            )}
        </section>
    );
};

export default ColorPaletteExtractor;
