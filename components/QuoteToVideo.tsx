
import React, { useState, useRef } from 'react';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface QuoteToVideoProps {
    labels: any;
}

const QuoteToVideo: React.FC<QuoteToVideoProps> = ({ labels }) => {
    const [quote, setQuote] = useState('');
    const [author, setAuthor] = useState('');
    const [style, setStyle] = useState('gradient'); // gradient, solid, image
    const [theme, setTheme] = useState('sunset'); // sunset, ocean, aurora, cyberpunk
    const [isRendering, setIsRendering] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const themes: any = {
        sunset: { bg: ['#ff7e5f', '#feb47b'], text: '#ffffff' },
        ocean: { bg: ['#2b5876', '#4e4376'], text: '#ffffff' },
        aurora: { bg: ['#00c6ff', '#0072ff'], text: '#ffffff' },
        cyberpunk: { bg: ['#2b0537', '#da22ff'], text: '#00ffff' },
        dark: { bg: ['#000000', '#434343'], text: '#ffffff' }
    };

    const handleRender = () => {
        if (!quote.trim() || !canvasRef.current) return;
        setIsRendering(true);
        setRecordedBlob(null);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset canvas size (HD)
        canvas.width = 1280;
        canvas.height = 720;

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9', videoBitsPerSecond: 2500000 });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setRecordedBlob(blob);
            setIsRendering(false);
        };

        mediaRecorder.start();

        // Animation Loop (5 seconds duration)
        let startTime: number | null = null;
        const duration = 5000;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Draw Background
            const selectedTheme = themes[theme] || themes.sunset;
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            // Animate gradient slightly
            gradient.addColorStop(0, selectedTheme.bg[0]);
            gradient.addColorStop(1, selectedTheme.bg[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add subtle moving particles
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for(let i=0; i<50; i++) {
                const x = (i * 30 + progress * 50) % canvas.width;
                const y = (i * 20 + Math.sin(progress * Math.PI) * 20) % canvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Text (Fade In Effect)
            ctx.globalAlpha = Math.min(progress * 2, 1);
            ctx.fillStyle = selectedTheme.text;
            ctx.font = 'bold 48px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Word Wrap Logic
            const maxWidth = 1000;
            const words = quote.split(' ');
            let line = '';
            const lines = [];
            
            for(let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            // Render Text Lines
            const lineHeight = 60;
            const startY = (canvas.height - (lines.length * lineHeight)) / 2;
            
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], canvas.width / 2, startY + (i * lineHeight));
            }

            // Render Author (Slide Up Effect)
            if (author) {
                const authorY = startY + (lines.length * lineHeight) + 40 - (progress * 10);
                ctx.font = 'italic 32px Arial, sans-serif';
                ctx.globalAlpha = Math.max(0, Math.min((progress - 0.5) * 2, 1));
                ctx.fillText(`- ${author}`, canvas.width / 2, authorY);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                mediaRecorder.stop();
            }
        };

        requestAnimationFrame(animate);
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-pink-400">{labels.quoteVideoTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.quoteVideoDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <TextArea 
                        id="quote-input" 
                        label="Quote" 
                        value={quote} 
                        placeholder={labels.quotePlaceholder} 
                        onChange={setQuote} 
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Author</label>
                        <input 
                            type="text" 
                            value={author} 
                            onChange={(e) => setAuthor(e.target.value)} 
                            placeholder={labels.authorPlaceholder}
                            className="w-full bg-gray-800 border-gray-700 text-white rounded-md p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                        <div className="flex gap-2 flex-wrap">
                            {Object.keys(themes).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`px-3 py-1 rounded text-sm capitalize ${theme === t ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleRender}
                        disabled={isRendering || !quote.trim()}
                        className="w-full flex items-center justify-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md font-bold disabled:opacity-50"
                    >
                        {isRendering ? <Spinner /> : null}
                        {isRendering ? labels.rendering : labels.startRender}
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center bg-black/50 rounded-lg p-4 border border-gray-800">
                    <canvas 
                        ref={canvasRef} 
                        className="w-full h-auto max-h-64 object-contain mb-4 bg-black rounded"
                    />
                    {recordedBlob && (
                        <div className="text-center w-full">
                            <video 
                                src={URL.createObjectURL(recordedBlob)} 
                                controls 
                                className="w-full h-auto max-h-64 mb-2 rounded" 
                            />
                            <a 
                                href={URL.createObjectURL(recordedBlob)} 
                                download="quote-video.webm"
                                className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-center"
                            >
                                {labels.download} Video
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default QuoteToVideo;
