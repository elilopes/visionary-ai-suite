import React, { useState } from 'react';
import Spinner from './Spinner';

interface RegisterProps {
    onRegisterSuccess: () => void;
    labels: any;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, labels }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError(labels.passwordMismatch);
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            if (email && password) {
                 console.log("Simulating successful registration for:", email);
                onRegisterSuccess();
            } else {
                setError(labels.registerError);
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-400">{labels.email}</label>
                <div className="mt-1">
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-400">{labels.password}</label>
                <div className="mt-1">
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        required
                         value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-400">{labels.confirmPassword}</label>
                <div className="mt-1">
                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-900 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    />
                </div>
            </div>

             {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Spinner /> : labels.register}
                </button>
            </div>
        </form>
    );
};

export default Register;
