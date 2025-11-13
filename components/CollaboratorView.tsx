import React, { useState, useRef } from 'react';
import { GeneratedProcess, OnlineResource, ProcessStep, TaskPriority, TaskCategory } from '../types';
import { PlusIcon, TrashIcon, VideoIcon, ImageIcon, AlertTriangleIcon, ToolIcon, LinkIcon, UploadIcon } from './icons';

interface CollaboratorViewProps {
    onContribute: (guide: Omit<GeneratedProcess, 'id' | 'author' | 'status'>) => void;
}

interface CollaboratorStep {
  id: number;
  title: string;
  description: string;
  image?: { name: string; dataUrl: string; };
  video?: { name: string; dataUrl: string; };
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const DynamicListEditor: React.FC<{
    items: string[];
    setItems: React.Dispatch<React.SetStateAction<string[]>>;
    label: string;
    placeholder: string;
    Icon: React.ElementType;
}> = ({ items, setItems, label, placeholder, Icon }) => {
    
    const handleChange = (index: number, value: string) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = value;
            return newItems;
        });
    };

    const addItem = () => setItems(prevItems => [...prevItems, '']);
    const removeItem = (index: number) => setItems(prevItems => prevItems.filter((_, i) => i !== index));

    return (
        <div className="space-y-3">
            <h3 className="flex items-center text-lg font-bold text-gray-300">
                <Icon className="h-6 w-6 mr-2 text-cyan-400" />
                {label}
            </h3>
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => handleChange(index, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                        placeholder={`${placeholder} #${index + 1}`}
                    />
                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-400 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
                </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                <PlusIcon className="w-4 h-4"/> Añadir {placeholder.toLowerCase()}
            </button>
        </div>
    );
};

