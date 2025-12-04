import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface DiscountAnalyzerProps {
    labels: any;
}

const DiscountAnalyzer: React.FC<DiscountAnalyzerProps> = ({ labels }) => {
    const [product, setProduct] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [discountedPrice, setDiscountedPrice] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!product.trim() || !originalPrice.trim() || !discountedPrice.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as a savvy shopper. Analyze the following discount and determine if it's a good deal. 
            Product: "${product}"
            Original Price: ${originalPrice}
            Discounted Price: ${discountedPrice}
            Provide a brief analysis and a final verdict (e.g., "Great Deal," "Average Sale," "Not a real discount").`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error analyzing discount:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.discountAnalyzerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.discountAnalyzerDescription}</p>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-400">{labels.discountAnalyzerProductLabel}</label>
                    <input
                        id="product-name"
                        type="text"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder={labels.discountAnalyzerProductPlaceholder}
                        className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="original-price" className="block text-sm font-medium text-gray-400">{labels.discountAnalyzerOriginalPriceLabel}</label>
                        <input
                            id="original-price"
                            type="number"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            placeholder="100.00"
                            className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                        />
                    </div>
                     <div>
                        <label htmlFor="discounted-price" className="block text-sm font-medium text-gray-400">{labels.discountAnalyzerDiscountedPriceLabel}</label>
                        <input
                            id="discounted-price"
                            type="number"
                            value={discountedPrice}
                            onChange={(e) => setDiscountedPrice(e.target.value)}
                            placeholder="75.00"
                            className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                        />
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !product.trim() || !originalPrice.trim() || !discountedPrice.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.discountAnalyzerButtonLoading : labels.discountAnalyzerButton}
                </button>
            </div>
            
            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && <p className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-md">{result}</p>}
                </div>
            )}
        </section>
    );
};

export default DiscountAnalyzer;