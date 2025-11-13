import React from 'react';
import { CheckCircleIcon } from './icons';

interface PricingPlansProps {}

const PlanCard: React.FC<{
    title: string;
    price: string;
    priceDetails: string;
    description: string;
    features: string[];
    isFeatured?: boolean;
}> = ({ title, price, priceDetails, description, features, isFeatured = false }) => {
    const cardClasses = isFeatured
        ? 'bg-gray-800 border-2 border-cyan-500 shadow-cyan-500/20 shadow-2xl relative'
        : 'bg-gray-800 border border-gray-700';

    return (
        <div className={`rounded-xl p-8 flex flex-col ${cardClasses}`}>
            {isFeatured && (
                <div className="absolute top-0 right-0 -mt-3 mr-3">
                    <span className="bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Más Popular</span>
                </div>
            )}
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-2 h-10">{description}</p>
            <div className="mt-6">
                <span className="text-4xl font-extrabold text-white">{price}</span>
                <span className="text-base font-medium text-gray-400">{priceDetails}</span>
            </div>
            <ul role="list" className="mt-8 space-y-3 text-sm flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex space-x-3 items-center">
                        <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-400" aria-hidden="true" />
                        <span className="text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const PricingPlans: React.FC<PricingPlansProps> = () => {
    return (
        <div className="py-16 sm:py-24">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Planes Flexibles para Todos
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                    Elige el plan que mejor se adapte a tus necesidades, desde empezar a explorar hasta potenciar tu productividad al máximo.
                </p>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                <PlanCard
                    title="Nivel Básico"
                    price="Gratis"
                    priceDetails=""
                    description="Ideal para empezar y para tareas ocasionales."
                    features={['10 Generaciones IA', 'Generación por texto', 'Acceso a guías públicas']}
                />
                 <PlanCard
                    title="Equipo"
                    price="15€"
                    priceDetails="/mes"
                    description="Perfecto para pequeños equipos y startups que necesitan colaborar."
                    features={['Para hasta 4 usuarios', '100 Generaciones IA/mes', 'Historial de equipo', 'Colaboración en guías']}
                />
                <PlanCard
                    title="Nivel Pro"
                    price="5€"
                    priceDetails="/mes"
                    description="Potencia ilimitada para usuarios frecuentes y profesionales."
                    features={['Generaciones IA ilimitadas', 'Análisis con imagen y vídeo', 'Soporte prioritario']}
                    isFeatured={true}
                />
                <PlanCard
                    title="Colaborador"
                    price="10€"
                    priceDetails="/mes"
                    description="Aporta tu experiencia y ayuda a otros. Obtén beneficios exclusivos."
                    features={['Publica guías con vídeo/imagen', 'Generaciones IA ilimitadas', 'Análisis con imagen y vídeo']}
                />
            </div>
        </div>
    );
};