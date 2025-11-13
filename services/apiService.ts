// FIX: Imported ProcessStep type
import { AuthUser, GeneratedProcess, ImageFile, TaskComplexity, TaskPriority, UserRole, GuideStatus, TaskCategory, ProcessStep } from '../types';
import { auth, db } from './firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp, orderBy, writeBatch, limit } from 'firebase/firestore';
import { mockGuides } from '../data/mockData';


// --- SERVICIO DE AUTENTICACIÓN (CON FIREBASE) ---

const syncUserVerificationStatus = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().isVerified !== firebaseUser.emailVerified) {
        await updateDoc(userDocRef, { isVerified: firebaseUser.emailVerified });
    }
};

export const loginWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;

        await syncUserVerificationStatus(firebaseUser);

        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
            return { 
                uid: firebaseUser.uid,
                email: firebaseUser.email!, 
                isVerified: firebaseUser.emailVerified,
                ...userDoc.data() 
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
                throw new Error('No se pudo iniciar sesión. Por favor, inténtalo de nuevo.');
        }
    }
};

export const registerWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
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
    const user = auth.currentUser;
    if (user) {
        await sendEmailVerification(user);
    } else {
        throw new Error("No hay un usuario autenticado para reenviar el correo.");
    }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
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
    await signOut(auth);
};

export const checkSession = (): Promise<AuthUser | null> => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); 
            if (user && user.email) {
                try {
                    await user.reload(); // Get the latest user state
                    await syncUserVerificationStatus(user);
                    
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        resolve({ 
                            uid: user.uid,
                            email: user.email, 
                            isVerified: user.emailVerified,
                            ...userDoc.data() 
                        } as AuthUser);
                    } else {
                        resolve(null);
                    }
                } catch(e) {
                    console.error("Error fetching user data during session check:", e);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
};

export const getUserData = async (email: string): Promise<AuthUser> => {
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
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === email) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const newPlanData: Partial<AuthUser> = { role: newRole };

        if(newRole === UserRole.PRO || newRole === UserRole.COLLABORATOR || newRole === UserRole.ADMINISTRATOR) {
            newPlanData.remainingGenerations = Infinity;
        } else if (newRole === UserRole.STANDARD) {
            newPlanData.remainingGenerations = 20;
        } else if(newRole === UserRole.BASIC) {
            newPlanData.remainingGenerations = 10;
        }
        
        await updateDoc(userDocRef, newPlanData);
        return await getUserData(email);
    }
    throw new Error("Usuario no encontrado para cambiar de plan.");
}

export const getAllUsersForAdmin = async (): Promise<AuthUser[]> => {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    // Note: This fetches from Firestore, which now contains the synced `isVerified` status.
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

// Obtiene solo guías aprobadas para la vista pública
export const getGuides = async (): Promise<GeneratedProcess[]> => {
    const guidesCol = collection(db, 'guides');

    // Comprueba si la colección está vacía para sembrar datos iniciales una sola vez
    const checkQuery = query(guidesCol, limit(1));
    const snapshotCheck = await getDocs(checkQuery);
    if (snapshotCheck.empty) {
        console.log("Colección 'guides' vacía. Sembrando datos iniciales de mockData.ts...");
        const batch = writeBatch(db);
        mockGuides.forEach(guide => {
            const { id, ...guideData } = guide; // Firestore generará su propio ID
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
    const { id, ...guideData } = guide;
    const guideRef = doc(db, 'guides', id.toString());
    await updateDoc(guideRef, guideData);
    return guide;
};

export const deleteGuide = async (id: string): Promise<void> => {
    const guideRef = doc(db, 'guides', id.toString());
    await deleteDoc(guideRef);
};

export const getTopContributors = async (): Promise<{ email: string; count: number }[]> => {
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
    const currentUser = auth.currentUser;
    if (!currentUser) return [];
    
    const historyCol = collection(db, `users/${currentUser.uid}/history`);
    const q = query(historyCol, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(guideFromDoc);
};

export const clearHistory = async (): Promise<void> => {
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

// --- PROXY DEL BACKEND DE LA API DE GEMINI (AHORA GUARDA EN FIRESTORE) ---

export const generateProcessProxy = async (
    description: string,
    complexity: TaskComplexity,
    priority: TaskPriority,
    image: ImageFile | null
): Promise<GeneratedProcess> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Autenticación requerida.");
    
    const currentUserData = await getUserData(currentUser.email!);
    if (currentUserData.remainingGenerations !== Infinity && currentUserData.remainingGenerations <= 0) {
        throw new Error("No te quedan generaciones. Por favor, actualiza tu plan.");
    }

    const newProcessData: Omit<GeneratedProcess, 'id'> = {
        taskTitle: `Guía generada por IA para: "${description.substring(0, 30)}..."`,
        priority,
        category: Object.values(TaskCategory)[Math.floor(Math.random() * Object.values(TaskCategory).length)],
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
    const mediaType = mediaFile.mimeType.startsWith('image') ? 'imagen' : 'vídeo';
    return {
        description: `Análisis de ${mediaType}: Se observa un objeto que requiere mantenimiento. Parece ser un ${mediaFile.name.split('.').shift()}. La tarea principal parece ser reparar o reemplazar una pieza central.`
    };
};

export const refineStepProxy = async (taskTitle: string, stepToRefine: ProcessStep): Promise<{ newDescription: string }> => {
    return {
        newDescription: `${stepToRefine.description} (Refinado por IA) Para realizar este paso con mayor precisión, asegúrate de utilizar la herramienta adecuada y aplicar una presión constante. Considera ver un tutorial en vídeo si no estás seguro.`
    };
};