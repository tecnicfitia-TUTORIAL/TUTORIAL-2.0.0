
import React from 'react';
import { TrophyIcon, UserIcon, ArrowLeftIcon } from './icons';

interface HallOfFameViewProps {
  topContributors: { email: string; count: number }[];
  onBack: () => void;
}

const Medal: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 0) return <span className="text-yellow-400" title="Oro">🥇</span>;
    if (rank === 1) return <span className="text-gray-300" title="Plata">🥈</span>;
    if (rank === 2) return <span className="text-yellow-600" title="Bronce">🥉</span>;
    return null;
}

const anonymizeEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (!domain) return 'Anónimo'; // Handle cases with no @
    const anonymizedLocal = `${localPart.substring(0, 3)}***`;
    return `${anonymizedLocal}@${domain}`;
};

export const HallOfFameView: React.FC<HallOfFameViewProps> = ({ topContributors, onBack }) => {
  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <button 
                onClick={onBack} 
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
                aria-label="Volver al inicio"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver al inicio
            </button>
        </div>
        
        <div className="text-center">
            <TrophyIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h2 className="text-3xl font-bold text-white mt-4">Muro de la Fama de la Comunidad</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                Reconocemos y celebramos a los colaboradores más activos que enriquecen nuestra base de conocimientos con sus guías expertas.
            </p>
        </div>

        {topContributors.length > 0 ? (
            <div className="max-w-3xl mx-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                <ul className="divide-y divide-gray-700">
                    {topContributors.map((contributor, index) => (
                        <li key={index} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-700 rounded-full">
                                        <UserIcon className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white flex items-center gap-2">
                                            {anonymizeEmail(contributor.email)}
                                            <Medal rank={index} />
                                        </p>
                                        <p className="text-sm text-gray-400">Aportaciones</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-cyan-400">{contributor.count}</p>
                                <p className="text-sm text-gray-500">guías</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        ) : (
            <div className="text-center py-12 text-gray-500">
                <TrophyIcon className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300">Aún no hay contribuciones</h3>
                <p>¡Sé el primero en aparecer aquí! Regístrate como colaborador y comparte tu conocimiento.</p>
            </div>
        )}
    </div>
  );
};
