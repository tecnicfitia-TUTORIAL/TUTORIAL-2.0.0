import React, { useState, FormEvent } from 'react';
import { SpinnerIcon, EnvelopeIcon, XCircleIcon, CheckCircleIcon, GoogleIcon, AppleIcon, GithubIcon } from './icons';
import * as apiService from '../services/apiService';
import { AuthUser } from '../types';

export type AuthView = 'login' | 'register' | 'forgot' | 'forgot_sent';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  initialView?: AuthView;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess, initialView = 'login' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiService.loginWithEmail(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiService.registerWithEmail(email, password);
      onLoginSuccess(user); // Log in immediately
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiService.sendPasswordReset(email);
      setView('forgot_sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiService.loginWithGoogle();
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
   const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiService.loginWithApple();
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiService.loginWithGithub();
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetFormState = (newView: AuthView) => {
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setIsLoading(false);
    setView(newView);
  };

  const renderContent = () => {
    switch(view) {
        case 'login':
        case 'register':
            return (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex justify-center items-center gap-3 bg-white text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition hover:bg-gray-200 disabled:opacity-50">
                            <GoogleIcon className="w-5 h-5"/> Continúa con Google
                        </button>
                        <button onClick={handleAppleLogin} disabled={isLoading} className="w-full flex justify-center items-center gap-3 bg-black text-white font-semibold py-2.5 px-4 rounded-lg transition hover:bg-gray-800 disabled:opacity-50">
                            <AppleIcon className="w-5 h-5"/> Continúa con Apple
                        </button>
                        <button onClick={handleGithubLogin} disabled={isLoading} className="w-full flex justify-center items-center gap-3 bg-[#333] text-white font-semibold py-2.5 px-4 rounded-lg transition hover:bg-[#444] disabled:opacity-50">
                            <GithubIcon className="w-5 h-5"/> Continúa con GitHub
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-gray-800 px-2 text-gray-400">O</span>
                        </div>
                    </div>
                    
                    {view === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                                <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label htmlFor="password"className="block text-sm font-medium text-gray-300">Contraseña</label>
                                <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-500">
                                {isLoading && <SpinnerIcon className="w-5 h-5"/>}
                                Iniciar Sesión
                            </button>
                            <div className="text-xs text-center text-gray-400">
                                <button type="button" onClick={() => resetFormState('forgot')} className="hover:underline text-cyan-400">¿Olvidaste tu contraseña?</button>
                            </div>
                        </form>
                    ) : (
                         <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300">Email</label>
                                <input type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label htmlFor="reg-password"className="block text-sm font-medium text-gray-300">Contraseña</label>
                                <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label htmlFor="reg-confirm-password"className="block text-sm font-medium text-gray-300">Confirmar Contraseña</label>
                                <input type="password" id="reg-confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <p className="text-xs text-gray-500 text-center">Al registrarte con tu email, se te enviará un correo para verificar tu cuenta.</p>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-500">
                                {isLoading && <SpinnerIcon className="w-5 h-5"/>}
                                Crear Cuenta y Entrar
                            </button>
                        </form>
                    )}
                </div>
            );
        case 'forgot':
             return (
                 <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" id="forgot-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-500">
                        {isLoading && <SpinnerIcon className="w-5 h-5"/>}
                        Enviar enlace de recuperación
                    </button>
                </form>
            );
        case 'forgot_sent':
            return (
                <div className="text-center">
                    <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-4"/>
                    <p className="text-gray-300">Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en breve.</p>
                </div>
            );
    }
  };
  
  const titles = {
      login: { title: "Bienvenido", subtitle: "Inicia sesión para continuar" },
      register: { title: "Crea tu Cuenta", subtitle: "Únete para empezar a generar guías" },
      forgot: { title: "Recuperar Contraseña", subtitle: "Introduce tu email para recibir un enlace de recuperación" },
      forgot_sent: { title: "Revisa tu Correo", subtitle: "" },
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8 w-full max-w-sm m-4 relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">{titles[view].title}</h2>
            {titles[view].subtitle && <p className="text-gray-400 mt-1">{titles[view].subtitle}</p>}
        </div>
        
        {renderContent()}

        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        
        <div className="text-xs text-center text-gray-400 mt-4">
            {view === 'login' && <p>¿No tienes cuenta? <button onClick={() => resetFormState('register')} className="hover:underline text-cyan-400">Regístrate</button></p>}
            {view === 'register' && <p>¿Ya tienes cuenta? <button onClick={() => resetFormState('login')} className="hover:underline text-cyan-400">Inicia Sesión</button></p>}
            {(view === 'forgot' || view === 'forgot_sent') && <p><button onClick={() => resetFormState('login')} className="hover:underline text-cyan-400">Volver a Iniciar Sesión</button></p>}
        </div>

      </div>
    </div>
  );
};