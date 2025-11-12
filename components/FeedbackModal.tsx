
import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CheckCircleIcon, XCircleIcon, EnvelopeIcon } from './icons';

interface FeedbackModalProps {
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (status === 'sent') {
            timer = setTimeout(() => {
                onClose();
            }, 3000); 
        }
        return () => clearTimeout(timer);
    }, [status, onClose]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '') return;

        setStatus('sending');
        // Simular una llamada a la API
        setTimeout(() => {
            console.log({
                to: 'tecnicfitia@tecnicalfitnesartificialintelligence.app', // Correo del desarrollador
                from: fromEmail || 'anonymous',
                subject,
                message,
            });
            setStatus('sent');
        }, 1500);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8 w-full max-w-lg m-4 relative animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <XCircleIcon className="w-6 h-6" />
                </button>

                {status === 'sent' ? (
                    <div className="text-center p-8 flex flex-col items-center justify-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4"/>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Gracias!</h2>
                        <p className="text-gray-300">Hemos recibido tu sugerencia. Tu feedback nos ayuda a mejorar.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <EnvelopeIcon className="w-8 h-8 text-cyan-400" />
                            <h2 className="text-2xl font-bold text-white">Enviar una Sugerencia</h2>
                        </div>
                        <p className="text-gray-400 mb-6 text-sm">
                            ¿Tienes una idea para una nueva función o has encontrado algo que podríamos mejorar? ¡Nos encantaría saberlo!
                        </p>
                        
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-300 mb-2">Tu Email (Opcional)</label>
                                <input 
                                    type="email" 
                                    id="feedback-email" 
                                    value={fromEmail} 
                                    onChange={(e) => setFromEmail(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500" 
                                    placeholder="Para que podamos responderte"
                                />
                            </div>
                             <div>
                                <label htmlFor="feedback-subject" className="block text-sm font-medium text-gray-300 mb-2">Asunto</label>
                                <input 
                                    type="text" 
                                    id="feedback-subject" 
                                    value={subject} 
                                    onChange={(e) => setSubject(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500" 
                                    placeholder="Ej: Idea para la vista de historial" 
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-300 mb-2">Mensaje</label>
                                <textarea 
                                    id="feedback-message" 
                                    rows={5} 
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500" 
                                    placeholder="Describe tu sugerencia o problema aquí..." 
                                    required
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={status === 'sending'}
                                className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                            >
                                {status === 'sending' ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    'Enviar Sugerencia'
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
