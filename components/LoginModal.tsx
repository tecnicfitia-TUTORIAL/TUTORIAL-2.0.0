
import React, { useState } from 'react';
import { GoogleIcon, AppleIcon } from './icons';

interface LoginModalProps {
    onLogin: (email: string) => void;
    onClose: () => void;
}

type Mode = 'login' | 'register';

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // En una app real, aquí iría la validación de los campos del formulario.
        // Para esta simulación, cualquier envío de formulario resulta en un inicio de sesión exitoso.
        onLogin(email);
    };

    const isLoginMode = mode === 'login';

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8 w-full max-w-md m-4 relative animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-6">
                    <div className="flex border-b border-gray-600">
                        <button onClick={() => setMode('login')} className={`w-1/2 pb-3 text-sm font-bold transition-colors focus:outline-none ${isLoginMode ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                            INICIAR SESIÓN
                        </button>
                        <button onClick={() => setMode('register')} className={`w-1/2 pb-3 text-sm font-bold transition-colors focus:outline-none ${!isLoginMode ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                            CREAR CUENTA
                        </button>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLoginMode ? 'Bienvenido de nuevo' : 'Únete a nosotros'}</h2>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500" placeholder="tu@email.com" required/>
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500" placeholder="********" required/>
                    </div>
                    {!isLoginMode && (
                         <div>
                            <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-300 mb-2">Confirmar Contraseña</label>
                            <input type="password" id="confirm-password" className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500" placeholder="********" required/>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
                        {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">O continúa con</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => onLogin('google_user@test.com')} className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <GoogleIcon className="w-5 h-5" />
                        Google
                    </button>
                    <button onClick={() => onLogin('apple_user@test.com')} className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <AppleIcon className="w-5 h-5" />
                        Apple
                    </button>
                </div>

            </div>
        </div>
    );
};