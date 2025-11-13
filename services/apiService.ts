import { AuthUser, GeneratedProcess, ImageFile, TaskComplexity, TaskPriority, UserRole, GuideStatus, TaskCategory, ProcessStep, GroundingSource, ChatMessage } from '../types';
import { firebaseState, auth, db } from './firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithPopup,
    getAdditionalUserInfo,
    OAuthProvider,
    GithubAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp, orderBy, writeBatch, limit } from 'firebase/firestore';
import { mockGuides } from '../data/mockData';
import { GoogleGenAI, Type } from "@google/genai";


// --- SERVICIO DE AUTENTICACIÓN (CON FIREBASE) ---

// DRY function to handle user creation/retrieval after social login
const handleSocialLogin = async (firebaseUser: FirebaseUser, isNewUser: boolean): Promise<AuthUser> => {
    if (isNewUser) {
        const newUser: Omit<AuthUser, 'email' | 'uid' | 'isVerified'> = {
            role: UserRole.BASIC,
            remainingGenerations: 10
        };
        await setDoc(doc(db, "users", firebaseUser.uid), {
            ...newUser,
            isVerified: true, // Social accounts are considered verified
            email: firebaseUser.email
        });
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            isVerified: true,
            ...newUser
        };
    } else {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
             return { 
                uid: firebaseUser.uid,
                email: firebaseUser.email!, 
                isVerified: true,
                ...userDoc.data() 
            } as AuthUser;
        }
        throw new Error('No se encontraron datos de usuario para esta cuenta social.');
    }
};


export const loginWithGoogle = async (): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("La autenticación no está disponible en modo de demostración.");
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
        return handleSocialLogin(result.user, isNewUser);
    } catch (error: any) {
        if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            throw new Error(`Dominio no autorizado. Añade '${domain}' a la lista de dominios autorizados en Firebase Authentication.`);
        }
        console.error("Error de inicio de sesión con Google:", error);
        throw new Error("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
    }
};

export const loginWithApple = async (): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("La autenticación no está disponible en modo de demostración.");
    try {
        const provider = new OAuthProvider('apple.com');
        const result = await signInWithPopup(auth, provider);
        const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
        return handleSocialLogin(result.user, isNewUser);
    } catch (error: any) {
        if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            throw new Error(`Dominio no autorizado. Añade '${domain}' a la lista de dominios autorizados en Firebase Authentication.`);
        }
        console.error("Error de inicio de sesión con Apple:", error);
        throw new Error("No se pudo iniciar sesión con Apple. Inténtalo de nuevo.");
    }
};

export const loginWithGithub = async (): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("La autenticación no está disponible en modo de demostración.");
    try {
        const provider = new GithubAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
        return handleSocialLogin(result.user, isNewUser);
    } catch (error: any) {
        if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            throw new Error(`Dominio no autorizado. Añade '${domain}' a la lista de dominios autorizados en Firebase Authentication.`);
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error("Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión con otro método.");
        }
        console.error("Error de inicio de sesión con GitHub:", error);
        throw new Error("No se pudo iniciar sesión con GitHub. Inténtalo de nuevo.");
    }
};


export const loginWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("La autenticación no está disponible en modo de demostración.");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Sincronizar el estado de verificación si es necesario, para mantener la consistencia.
            if (userData.isVerified !== firebaseUser.emailVerified) {
                await updateDoc(userDocRef, { isVerified: firebaseUser.emailVerified });
            }
            return { 
                uid: firebaseUser.uid,
                email: firebaseUser.email!, 
                isVerified: firebaseUser.emailVerified,
                ...userData 
            } as AuthUser;
        }
        throw new Error('No se encontraron datos de usuario asociados a esta cuenta.');
    } catch (error: any) {
         switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                throw new Error('El correo electrónico o la contraseña son incorrectos.');
            case 'auth/invalid-email':
                throw new Error('El formato del correo electrónico no es válido.');
            case 'auth/user-disabled':
                throw new Error('Esta cuenta de usuario ha sido deshabilitada.');
            default:
                console.error("Error de inicio de sesión en Firebase:", error);
                if (error.message && error.message.includes('client is offline')) {
                    throw new Error('Error de conexión con la base de datos. Por favor, comprueba tu conexión y vuelve a intentarlo.');
               }
                throw new Error('No se pudo iniciar sesión. Por favor, inténtalo de nuevo.');
        }
    }
};

