
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginProps {
    onLogin: (email: string, pass: string) => boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate a small network delay for better UX feel
        setTimeout(() => {
            const success = onLogin(email, password);
            if (!success) {
                setError('Email hoặc mật khẩu không chính xác!');
                setIsLoading(false);
            }
            // If success, parent component will unmount this, so no need to set loading false
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
                {/* Visual Side (Hidden on mobile) */}
                <div className="hidden md:block w-2 bg-indigo-600"></div>

                {/* Form Side */}
                <div className="w-full p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight mb-2">ULTIMATE FLOW</h1>
                        <p className="text-gray-500 text-sm">Đăng nhập để quản lý hiệu suất của bạn</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center animate-fade-in">
                                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                            {!isLoading && <ArrowRight size={18} className="ml-2" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-400">
                        &copy; 2024 Ultimate Flow. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};
