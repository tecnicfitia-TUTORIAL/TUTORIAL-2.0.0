
import React, { useState } from 'react';
import { GeneratedProcess, ProcessStep, TaskPriority } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, LinkIcon, ToolIcon, WandIcon, ClipboardIcon, UserIcon } from './icons';
import { refineStepDescription } from '../services/geminiService';

interface ProcessOutputProps {
  process: GeneratedProcess | null;
  isLoading: boolean;
  error: string | null;
  onProcessUpdate?: (updatedProcess: GeneratedProcess) => void;
}

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const LoadingSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
        <div className="space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
        </div>
        <div className="space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>
    </div>
);

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const styles = {
      [TaskPriority.HIGH]: 'bg-red-400/10 text-red-400 ring-red-400/20',
      [TaskPriority.MEDIUM]: 'bg-yellow-400/10 text-yellow-300 ring-yellow-400/30',
      [TaskPriority.LOW]: 'bg-green-400/10 text-green-300 ring-green-400/30',
    };
    const priorityStyle = styles[priority] || 'bg-gray-400/10 text-gray-300 ring-gray-400/20';
  
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${priorityStyle}`}>
        Prioridad: {priority}
      </span>
    );
};

const AuthorChip: React.FC<{ author: 'IA' | 'Colaborador' }> = ({ author }) => {
    const isIA = author === 'IA';
    return (
        <span className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isIA ? 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/20' : 'bg-purple-400/10 text-purple-400 ring-purple-400/20'}`}>
            {isIA ? 'Generado por IA' : <><UserIcon className="h-3 w-3"/> Aportado por Colaborador</>}
        </span>
    );
}

