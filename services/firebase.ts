import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// La configuración de Firebase ahora se carga desde variables de entorno seguras.
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
    isConfigured: Object.values(firebaseConfig).every(value => value),
    error: null,
};

let app, auth, db;

if (firebaseState.isConfigured) {
    try {
        // Patrón Singleton para evitar reinicializar la app en recargas en caliente
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

        // Inicializar servicios de Firebase
        // Se utiliza la inicialización por defecto. Firestore habilitará la persistencia
        // offline por defecto, lo cual es generalmente deseable.
        db = getFirestore(app);
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