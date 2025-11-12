
import { AuthUser, GeneratedProcess, ProcessStep, ImageFile, TaskComplexity, TaskPriority, UserRole, GuideStatus, TaskCategory } from '../types';
import { mockGuides } from '../data/mockData';

// --- SIMULACIÓN DE BACKEND ---

// Simulación de la base de datos en memoria
let allGuides: GeneratedProcess[] = [...mockGuides];
let userHistory: GeneratedProcess[] = [];
let currentUser: AuthUser | null = null;
let nextId = Date.now();

// Simulación de latencia de red
const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getMockUser = (email: string): AuthUser => {
    if (email.startsWith('admin')) {
        return { email, role: UserRole.ADMINISTRATOR, remainingGenerations: Infinity };
    }
    if (email.startsWith('collab')) {
        return { email, role: UserRole.COLLABORATOR, remainingGenerations: Infinity };
    }
    if (email.startsWith('pro')) {
        return { email, role: UserRole.PRO, remainingGenerations: Infinity };
    }
    if (email.startsWith('standard')) {
        return { email, role: UserRole.STANDARD, remainingGenerations: 20 };
    }
    // Incluyendo google_user y apple_user como pro por defecto para la demo
    if (email.includes('google_user') || email.includes('apple_user')) {
        return { email, role: UserRole.PRO, remainingGenerations: Infinity };
    }
    return { email, role: UserRole.BASIC, remainingGenerations: 3 };
}

// --- SERVICIO DE AUTENTICACIÓN ---

export const getCurrentUser = async (): Promise<AuthUser | null> => {
    await networkDelay(150);
    const userEmail = localStorage.getItem('authUserEmail');
    if (userEmail) {
        currentUser = getMockUser(userEmail);
        return currentUser;
    }
    return null;
};

export const login = async (email: string): Promise<AuthUser> => {
    await networkDelay(500);
    localStorage.setItem('authUserEmail', email);
    currentUser = getMockUser(email);
    // Simular un historial inicial para usuarios que regresan
    if (email.includes('standard') || email.includes('pro')) {
         userHistory = allGuides.filter(g => g.author === 'IA').slice(0, 2).map(g => ({...g, id: g.id + 1000}));
    } else {
        userHistory = [];
    }
    return currentUser;
};

export const logout = async (): Promise<void> => {
    await networkDelay(100);
    localStorage.removeItem('authUserEmail');
    currentUser = null;
    userHistory = [];
    return;
};


// --- SERVICIO DE GUÍAS ---
export const getGuides = async (): Promise<GeneratedProcess[]> => {
    await networkDelay(300);
    return [...allGuides];
};

export const addGuide = async (guide: Omit<GeneratedProcess, 'id' | 'author' | 'status' | 'authorEmail'>): Promise<GeneratedProcess> => {
    await networkDelay(400);
    if (!currentUser) throw new Error("Usuario no autenticado");

    const newGuide: GeneratedProcess = {
        ...guide,
        id: nextId++,
        author: 'Colaborador',
        authorEmail: currentUser.email,
        status: GuideStatus.PENDING,
    };
    allGuides.unshift(newGuide);
    return newGuide;
};

export const updateGuide = async (guide: GeneratedProcess): Promise<GeneratedProcess> => {
    await networkDelay(200);
    allGuides = allGuides.map(g => g.id === guide.id ? guide : g);
    userHistory = userHistory.map(h => h.id === guide.id ? guide : h);
    return guide;
};

export const deleteGuide = async (id: number): Promise<void> => {
    await networkDelay(300);
    allGuides = allGuides.filter(g => g.id !== id);
    userHistory = userHistory.filter(h => h.id !== id);
    return;
};

