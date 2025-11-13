import React, { useState } from 'react';
import { AlertTriangleIcon, SpinnerIcon } from './icons';

interface VerificationBannerProps {
    onResend: () => Promise<void>;
    message: string | null;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({ onResend, message }) => {
    const [isSending, setIsSending] = useState(false);

    const handleResendClick = async () => {
        setIsSending(true);
        await onResend();
        setIsSending(false);
    };

    return (
        <div className="bg-yellow-600/20 border-b-2 border-yellow-500 text-yellow-200 text-sm px-4 py-2">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center">
                    <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {message ? (
                        <p className="font-semibold">{message}</p>
                    ) : (
                        <p>
                            Tu cuenta no ha sido verificada. Por favor, revisa tu correo electrónico para completar el registro.
                        </p>
                    )}
                </div>
                <button
                    onClick={handleResendClick}
                    disabled={isSending}
                    className="flex items-center justify-center font-bold whitespace-nowrap bg-yellow-500/20 hover:bg-yellow-500/40 text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isSending ? (
                        <>
                            <SpinnerIcon className="w-4 h-4 mr-2" />
                            Enviando...
                        </>
                    ) : (
                        'Reenviar correo'
                    )}
                </button>
            </div>
        </div>
    );
};