import { ImageFile, GeneratedProcess, ProcessStep, TaskComplexity, TaskPriority } from "../types";
import { generateProcessProxy, describeMediaProxy, refineStepProxy } from "./apiService";

export const generateTaskProcess = async (
  description: string,
  complexity: TaskComplexity,
  priority: TaskPriority,
  image: ImageFile | null
): Promise<GeneratedProcess> => {
  try {
    const process = await generateProcessProxy(description, complexity, priority, image);
    return process;
  } catch (error) {
    console.error("Error al generar el proceso vía backend:", error);
    if (error instanceof Error) {
        throw new Error(`Error del backend: ${error.message}`);
    }
    throw new Error("Ocurrió un error desconocido al contactar con el backend.");
  }
};

export const describeMedia = async (mediaFile: ImageFile): Promise<string> => {
    try {
        const { description } = await describeMediaProxy(mediaFile);
        return description;
    } catch (error) {
        console.error("Error al describir el archivo multimedia vía backend:", error);
        return "No se pudo analizar el archivo. Por favor, describe la tarea manualmente.";
    }
};

export const refineStepDescription = async (taskTitle: string, stepToRefine: ProcessStep): Promise<string> => {
    try {
        const { newDescription } = await refineStepProxy(taskTitle, stepToRefine);
        return newDescription;
    } catch (error) {
        console.error("Error al refinar el paso vía backend:", error);
        return "No se pudo refinar la descripción en este momento.";
    }
};
