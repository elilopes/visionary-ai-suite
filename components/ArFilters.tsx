
import React, { useRef, useState, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

interface ArFiltersProps {
    labels: any;
}

const ArFilters: React.FC<ArFiltersProps> = ({ labels }) => {
    const [isCameraRunning, setIsCameraRunning] = useState(false);
    const [filterType, setFilterType] = useState('mesh'); // mesh, sunglasses, clown
    const [error, setError] = useState('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        const initLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
            } catch (e) {
                console.error("Error loading MediaPipe:", e);
                setError("Failed to load AI model.");
            }
        };
        initLandmarker();

        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        setIsCameraRunning(false);
    };

    const startCamera = async () => {
        if (!faceLandmarkerRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
            }
            setIsCameraRunning(true);
            setError('');
        } catch (err) {
            setError("Could not access camera.");
        }
    };

    const predictWebcam = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = faceLandmarkerRef.current;

        if (!video || !canvas || !landmarker) return;

        // Resize canvas to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (results.faceLandmarks) {
                const drawingUtils = new DrawingUtils(ctx);
                
                for (const landmarks of results.faceLandmarks) {
                    if (filterType === 'mesh') {
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
                    } else if (filterType === 'sunglasses') {
                        // Simple glasses logic based on eye coordinates
                        const leftEye = landmarks[33]; // Inner corner left eye
                        const rightEye = landmarks[263]; // Inner corner right eye
                        const nose = landmarks[1]; // Nose tip

                        const width = Math.abs(rightEye.x - leftEye.x) * canvas.width * 2.5;
                        const x = leftEye.x * canvas.width - (width * 0.2);
                        const y = leftEye.y * canvas.height - (width * 0.3);
                        
                        ctx.fillStyle = "black";
                        ctx.fillRect(x, y, width, width * 0.3); // Placeholder for glasses graphic
                        ctx.fillStyle = "white";
                        ctx.fillText("🕶️", x + width/2 - 20, y + 20); // Emoji placeholder
                    } else if (filterType === 'clown') {
                        const nose = landmarks[1];
                        ctx.beginPath();
                        ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 20, 0, 2 * Math.PI);
                        ctx.fillStyle = "red";
                        ctx.fill();
                    }
                }
            }
        }

        if (isCameraRunning) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.arFiltersTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.arFiltersDescription}</p>

            <div className="flex flex-col items-center gap-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-black max-w-md w-full aspect-[4/3]">
                    <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                    {!isCameraRunning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            Camera Off
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mb-2">
                    <button onClick={() => setFilterType('mesh')} className={`px-3 py-1 rounded text-sm ${filterType==='mesh' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Mesh</button>
                    <button onClick={() => setFilterType('sunglasses')} className={`px-3 py-1 rounded text-sm ${filterType==='sunglasses' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Glasses</button>
                    <button onClick={() => setFilterType('clown')} className={`px-3 py-1 rounded text-sm ${filterType==='clown' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Clown</button>
                </div>

                <button
                    onClick={isCameraRunning ? stopCamera : startCamera}
                    className={`px-6 py-2 rounded-full font-bold transition-colors ${
                        isCameraRunning 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isCameraRunning ? labels.arFiltersStop : labels.arFiltersStart}
                </button>
            </div>
        </section>
    );
};

export default ArFilters;
