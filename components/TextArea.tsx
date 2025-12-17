
import React, { useState, useEffect } from 'react';

interface TextAreaProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

const TextArea: React.FC<TextAreaProps> = ({ id, label, value, placeholder, onChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = navigator.language || 'pt-BR'; 
      
      recog.onstart = () => setIsListening(true);
      recog.onend = () => setIsListening(false);
      recog.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newValue = value ? `${value} ${transcript}` : transcript;
        onChange(newValue);
      };
      setRecognition(recog);
    }
  }, [value, onChange]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) recognition.stop();
    else recognition.start();
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-bold text-[var(--text-muted)]">
          {label}
        </label>
        {recognition && (
          <button
            type="button"
            onClick={toggleListening}
            className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)]'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-white' : 'bg-red-500'}`} />
            {isListening ? 'Ouvindo...' : 'Dictate'}
          </button>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--accent)] transition duration-150 ease-in-out p-4 text-base resize-y outline-none placeholder:text-[var(--text-muted)]/50"
      />
    </div>
  );
};

export default TextArea;
