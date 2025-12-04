import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface PriceComparatorProps {
    labels: any;
}

const PriceComparator: React.FC<PriceComparatorProps> = ({ labels }) => {
    const [product, setProduct] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCompare = async () => {
        if (!product.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Simulate a price comparison for the following product: "${product}". 
            List potential prices from 3-4 different fictional or common online retailers. 
            Format the output as a markdown list.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error comparing prices:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.priceComparatorTitle}</h3>
            <p className="text-gray-400 mb-4">{labels.priceComparatorDescription}</p>
            <p className="text-sm text-yellow-400 bg-yellow-900/30 p-3 rounded-md mb-6">{labels.priceComparatorWarning}</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="comparator-product" className="block text-sm font-medium text-gray-400">{labels.priceComparatorProductLabel}</label>
                    <input
                        id="comparator-product"
                        type="text"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder={labels.priceComparatorProductPlaceholder}
                        className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    />
                </div>
                <button
                    onClick={handleCompare}
                    disabled={isLoading || !product.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.priceComparatorButtonLoading : labels.priceComparatorButton}
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

export default PriceComparator;