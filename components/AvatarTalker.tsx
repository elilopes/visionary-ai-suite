
import React, { useState, useEffect, useRef } from 'react';
import TextArea from './TextArea';

interface AvatarTalkerProps {
    labels: any;
}

const AvatarTalker: React.FC<AvatarTalkerProps> = ({ labels }) => {
    const [text, setText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [pitch, setPitch] = useState(1);
    const [rate, setRate] = useState(1);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    
    // Animation state
    const [mouthHeight, setMouthHeight] = useState(2);
    const [blink, setBlink] = useState(false);
    const animationFrameRef = useRef<number | null>(null);

    // Subtitle state
    const [wordList, setWordList] = useState<{word: string, id: number}[]>([]);
    const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0) {
                // Try to find a default voice matching the current language logic if possible, otherwise first
                setSelectedVoice(availableVoices[0].name);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Blinking Interval
        const blinkInterval = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 200);
        }, 4000);

        return () => {
            clearInterval(blinkInterval);
            window.speechSynthesis.cancel();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const handleSpeak = () => {
        if (!text.trim()) return;
        
        window.speechSynthesis.cancel();
        
        // Prepare words for subtitle highlighting
        // Splitting by spaces to create a crude index
        const words = text.trim().split(/\s+/);
        setWordList(words.map((w, i) => ({ word: w, id: i })));
        setActiveWordIndex(-1);

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
        utterance.pitch = pitch;
        utterance.rate = rate;

        utterance.onstart = () => {
            setIsSpeaking(true);
            animateMouth();
        };

        // Key to Videoke Effect: onboundary event
        // Not all browsers support this perfectly for all voices, but works for most.
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                // Find which word corresponds to this char index
                const charIndex = event.charIndex;
                // Calculate cumulative length to find the word index
                let currentLength = 0;
                let foundIndex = 0;
                for (let i = 0; i < words.length; i++) {
                    // +1 for space
                    if (currentLength <= charIndex && charIndex < currentLength + words[i].length + 1) {
                        foundIndex = i;
                        break;
                    }
                    currentLength += words[i].length + 1;
                }
                setActiveWordIndex(foundIndex);
            }
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setActiveWordIndex(-1);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setMouthHeight(2); // Close mouth
        };

        utterance.onerror = (e) => {
            console.error("Speech Error", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setMouthHeight(2);
        setActiveWordIndex(-1);
    };

    const animateMouth = () => {
        const time = Date.now() * 0.02; // Speed
        const height = Math.abs(Math.sin(time)) * 15 + Math.random() * 5 + 2;
        setMouthHeight(height);
        animationFrameRef.current = requestAnimationFrame(animateMouth);
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{labels.avatarTalkerTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.avatarTalkerDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Avatar Display */}
                <div className="flex flex-col items-center">
                    <div className="relative w-64 h-64 bg-blue-100 rounded-full border-4 border-gray-700 overflow-hidden shadow-inner mb-4">
                        {/* CSS/SVG Avatar */}
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            {gender === 'male' ? (
                                <>
                                    {/* Male Skin */}
                                    <circle cx="100" cy="100" r="90" fill="#fdd8b5" />
                                    {/* Male Hair */}
                                    <path d="M20,100 Q20,20 100,20 T180,100" fill="none" stroke="#4a3b2a" strokeWidth="120" strokeLinecap="round" clipPath="url(#circleView)" />
                                </>
                            ) : (
                                <>
                                    {/* Female Hair Back */}
                                    <path d="M10,120 Q10,10 100,10 T190,120 L190,200 L10,200 Z" fill="#e6c229" />
                                    {/* Female Skin */}
                                    <circle cx="100" cy="100" r="90" fill="#fdd8b5" />
                                    {/* Female Hair Front/Bangs */}
                                    <path d="M20,90 Q50,40 100,60 Q150,40 180,90" fill="none" stroke="#e6c229" strokeWidth="20" strokeLinecap="round" />
                                </>
                            )}
                            
                            {/* Eyes */}
                            <g transform={`scale(1, ${blink ? 0.1 : 1})`} transform-origin="100 80">
                                <circle cx="70" cy="80" r="10" fill="#333" />
                                <circle cx="130" cy="80" r="10" fill="#333" />
                                <circle cx="73" cy="77" r="3" fill="white" />
                                <circle cx="133" cy="77" r="3" fill="white" />
                                {/* Eyelashes for Female */}
                                {gender === 'female' && (
                                    <>
                                        <line x1="60" y1="75" x2="50" y2="70" stroke="black" strokeWidth="2" />
                                        <line x1="140" y1="75" x2="150" y2="70" stroke="black" strokeWidth="2" />
                                    </>
                                )}
                            </g>

                            {/* Mouth (Animated) */}
                            <ellipse cx="100" cy="130" rx="20" ry={mouthHeight} fill={gender === 'female' ? "#c2185b" : "#5c2a2a"} />
                            {/* Tongue (visible when mouth open) */}
                            {mouthHeight > 5 && (
                                <path d={`M85,135 Q100,${130 + mouthHeight - 2} 115,135`} stroke="#e06c75" strokeWidth="8" strokeLinecap="round" />
                            )}
                        </svg>
                    </div>

                    {/* Videoke / Pulsing Subtitles */}
                    {isSpeaking && (
                        <div className="bg-black/80 p-3 rounded-lg text-center max-w-sm w-full min-h-[60px] flex flex-wrap justify-center items-center gap-1.5 transition-all">
                            {wordList.map((item, idx) => (
                                <span 
                                    key={idx} 
                                    className={`transition-all duration-150 inline-block px-1 rounded ${
                                        idx === activeWordIndex 
                                        ? 'text-yellow-400 font-bold transform scale-125 bg-white/10 shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                                        : 'text-gray-400'
                                    }`}
                                >
                                    {item.word}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                        <label className="block text-sm font-medium text-gray-400 mb-2">{labels.avatarGenderLabel}</label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="gender" 
                                    value="male" 
                                    checked={gender === 'male'} 
                                    onChange={() => setGender('male')}
                                    className="mr-2 accent-indigo-500"
                                />
                                <span className="text-gray-300">{labels.male}</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="gender" 
                                    value="female" 
                                    checked={gender === 'female'} 
                                    onChange={() => setGender('female')}
                                    className="mr-2 accent-pink-500"
                                />
                                <span className="text-gray-300">{labels.female}</span>
                            </label>
                        </div>
                    </div>

                    <TextArea 
                        id="avatar-text" 
                        label={labels.textToSpeak} 
                        value={text} 
                        placeholder="Hello! I am a cartoon avatar running entirely in your browser." 
                        onChange={setText} 
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{labels.voice}</label>
                        <select 
                            value={selectedVoice} 
                            onChange={(e) => setSelectedVoice(e.target.value)} 
                            className="w-full bg-gray-900 border-gray-700 text-white rounded-md p-2"
                        >
                            {voices.map(v => (
                                <option key={v.name} value={v.name}>
                                    {v.name} ({v.lang})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{labels.pitch}: {pitch}</label>
                            <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={pitch} 
                                onChange={(e) => setPitch(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{labels.rate}: {rate}</label>
                            <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={rate} 
                                onChange={(e) => setRate(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSpeak}
                            disabled={isSpeaking || !text.trim()}
                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-bold transition-colors disabled:opacity-50"
                        >
                            {isSpeaking ? "Speaking..." : labels.speak}
                        </button>
                        <button
                            onClick={handleStop}
                            disabled={!isSpeaking}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold transition-colors disabled:opacity-50"
                        >
                            {labels.stop}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AvatarTalker;
