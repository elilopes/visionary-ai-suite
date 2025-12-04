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
            <CameraCapture 
                onCapture={handleCameraCapture} 
                labels={labels} 
                onCancel={() => setIsCameraOpen(false)}
            />
        );
    }

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="relative">
                <input 
                    type="file" 
                    accept={accept}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-700 cursor-pointer"
                />
            </div>
            <div className="text-center text-gray-500 text-xs">- OR -</div>
            <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center justify-center w-full py-2 px-4 border border-gray-600 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                {labels.takePhoto}
            </button>
        </div>
    );
};

export default ImageInput;