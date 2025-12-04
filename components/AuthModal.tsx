
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Spinner from './Spinner';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (method: 'email' | 'drive') => void;
    labels: any;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, labels }) => {
    const [view, setView] = useState<'login' | 'register'>('login');
    const [isDriveLoading, setIsDriveLoading] = useState(false);

    if (!isOpen) return null;

    const activeTabClass = 'border-indigo-500 text-indigo-400';
    const inactiveTabClass = 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500';

    const handleDriveConnect = () => {
        setIsDriveLoading(true);
        // Simulating Google Auth Flow
        setTimeout(() => {
            setIsDriveLoading(false);
            onLoginSuccess('drive');
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="auth-modal-title" className="text-xl font-bold text-white">{labels.authModalTitle}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-center text-gray-400 mb-6">{labels.authModalDescription}</p>
                    
                    <div className="border-b border-gray-700 mb-6">
                        <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setView('login')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'login' ? activeTabClass : inactiveTabClass}`}
                            >
                                {labels.login}
                            </button>
                            <button
                                onClick={() => setView('register')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'register' ? activeTabClass : inactiveTabClass}`}
                            >
                                {labels.register}
                            </button>
                        </nav>
                    </div>

                    {view === 'login' ? (
                        <Login onLoginSuccess={() => onLoginSuccess('email')} labels={labels} />
                    ) : (
                        <Register onRegisterSuccess={() => onLoginSuccess('email')} labels={labels} />
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-800 text-gray-400">OR</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleDriveConnect}
                                disabled={isDriveLoading}
                                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-600 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                {isDriveLoading ? (
                                    <Spinner /> 
                                ) : (
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                                            <path d="M18.972 15.568L22.662 9.175L12.84 9.175L8.077 17.422C8.077 17.422 17.232 17.422 17.9 17.422C18.335 17.422 18.745 16.76 18.972 15.568Z" fill="#4285F4" />
                                            <path d="M6.515 14.687L3.775 9.932C3.775 9.932 8.625 1.522 8.625 1.522L13.45 9.932L6.515 14.687Z" fill="#34A853" />
                                            <path d="M5.477 16.522L9.167 22.915C9.167 22.915 18.867 22.915 18.867 22.915L14.042 14.505C14.042 14.505 5.477 14.505 5.477 16.522Z" fill="#1967D2" />
                                            <path d="M12.84 9.175L9.15 2.782C9.15 2.782 4.295 11.192 4.295 11.192L8.077 17.422L12.84 9.175Z" fill="#FBBC05" />
                                            <path d="M13.45 9.932L18.275 1.522C18.275 1.522 8.625 1.522 8.625 1.522L12.84 9.175L13.45 9.932Z" fill="#EA4335" />
                                        </g>
                                    </svg>
                                )}
                                {labels.saveToDrive}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
