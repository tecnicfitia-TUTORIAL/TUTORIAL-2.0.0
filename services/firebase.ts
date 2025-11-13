import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

// Configuración del proyecto de Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyBJMnJ_HTT4BfI16MFufj8aIsQFUA-0cso",
  authDomain: "tutorioa.firebaseapp.com",
  projectId: "tutorioa",
  storageBucket: "tutorioa.appspot.com",
  messagingSenderId: "999998653049",
  appId: "1:999998653049:web:4c3c894644386a1cfa0aa8"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Habilitar la persistencia offline con el método moderno para mejorar la resiliencia de la red.
// Esto reemplaza a la función 'enableIndexedDbPersistence' que está en desuso.
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({})
    });
} catch (e: any) {
    console.error("Error al inicializar la persistencia de Firestore, volviendo al modo online.", e);
    // Si falla la inicialización (p. ej., por ser llamado múltiples veces),
    // obtenemos la instancia por defecto que funcionará en memoria.
    db = getFirestore(app);
}

// Exportar instancias de los servicios de Firebase para usar en la aplicación
export const auth = getAuth(app);
export { db };