const CollaboratorView: React.FC<CollaboratorViewProps> = ({ onContribute }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [category, setCategory] = useState<TaskCategory>(TaskCategory.OTHER);
    const [safetyWarnings, setSafetyWarnings] = useState<string[]>([]);
    const [requiredTools, setRequiredTools] = useState<string[]>([]);
    const [steps, setSteps] = useState<CollaboratorStep[]>([{ id: Date.now(), title: '', description: '' }]);
    const [onlineResources, setOnlineResources] = useState<OnlineResource[]>([{ title: '', url: '' }]);
    const [urlErrors, setUrlErrors] = useState<{ [index: number]: string | undefined }>({});
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/i;

    const handleResourceUrlChange = (index: number, value: string) => {
        const newResources = [...onlineResources];
        newResources[index].url = value;
        setOnlineResources(newResources);

        if (value && !urlPattern.test(value)) {
            setUrlErrors(prev => ({ ...prev, [index]: 'Por favor, introduce una URL válida.' }));
        } else {
            setUrlErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
        }
    };

    const handleStepChange = (id: number, field: keyof Omit<CollaboratorStep, 'id' | 'image' | 'video'>, value: string) => {
        setSteps(prev => prev.map(step => step.id === id ? { ...step, [field]: value } : step));
    };

    const addStep = () => setSteps([...steps, { id: Date.now(), title: '', description: '' }]);
    const removeStep = (id: number) => {
        if (steps.length > 1) setSteps(steps.filter(step => step.id !== id));
    };
    
    const handleStepMediaChange = async (e: React.ChangeEvent<HTMLInputElement>, stepId: number, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await fileToDataUrl(file);
                setSteps(prev => prev.map(step => 
                    step.id === stepId ? { ...step, [type]: { name: file.name, dataUrl } } : step
                ));
            } catch (error) {
                console.error("Error procesando archivo:", error);
                alert("Hubo un error al cargar el archivo.");
            }
        }
    };

    const removeStepMedia = (stepId: number, type: 'image' | 'video') => {
        setSteps(prev => prev.map(step => step.id === stepId ? { ...step, [type]: undefined } : step));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hasUrlErrors = Object.values(urlErrors).some(error => !!error);
        if (hasUrlErrors) {
            alert("Por favor, corrige las URLs no válidas antes de enviar.");
            return;
        }

        const finalSteps: ProcessStep[] = steps.map((s, index) => ({
            stepNumber: index + 1,
            title: s.title,
            description: s.description,
            imageUrl: s.image?.dataUrl,
            videoUrl: s.video?.dataUrl,
        }));

        const guideData: Omit<GeneratedProcess, 'id' | 'author' | 'status'> = {
            taskTitle,
            priority,
            category,
            safetyWarnings: safetyWarnings.filter(w => w.trim() !== ''),
            requiredTools: requiredTools.filter(t => t.trim() !== ''),
            steps: finalSteps,
            onlineResources: onlineResources.filter(r => r.title.trim() !== '' && r.url.trim() !== ''),
        };
        onContribute(guideData);
        alert("¡Guía enviada para revisión! Gracias por tu contribución.");
        // Reset form
        setTaskTitle('');
        setPriority(TaskPriority.MEDIUM);
        setCategory(TaskCategory.OTHER);
        setSafetyWarnings([]);
        setRequiredTools([]);
        setSteps([{ id: Date.now(), title: '', description: ''}]);
        setOnlineResources([{ title: '', url: ''}]);
        setUrlErrors({});
    };
    
    const hasUrlErrors = Object.values(urlErrors).some(error => !!error);

  return (
    <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Portal del Colaborador</h2>
        <p className="text-gray-400 mb-8">
            Añade tu propia guía detallada. Incluye advertencias, herramientas, pasos con imágenes y vídeos, y recursos adicionales para ayudar a la comunidad.
        </p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <div>
                <label htmlFor="collab-title" className="block text-sm font-medium text-gray-300 mb-1">Título de la Guía</label>
                <input type="text" id="collab-title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" placeholder="Ej: Limpieza de carburador de motocicleta" required/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prioridad</label>
                  <div className="grid grid-cols-3 gap-2">
                      {Object.values(TaskPriority).map((level) => (
                          <div key={level}>
                              <input type="radio" id={`collab-priority-${level}`} name="collab-priority" value={level} checked={priority === level} onChange={() => setPriority(level)} className="hidden"/>
                              <label htmlFor={`collab-priority-${level}`} className={`block p-2 text-center rounded-md cursor-pointer transition-all duration-200 border-2 text-sm ${ priority === level ? 'bg-cyan-600 border-cyan-500 text-white font-bold' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                  {level}
                              </label>
                          </div>
                      ))}
                  </div>
              </div>
              <div>
                <label htmlFor="collab-category" className="block text-sm font-medium text-gray-300 mb-2">Categoría</label>
                <select id="collab-category" value={category} onChange={e => setCategory(e.target.value as TaskCategory)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 h-[44px]">
                    {Object.values(TaskCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
              </div>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <DynamicListEditor items={safetyWarnings} setItems={setSafetyWarnings} label="Advertencias de Seguridad" placeholder="Advertencia" Icon={AlertTriangleIcon} />
            <DynamicListEditor items={requiredTools} setItems={setRequiredTools} label="Herramientas y Materiales" placeholder="Herramienta" Icon={ToolIcon} />
        </div>

        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Pasos a Seguir</h3>
            {steps.map((step, index) => (
                <div key={step.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4 relative">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-400">Paso {index + 1}</span>
                        {steps.length > 1 && <button type="button" onClick={() => removeStep(step.id)} className="p-1 text-gray-500 hover:text-red-400 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>}
                    </div>
                    <input type="text" value={step.title} onChange={e => handleStepChange(step.id, 'title', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200" placeholder="Título del paso" required/>
                    <textarea value={step.description} onChange={e => handleStepChange(step.id, 'description', e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200" placeholder="Descripción detallada del paso..." required></textarea>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Image Upload */}
                        <div className="space-y-2">
                             <label className="flex items-center text-sm font-medium text-gray-300"><ImageIcon className="w-4 h-4 mr-2"/>Imagen (Opcional)</label>
                             {step.image ? (
                                <div className="relative group">
                                    <img src={step.image.dataUrl} alt="Vista previa" className="w-full h-32 object-cover rounded-md"/>
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => removeStepMedia(step.id, 'image')} className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md"><TrashIcon className="w-4 h-4"/> Quitar</button>
                                    </div>
                                </div>
                             ) : (
                                <button type="button" onClick={() => fileInputRefs.current[`image-${step.id}`]?.click()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-md p-4 text-gray-400 transition-colors">
                                    <UploadIcon className="w-6 h-6"/> Subir Imagen
                                </button>
                             )}
                            <input type="file" ref={el => { if (el) fileInputRefs.current[`image-${step.id}`] = el; }} onChange={e => handleStepMediaChange(e, step.id, 'image')} accept="image/*" className="hidden"/>
                        </div>
                        {/* Video Upload */}
                        <div className="space-y-2">
                             <label className="flex items-center text-sm font-medium text-gray-300"><VideoIcon className="w-4 h-4 mr-2"/>Vídeo (Opcional)</label>
                             {step.video ? (
                                <div className="relative group">
                                    <video src={step.video.dataUrl} className="w-full h-32 object-cover rounded-md bg-black" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => removeStepMedia(step.id, 'video')} className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md"><TrashIcon className="w-4 h-4"/> Quitar</button>
                                    </div>
                                </div>
                             ) : (
                                <button type="button" onClick={() => fileInputRefs.current[`video-${step.id}`]?.click()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-md p-4 text-gray-400 transition-colors">
                                    <UploadIcon className="w-6 h-6"/> Subir Vídeo
                                </button>
                             )}
                            <input type="file" ref={el => { if (el) fileInputRefs.current[`video-${step.id}`] = el; }} onChange={e => handleStepMediaChange(e, step.id, 'video')} accept="video/*" className="hidden"/>
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addStep} className="w-full flex justify-center items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="w-5 h-5"/> Añadir Paso
            </button>
        </div>
        
        <div className="space-y-3">
            <h3 className="flex items-center text-lg font-bold text-gray-300">
                <LinkIcon className="h-6 w-6 mr-2 text-cyan-400" />
                Recursos Adicionales
            </h3>
            {onlineResources.map((resource, index) => (
                <div key={index} className="grid sm:grid-cols-2 gap-2">
                     <input
                        type="text"
                        value={resource.title}
                        onChange={(e) => {
                            const newResources = [...onlineResources];
                            newResources[index].title = e.target.value;
                            setOnlineResources(newResources);
                        }}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                        placeholder={`Título del Recurso #${index + 1}`}
                    />
                    <div className="relative">
                        <input
                            type="url"
                            value={resource.url}
                            onChange={(e) => handleResourceUrlChange(index, e.target.value)}
                            className={`w-full bg-gray-900 border rounded-md p-2 text-gray-200 focus:ring-2 ${urlErrors[index] ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'}`}
                            placeholder={`URL para "${resource.title || `Recurso #${index + 1}`}"`}
                        />
                         {urlErrors[index] && <p className="absolute -bottom-4 left-1 text-red-400 text-xs mt-1">{urlErrors[index]}</p>}
                    </div>
                </div>
            ))}
             <button type="button" onClick={() => setOnlineResources([...onlineResources, {title: '', url: ''}])} className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                <PlusIcon className="w-4 h-4"/> Añadir Recurso
            </button>
        </div>


        <button type="submit" disabled={hasUrlErrors} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 text-lg">
            Enviar Guía para Revisión
        </button>
      </form>
    </div>
  );
};

export default CollaboratorView;