export const registerWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("El registro no está disponible en modo de demostración.");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;
        
        const newUser: Omit<AuthUser, 'email' | 'uid' | 'isVerified'> = {
            role: UserRole.BASIC,
            remainingGenerations: 10
        };

        // Store user data along with verification status
        await setDoc(doc(db, "users", firebaseUser.uid), {
            ...newUser,
            isVerified: false,
            email: firebaseUser.email // Store email for admin queries
        });
        
        await sendEmailVerification(firebaseUser);

        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            isVerified: false,
            ...newUser
        };

    } catch (error: any) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                throw new Error('Este correo electrónico ya está registrado.');
            case 'auth/invalid-email':
                throw new Error('El formato del correo electrónico no es válido.');
            case 'auth/weak-password':
                throw new Error('La contraseña es demasiado débil. Debe tener al menos 6 caracteres.');
            case 'auth/operation-not-allowed':
                 throw new Error('El registro por email y contraseña no está habilitado.');
            default:
                console.error("Error de registro en Firebase:", error);
                throw new Error('No se pudo registrar el usuario. Revisa la configuración de Firebase.');
        }
    }
};

export const resendVerificationEmail = async (): Promise<void> => {
    if (!firebaseState.isConfigured) throw new Error("La verificación no está disponible en modo de demostración.");
    const user = auth.currentUser;
    if (user) {
        await sendEmailVerification(user);
    } else {
        throw new Error("No hay un usuario autenticado para reenviar el correo.");
    }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
    if (!firebaseState.isConfigured) return;
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        if (error.code === 'auth/invalid-email') {
            throw new Error('El formato del correo electrónico no es válido.');
        }
        console.error("Error al enviar correo de recuperación:", error);
    }
};

export const logout = async (): Promise<void> => {
    if (!firebaseState.isConfigured) return;
    await signOut(auth);
};

export const checkSession = (): Promise<AuthUser | null> => {
    if (!firebaseState.isConfigured) return Promise.resolve(null);
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); 
            if (user && user.email) {
                try {
                    await user.reload(); // Obtener el estado más reciente del usuario (incl. emailVerified)
                    
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Sincronizar el estado de verificación si es necesario, sin una segunda lectura
                        if (userData.isVerified !== user.emailVerified) {
                            await updateDoc(userDocRef, { isVerified: user.emailVerified });
                            userData.isVerified = user.emailVerified; // Actualizar la copia local para el retorno
                        }

                        resolve({ 
                            uid: user.uid,
                            email: user.email, 
                            isVerified: user.emailVerified,
                            ...userData 
                        } as AuthUser);
                    } else {
                        resolve(null);
                    }
                } catch(e) {
                    console.error("Error al obtener los datos del usuario durante la comprobación de sesión:", e);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
};

export const getUserData = async (email: string): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("Los datos de usuario no están disponibles en modo de demostración.");
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === email) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
            return { 
                uid: currentUser.uid,
                email: currentUser.email, 
                isVerified: currentUser.emailVerified,
                ...userDoc.data() 
            } as AuthUser;
        }
    }
    throw new Error("Usuario no encontrado o no autenticado.");
};

export const changePlan = async (email: string, newRole: UserRole): Promise<AuthUser> => {
    if (!firebaseState.isConfigured) throw new Error("Los planes no están disponibles en modo de demostración.");
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === email) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const newPlanData: Partial<AuthUser> = { role: newRole };

        if(newRole === UserRole.PRO || newRole === UserRole.COLLABORATOR || newRole === UserRole.ADMINISTRATOR) {
            newPlanData.remainingGenerations = Infinity;
        } else if (newRole === UserRole.TEAM) {
            newPlanData.remainingGenerations = 100;
        } else if(newRole === UserRole.BASIC) {
            newPlanData.remainingGenerations = 10;
        }
        
        await updateDoc(userDocRef, newPlanData);
        return await getUserData(email);
    }
    throw new Error("Usuario no encontrado para cambiar de plan.");
}

export const getAllUsersForAdmin = async (): Promise<AuthUser[]> => {
    if (!firebaseState.isConfigured) return [];
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AuthUser));
};

// --- SERVICIO DE GUÍAS (CONECTADO A FIRESTORE) ---

const guideFromDoc = (doc: any): GeneratedProcess => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
    } as GeneratedProcess;
};

