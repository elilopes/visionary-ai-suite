
import React, { useState } from 'react';
import CameraCapture from './CameraCapture';

interface ImageInputProps {
    onChange: (file: File) => void;
    labels: any;
    className?: string;
    accept?: string;
}

const ImageInput: React.FC<ImageInputProps> = ({ onChange, labels, className, accept = "image/*" }) => {
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0]);
        }
    };

    const handleCameraCapture = (file: File) => {
        onChange(file);
        setIsCameraOpen(false);
    };

    if (isCameraOpen) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] animate-fade-in">
                <div className="w-full max-w-md">
                    <CameraCapture 
                        onCapture={handleCameraCapture} 
                        labels={labels} 
                        onCancel={() => setIsCameraOpen(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow relative">
                    <label className="flex items-center justify-center w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg cursor-pointer transition-all shadow-lg active:scale-95">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Upload Arquivo
                        <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
                    </label>
                </div>
                
                <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center justify-center py-3 px-6 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-bold rounded-lg transition-all border border-gray-700 shadow-lg active:scale-95"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {labels.takePhoto || "Câmera"}
                </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">Suporta PNG, JPG e WebP</p>
        </div>
    );
};

export default ImageInput;
