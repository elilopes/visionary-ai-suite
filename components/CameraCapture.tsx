import React, { useState, useRef, useCallback } from 'react';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    labels: any;
    onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, labels, onCancel }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode } 
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError('');
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(labels.cameraError);
        }
    }, [facingMode, labels.cameraError, stream]);

    React.useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(videoRef.current, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                        onCapture(file);
                        // Stop stream after capture
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                        }
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="flex flex-col items-center space-y-4 bg-black rounded-lg p-4 relative">
            {error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                </div>
            )}
            
            <div className="flex justify-center space-x-4 w-full">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-700 text-white rounded-full text-sm"
                >
                    {labels.cancel}
                </button>
                <button 
                    onClick={handleCapture}
                    className="px-6 py-2 bg-white text-black font-bold rounded-full border-4 border-gray-300 hover:bg-gray-200 transition-colors"
                >
                    {labels.capture}
                </button>
                <button 
                    onClick={switchCamera}
                    className="px-4 py-2 bg-gray-700 text-white rounded-full text-sm"
                >
                    {labels.switchCamera}
                </button>
            </div>
        </div>
    );
};

export default CameraCapture;