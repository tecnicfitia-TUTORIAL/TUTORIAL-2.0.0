import React, { useState, useEffect } from 'react';
import { getTopContributors } from '../services/apiService';
import { SpinnerIcon, TrophyIcon, ArrowLeftIcon } from './icons';

interface Contributor {
  email: string;
  count: number;
}

interface HallOfFameViewProps {
    onBack: () => void;
}

const HallOfFameView: React.FC<HallOfFameViewProps> = ({ onBack }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      setIsLoading(true);
      try {
        const topContributors = await getTopContributors();
        setContributors(topContributors);
      } catch (error) {
        console.error("Error fetching top contributors:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContributors();
  }, []);
  
  const getTrophyColor = (index: number) => {
      switch (index) {
          case 0: return 'text-yellow-400';
          case 1: return 'text-gray-400';
          case 2: return 'text-yellow-600';
          default: return 'text-gray-500';
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-4">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-colors font-medium"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Volver a la página principal</span>
            </button>
        </div>
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
            <div className="text-center mb-8">
                <TrophyIcon className="h-16 w-16 text-cyan-400 mx-auto mb-4"/>
                <h2 className="text-3xl font-bold text-white">Salón de la Fama</h2>
                <p className="text-gray-400 mt-2">
                    Un reconocimiento a los miembros de la comunidad que más aportan con su conocimiento y experiencia.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center p-16">
                    <SpinnerIcon className="w-12 h-12 text-cyan-500" />
                </div>
            ) : (
                <div className="flow-root">
                    <ul role="list" className="divide-y divide-gray-700">
                        {contributors.map((contributor, index) => (
                            <li key={contributor.email} className="py-4 flex items-center space-x-4">
                               <div className={`w-8 text-center text-2xl font-bold ${getTrophyColor(index)}`}>
                                    {index < 3 ? <TrophyIcon className="w-8 h-8"/> : `#${index + 1}`}
                               </div>
                               <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{contributor.email}</p>
                               </div>
                               <div>
                                    <p className="text-sm font-semibold text-cyan-400">{contributor.count} guías aportadas</p>
                               </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {contributors.length === 0 && !isLoading && (
                 <p className="text-center text-gray-500 py-10">
                    Aún no hay suficientes contribuciones para generar un ranking. ¡Anímate a ser el primero!
                </p>
            )}
        </div>
    </div>
  );
};

export default HallOfFameView;