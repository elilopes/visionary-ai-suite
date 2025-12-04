import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface AssetComparatorProps {
    labels: any;
}

const AssetComparator: React.FC<AssetComparatorProps> = ({ labels }) => {
    const [assets, setAssets] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCompare = async () => {
        if (!assets.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an experienced financial analyst. Provide a detailed comparison of the following assets: "${assets}".
For each asset, analyze and compare them based on the following criteria:
- **Strengths**: What are its key advantages?
- **Risks**: What are the main risks and downsides associated with it?
- **Performance History**: Briefly summarize its historical performance (without citing specific real-time numbers, speak in general terms like 'historically volatile with high returns' or 'stable with modest growth').
- **Volatility**: Describe its typical price volatility.
- **Best Potential**: In what market conditions or for what type of investor does this asset have the best potential?
Format the output clearly using markdown for easy readability.
IMPORTANT: Include a disclaimer that this is not financial advice and is for informational purposes only.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error comparing assets:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.assetComparatorTitle}</h3>
            <p className="text-gray-400 mb-4">{labels.assetComparatorDescription}</p>
            <p className="text-sm text-yellow-400 bg-yellow-900/30 p-3 rounded-md mb-6">{labels.assetComparatorWarning}</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="asset-comparator-input" className="block text-sm font-medium text-gray-400">{labels.assetComparatorInputLabel}</label>
                    <input
                        id="asset-comparator-input"
                        type="text"
                        value={assets}
                        onChange={(e) => setAssets(e.target.value)}
                        placeholder={labels.assetComparatorPlaceholder}
                        className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    />
                </div>
                <button
                    onClick={handleCompare}
                    disabled={isLoading || !assets.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.assetComparatorButtonLoading : labels.assetComparatorButton}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <div className="text-gray-300 prose prose-invert max-w-none bg-gray-900/50 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />}
                </div>
            )}
        </section>
    );
};

export default AssetComparator;