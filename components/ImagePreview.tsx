import React from 'react';
import Spinner from './Spinner';

interface ImagePreviewProps {
  isLoading: boolean;
  images: string[];
  error: string;
  labels: {
    imagePreviewTitle: string;
    download: string;
  };
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ isLoading, images, error, labels }) => {
  if (!isLoading && images.length === 0 && !error) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-800/50 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-200">{labels.imagePreviewTitle}</h2>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {isLoading && (
          <div className="text-center text-gray-400">
            <Spinner />
          </div>
        )}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {!isLoading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {images.map((base64Image, index) => {
              const imageUrl = `data:image/png;base64,${base64Image}`;
              return (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Generated Preview ${index + 1}`}
                    className="rounded-lg object-cover w-full h-full aspect-square"
                  />
                  <a
                    href={imageUrl}
                    download={`prompt-preview-${index + 1}.png`}
                    className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
                    title={labels.download}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
