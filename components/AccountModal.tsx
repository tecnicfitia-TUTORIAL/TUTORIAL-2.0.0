
import React from 'react';
import { AuthUser, UserRole } from '../types';
import { CheckCircleIcon } from './icons';

interface AccountModalProps {
    user: AuthUser;
    onClose: () => void;
    onPlanChange: (newRole: UserRole) => void;
}

interface PlanCardProps {
    title: UserRole;
    description: string;
    features: string[];
    isCurrentPlan: boolean;
    onSelectPlan: () => void;
    price?: string;
    isPremium?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ title, description, features, isCurrentPlan, onSelectPlan, price, isPremium = false }) => (
    <div className={`border-2 rounded-lg p-6 flex flex-col ${isCurrentPlan ? 'border-cyan-500 bg-gray-900' : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'} transition-all`}>
        <h3 className={`text-xl font-bold ${isPremium ? 'text-cyan-400' : 'text-white'}`}>{title}</h3>
        <p className="text-gray-400 text-sm mb-4 h-10">{description}</p>
        
        {price && <p className="text-3xl font-bold text-white mb-4">{price}<span className="text-sm font-normal text-gray-400">/mes</span></p>}
        
        <ul className="space-y-2 mb-6 text-gray-300 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-cyan-400 mr-2 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        
        <button
            onClick={onSelectPlan}
            disabled={isCurrentPlan}
            className={`w-full mt-auto font-bold py-2 px-4 rounded-lg transition duration-300 ${isCurrentPlan ? 'bg-cyan-600 text-white cursor-default' : isPremium ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
        >
            {isCurrentPlan ? 'Plan Actual' : `Cambiar a ${title}`}
        </button>
    </div>
);


export const AccountModal: React.FC<AccountModalProps> = ({ user, onClose, onPlanChange }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-6xl m-4 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="text-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">Gestiona tu Plan</h2>
                    <p className="text-gray-400 mt-2">
                        Tu plan actual: <span className="font-semibold text-cyan-400">{user.role}</span>
                    </p>
                    <p className="text-gray-400">
                        Generaciones restantes: <span className="font-semibold text-cyan-400">{user.remainingGenerations === Infinity ? '∞' : user.remainingGenerations}</span>
                    </p>
                </div>
                
                <p className="text-gray-400 text-center mb-8">Elige el plan que mejor se adapte a tus necesidades.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <PlanCard
                        title={UserRole.BASIC}
                        description="Ideal para empezar y para tareas ocasionales."
                        price="Gratis"
                        features={["3 Generaciones IA", "Generación por texto", "Acceso a guías públicas"]}
                        isCurrentPlan={user.role === UserRole.BASIC}
                        onSelectPlan={() => onPlanChange(UserRole.BASIC)}
                    />
                     <PlanCard
                        title={UserRole.STANDARD}
                        description="Para usuarios regulares que necesitan más potencia."
                        price="1€"
                        isPremium
                        features={["20 Generaciones IA/mes", "Análisis de tareas con imágenes", "Historial de tareas"]}
                        isCurrentPlan={user.role === UserRole.STANDARD}
                        onSelectPlan={() => onPlanChange(UserRole.STANDARD)}
                    />
                    <PlanCard
                        title={UserRole.PRO}
                        description="Potencia ilimitada para usuarios frecuentes y profesionales."
                        price="5€"
                        isPremium
                        features={["Generaciones IA Ilimitadas", "Análisis con imagen y vídeo", "Soporte prioritario"]}
                        isCurrentPlan={user.role === UserRole.PRO}
                        onSelectPlan={() => onPlanChange(UserRole.PRO)}
                    />
                    <PlanCard
                        title={UserRole.COLLABORATOR}
                        description="Aporta tu experiencia y ayuda a otros. Obtén beneficios exclusivos."
                        price="10€"
                        isPremium
                        features={["Publica guías con vídeo/imagen", "Generaciones IA Ilimitadas", "Análisis con imagen y vídeo"]}
                        isCurrentPlan={user.role === UserRole.COLLABORATOR}
                        onSelectPlan={() => onPlanChange(UserRole.COLLABORATOR)}
                    />
                </div>
            </div>
        </div>
    );
};
