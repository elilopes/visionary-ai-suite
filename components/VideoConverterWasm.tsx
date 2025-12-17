
import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Spinner from './Spinner';

interface VideoConverterWasmProps {
    labels: any;
}

const VideoConverterWasm: React.FC<VideoConverterWasmProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState('gif');
    const [isConverting, setIsLoading] = useState(false);
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
            // Using precise URLs from unpkg to bypass origin restrictions on Workers
            // Version 0.12.x requires consistent sources for core and worker
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
            const ffmpegBaseURL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/esm';
            
            // Note: v0.12 requires SharedArrayBuffer and COOP/COEP headers. 
            // In environments where headers can't be set, it may fail with a SharedArrayBuffer error.
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                // Explicitly provide workerURL via blob to fix origin construction issues
                workerURL: await toBlobURL(`${ffmpegBaseURL}/worker.js`, 'text/javascript'),
            });
            setIsLoaded(true);
        } catch (e: any) {
            console.error("FFmpeg Load Error:", e);
            setError("Falha ao carregar motor FFmpeg local. Isso ocorre devido a restrições de segurança do navegador (SharedArrayBuffer) ou erro de carregamento do Worker via CDN.");
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
        setIsLoading(true);
        setDownloadUrl('');
        setError('');
        
        const ffmpeg = ffmpegRef.current;
        const inputExt = file.name.substring(file.name.lastIndexOf('.'));
        const inputName = 'input' + inputExt;
        const outputName = 'output.' + targetFormat;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
            
            let args = ['-i', inputName];
            if (targetFormat === 'gif') {
                args = ['-i', inputName, '-vf', 'fps=10,scale=320:-1:flags=lanczos', '-c:v', 'gif', outputName];
            } else if (targetFormat === 'mp3') {
                args = ['-i', inputName, '-vn', '-ab', '128k', outputName];
            } else {
                args = ['-i', inputName, outputName];
            }

            await ffmpeg.exec(args);
            
            const data = await ffmpeg.readFile(outputName);
            const url = URL.createObjectURL(new Blob([data], { type: getMimeType(targetFormat) }));
            setDownloadUrl(url);
        } catch (e: any) {
            console.error("Conversion Error:", e);
            setError("Falha na conversão. O arquivo pode ser incompatível ou o processamento foi interrompido.");
        } finally {
            setIsLoading(false);
        }
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
            <h3 className="text-xl font-bold mb-2 text-green-400">{labels.converterWasmTitle || "Conversor de Vídeo"}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.converterWasmDescription || "Converta vídeo localmente usando o processamento do seu navegador."}</p>

            {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 text-sm border border-red-800">{error}</div>}

            {!isLoaded && !error ? (
                <div className="flex items-center text-gray-400 text-sm">
                    <Spinner /> <span className="ml-2">Carregando motor local...</span>
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
                        <label className="text-sm text-gray-400">{labels.convertTo || "Para"}:</label>
                        <select 
                            value={targetFormat} 
                            onChange={(e) => setTargetFormat(e.target.value)}
                            className="bg-gray-800 text-white rounded p-2 text-sm border border-gray-600 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="gif">GIF (Animado)</option>
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                            <option value="mp3">MP3 (Apenas Áudio)</option>
                        </select>
                    </div>

                    <button
                        onClick={convert}
                        disabled={isConverting || !file || !isLoaded}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md disabled:opacity-50 transition-colors"
                    >
                        {isConverting ? <Spinner /> : "Converter Agora"}
                    </button>

                    {isConverting && (
                        <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
                            <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                            <p className="text-xs text-gray-500 mt-1 text-center truncate">{message}</p>
                        </div>
                    )}

                    {downloadUrl && (
                        <div className="animate-fade-in">
                            <a 
                                href={downloadUrl} 
                                download={`converted.${targetFormat}`}
                                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-center mt-4 transition-colors"
                            >
                                Baixar {targetFormat.toUpperCase()}
                            </a>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default VideoConverterWasm;
