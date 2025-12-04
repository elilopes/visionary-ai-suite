
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';

interface RoutePlannerProps {
    labels: any;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ labels }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [stops, setStops] = useState('');
    const [links, setLinks] = useState<{ google: string, waze: string } | null>(null);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!origin.trim() || !destination.trim()) return;
        setIsLoading(true);
        setLinks(null);
        setDescription('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Plan a route from "${origin}" to "${destination}" ${stops ? `with stops at: ${stops}` : ''}.
            1. Briefly describe the best path and key highways.
            2. Generate a Google Maps URL strictly following this format: https://www.google.com/maps/dir/?api=1&origin={EncodedOrigin}&destination={EncodedDestination}&waypoints={EncodedStops}
            3. Generate a Waze URL (only for destination).
            
            Return the response in JSON format: { "description": "text", "googleUrl": "url", "wazeUrl": "url" }`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            
            const data = JSON.parse(response.text);
            setDescription(data.description);
            setLinks({ google: data.googleUrl, waze: data.wazeUrl });

        } catch (e) {
            console.error("Error planning route:", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-2 text-blue-400">{labels.routePlannerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.routePlannerDescription}</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{labels.routePlannerOrigin}</label>
                        <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{labels.routePlannerDestination}</label>
                        <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">{labels.routePlannerStops}</label>
                    <input type="text" value={stops} onChange={(e) => setStops(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !origin || !destination}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.routePlannerButton}
                </button>
            </div>

            {links && (
                <div className="mt-6 pt-4 border-t border-gray-700 space-y-4">
                    <p className="text-gray-300 text-sm">{description}</p>
                    <div className="flex gap-4">
                        <a href={links.google} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition-colors">
                            Open in Google Maps
                        </a>
                        <a href={links.waze} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors">
                            Open in Waze
                        </a>
                    </div>
                </div>
            )}
        </section>
    );
};

export default RoutePlanner;
