
import React, { useState, useRef, useEffect } from 'react';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface VideoCropperProps {
    labels: any;
}

const VideoCropper: React.FC<VideoCropperProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string>('');
    const [isRecording, setIsRecording] = useState(false);
    const [progress, setProgress] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [ffmpegCmd, setFfmpegCmd] = useState('');
    const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
    
    // Crop State
    const [crop, setCrop] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Processing Refs
    const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setVideoSrc(URL.createObjectURL(f));
            setRecordedBlob(null);
            setFfmpegCmd('');
            setCrop(null);
        }
    };

    // Draw Overlay Loop
    useEffect(() => {
        const canvas = canvasOverlayRef.current;
        const container = containerRef.current;
        
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to match video display size
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            drawOverlay();
        });
        resizeObserver.observe(container);

        const drawOverlay = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Darken background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (crop) {
                // Clear crop area
                ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
                
                // Draw Border
                ctx.strokeStyle = '#00ff00'; // Green
                ctx.lineWidth = 2;
                ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
                
                // Draw Dimensions
                ctx.fillStyle = '#00ff00';
                ctx.font = '12px sans-serif';
                ctx.fillText(`Selection`, crop.x + 5, crop.y - 5);
            }
        };

        drawOverlay();
        
        return () => resizeObserver.disconnect();
    }, [crop]);

    // Mouse Interactions for Crop Box
    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasOverlayRef.current) return { x: 0, y: 0 };
        const rect = canvasOverlayRef.current.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoords(e);
        setIsDragging(true);
        setStartPos({ x, y });
        setCrop({ x, y, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        const w = x - startPos.x;
        const h = y - startPos.y;

        setCrop({
            x: w > 0 ? startPos.x : x,
            y: h > 0 ? startPos.y : y,
            w: Math.abs(w),
            h: Math.abs(h)
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Processing Logic
    const startProcessing = () => {
        if (!videoRef.current || !crop || !canvasOverlayRef.current) return;
        
        const video = videoRef.current;
        
        // Calculate scaling factor between Displayed Video Size and Actual Video Resolution
        const scaleX = video.videoWidth / canvasOverlayRef.current.width;
        const scaleY = video.videoHeight / canvasOverlayRef.current.height;

        const sourceX = crop.x * scaleX;
        const sourceY = crop.y * scaleY;
        const sourceW = crop.w * scaleX;
        const sourceH = crop.h * scaleY;

        // Generate FFmpeg Command
        const cmd = `ffmpeg -i input.mp4 -filter:v "crop=${Math.round(sourceW)}:${Math.round(sourceH)}:${Math.round(sourceX)}:${Math.round(sourceY)}" -c:a copy output_cropped.mp4`;
        setFfmpegCmd(cmd);

        // Client-side Recording Setup
        const canvas = document.createElement('canvas');
        canvas.width = sourceW;
        canvas.height = sourceH;
        processingCanvasRef.current = canvas;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const stream = canvas.captureStream(30); // 30 FPS
        
        // Configure bitrate based on selection
        let bitrate = 2500000; // Medium
        if (quality === 'high') bitrate = 8000000;
        if (quality === 'low') bitrate = 800000;

        const mediaRecorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm',
            videoBitsPerSecond: bitrate
        });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setRecordedBlob(blob);
            setIsRecording(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        mediaRecorderRef.current = mediaRecorder;
        
        // Reset Video to start
        video.currentTime = 0;
        video.play();
        mediaRecorder.start();
        setIsRecording(true);

        // Drawing Loop
        const drawFrame = () => {
            if (video.paused || video.ended) {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                return;
            }

            ctx.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
            
            // Update progress (simple visual)
            setProgress((video.currentTime / video.duration) * 100);

            animationFrameRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();
    };

    const handleStop = () => {
        if (videoRef.current) videoRef.current.pause();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const downloadVideo = () => {
        if (!recordedBlob) return;
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cropped-video.webm';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-green-400">{labels.cropperTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.cropperDescription}</p>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <input 
                        type="file" 
                        accept="video/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-600 file:text-white
                        hover:file:bg-green-700"
                    />
                    
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400 whitespace-nowrap">{labels.qualityLabel}:</label>
                        <select 
                            value={quality} 
                            onChange={(e) => setQuality(e.target.value as any)}
                            className="bg-gray-800 text-white text-sm rounded border border-gray-600 p-1"
                        >
                            <option value="high">{labels.qualityHigh}</option>
                            <option value="medium">{labels.qualityMedium}</option>
                            <option value="low">{labels.qualityLow}</option>
                        </select>
                    </div>
                </div>

                {videoSrc && (
                    <div className="relative w-full max-w-2xl mx-auto border border-gray-600 bg-black rounded overflow-hidden">
                        {/* Container Ref for Sizing */}
                        <div ref={containerRef} className="relative w-full h-full">
                            <video 
                                ref={videoRef}
                                src={videoSrc}
                                className="w-full h-auto block"
                                playsInline
                                onEnded={() => setIsRecording(false)}
                            />
                            {/* Overlay Canvas for Drawing Crop Box */}
                            <canvas 
                                ref={canvasOverlayRef}
                                className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleMouseDown}
                                onTouchMove={handleMouseMove}
                                onTouchEnd={handleMouseUp}
                            />
                        </div>
                    </div>
                )}

                {crop && !isRecording && !recordedBlob && (
                    <div className="text-center">
                        <p className="text-sm text-gray-300 mb-2">Selection: {Math.round(crop.w)}x{Math.round(crop.h)} px (Visual)</p>
                        <button
                            onClick={startProcessing}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-colors"
                        >
                            {labels.startCrop}
                        </button>
                    </div>
                )}

                {isRecording && (
                    <div className="text-center space-y-2">
                        <p className="text-yellow-400 animate-pulse">Recording Crop... {Math.round(progress)}%</p>
                        <button
                            onClick={handleStop}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                        >
                            {labels.stopCrop}
                        </button>
                    </div>
                )}

                {recordedBlob && (
                    <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50 text-center">
                        <p className="text-green-300 mb-3">{labels.cropComplete}</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={downloadVideo}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                {labels.download}
                            </button>
                            <button
                                onClick={() => { setRecordedBlob(null); setCrop(null); }}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-bold"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}

                {ffmpegCmd && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-1">Professional FFmpeg Command (Lossless):</p>
                        <CodeBlock code={ffmpegCmd} />
                    </div>
                )}
            </div>
        </section>
    );
};

export default VideoCropper;