export const getTopContributors = async (): Promise<{ email: string; count: number }[]> => {
    await networkDelay(250);
    const contributorCounts: { [email: string]: number } = {};
    allGuides
        .filter(guide => guide.author === 'Colaborador' && guide.authorEmail && guide.status === GuideStatus.APPROVED)
        .forEach(guide => {
            if (guide.authorEmail) {
                contributorCounts[guide.authorEmail] = (contributorCounts[guide.authorEmail] || 0) + 1;
            }
        });

    return Object.entries(contributorCounts)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
};

// --- SERVICIO DE HISTORIAL ---
export const getHistory = async (): Promise<GeneratedProcess[]> => {
    await networkDelay(200);
    return [...userHistory].sort((a, b) => b.id - a.id);
};

export const clearHistory = async (): Promise<void> => {
    await networkDelay(150);
    userHistory = [];
    return;
};

// --- PROXY DEL BACKEND DE LA API DE GEMINI (SIMULADO) ---

export const generateProcessProxy = async (
    description: string,
    complexity: TaskComplexity,
    priority: TaskPriority,
    image: ImageFile | null
): Promise<GeneratedProcess> => {
    await networkDelay(2500);
    if (!currentUser) throw new Error("No autenticado");
    if (currentUser.remainingGenerations <= 0) throw new Error("No tienes generaciones restantes.");

    if (currentUser.remainingGenerations !== Infinity) {
        currentUser.remainingGenerations--;
    }
    
    // Simular una respuesta de la IA
    const categories = Object.values(TaskCategory);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    const newProcess: GeneratedProcess = {
        id: nextId++,
        taskTitle: `Guía generada por IA para: "${description.substring(0, 30)}..."`,
        priority,
        category: randomCategory,
        safetyWarnings: ["Usar equipo de protección personal (EPIs).", "Trabajar en un área bien ventilada.", "Desconectar la alimentación antes de empezar."],
        requiredTools: ["Herramienta A", "Material B", "Componente C"],
        steps: [
            { stepNumber: 1, title: "Preparación del área de trabajo", description: "Limpia y organiza el espacio donde realizarás la tarea para evitar accidentes." },
            { stepNumber: 2, title: "Inspección inicial", description: "Revisa el objeto o sistema para evaluar el alcance del trabajo. Si subiste una imagen, se habría analizado aquí." },
            { stepNumber: 3, title: "Ejecución del paso principal", description: `Este es el paso clave relacionado con la complejidad ${complexity} y la descripción dada.` },
            { stepNumber: 4, title: "Verificación y pruebas", description: "Comprueba que la tarea se ha completado correctamente y que todo funciona como se esperaba." },
            { stepNumber: 5, title: "Limpieza final", description: "Recoge todas las herramientas y desecha los residuos de forma adecuada." }
        ],
        onlineResources: [{ title: "Documentación técnica relacionada", url: "https://www.google.com" }],
        groundingSources: [{ title: "Web de referencia para la generación", url: "https://www.wikipedia.org" }],
        author: 'IA',
        status: GuideStatus.APPROVED,
    };

    userHistory.unshift(newProcess);
    allGuides.unshift(newProcess);

    return newProcess;
};

export const describeMediaProxy = async (mediaFile: ImageFile): Promise<{ description: string }> => {
    await networkDelay(1500);
    const mediaType = mediaFile.mimeType.startsWith('image') ? 'imagen' : 'vídeo';
    return {
        description: `Análisis de ${mediaType}: Se observa un objeto que requiere mantenimiento. Parece ser un ${mediaFile.name.split('.').shift()}. La tarea principal parece ser reparar o reemplazar una pieza central.`
    };
};

export const refineStepProxy = async (taskTitle: string, stepToRefine: ProcessStep): Promise<{ newDescription: string }> => {
    await networkDelay(1000);
    return {
        newDescription: `${stepToRefine.description} (Refinado por IA) Para realizar este paso con mayor precisión, asegúrate de utilizar la herramienta adecuada y aplicar una presión constante. Considera ver un tutorial en vídeo si no estás seguro.`
    };
};