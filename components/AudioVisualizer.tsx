
import React, { useRef, useState, useEffect } from 'react';

interface AudioVisualizerProps {
    labels: any;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ labels }) => {
    const [isListening, setIsListening] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const startVisualizer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            sourceRef.current = source;
            setIsListening(true);
            
            draw();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopVisualizer = () => {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        setIsListening(false);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {
            animationRef.current = requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgb(20, 20, 30)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                // Rainbow gradient based on frequency
                const r = barHeight + (25 * (i/bufferLength));
                const g = 250 * (i/bufferLength);
                const b = 50;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight / 1.5, barWidth, barHeight / 1.5);

                x += barWidth + 1;
            }
        };

        renderFrame();
    };

    useEffect(() => {
        return () => stopVisualizer();
    }, []);

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-cyan-400">{labels.audioVisualizerTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.audioVisualizerDescription}</p>

            <div className="flex flex-col items-center gap-4">
                <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={200} 
                    className="w-full bg-black rounded-lg border border-gray-800 shadow-inner"
                />
                
                <button
                    onClick={isListening ? stopVisualizer : startVisualizer}
                    className={`px-6 py-2 rounded-full font-bold transition-colors ${
                        isListening 
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                >
                    {isListening ? labels.stopVisualizer : labels.startVisualizer}
                </button>
            </div>
        </section>
    );
};

export default AudioVisualizer;