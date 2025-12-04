
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface GameAssetGeneratorProps {
    labels: any;
}

const GameAssetGenerator: React.FC<GameAssetGeneratorProps> = ({ labels }) => {
    const [type, setType] = useState(labels.gameAssetsTypes[0]);
    const [input, setInput] = useState('');
    const [resultText, setResultText] = useState('');
    const [resultImage, setResultImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setResultText('');
        setResultImage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            if (type === labels.gameAssetsTypes[0]) { // Character (Image)
                const prompt = `Game Character Design: ${input}. High quality, detailed, concept art style.`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE] }
                });
                
                 if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    setResultImage(response.candidates[0].content.parts[0].inlineData.data);
                }

            } else { // Narrative (Text)
                const prompt = `Write a compelling video game narrative/lore based on: "${input}".
                Include:
                1. World Setting
                2. Main Conflict
                3. Key Factions/Characters
                4. A Plot Hook for the player.`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                setResultText(response.text);
            }

        } catch (e) {
            console.error("Error generating game asset:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-pink-500/30">
            <h3 className="text-2xl font-bold mb-2 text-pink-400">{labels.gameAssetsTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.gameAssetsDescription}</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{labels.gameAssetsTypeLabel}</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 p-3 text-base"
                    >
                        {labels.gameAssetsTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <TextArea
                    id="game-input"
                    label="Description"
                    value={input}
                    placeholder={labels.gameAssetsPlaceholder}
                    onChange={setInput}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.gameAssetsButton}
                </button>
            </div>

            {(resultText || resultImage || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {resultImage && (
                        <img src={`data:image/png;base64,${resultImage}`} alt="Game Character" className="w-full max-w-md rounded-lg shadow-md mx-auto" />
                    )}
                    {resultText && (
                         <div className="text-gray-300 prose prose-invert bg-gray-900/50 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: resultText.replace(/\n/g, '<br />') }} />
                    )}
                </div>
            )}
        </section>
    );
};

export default GameAssetGenerator;
