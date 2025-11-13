import React from 'react';
import { AuthUser, UserRole } from '../types';
import { XCircleIcon, CheckCircleIcon } from './icons';

interface ManagePlanModalProps {
  user: AuthUser;
  onClose: () => void;
  onChangePlan: (newRole: UserRole) => void;
}

const plans = [
    {
        role: UserRole.BASIC,
        title: 'Nivel Básico',
        price: 'Gratis',
        priceSuffix: '/mes',
        description: 'Ideal para empezar y para tareas ocasionales.',
        features: ['3 Generaciones IA', 'Generación por texto', 'Acceso a guías públicas'],
    },
    {
        role: UserRole.STANDARD,
        title: 'Estándar',
        price: '1€',
        priceSuffix: '/mes',
        description: 'Para usuarios regulares que necesitan más potencia.',
        features: ['20 Generaciones IA/mes', 'Análisis de tareas con imágenes', 'Historial de tareas'],
    },
    {
        role: UserRole.PRO,
        title: 'Nivel Pro',
        price: '5€',
        priceSuffix: '/mes',
        description: 'Potencia ilimitada para usuarios frecuentes y profesionales.',
        features: ['Generaciones IA ilimitadas', 'Análisis con imagen y vídeo', 'Soporte prioritario'],
        isFeatured: true,
    },
    {
        role: UserRole.COLLABORATOR,
        title: 'Colaborador',
        price: '10€',
        priceSuffix: '/mes',
        description: 'Aporta tu experiencia y ayuda a otros. Obtén beneficios exclusivos.',
        features: ['Publica guías con vídeo/imagen', 'Generaciones IA ilimitadas', 'Análisis con imagen y vídeo'],
    },
];

const PlanCard: React.FC<{
    plan: typeof plans[0];
    isCurrentPlan: boolean;
    onChangePlan: (newRole: UserRole) => void;
}> = ({ plan, isCurrentPlan, onChangePlan }) => {
    
    let buttonContent;
    if (isCurrentPlan) {
        buttonContent = <button disabled className="w-full font-bold py-2 px-4 rounded-lg bg-cyan-600 text-white cursor-default">Plan Actual</button>;
    } else {
        buttonContent = (
            <button 
                onClick={() => onChangePlan(plan.role)}
                className="w-full font-bold py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
            >
                Actualizar a {plan.title}
            </button>
        );
         if(plan.role === UserRole.BASIC){
             buttonContent = (
                <button 
                    onClick={() => onChangePlan(plan.role)}
                    className="w-full font-bold py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
                >
                    Actualizar a Nivel Básico
                </button>
            );
         }
    }


    const cardClasses = isCurrentPlan
        ? 'bg-gray-800/80 border-2 border-cyan-500 shadow-cyan-500/20 shadow-lg'
        : 'bg-gray-800/80 border border-gray-700';

    return (
        <div className={`rounded-xl p-6 flex flex-col ${cardClasses}`}>
            <h3 className="text-lg font-bold text-white">{plan.title}</h3>
            <p className="text-sm text-gray-400 mt-1 h-12">{plan.description}</p>
            <div className="mt-4">
                <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                <span className="text-base font-medium text-gray-400">{plan.priceSuffix}</span>
            </div>
            <ul role="list" className="mt-6 space-y-3 text-sm flex-grow">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex space-x-3 items-center">
                        <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-400" aria-hidden="true" />
                        <span className="text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-6">
                {buttonContent}
            </div>
        </div>
    );
};


const ManagePlanModal: React.FC<ManagePlanModalProps> = ({ user, onClose, onChangePlan }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl p-8 w-full max-w-5xl m-4 relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <XCircleIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Gestiona tu Plan</h2>
                    <p className="text-gray-400 mt-2">
                        Tu plan actual: <span className="font-semibold text-cyan-400">{user.role}</span> | Generaciones restantes: <span className="font-semibold text-cyan-400">{user.remainingGenerations === Infinity ? '∞' : user.remainingGenerations}</span>
                    </p>
                    <p className="text-gray-500 mt-4 text-sm">Elige el plan que mejor se adapte a tus necesidades.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map(plan => (
                        <PlanCard 
                            key={plan.role}
                            plan={plan}
                            isCurrentPlan={user.role === plan.role}
                            onChangePlan={onChangePlan}
                        />
                    ))}
                </div>
                <p className="text-center text-xs text-gray-600 mt-8">
                    Los pagos son procesados de forma segura por nuestro proveedor externo. No almacenamos los datos de tu tarjeta.
                </p>
            </div>
        </div>
    );
};

export default ManagePlanModal;