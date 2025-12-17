
import React, { useState, useRef, useCallback, useEffect } from 'react';

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

    // Friendly error handler
    const getFriendlyError = (err: any) => {
        const errLabels = labels.errors || {};
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') return errLabels.camera;
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') return "Nenhuma câmera encontrada neste dispositivo.";
        return errLabels.unknown || "Erro inesperado ao abrir câmera.";
    };

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const newStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError('');
        } catch (err) {
            console.error("Camera Error:", err);
            setError(getFriendlyError(err));
        }
    }, [facingMode, labels]);

    // Activation happens only when component mounts (User clicked the button)
    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]); // Re-run on toggle, but initial run is safe here as component is already visible

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
                        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                        onCapture(file);
                        if (stream) stream.getTracks().forEach(track => track.stop());
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 bg-black/90 rounded-lg p-6 relative border border-gray-700 shadow-2xl animate-fade-in z-50">
            {error ? (
                <div className="text-red-500 bg-red-900/20 p-6 rounded border border-red-800 text-center max-w-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    <p className="text-sm font-medium">{error}</p>
                    <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-800 rounded text-xs text-white">Fechar</button>
                </div>
            ) : (
                <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden border-2 border-indigo-500/50">
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Acesso Ativo</span>
                    </div>
                </div>
            )}
            
            {!error && (
                <div className="flex justify-center items-center gap-6 w-full">
                    <button onClick={onCancel} className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors" title={labels.cancel}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <button onClick={handleCapture} className="p-5 bg-white text-black font-bold rounded-full border-4 border-indigo-500 shadow-xl hover:scale-105 active:scale-95 transition-all">
                        <div className="w-8 h-8 rounded-full border-2 border-black" />
                    </button>

                    <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors" title={labels.switchCamera}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992a8.25 8.25 0 0 0-11.667 0v4.992m16.66-4.992l-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 5.006m16.66 4.992h-4.992" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
