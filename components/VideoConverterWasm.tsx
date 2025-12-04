
import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import Spinner from './Spinner';

interface VideoConverterWasmProps {
    labels: any;
}

const VideoConverterWasm: React.FC<VideoConverterWasmProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState('gif');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [error, setError] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    
    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('log', ({ message }) => {
            setMessage(message);
        });
        ffmpeg.on('progress', ({ progress }) => {
            setProgress(Math.round(progress * 100));
        });
        
        try {
            // Note: SharedArrayBuffer is required for ffmpeg.wasm which needs specific headers. 
            // In a simple React dev environment without headers, this might fail or fallback to single thread if version supports.
            // Using coreURL/wasmURL from CDN to ensure loading.
            await ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm'
            });
            setIsLoaded(true);
        } catch (e: any) {
            console.error("FFmpeg Load Error:", e);
            setError("Could not load FFmpeg. Your browser might not support SharedArrayBuffer or Cross-Origin headers are missing.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setDownloadUrl('');
            setError('');
            setProgress(0);
        }
    };

    const convert = async () => {
        if (!file || !isLoaded) return;
        setIsConverting(true);
        setDownloadUrl('');
        setError('');
        
        const ffmpeg = ffmpegRef.current;
        const inputName = 'input' + getExt(file.name);
        const outputName = 'output.' + targetFormat;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
            
            // Run FFmpeg command
            // Example: ffmpeg -i input.mp4 output.gif
            let args = ['-i', inputName, outputName];
            if (targetFormat === 'gif') {
                // Optimization for GIF
                args = ['-i', inputName, '-vf', 'fps=10,scale=320:-1:flags=lanczos', '-c:v', 'gif', outputName];
            } else if (targetFormat === 'mp3') {
                args = ['-i', inputName, '-vn', '-ab', '128k', outputName];
            }

            await ffmpeg.exec(args);
            
            const data = await ffmpeg.readFile(outputName);
            const url = URL.createObjectURL(new Blob([data], { type: getMimeType(targetFormat) }));
            setDownloadUrl(url);
        } catch (e: any) {
            console.error("Conversion Error:", e);
            setError("Conversion failed. Check console.");
        } finally {
            setIsConverting(false);
        }
    };

    const getExt = (filename: string) => {
        return filename.substring(filename.lastIndexOf('.'));
    };

    const getMimeType = (fmt: string) => {
        if (fmt === 'mp4') return 'video/mp4';
        if (fmt === 'gif') return 'image/gif';
        if (fmt === 'mp3') return 'audio/mpeg';
        if (fmt === 'webm') return 'video/webm';
        return 'application/octet-stream';
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-green-400">{labels.converterWasmTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.converterWasmDescription}</p>

            {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 text-sm border border-red-800">{error}</div>}

            {!isLoaded && !error ? (
                <div className="flex items-center text-gray-400 text-sm">
                    <Spinner /> <span className="ml-2">Loading FFmpeg Core...</span>
                </div>
            ) : (
                <div className="space-y-4">
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
                        <label className="text-sm text-gray-400">{labels.convertTo}:</label>
                        <select 
                            value={targetFormat} 
                            onChange={(e) => setTargetFormat(e.target.value)}
                            className="bg-gray-800 text-white rounded p-2 text-sm border border-gray-600"
                        >
                            <option value="gif">GIF (Animated)</option>
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                            <option value="mp3">MP3 (Audio Only)</option>
                        </select>
                    </div>

                    <button
                        onClick={convert}
                        disabled={isConverting || !file}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md disabled:opacity-50 transition-colors"
                    >
                        {isConverting ? <Spinner /> : "Convert Now"}
                    </button>

                    {isConverting && (
                        <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
                            <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                            <p className="text-xs text-gray-500 mt-1 text-center truncate">{message}</p>
                        </div>
                    )}

                    {downloadUrl && (
                        <a 
                            href={downloadUrl} 
                            download={`converted.${targetFormat}`}
                            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-center mt-4 transition-colors"
                        >
                            Download {targetFormat.toUpperCase()}
                        </a>
                    )}
                </div>
            )}
        </section>
    );
};

export default VideoConverterWasm;