export const ProcessOutput: React.FC<ProcessOutputProps> = ({ process, isLoading, error, onProcessUpdate }) => {
  const [refiningStep, setRefiningStep] = useState<number | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [copiedStepNumber, setCopiedStepNumber] = useState<number | null>(null);
  const [isAllCopied, setIsAllCopied] = useState<boolean>(false);
  const [isSafetyVisible, setIsSafetyVisible] = useState(false);

  const handleCopyToClipboard = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStepNumber(stepNumber);
      setTimeout(() => {
        setCopiedStepNumber(null);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleCopyAll = () => {
    if (!process) return;

    const sections = [];
    sections.push(process.taskTitle);

    if (process.safetyWarnings && process.safetyWarnings.length > 0) {
        sections.push("\n⚠️ Medidas de Seguridad y EPIs:\n" + process.safetyWarnings.map(w => `- ${w}`).join("\n"));
    }

    if (process.requiredTools && process.requiredTools.length > 0) {
        sections.push("\n🛠️ Herramientas y Materiales:\n" + process.requiredTools.map(t => `- ${t}`).join("\n"));
    }

    if (process.steps && process.steps.length > 0) {
        sections.push("\n📝 Pasos a seguir:\n" + process.steps.map(s => `${s.stepNumber}. ${s.title}\n   ${s.description}`).join("\n\n"));
    }

    if (process.onlineResources && process.onlineResources.length > 0) {
        sections.push("\n🔗 Recursos Adicionales:\n" + process.onlineResources.map(r => `- ${r.title}: ${r.url}`).join("\n"));
    }
    
    if (process.groundingSources && process.groundingSources.length > 0) {
        sections.push("\n📚 Fuentes de Información:\n" + process.groundingSources.map(r => `- ${r.title}: ${r.url}`).join("\n"));
    }

    const fullText = sections.join("\n");
    
    navigator.clipboard.writeText(fullText).then(() => {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2500);
    }).catch(err => {
        console.error('Failed to copy all text: ', err);
    });
  };

  const handleRefineStep = async (stepToRefine: ProcessStep) => {
    if (!process || !onProcessUpdate) return;
    setRefiningStep(stepToRefine.stepNumber);
    setRefineError(null);
    try {
        const newDescription = await refineStepDescription(process.taskTitle, stepToRefine);
        
        const updatedSteps = process.steps.map(step => 
            step.stepNumber === stepToRefine.stepNumber 
                ? { ...step, description: newDescription } 
                : step
        );

        const updatedProcess = { ...process, steps: updatedSteps };
        onProcessUpdate(updatedProcess);

    } catch (err) {
        setRefineError("No se pudo refinar este paso. Inténtalo de nuevo.");
        console.error(err);
    } finally {
        setRefiningStep(null);
    }
  };

  if (isLoading) {
    return <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 min-h-[400px]"><LoadingSkeleton /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg flex items-start space-x-4">
        <AlertTriangleIcon className="h-8 w-8 text-red-400 flex-shrink-0 mt-1" />
        <div>
            <h3 className="font-bold text-lg text-red-200">Error al generar el proceso</h3>
            <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 flex flex-col items-center justify-center min-h-[400px] text-center text-gray-400">
        <CheckCircleIcon className="h-16 w-16 text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-300">Listo para tus tareas</h2>
        <p className="max-w-md">Usa el formulario para generar una guía o busca en las guías de la comunidad.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl border border-gray-700">
      <div className="mb-6 pb-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h2 className="text-3xl font-bold text-cyan-400 flex-1">{process.taskTitle}</h2>
            <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                <button 
                    onClick={handleCopyAll}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                    aria-label="Copiar toda la guía"
                >
                    {isAllCopied ? (
                        <>
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                            <span>¡Copiado!</span>
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4" />
                            <span>Copiar Todo</span>
                        </>
                    )}
                </button>
                <div className="flex items-center gap-2 self-start sm:self-end">
                  {process.priority && <PriorityBadge priority={process.priority} />}
                  {process.author && <AuthorChip author={process.author} />}
                </div>
            </div>
        </div>
      </div>

      {process.requiredTools && process.requiredTools.length > 0 && (
        <div className="mb-6">
          <h3 className="flex items-center text-lg font-bold text-gray-300 mb-3">
            <ToolIcon className="h-6 w-6 mr-2 text-cyan-400" />
            Herramientas y Materiales
          </h3>
          <div className="flex flex-wrap gap-2">
            {process.requiredTools.map((tool, index) => (
                <span key={index} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">{tool}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-300 mb-4">Pasos a seguir</h3>
        <ol className="relative border-l border-gray-600 space-y-8">
          {process.steps.map((step) => (
            <li key={step.stepNumber} className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-cyan-800 text-cyan-300 rounded-full -left-4 ring-4 ring-gray-800">
                    {step.stepNumber}
                </span>
                <div className="ml-4">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="text-lg font-semibold text-gray-100 flex-1">{step.title}</h4>
                        {onProcessUpdate && (
                            <button
                                onClick={() => handleRefineStep(step)}
                                disabled={refiningStep !== null}
                                className="flex items-center text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-wait transition-colors flex-shrink-0"
                                title="Refinar este paso con IA"
                            >
                                {refiningStep === step.stepNumber ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-300"></div>
                                ) : (
                                    <>
                                        <WandIcon className="h-4 w-4 mr-1" />
                                        <span>Refinar</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <p className="text-gray-400 flex-grow">{step.description}</p>
                      <button
                        onClick={() => handleCopyToClipboard(step.description, step.stepNumber)}
                        className="p-1 text-gray-500 hover:text-cyan-400 transition-colors rounded-md flex-shrink-0"
                        title="Copiar descripción"
                        aria-label="Copiar descripción del paso"
                      >
                        {copiedStepNumber === step.stepNumber ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <ClipboardIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    
                    {step.stepNumber === 1 && process.safetyWarnings && process.safetyWarnings.length > 0 && (
                        <div className="mt-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                            <button onClick={() => setIsSafetyVisible(!isSafetyVisible)} className="w-full flex justify-between items-center p-3 text-left font-semibold text-yellow-400">
                                <span className="flex items-center">
                                    <AlertTriangleIcon className="h-5 w-5 mr-2" />
                                    Medidas de Seguridad y EPIs
                                </span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isSafetyVisible ? 'rotate-180' : ''}`} />
                            </button>
                            {isSafetyVisible && (
                                <div className="p-3 border-t border-gray-700">
                                    <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm">
                                        {process.safetyWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {(step.imageUrl || step.videoUrl) && (
                        <div className="mt-4">
                            {step.imageUrl && <img src={step.imageUrl} alt={`Visual para ${step.title}`} className="rounded-lg max-h-60 w-auto" />}
                            {step.videoUrl && (
                                <video controls src={step.videoUrl} className="rounded-lg max-h-60 w-auto">
                                    Tu navegador no soporta el tag de vídeo.
                                </video>
                            )}
                        </div>
                    )}
                </div>
            </li>
          ))}
        </ol>
      </div>
      
      {refineError && <p className="text-red-400 text-sm mt-4 text-center">{refineError}</p>}

      {process.onlineResources && process.onlineResources.length > 0 && (
        <div className="mb-8">
          <h3 className="flex items-center text-lg font-bold text-gray-300 mb-3">
            <LinkIcon className="h-6 w-6 mr-2 text-cyan-400" />
            Recursos Adicionales
          </h3>
          <ul className="space-y-2">
            {process.onlineResources.map((resource, index) => (
              <li key={index}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 hover:underline transition duration-200">
                  {resource.title}
                  <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {process.groundingSources && process.groundingSources.length > 0 && process.author === 'IA' && (
        <div className="pt-6 border-t border-gray-700">
          <h3 className="flex items-center text-lg font-bold text-gray-300 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg>
            Fuentes de Información
          </h3>
          <ul className="space-y-2">
            {process.groundingSources.map((source, index) => (
              <li key={index}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition duration-200">
                  {source.title}
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};