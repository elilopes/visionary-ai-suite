
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
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      // Default to browser language or English, ideally could pass app language prop here
      recog.lang = navigator.language || 'en-US'; 
      
      recog.onstart = () => setIsListening(true);
      recog.onend = () => setIsListening(false);
      recog.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Append text if there's already value, or replace if empty? Appending is usually better for dictation.
        const newValue = value ? `${value} ${transcript}` : transcript;
        onChange(newValue);
      };
      setRecognition(recog);
    }
  }, [value, onChange]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-medium text-gray-400">
          {label}
        </label>
        {recognition && (
          <button
            type="button"
            onClick={toggleListening}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="Dictate text"
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-ping"/>
                Listening...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.964V18.75a.75.75 0 001.5 0V15.964c2.96-.38 5.25-2.904 5.25-5.964v-.357a.75.75 0 00-1.5 0V10c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5v-.357z" />
                </svg>
                Dictate
              </>
            )}
          </button>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base resize-y"
      />
    </div>
  );
};

export default TextArea;