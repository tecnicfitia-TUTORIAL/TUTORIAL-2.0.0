import React from 'react';
import { KeyIcon, AlertTriangleIcon } from './icons';

const SetupGuide: React.FC = () => {

    const envVars = [
        { name: 'API_KEY', description: 'Tu clave de API de Gemini de Google AI Studio.' },
        { name: 'FIREBASE_API_KEY', description: 'El "apiKey" de la configuración de tu aplicación web de Firebase.' },
        { name: 'FIREBASE_AUTH_DOMAIN', description: 'El "authDomain" de Firebase.' },
        { name: 'FIREBASE_PROJECT_ID', description: 'El "projectId" de Firebase.' },
        { name: 'FIREBASE_STORAGE_BUCKET', description: 'El "storageBucket" de Firebase.' },
        { name: 'FIREBASE_MESSAGING_SENDER_ID', description: 'El "messagingSenderId" de Firebase.' },
        { name: 'FIREBASE_APP_ID', description: 'El "appId" de Firebase para tu aplicación web.' },
    ];

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-yellow-500/30 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="flex-shrink-0">
                    <AlertTriangleIcon className="w-16 h-16 text-yellow-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configuración Requerida para Activar la Aplicación</h1>
                    <p className="text-gray-400 mt-2">
                        La aplicación se está ejecutando en un <strong>modo de demostración</strong> limitado porque no está conectada a un backend de Firebase. Para habilitar todas las funcionalidades, como el registro de usuarios, el historial y las contribuciones de la comunidad, sigue los pasos a continuación.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg">1</div>
                        <div className="w-px h-full bg-gray-600"></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-cyan-400 mb-2">Crea o Selecciona un Proyecto en Firebase</h2>
                        <p className="text-gray-300">
                            Ve a la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold hover:underline">Consola de Firebase</a>, inicia sesión con tu cuenta de Google y crea un nuevo proyecto (o selecciona uno existente).
                        </p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg">2</div>
                        <div className="w-px h-full bg-gray-600"></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-cyan-400 mb-2">Añade una Aplicación Web</h2>
                        <p className="text-gray-300 mb-3">
                            Dentro de tu proyecto de Firebase, haz clic en el icono de "Web" ({`</>`}) para registrar una nueva aplicación web. Dale un apodo y completa el registro.
                        </p>
                    </div>
                </div>
                
                 {/* Step 3 */}
                 <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg">3</div>
                        <div className="w-px h-full bg-gray-600"></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-cyan-400 mb-2">Copia tus Credenciales de Firebase</h2>
                        <p className="text-gray-300 mb-3">
                            Después de registrar la aplicación, Firebase te mostrará un objeto de configuración (`firebaseConfig`). También puedes encontrarlo en la "Configuración del proyecto" {'>'} "Tus apps". Necesitarás los valores de este objeto.
                        </p>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg">4</div>
                        <div className="w-px h-full bg-gray-600"></div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-cyan-400 mb-2">Configura las "Secret Keys" en AI Studio</h2>
                        <p className="text-gray-300 mb-4">
                            En el panel de AI Studio, ve a la sección de "Secret Keys" y añade las siguientes claves con los valores que copiaste de Google AI Studio y Firebase:
                        </p>
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-3">
                           {envVars.map(v => (
                                <div key={v.name}>
                                    <p className="text-cyan-400">{v.name}</p>
                                    <p className="text-gray-500 text-xs pl-2">// {v.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">5</div>
                     <div className="flex-1">
                        <h2 className="text-xl font-semibold text-cyan-400 mb-2">Habilita los Servicios de Firebase</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li><strong>Authentication:</strong> Ve a la sección "Authentication", haz clic en "Empezar" y habilita los proveedores que desees (como mínimo "Correo electrónico/Contraseña", y opcionalmente Google, GitHub, Apple, etc.).</li>
                            <li><strong>Firestore Database:</strong> Ve a la sección "Firestore Database", haz clic en "Crear base de datos", inicia en modo de producción y elige una ubicación.</li>
                        </ul>
                    </div>
                </div>
            </div>

             <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <p className="text-gray-300 font-semibold">
                    Una vez que hayas configurado estas claves, actualiza esta página. La aplicación se conectará a tu backend y estará completamente funcional.
                </p>
            </div>
        </div>
    );
};

export default SetupGuide;