import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GeneratedProcess, UserRole, TaskCategory, TaskPriority } from '../types';
import { ProcessOutput } from './ProcessOutput';
import { SearchIcon, CheckCircleIcon, ArrowLeftIcon, UserIcon, HomeIcon, CarIcon, CodeBracketIcon, SparklesIcon, QuestionMarkCircleIcon } from './icons';

interface GuestViewProps {
  onLoginClick: () => void;
  publicGuides: GeneratedProcess[];
  onSelectGuide: (id: number) => void;
  selectedGuide: GeneratedProcess | null;
  onClearSelectedGuide: () => void;
  onFeedbackClick: () => void;
}

const categoryIcons: { [key in TaskCategory]: React.ElementType } = {
    [TaskCategory.HOME]: HomeIcon,
    [TaskCategory.AUTOMOTIVE]: CarIcon,
    [TaskCategory.TECHNOLOGY]: CodeBracketIcon,
    [TaskCategory.CRAFTS]: SparklesIcon,
    [TaskCategory.OTHER]: QuestionMarkCircleIcon,
};

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const styles = {
      [TaskPriority.HIGH]: 'bg-red-400/10 text-red-400 ring-red-400/20',
      [TaskPriority.MEDIUM]: 'bg-yellow-400/10 text-yellow-300 ring-yellow-400/30',
      [TaskPriority.LOW]: 'bg-green-400/10 text-green-300 ring-green-400/30',
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[priority]}`}>{priority}</span>;
};

const GuideCard: React.FC<{ guide: GeneratedProcess; onSelect: () => void; }> = ({ guide, onSelect }) => {
    const CategoryIcon = categoryIcons[guide.category] || QuestionMarkCircleIcon;
    const authorIsIA = guide.author === 'IA';
    return (
        <button onClick={onSelect} className="w-full text-left bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col hover:border-cyan-500 hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-lg">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <p className="font-bold text-white pr-2">{guide.taskTitle}</p>
                    <CategoryIcon className="w-6 h-6 text-gray-500 flex-shrink-0"/>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 font-medium ring-1 ring-inset ${authorIsIA ? 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/20' : 'bg-purple-400/10 text-purple-400 ring-purple-400/20'}`}>
                    {authorIsIA ? 'IA' : 'Comunidad'}
                </span>
                <PriorityBadge priority={guide.priority} />
            </div>
        </button>
    );
};


export const GuestView: React.FC<GuestViewProps> = ({ onLoginClick, publicGuides, onSelectGuide, selectedGuide, onClearSelectedGuide, onFeedbackClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const guideViewerRef = useRef<HTMLDivElement>(null);

  const filteredGuides = useMemo(() => {
    return publicGuides
      .filter(guide => activeCategory === 'all' || guide.category === activeCategory)
      .filter(guide => guide.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, publicGuides, activeCategory]);

  useEffect(() => {
    if (selectedGuide && guideViewerRef.current) {
      guideViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedGuide]);
  
  if (selectedGuide) {
    return (
      <div ref={guideViewerRef} className="space-y-6 animate-fade-in">
        <button 
            onClick={onClearSelectedGuide} 
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
            aria-label="Volver a la búsqueda"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Explorar Guías
        </button>
        <ProcessOutput process={selectedGuide} isLoading={false} error={null} />
      </div>
    );
  }

  const allCategories = ['all', ...Object.values(TaskCategory)];

  return (
    <div className="space-y-16">
        {/* Hero Section */}
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 flex flex-col justify-center items-center text-center">
            <div className="w-full">
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                    TUTORIAL 2.0
                </h2>
                <p className="text-cyan-300 text-xl lg:text-2xl font-semibold mb-6">
                    ENCUENTRA. APRENDE. HAZ.
                </p>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                    Busca en nuestra base de datos de guías creadas por la comunidad y por nuestra IA, o <button onClick={onLoginClick} className="text-cyan-400 hover:underline font-semibold">únete a la comunidad</button> para generar las tuyas.
                </p>
                
                <div className="w-full max-w-2xl mt-8 mx-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <input
                            type="search"
                            className="w-full bg-gray-900 border border-gray-600 rounded-full py-3 pl-12 pr-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 placeholder-gray-500"
                            placeholder="Busca una tarea, ej: cambiar aceite de coche..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Community Hub Section */}
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Explora Guías de la Comunidad</h2>
                <p className="text-gray-400 mt-2">Filtra por categoría o usa la búsqueda para encontrar lo que necesitas.</p>
            </div>
            
            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {allCategories.map(category => (
                    <button 
                        key={category}
                        onClick={() => setActiveCategory(category as TaskCategory | 'all')}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeCategory === category ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                        {category === 'all' ? 'Todas' : category}
                    </button>
                ))}
            </div>

            {/* Guides Grid */}
            {filteredGuides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGuides.map(guide => (
                        <GuideCard key={guide.id} guide={guide} onSelect={() => onSelectGuide(guide.id)} />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 text-gray-500">
                     <SearchIcon className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300">No se encontraron guías</h3>
                    <p>Prueba a cambiar los filtros o el término de búsqueda.</p>
                </div>
            )}
        </div>

        <div className="text-center px-4">
            <button onClick={onFeedbackClick} className="text-xl font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors duration-300">
              ¿Tienes una idea para una nueva función o has encontrado algo que podríamos mejorar? ¡Nos encantaría saberlo!
            </button>
        </div>
    </div>
  );
};