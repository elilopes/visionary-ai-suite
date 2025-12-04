
import React, { useState, useRef } from 'react';
import Spinner from './Spinner';

interface VocalRemoverProps {
    labels: any;
}

const VocalRemover: React.FC<VocalRemoverProps> = ({ labels }) => {
    const [file, setFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string>('');
    const [instrumentalUrl, setInstrumentalUrl] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Audio Refs
    const originalAudioRef = useRef<HTMLAudioElement>(null);
    const instrumentalAudioRef = useRef<HTMLAudioElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setOriginalUrl(URL.createObjectURL(f));
            setInstrumentalUrl('');
        }
    };

    const processAudio = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            // Create new buffer for instrumental
            const numberOfChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;
            const sampleRate = audioBuffer.sampleRate;
            const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;

            // Phase Cancellation Logic (Center Channel Suppression)
            // Left = Left - Right
            // Right = Right - Left
            // This removes signals that are identical in both channels (usually vocals/bass in center)
            
            const splitter = offlineCtx.createChannelSplitter(2);
            const merger = offlineCtx.createChannelMerger(2);
            
            // Invert Right Channel
            const gainRight = offlineCtx.createGain();
            gainRight.gain.value = -1;

            source.connect(splitter);
            
            // Connect Left to Left Output
            splitter.connect(merger, 0, 0); 
            
            // Connect Right -> Inverter -> Left Output (L - R)
            splitter.connect(gainRight, 1);
            gainRight.connect(merger, 0, 0);

            // Do the same for Right Output (R - L) or just duplicate Mono result
            // For simple karaoke, (L-R) in both ears is standard "Karaoke" trick
            splitter.connect(merger, 0, 1);
            splitter.connect(gainRight, 1, 1); // R - R (Cancel) - wait, simple way:
            
            // Simple Phase Inversion: 
            // OOPS (Out Of Phase Stereo) effect is (L - R)
            // We'll create a mono buffer of L-R and feed it to both channels.
            
            const renderedBuffer = await offlineCtx.startRendering().then(() => {
                 // Manual buffer manipulation is often cleaner for this specific alg
                 const l = audioBuffer.getChannelData(0);
                 const r = audioBuffer.getChannelData(1);
                 const newBuffer = audioCtx.createBuffer(2, length, sampleRate);
                 const newL = newBuffer.getChannelData(0);
                 const newR = newBuffer.getChannelData(1);

                 for (let i = 0; i < length; i++) {
                     // Simple substraction removes center channel
                     const sample = (l[i] - r[i]); 
                     newL[i] = sample;
                     newR[i] = sample;
                 }
                 return newBuffer;
            });

            // Convert AudioBuffer to WAV Blob
            const wavBlob = bufferToWave(renderedBuffer, length);
            setInstrumentalUrl(URL.createObjectURL(wavBlob));

        } catch (error) {
            console.error("Audio processing error:", error);
            alert("Error processing audio. Ensure file is Stereo MP3/WAV.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper to create WAV file from AudioBuffer
    const bufferToWave = (abuffer: AudioBuffer, len: number) => {
        const numOfChan = abuffer.numberOfChannels;
        const length = len * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this example)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < len) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([buffer], { type: "audio/wav" });

        function setUint16(data: any) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data: any) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-pink-400">{labels.vocalRemoverTitle}</h3>
            <p className="text-gray-400 mb-4 text-sm">{labels.vocalRemoverDescription}</p>

            <div className="space-y-6">
                <input 
                    type="file" 
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-pink-600 file:text-white
                    hover:file:bg-pink-700"
                />

                {originalUrl && (
                    <div className="bg-black/30 p-4 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">{labels.vocalRemoverPlayOriginal}</p>
                        <audio ref={originalAudioRef} src={originalUrl} controls className="w-full h-8" />
                    </div>
                )}

                <button
                    onClick={processAudio}
                    disabled={isProcessing || !file}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isProcessing ? <Spinner /> : null}
                    {isProcessing ? labels.vocalRemoverProcessing : "Remove Vocals"}
                </button>

                {instrumentalUrl && (
                    <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/30 animate-fade-in">
                        <p className="text-xs text-green-300 mb-1">{labels.vocalRemoverPlayInstrumental}</p>
                        <audio ref={instrumentalAudioRef} src={instrumentalUrl} controls className="w-full h-8 mb-3" />
                        
                        <a 
                            href={instrumentalUrl} 
                            download={`instrumental-${file?.name || 'audio'}.wav`}
                            className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-center text-sm"
                        >
                            {labels.vocalRemoverDownload}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
};

export default VocalRemover;
