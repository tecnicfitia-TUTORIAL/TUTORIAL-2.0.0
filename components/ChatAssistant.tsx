import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon, XCircleIcon, SendIcon, SpinnerIcon } from './icons';
import { getChatResponseProxy } from '../services/apiService';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: '¡Hola! Soy tu asistente de ayuda. ¿En qué puedo ayudarte hoy con la aplicación?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(isOpen) {
           setTimeout(() => scrollToBottom(), 100);
        }
    }, [isOpen, messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput) return;

        const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await getChatResponseProxy(trimmedInput, newMessages);
            const assistantMessage: ChatMessage = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error getting chat response:", error);
            const errorMessage: ChatMessage = { role: 'assistant', content: 'Lo siento, no pude procesar tu solicitud en este momento.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Window */}
            <div className={`fixed bottom-24 right-5 sm:right-8 w-[calc(100%-2.5rem)] max-w-sm h-[70%] max-h-[500px] bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl flex flex-col z-40 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="font-bold text-white">Asistente de Ayuda</h3>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl px-4 py-2 whitespace-pre-wrap ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                               {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-xl px-4 py-2 bg-gray-700 text-gray-200 flex items-center gap-2 rounded-bl-none">
                               <SpinnerIcon className="w-4 h-4" />
                               <span>Pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex-shrink-0 flex items-center gap-3">
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        placeholder="Escribe tu pregunta..." 
                        className="w-full bg-gray-900 border border-gray-600 rounded-full py-2 px-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 transition"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !inputValue.trim()} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors flex-shrink-0">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>

            {/* Floating Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="fixed bottom-5 right-5 sm:right-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-4 shadow-lg z-50 transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
              aria-label="Abrir asistente de chat"
              style={{ animation: isOpen ? 'none' : 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            >
              {isOpen ? <XCircleIcon className="w-8 h-8"/> : <ChatBubbleIcon className="w-8 h-8"/>}
            </button>
            <style>{`
                @keyframes pulse {
                    50% {
                        box-shadow: 0 0 0 10px rgba(34, 211, 238, 0.3), 0 0 0 0 rgba(34, 211, 238, 0);
                    }
                }
            `}</style>
        </>
    );
};

export default ChatAssistant;