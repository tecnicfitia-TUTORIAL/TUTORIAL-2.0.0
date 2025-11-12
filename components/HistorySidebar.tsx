import React, { useState } from 'react';
import { GeneratedProcess, TaskPriority } from '../types';
import { HistoryIcon, TrashIcon, SearchIcon } from './icons';

interface HistorySidebarProps {
  history: GeneratedProcess[];
  onSelectItem: (id: number) => void;
  onClearHistory: () => void;
  activeTaskId: number | null;
}

const getPriorityClass = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 'bg-red-500';
    case TaskPriority.MEDIUM:
      return 'bg-yellow-500';
    case TaskPriority.LOW:
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelectItem, onClearHistory, activeTaskId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item =>
    item.taskTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <HistoryIcon className="h-6 w-6 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Historial de Tareas</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded"
            aria-label="Limpiar historial"
            title="Limpiar historial"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Buscar en historial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      <div className="flex-grow overflow-y-auto">
        {filteredHistory.length > 0 ? (
          <ul className="space-y-2">
            {filteredHistory.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelectItem(item.id)}
                  className={`w-full text-left p-3 rounded-md transition-colors text-sm flex items-center justify-between ${
                    activeTaskId === item.id
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <span className="truncate pr-2">{item.taskTitle}</span>
                  {item.priority && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getPriorityClass(item.priority)}`} title={`Prioridad: ${item.priority}`}></span>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">
            {history.length > 0 ? 'No se encontraron resultados.' : 'No hay tareas en tu historial. ¡Genera una para empezar!'}
          </p>
        )}
      </div>
    </div>
  );
};