export const getGuides = async (): Promise<GeneratedProcess[]> => {
    if (!firebaseState.isConfigured) return [];
    const guidesCol = collection(db, 'guides');

    const checkQuery = query(guidesCol, limit(1));
    const snapshotCheck = await getDocs(checkQuery);
    if (snapshotCheck.empty) {
        console.log("Colección 'guides' vacía. Sembrando datos iniciales de mockData.ts...");
        const batch = writeBatch(db);
        mockGuides.forEach(guide => {
            const { id, ...guideData } = guide;
            const newGuideRef = doc(collection(db, "guides"));
            batch.set(newGuideRef, {
                ...guideData,
                createdAt: serverTimestamp()
            });
        });
        await batch.commit();
        console.log("Datos iniciales sembrados correctamente.");
    }

    const q = query(guidesCol, where('status', '==', GuideStatus.APPROVED), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(guideFromDoc);
};

export const addGuide = async (guide: Omit<GeneratedProcess, 'id' | 'author' | 'status'>): Promise<GeneratedProcess> => {
    if (!firebaseState.isConfigured) throw new Error("No se pueden añadir guías en modo de demostración.");
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Necesitas iniciar sesión para contribuir.");

    const newGuideData = {
        ...guide,
        author: 'Colaborador' as const,
        authorEmail: currentUser.email!,
        authorId: currentUser.uid,
        status: GuideStatus.PENDING,
        createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "guides"), newGuideData);
    
    return {
        ...newGuideData,
        id: docRef.id
    } as GeneratedProcess;
};

export const updateGuide = async (guide: GeneratedProcess): Promise<GeneratedProcess> => {
    if (!firebaseState.isConfigured) return guide;
    const { id, ...guideData } = guide;
    const guideRef = doc(db, 'guides', id.toString());
    await updateDoc(guideRef, guideData);
    return guide;
};

export const deleteGuide = async (id: string): Promise<void> => {
    if (!firebaseState.isConfigured) return;
    const guideRef = doc(db, 'guides', id.toString());
    await deleteDoc(guideRef);
};

