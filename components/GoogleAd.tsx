
import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface GoogleAdProps {
    slot: string; // The Ad Unit ID from Google AdSense console
    client?: string; // Your Publisher ID (defaults to the one in index.html if not provided here)
    format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
    responsive?: boolean;
    style?: React.CSSProperties;
    className?: string;
    testMode?: boolean; // If true, shows a gray placeholder box instead of trying to load an ad
}

const GoogleAd: React.FC<GoogleAdProps> = ({ 
    slot, 
    client = 'ca-pub-XXXXXXXXXXXXXXXX', // Replace with your actual Publisher ID
    format = 'auto', 
    responsive = true,
    style,
    className,
    testMode = false
}) => {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        if (testMode) return;

        try {
            // Push the ad to Google's queue
            // We check if the element is empty to prevent double-pushing in StrictMode or re-renders
            if (adRef.current && adRef.current.innerHTML === "") {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, [testMode]);

    if (testMode) {
        return (
            <div className={`bg-gray-800 border border-gray-600 border-dashed flex items-center justify-center text-gray-500 text-sm p-4 rounded-md my-4 ${className}`} style={{ minHeight: '100px', ...style }}>
                <div className="text-center">
                    <p className="font-bold">Google AdSense Space</p>
                    <p className="text-xs">Slot ID: {slot}</p>
                    <p className="text-xs">Format: {format}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`ad-container my-4 flex justify-center overflow-hidden ${className}`}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block', ...style }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            />
        </div>
    );
};

export default GoogleAd;
