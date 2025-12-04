
import React, { useState } from 'react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface StorybookGeneratorProps {
    labels: any;
}

interface StoryPage {
    pageNumber: number;
    text: string;
    imagePrompt: string;
    imageData?: string;
}

const StorybookGenerator: React.FC<StorybookGeneratorProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [theme, setTheme] = useState('');
    const [pages, setPages] = useState<StoryPage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(''); // 'analyzing', 'writing', 'illustrating'
    const [error, setError] = useState('');

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setPages([]);
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
        setPages([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // Step 1: Analyze Character
            setLoadingStep('Analyzing Character...');
            const filePart = await fileToGenerativePart(file);
            const analysisPrompt = `Analyze the main character in this image. 
            Provide a detailed physical description suitable for an AI image generator to reproduce this character in different poses. 
            Focus on: Hair style/color, Eye color, Distinctive clothing, Art style (e.g., cartoon, realistic), and Key facial features. 
            Output ONLY the description paragraph.`;

            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Using 2.5 Flash for speed
                contents: { parts: [filePart, { text: analysisPrompt }] }
            });
            const characterDescription = analysisResponse.text;

            // Step 2: Write Story
            setLoadingStep('Writing Story...');
            const storyPrompt = `Write a short children's story (3-4 pages/scenes) featuring a character with this description: "${characterDescription}".
            Theme/Plot: ${theme || "A magical adventure"}.
            
            Return a JSON array where each object represents a page and has:
            - "text": The story text for that page (2-3 sentences).
            - "image_prompt": A specific prompt to generate an illustration for this page. It MUST include the character description: "${characterDescription}" combined with the action of the scene.
            
            Example format:
            [
              { "text": "Once upon a time...", "image_prompt": "A cute boy with red hair wearing a blue shirt standing in a forest..." },
              ...
            ]`;

            const storyResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: storyPrompt }] },
                config: { responseMimeType: "application/json" }
            });

            const storyData = JSON.parse(storyResponse.text || "[]");
            
            // Step 3: Generate Illustrations (Sequentially to avoid rate limits on some keys, or parallel)
            setLoadingStep('Illustrating Pages...');
            const generatedPages: StoryPage[] = [];

            // Limit to 4 pages max for performance
            const pagesToGenerate = storyData.slice(0, 4);

            // We use a loop here to process. 
            for (let i = 0; i < pagesToGenerate.length; i++) {
                const pageData = pagesToGenerate[i];
                setLoadingStep(`Illustrating Page ${i + 1}/${pagesToGenerate.length}...`);
                
                // Generate Image
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: `Children's book illustration. ${pageData.image_prompt}` }] },
                    config: { responseModalities: [Modality.IMAGE] }
                });

                let imageData = '';
                if (imageResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    imageData = imageResponse.candidates[0].content.parts[0].inlineData.data;
                }

                generatedPages.push({
                    pageNumber: i + 1,
                    text: pageData.text,
                    imagePrompt: pageData.image_prompt,
                    imageData: imageData
                });
            }

            setPages(generatedPages);

        } catch (e) {
            console.error("Error generating storybook:", e);
            setError("Failed to create storybook. Please try again or use a smaller image.");
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-pink-500/30">
            <h3 className="text-2xl font-bold mb-2 text-pink-400">{labels.storybookGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.storybookGeneratorDescription}</p>

            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <ImageInput onChange={handleFileChange} labels={labels} />
                </div>
                
                {file && (
                    <div className="flex justify-center">
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="Character Reference" 
                            className="h-32 rounded-md object-contain border border-gray-700" 
                        />
                    </div>
                )}

                <TextArea
                    id="story-theme"
                    label="Story Theme / Plot Idea"
                    value={theme}
                    placeholder={labels.storybookGeneratorPlaceholder}
                    onChange={setTheme}
                />

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? loadingStep : labels.storybookGeneratorButton}
                </button>
            </div>

            {(pages.length > 0 || error) && (
                <div className="mt-8 pt-4 border-t border-gray-700">
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    
                    {pages.length > 0 && (
                        <div className="space-y-8">
                            <h4 className="text-xl font-semibold text-center text-pink-300 mb-4">Your Story</h4>
                            <div className="grid gap-8">
                                {pages.map((page) => (
                                    <div key={page.pageNumber} className="bg-white text-black rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row">
                                        <div className="md:w-1/2 h-64 md:h-auto relative bg-gray-200">
                                            {page.imageData ? (
                                                <img 
                                                    src={`data:image/png;base64,${page.imageData}`} 
                                                    alt={`Page ${page.pageNumber}`} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500">Image Failed</div>
                                            )}
                                        </div>
                                        <div className="md:w-1/2 p-6 flex flex-col justify-center items-center text-center bg-[#fffaf0]">
                                            <span className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Page {page.pageNumber}</span>
                                            <p className="text-lg font-serif leading-relaxed">{page.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default StorybookGenerator;
