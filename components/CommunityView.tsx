import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedProcess, TaskCategory, TaskPriority } from '../types';
import * as apiService from '../services/apiService';
import { SpinnerIcon, SearchIcon, HomeIcon, CarIcon, CodeBracketIcon, SparklesIcon, QuestionMarkCircleIcon } from './icons';
import { PricingPlans } from './PricingPlans';
import { AuthView } from './LoginModal';

interface CommunityViewProps {
    onSelectGuide: (guide: GeneratedProcess) => void;
    onAuthRequest: (view: AuthView) => void;
}

const categoryIcons: { [key in TaskCategory]: React.ElementType } = {
    [TaskCategory.HOME]: HomeIcon,
    [TaskCategory.AUTOMOTIVE]: CarIcon,
    [TaskCategory.TECHNOLOGY]: CodeBracketIcon,
    [TaskCategory.CRAFTS]: SparklesIcon,
    [TaskCategory.OTHER]: QuestionMarkCircleIcon,
};

const GuideCard: React.FC<{ guide: GeneratedProcess, onSelect: () => void }> = ({ guide, onSelect }) => {
    const CategoryIcon = categoryIcons[guide.category] || QuestionMarkCircleIcon;
    
    const authorText = guide.author === 'IA' ? 'IA' : 'Comunidad';
    const authorColor = guide.author === 'IA' ? 'bg-cyan-900 text-cyan-300' : 'bg-purple-900 text-purple-300';

    const priorityColorMap: { [key in TaskPriority]?: string } = {
        [TaskPriority.HIGH]: 'bg-red-900 text-red-300',
        [TaskPriority.MEDIUM]: 'bg-yellow-900 text-yellow-300',
        [TaskPriority.LOW]: 'bg-green-900 text-green-300',
    };
    const priorityColor = priorityColorMap[guide.priority] || 'bg-gray-900 text-gray-300';
    
    return (
        <div 
            className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col hover:border-cyan-500 hover:shadow-lg transition-all cursor-pointer group"
            onClick={onSelect}
        >
            <div className="flex-grow">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">{guide.taskTitle}</h3>
                    <span className="flex-shrink-0 flex items-center text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded-md border border-gray-700">
                        <CategoryIcon className="w-4 h-4 mr-1.5" />
                        {guide.category}
                    </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                    {guide.steps[0]?.description || 'Guía creada por la comunidad.'}
                </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center text-xs">
                <span className={`px-2 py-0.5 font-semibold rounded-full ${authorColor}`}>{authorText}</span>
                <span className={`px-2 py-0.5 font-semibold rounded-full ${priorityColor}`}>{guide.priority}</span>
            </div>
        </div>
    );
};

const CommunityView: React.FC<CommunityViewProps> = ({ onSelectGuide, onAuthRequest }) => {
    const [guides, setGuides] = useState<GeneratedProcess[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                setStatus('loading');
                const allGuides = await apiService.getGuides();
                setGuides(allGuides.filter(g => g.status === 'Aprobada'));
                setStatus('ready');
            } catch (error) {
                console.error(error);
                setStatus('error');
            }
        };
        fetchGuides();
    }, []);

    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const matchesSearch = guide.taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [guides, searchTerm, selectedCategory]);

    if (status === 'loading') {
        return <div className="flex justify-center items-center p-16"><SpinnerIcon className="w-12 h-12 text-cyan-500" /></div>;
    }

    if (status === 'error') {
        return <div className="text-center p-16 text-red-400">Error al cargar las guías de la comunidad.</div>;
    }

    return (
        <div>
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl uppercase">
                    Encuentra. Aprende. Haz.
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                    Busca en nuestra base de datos de guías creadas por la comunidad y por nuestra IA, o <button onClick={() => onAuthRequest('register')} className="text-cyan-400 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">únete a la comunidad</button> para generar las tuyas.
                </p>
            </div>

            {/* Filters */}
             <div className="mb-8">
                 <div className="relative flex-grow max-w-xl mx-auto mb-8">
                    <input
                        type="text"
                        placeholder="Busca una tarea, ej: cambiar aceite de coche..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 pl-12 pr-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-bold text-white">Explora Guías de la Comunidad</h3>
                    <p className="text-gray-500 mt-1">Filtra por categoría o usa la búsqueda para encontrar lo que necesitas.</p>
                </div>
                
                <div className="flex justify-center flex-wrap gap-2 mt-6">
                    {(['all', ...Object.values(TaskCategory)] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {cat === 'all' ? 'Todas' : cat}
                        </button>
                    ))}
                </div>
            </div>


            {/* Grid */}
            {filteredGuides.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGuides.map(guide => (
                        <GuideCard key={guide.id} guide={guide} onSelect={() => onSelectGuide(guide)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <p className="font-semibold text-lg">No se encontraron guías</p>
                    <p>Intenta ajustar tu búsqueda o filtro.</p>
                </div>
            )}

            <PricingPlans />
        </div>
    );
};

export default CommunityView;