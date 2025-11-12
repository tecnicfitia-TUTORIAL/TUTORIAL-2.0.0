
import React, { useState, useRef } from 'react';
import { TaskComplexity, UserRole, ImageFile, TaskPriority } from '../types';
import { UploadIcon, WandIcon, SpinnerIcon, AlertTriangleIcon } from './icons';
import { describeMedia } from '../services/geminiService';

interface TaskInputFormProps {
  userRole: UserRole;
  onSubmit: (description: string, complexity: TaskComplexity, priority: TaskPriority, image: ImageFile | null) => void;
  isLoading: boolean;
  remainingGenerations: number | typeof Infinity;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

export const TaskInputForm: React.FC<TaskInputFormProps> = ({ userRole, onSubmit, isLoading, remainingGenerations }) => {
  const [description, setDescription] = useState('');
  const [complexity, setComplexity] = useState<TaskComplexity>(TaskComplexity.SIMPLE);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [mediaFile, setMediaFile] = useState<ImageFile | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormError(null); // Clear previous errors
      const base64 = await fileToBase64(file);
      const newMediaFile: ImageFile = { base64, mimeType: file.type, name: file.name };
      setMediaFile(newMediaFile);
      
      setIsProcessingMedia(true);
      try {
        const aiDescription = await describeMedia(newMediaFile);
        setDescription(aiDescription);
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
        setFormError("Error al analizar el archivo multimedia. Inténtalo con otro o describe la tarea manualmente.");
      } finally {
        setIsProcessingMedia(false);
      }
    }
  };

  const isFileUploadDisabled = ![UserRole.PRO, UserRole.COLLABORATOR, UserRole.ADMINISTRATOR].includes(userRole);
  const hasNoGenerationsLeft = remainingGenerations <= 0;
  
  const validateForm = (): boolean => {
    if (description.trim().length < 10) {
        setFormError('La descripción debe tener al menos 10 caracteres.');
        return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm() && !hasNoGenerationsLeft) {
      onSubmit(description, complexity, priority, isFileUploadDisabled ? null : mediaFile);
    }
  };
  
  const triggerFileSelect = () => {
    if (!isFileUploadDisabled) {
      fileInputRef.current?.click();
    }
  };

  const getUploadText = () => {
    if (isFileUploadDisabled) {
      return <p className="text-sm">Actualiza a <span className="font-bold text-cyan-400">Pro</span> para subir imágenes o vídeos.</p>;
    }
    if (isProcessingMedia) {
        const mediaType = mediaFile?.mimeType.startsWith('image') ? 'imagen' : 'vídeo';
        return (
          <div className="flex flex-col items-center justify-center space-y-2">
            <SpinnerIcon className="h-8 w-8 text-cyan-400" />
            <p className="font-semibold text-cyan-400">Analizando {mediaType} con IA...</p>
            <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
          </div>
        );
    }
    if (mediaFile) {
        const mediaType = mediaFile?.mimeType.startsWith('image') ? 'Imagen' : 'Vídeo';
        return <>
            <p className="font-semibold text-cyan-400">{mediaType} seleccionado:</p>
            <p className="text-sm text-gray-300">{mediaFile.name}</p>
        </>;
    }
    return <p>Arrastra y suelta o haz clic para seleccionar</p>;
  }

  const hasDescriptionError = formError?.includes('descripción');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Describe la tarea (o súbela en una imagen/vídeo)
        </label>
        <textarea
          id="description"
          rows={4}
          className={`w-full bg-gray-900 border rounded-md p-3 text-gray-200 focus:ring-2 transition duration-200 placeholder-gray-500 ${
            hasDescriptionError
            ? 'border-red-500 ring-red-500/50 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-600 focus:ring-cyan-500 focus:border-cyan-500'
          }`}
          placeholder="Ej: Necesito cambiar la bombilla de una lámpara de araña antigua..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (e.target.value.trim().length >= 10) {
              if (hasDescriptionError) setFormError(null);
            }
          }}
          required
          aria-invalid={!!formError}
          aria-describedby="form-error"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Prioridad de la Tarea</label>
        <div className="grid grid-cols-3 gap-4">
          {Object.values(TaskPriority).map((level) => (
            <div key={level}>
              <input
                type="radio"
                id={`priority-${level}`}
                name="priority"
                value={level}
                checked={priority === level}
                onChange={() => setPriority(level)}
                className="hidden"
                aria-label={`Prioridad ${level}`}
              />
              <label
                htmlFor={`priority-${level}`}
                className={`block p-3 text-center rounded-md cursor-pointer transition-all duration-200 border-2 ${
                  priority === level
                    ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {level}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Nivel de complejidad</label>
        <div className="grid grid-cols-3 gap-4">
          {Object.values(TaskComplexity).map((level) => (
            <div key={level}>
              <input
                type="radio"
                id={level}
                name="complexity"
                value={level}
                checked={complexity === level}
                onChange={() => setComplexity(level)}
                className="hidden"
              />
              <label
                htmlFor={level}
                className={`block p-3 text-center rounded-md cursor-pointer transition-all duration-200 border-2 ${
                  complexity === level
                    ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {level}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Añadir imagen o vídeo (Opcional - Pro y Colaborador)</label>
        <div
          onClick={triggerFileSelect}
          className={`relative block w-full border-2 ${isFileUploadDisabled ? 'border-gray-600 bg-gray-700 cursor-not-allowed' : 'border-gray-500 border-dashed hover:border-cyan-400 cursor-pointer'} rounded-lg p-8 text-center transition duration-200`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*"
            disabled={isFileUploadDisabled || isProcessingMedia}
          />
          <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
            {!isProcessingMedia && <UploadIcon className="h-10 w-10"/>}
            {getUploadText()}
          </div>
        </div>
      </div>
      
      {formError && (
        <div id="form-error" className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg flex items-center space-x-3 text-sm">
            <AlertTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p>{formError}</p>
        </div>
      )}

      <div className="text-center text-sm text-gray-400">
        Generaciones restantes: <span className="font-bold text-cyan-400">{remainingGenerations === Infinity ? '∞' : remainingGenerations}</span>
      </div>

      {hasNoGenerationsLeft && (
        <div className="text-center bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-3 rounded-lg">
          Has agotado tus generaciones gratuitas. ¡Actualiza tu plan para continuar!
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || hasNoGenerationsLeft || isProcessingMedia}
        className="w-full flex justify-center items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 text-lg shadow-lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Generando...</span>
          </>
        ) : (
          <>
            <WandIcon className="h-6 w-6"/>
            <span>Generar Proceso</span>
          </>
        )}
      </button>
    </form>
  );
};