export const getTopContributors = async (): Promise<{ email: string; count: number }[]> => {
    if (!firebaseState.isConfigured) return [];
    const guidesCol = collection(db, 'guides');
    const q = query(guidesCol, where('status', '==', GuideStatus.APPROVED));
    const approvedGuidesSnapshot = await getDocs(q);
    const guides = approvedGuidesSnapshot.docs.map(guideFromDoc);

    const contributorCounts: { [email: string]: number } = {};
    guides
        .filter(guide => guide.author === 'Colaborador' && guide.authorEmail)
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

// --- SERVICIO DE HISTORIAL (CONECTADO A FIRESTORE) ---
export const getHistory = async (): Promise<GeneratedProcess[]> => {
    if (!firebaseState.isConfigured) return [];
    const currentUser = auth.currentUser;
    if (!currentUser) return [];
    
    const historyCol = collection(db, `users/${currentUser.uid}/history`);
    const q = query(historyCol, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(guideFromDoc);
};

export const clearHistory = async (): Promise<void> => {
    if (!firebaseState.isConfigured) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const historyCol = collection(db, `users/${currentUser.uid}/history`);
    const snapshot = await getDocs(historyCol);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
};

// --- PROXY DEL BACKEND DE LA API DE GEMINI (AHORA CON GEMINI REAL) ---

export const generateProcessProxy = async (
    description: string,
    complexity: TaskComplexity,
    priority: TaskPriority,
    image: ImageFile | null
): Promise<GeneratedProcess> => {
    if (!process.env.API_KEY) {
        throw new Error("La API Key de Google no está configurada. Por favor, configúrala como Secret Key en AI Studio.");
    }

    if (!firebaseState.isConfigured) {
        console.warn("Firebase no está configurado. Ejecutando en modo de generación de demostración sin guardado.");
        const demoProcess: Omit<GeneratedProcess, 'id'> = {
            taskTitle: `Guía Demo para: "${description.substring(0, 30)}..."`,
            priority, category: TaskCategory.OTHER,
            safetyWarnings: ["Usar equipo de protección adecuado."],
            requiredTools: ["Herramienta de demostración 1"],
            steps: [{ stepNumber: 1, title: "Paso de Preparación (Demo)", description: "Este es un paso generado en modo de demostración porque Firebase no está configurado." }],
            onlineResources: [], groundingSources: [], author: 'IA', status: GuideStatus.APPROVED,
        };
        return { ...demoProcess, id: `demo-${Date.now()}` };
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Autenticación requerida.");
    
    const currentUserData = await getUserData(currentUser.email!);
    if (currentUserData.remainingGenerations !== Infinity && currentUserData.remainingGenerations <= 0) {
        throw new Error("No te quedan generaciones. Por favor, actualiza tu plan.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const processSchema = {
        type: Type.OBJECT,
        properties: {
            taskTitle: { type: Type.STRING, description: "Título claro y conciso para la tarea." },
            category: { type: Type.STRING, description: `Clasifica la tarea en una de estas categorías: ${Object.values(TaskCategory).join(', ')}` },
            safetyWarnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de advertencias de seguridad importantes y equipo de protección personal (EPI) necesario." },
            requiredTools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de herramientas y materiales necesarios." },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        stepNumber: { type: Type.INTEGER },
                        title: { type: Type.STRING, description: "Título corto para el paso." },
                        description: { type: Type.STRING, description: "Descripción detallada y clara del paso." }
                    },
                    required: ["stepNumber", "title", "description"]
                }
            },
            onlineResources: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                    },
                    required: ["title", "url"]
                }
            }
        },
        required: ["taskTitle", "category", "safetyWarnings", "requiredTools", "steps", "onlineResources"]
    };

    const prompt = `Actúa como un experto en bricolaje y reparaciones. Genera una guía paso a paso detallada, segura y fácil de seguir para la siguiente tarea.
    - Tarea: ${description}
    - Complejidad deseada: ${complexity}
    - Prioridad: ${priority}
    
    Devuelve la guía en formato JSON, siguiendo estrictamente el esquema proporcionado. Asegúrate de que los pasos sean lógicos y secuenciales. Las advertencias de seguridad deben ser relevantes y prioritarias.`;

    const contents = [];
    if (image) {
        contents.push({ inlineData: { mimeType: image.mimeType, data: image.base64 }});
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: contents },
        config: {
            responseMimeType: "application/json",
            responseSchema: processSchema,
            tools: [{ googleSearch: {} }]
        },
    });

    const parsedJson = JSON.parse(response.text);
    const groundingSources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            title: chunk.web?.title || 'Fuente de Google',
            url: chunk.web?.uri || '#',
        })) || [];


    const newProcessData: Omit<GeneratedProcess, 'id'> = {
        ...parsedJson,
        priority,
        groundingSources,
        author: 'IA',
        authorEmail: 'ia@tutorial-2.0.app',
        authorId: 'gemini-ia-system',
        status: GuideStatus.APPROVED,
        // @ts-ignore
        createdAt: serverTimestamp(),
    };

    const historyCol = collection(db, `users/${currentUser.uid}/history`);
    const docRef = await addDoc(historyCol, newProcessData);
    
    if (currentUserData.remainingGenerations !== Infinity) {
       const userDocRef = doc(db, "users", currentUser.uid);
       await updateDoc(userDocRef, {
           remainingGenerations: currentUserData.remainingGenerations - 1
       });
    }

    return { ...newProcessData, id: docRef.id } as GeneratedProcess;
};

export const describeMediaProxy = async (mediaFile: ImageFile): Promise<{ description: string }> => {
     if (!process.env.API_KEY) throw new Error("La API Key de Google no está configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = "Describe en una frase corta la tarea principal que se muestra en esta imagen/vídeo, desde la perspectiva de una guía 'cómo hacer'. Por ejemplo: 'Cambiar una rueda pinchada de un coche'.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [
            { inlineData: { mimeType: mediaFile.mimeType, data: mediaFile.base64 } },
            { text: prompt }
        ]},
    });

    return { description: response.text };
};

export const refineStepProxy = async (taskTitle: string, stepToRefine: ProcessStep): Promise<{ newDescription: string }> => {
    if (!process.env.API_KEY) throw new Error("La API Key de Google no está configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Dentro de la guía "${taskTitle}", necesito refinar un paso. 
    Paso a refinar: "${stepToRefine.title}: ${stepToRefine.description}".
    Por favor, re-escribe la descripción de este paso para que sea más detallada, clara y fácil de entender para un principiante. No incluyas el título del paso, solo la nueva descripción.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return { newDescription: response.text };
};


export const getChatResponseProxy = async (currentMessage: string, history: ChatMessage[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("La API Key de Google no está configurada.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const geminiHistory = history.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: geminiHistory,
        config: {
            systemInstruction: `You are a helpful assistant for an application named TUTORIAL 2.0. This application allows users to generate step-by-step guides for various tasks using AI. Users can also view guides from other community members and contribute their own. Your role is to answer user questions about how to use the application, its features, different user plans, or any other related topic. Be concise and friendly. Respond in Spanish.`,
        }
    });

    const response = await chat.sendMessage({ message: currentMessage });

    return response.text;
};