
import React, { useState, useMemo } from 'react';
import { GeneratedProcess, GuideStatus, TaskPriority } from '../types';
import { ProcessOutput } from './ProcessOutput';
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon, TrashIcon, SearchIcon } from './icons';

interface AdminViewProps {
  allGuides: GeneratedProcess[];
  onApprove: (id: number) => void;
  onRejectWithFeedback: (id: number, feedback: string) => void;
  onDelete: (id: number) => void;
}

type AdminTab = 'pending' | 'approved' | 'rejected';

const FeedbackModal: React.FC<{
    guideTitle: string;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
}> = ({ guideTitle, onClose, onSubmit }) => {
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(feedback);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">Añadir Comentario de Rechazo</h3>
                <p className="text-sm text-gray-400 mb-4">Rechazando la guía: <span className="font-semibold text-cyan-400">{guideTitle}</span></p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                        placeholder="Ej: La guía es demasiado breve, por favor añade más detalles en los pasos..."
                        required
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Confirmar Rechazo</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; count: number; Icon: React.ElementType; colorClass: string }> = ({ title, count, Icon, colorClass }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-700">
        <div className={`p-3 rounded-full bg-gray-900 ${colorClass}`}>
            <Icon className="h-6 w-6 text-white"/>
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{count}</p>
            <p className="text-sm text-gray-400">{title}</p>
        </div>
    </div>
);

const GuideCard: React.FC<{
    guide: GeneratedProcess;
    onSelect: () => void;
    actions: React.ReactNode;
}> = ({ guide, onSelect, actions }) => (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-grow">
            <p className="font-bold text-white">{guide.taskTitle}</p>
            <div className="text-xs text-gray-400 flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                <span>Autor: <span className="font-semibold text-purple-400">{guide.author}</span></span>
                <span>Prioridad: <span className="font-semibold text-cyan-400">{guide.priority}</span></span>
                <span>Fecha: <span className="font-semibold text-gray-300">{new Date(guide.id).toLocaleDateString()}</span></span>
            </div>
             {guide.status === GuideStatus.REJECTED && guide.moderatorFeedback && (
                <div className="mt-2 text-xs bg-yellow-900/50 border-l-2 border-yellow-500 p-2 rounded-r-md">
                    <p className="font-semibold text-yellow-400">Comentario del moderador:</p>
                    <p className="text-yellow-200 italic">"{guide.moderatorFeedback}"</p>
                </div>
            )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <button onClick={onSelect} className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors">
                Revisar
            </button>
            {actions}
        </div>
    </div>
);


export const AdminView: React.FC<AdminViewProps> = ({ allGuides, onApprove, onRejectWithFeedback, onDelete }) => {
    const [selectedGuide, setSelectedGuide] = useState<GeneratedProcess | null>(null);
    const [activeTab, setActiveTab] = useState<AdminTab>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [guideToReject, setGuideToReject] = useState<GeneratedProcess | null>(null);

    const stats = useMemo(() => ({
        pending: allGuides.filter(g => g.status === GuideStatus.PENDING).length,
        approved: allGuides.filter(g => g.status === GuideStatus.APPROVED).length,
        rejected: allGuides.filter(g => g.status === GuideStatus.REJECTED).length,
    }), [allGuides]);

    const filteredGuides = useMemo(() => {
        const statusMap: Record<AdminTab, GuideStatus> = {
            pending: GuideStatus.PENDING,
            approved: GuideStatus.APPROVED,
            rejected: GuideStatus.REJECTED,
        };
        const currentStatus = statusMap[activeTab];
        return allGuides
            .filter(g => g.status === currentStatus)
            .filter(g => g.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allGuides, activeTab, searchTerm]);

    const handleRejectSubmit = (feedback: string) => {
        if (guideToReject) {
            onRejectWithFeedback(guideToReject.id, feedback);
            setGuideToReject(null);
            setSelectedGuide(null); // Also close detail view if open
        }
    };

    if (selectedGuide) {
        return (
             <div className="space-y-6">
                <button onClick={() => setSelectedGuide(null)} className="text-cyan-400 hover:underline">
                    &larr; Volver al panel de moderación
                </button>
                <div className="border-t-4 border-cyan-500 pt-4">
                    <ProcessOutput process={selectedGuide} isLoading={false} error={null} />
                </div>
                 <div className="flex justify-end items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-300 font-semibold mr-auto">Acciones de Moderación</span>
                    {selectedGuide.status !== GuideStatus.APPROVED && (
                        <button onClick={() => { onApprove(selectedGuide.id); setSelectedGuide(null); }} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5"/>Aprobar
                        </button>
                    )}
                    {selectedGuide.status !== GuideStatus.REJECTED && (
                        <button onClick={() => setGuideToReject(selectedGuide)} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                             <XCircleIcon className="w-5 h-5"/>Rechazar
                        </button>
                    )}
                     <button onClick={() => { onDelete(selectedGuide.id); setSelectedGuide(null); }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                         <TrashIcon className="w-5 h-5"/>Eliminar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg shadow-xl border border-gray-700 space-y-6">
            {guideToReject && (
                <FeedbackModal
                    guideTitle={guideToReject.taskTitle}
                    onClose={() => setGuideToReject(null)}
                    onSubmit={handleRejectSubmit}
                />
            )}
            <div>
                <h2 className="text-2xl font-bold text-cyan-400">Panel de Administración</h2>
                <p className="text-gray-400">Gestiona y modera las guías de la comunidad.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Pendientes de Revisión" count={stats.pending} Icon={AlertTriangleIcon} colorClass="text-yellow-400" />
                <StatCard title="Guías Aprobadas" count={stats.approved} Icon={CheckCircleIcon} colorClass="text-green-400" />
                <StatCard title="Guías Rechazadas" count={stats.rejected} Icon={XCircleIcon} colorClass="text-red-400" />
            </div>

            <div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('pending')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}>Pendientes</button>
                            <button onClick={() => setActiveTab('approved')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}>Aprobadas</button>
                            <button onClick={() => setActiveTab('rejected')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}>Rechazadas</button>
                        </nav>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar en guías..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 bg-gray-800 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                {filteredGuides.length > 0 ? (
                    <div className="space-y-4">
                        {filteredGuides.map(guide => (
                            <GuideCard 
                                key={guide.id}
                                guide={guide}
                                onSelect={() => setSelectedGuide(guide)}
                                actions={
                                    <div className="flex items-center gap-2">
                                        {activeTab !== 'approved' && (
                                            <button onClick={() => onApprove(guide.id)} className="bg-green-600/20 hover:bg-green-500/30 text-green-300 text-xs font-bold p-2 rounded-lg transition-colors" title="Aprobar"><CheckCircleIcon className="w-4 h-4"/></button>
                                        )}
                                         {activeTab !== 'rejected' && (
                                            <button onClick={() => setGuideToReject(guide)} className="bg-yellow-600/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-bold p-2 rounded-lg transition-colors" title="Rechazar"><XCircleIcon className="w-4 h-4"/></button>
                                        )}
                                        {activeTab !== 'pending' && (
                                            <button onClick={() => onDelete(guide.id)} className="bg-red-600/20 hover:bg-red-500/30 text-red-400 text-xs font-bold p-2 rounded-lg transition-colors" title="Eliminar"><TrashIcon className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                         <SearchIcon className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300">No se encontraron guías</h3>
                        <p>No hay guías que coincidan con el estado y la búsqueda actuales.</p>
                    </div>
                )}
            </div>
        </div>
    );
};