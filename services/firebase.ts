import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

// ---
// NOTA IMPORTANTE PARA EL USUARIO:
// Para que la aplicación se conecte a TU proyecto de Firebase,
// debes configurar las siguientes variables de entorno en tu entorno de Google AI Studio.
// Ve a la configuración de tu proyecto de Firebase, busca la configuración de tu aplicación web
// y copia los valores correspondientes en las "Secret Keys" de AI Studio.
// Ejemplo: FIREBASE_API_KEY = "tu-api-key-de-firebase"
// ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

interface FirebaseState {
    isConfigured: boolean;
    error: Error | null;
}

// Export a state object that the UI can use to react to initialization problems.
export const firebaseState: FirebaseState = {
    isConfigured: !!(firebaseConfig.apiKey && firebaseConfig.projectId),
    error: null,
};

let app, auth, db;

if (firebaseState.isConfigured) {
    try {
        // Patrón Singleton para evitar reinicializar la app en recargas en caliente
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

        // Inicializar Firestore, deshabilitando explícitamente la persistencia (modo offline)
        // para evitar problemas de compatibilidad en este entorno.
        try {
            db = initializeFirestore(app, {
                localCache: memoryLocalCache({})
            });
        } catch (e: any) {
            console.error("Error al inicializar Firestore sin persistencia, volviendo a la instancia por defecto.", e);
            db = getFirestore(app);
        }

        auth = getAuth(app);

    } catch (error: any) {
        console.error("Error al inicializar Firebase. Comprueba que las credenciales son correctas.", error);
        // If initialization fails (e.g., invalid API key), we update the state
        // so the UI can show the setup instructions.
        firebaseState.isConfigured = false;
        firebaseState.error = error;
    }
} else {
    const errorMessage = "La configuración de Firebase está incompleta. Por favor, configura las Secret Keys en AI Studio.";
    console.warn(`ADVERTENCIA: ${errorMessage}`);
    firebaseState.error = new Error(errorMessage);
}


// Exportar instancias de los servicios de Firebase. Serán 'undefined' si la inicialización falla.
// El UI guard check en App.tsx previene que se usen en ese estado.
export { auth, db };