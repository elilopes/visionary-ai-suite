import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BeforeAfterSliderProps {
    original: string;
    processed: string;
    originalLabel?: string;
    processedLabel?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ 
    original, 
    processed, 
    originalLabel = "Antes", 
    processedLabel = "Depois" 
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
            setSliderPosition(percent);
        }
    }, []);

    const handleMouseDown = () => setIsDragging(true);
    const handleTouchStart = () => setIsDragging(true);

    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) handleMove(e.clientX);
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        };

        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
        }

        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isDragging, handleMove]);

    return (
        <div ref={containerRef} className="relative w-full max-w-lg mx-auto overflow-hidden rounded-lg shadow-xl select-none group cursor-col-resize">
            {/* Background Image (Processed/After) */}
            <img 
                src={processed} 
                alt="After" 
                className="block w-full h-auto object-cover pointer-events-none select-none" 
            />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none z-20">
                {processedLabel}
            </div>

            {/* Foreground Image (Original/Before) - Clipped */}
            <div 
                className="absolute inset-0 pointer-events-none select-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img 
                    src={original} 
                    alt="Before" 
                    className="block w-full h-full object-cover" 
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded z-20">
                    {originalLabel}
                </div>
            </div>

            {/* Slider Handle */}
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-lg border border-gray-300">
                    <div className="flex items-center justify-center gap-0.5 w-4 h-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-gray-600"><path d="M15 18l-6-6 6-6"/></svg>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-gray-600"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default BeforeAfterSlider;