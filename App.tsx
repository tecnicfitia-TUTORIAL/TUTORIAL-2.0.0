import React, { useState, useEffect, Suspense, lazy } from 'react';
import { TaskInputForm } from './components/TaskInputForm';
import { ProcessOutput } from './components/ProcessOutput';
import { HistorySidebar } from './components/HistorySidebar';
import { GuestView } from './components/GuestView';
import type { AuthView } from './components/LoginModal';
import { VerificationBanner } from './components/VerificationBanner';
import Header from './components/Header';

import { AuthUser, GeneratedProcess, ImageFile, TaskComplexity, TaskPriority, UserRole } from './types';
import * as geminiService from './services/geminiService';
import * as apiService from './services/apiService';
import { firebaseState } from './services/firebase';

// Lazy load views for code splitting
const CommunityView = lazy(() => import('./components/CommunityView'));
const CollaboratorView = lazy(() => import('./components/CollaboratorView'));
const AdminView = lazy(() => import('./components/AdminView'));
const HallOfFameView = lazy(() => import('./components/HallOfFameView'));

// Lazy load modals for code splitting
const LoginModal = lazy(() => import('./components/LoginModal'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const ManagePlanModal = lazy(() => import('./components/ManagePlanModal'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));


const App: React.FC = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedProcess, setGeneratedProcess] = useState<GeneratedProcess | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Modal states
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isManagePlanModalOpen, setIsManagePlanModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<AuthView>('login');
    
    // Feature states
    const [history, setHistory] = useState<GeneratedProcess[]>([]);
    const [activeView, setActiveView] = useState<'generate' | 'community' | 'contribute' | 'halloffame' | 'admin'>('generate');
    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    
    const firebaseReady = firebaseState.isConfigured;

    useEffect(() => {
        const checkUserSession = async () => {
            setIsLoading(true);
            try {
                const sessionUser = await apiService.checkSession();
                setUser(sessionUser);
                if (sessionUser) {
                    const userHistory = await apiService.getHistory();
                    setHistory(userHistory);
                }
            } catch (error) {
                console.error("Error al comprobar la sesión:", error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkUserSession();
    }, [firebaseReady]);
    
    useEffect(() => {
      let intervalId: number;
      if (user && !user.isVerified) {
        // Periodically check verification status in case the user verifies in another tab
        intervalId = window.setInterval(async () => {
          const updatedUser = await apiService.checkSession();
          if (updatedUser?.isVerified) {
            setUser(updatedUser);
          }
        }, 30000); // Check every 30 seconds
      }
      return () => clearInterval(intervalId);
    }, [user]);

    const handleGenerate = async (description: string, complexity: TaskComplexity, priority: TaskPriority, image: ImageFile | null) => {
        setIsGenerating(true);
        setGenerationError(null);
        setGeneratedProcess(null);
        setActiveTaskId(null);

        try {
            const process = await geminiService.generateTaskProcess(description, complexity, priority, image);
            setGeneratedProcess(process);

            // Update user's remaining generations and history
            if (user) {
                const updatedUser = await apiService.getUserData(user.email);
                setUser(updatedUser);
                setHistory(prev => [process, ...prev]);
            }

        } catch (error) {
            console.error("Error al generar el proceso:", error);
            if (error instanceof Error) {
                setGenerationError(error.message);
            } else {
                setGenerationError("Ocurrió un error desconocido.");
            }
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleLoginSuccess = async (loggedInUser: AuthUser) => {
        setUser(loggedInUser);
        setIsAuthModalOpen(false);
        try {
            const userHistory = await apiService.getHistory();
            setHistory(userHistory);
        } catch (error) {
            console.error("Error al cargar el historial del usuario:", error);
            setHistory([]);
        }
    };

    const handleLogout = async () => {
        await apiService.logout();
        setUser(null);
        setHistory([]);
        setGeneratedProcess(null);
        setIsAccountModalOpen(false);
        setActiveView('generate'); // Reset to default view on logout
    };

    const handleOpenAuthModal = (view: AuthView) => {
        setAuthModalView(view);
        setIsAuthModalOpen(true);
    };
    
    const closeAllModals = () => {
        setIsAuthModalOpen(false);
        setIsAccountModalOpen(false);
        setIsManagePlanModalOpen(false);
        setIsFeedbackModalOpen(false);
    };

    const handleContribute = async (guide: Omit<GeneratedProcess, 'id' | 'author' | 'status'>) => {
        try {
            await apiService.addGuide(guide);
            // Optionally, switch view or give feedback
        } catch(error) {
            console.error("Error al contribuir con la guía:", error);
            // Optionally, show error to user
        }
    };
    
    const handleSelectFromHistory = (id: string) => {
      const selectedProcess = history.find(item => item.id === id);
      if (selectedProcess) {
        setGeneratedProcess(selectedProcess);
        setGenerationError(null);
        setIsGenerating(false);
        setActiveView('generate');
        setActiveTaskId(id);
      }
    };

    const handleClearHistory = async () => {
      if (confirm("¿Estás seguro de que quieres borrar todo tu historial? Esta acción no se puede deshacer.")) {
        await apiService.clearHistory();
        setHistory([]);
        if (generatedProcess && history.some(h => h.id === generatedProcess.id)) {
            setGeneratedProcess(null);
        }
      }
    };
    
    const handleChangePlan = async (newRole: UserRole) => {
        if(user) {
            const updatedUser = await apiService.changePlan(user.email, newRole);
            setUser(updatedUser);
            setIsManagePlanModalOpen(false); // Close plan modal after change
        }
    };
    
    const handleResendVerification = async () => {
        try {
            await apiService.resendVerificationEmail();
            setVerificationMessage("¡Correo de verificación reenviado! Revisa tu bandeja de entrada.");
             setTimeout(() => setVerificationMessage(null), 5000);
        } catch (error) {
            setVerificationMessage("Error al reenviar el correo. Inténtalo de nuevo más tarde.");
            setTimeout(() => setVerificationMessage(null), 5000);
        }
    };
    
    const handleNavigate = (view: 'generate' | 'community' | 'contribute' | 'halloffame' | 'admin') => {
        setGeneratedProcess(null);
        setGenerationError(null);
        setActiveTaskId(null);
        setActiveView(view);
    };

    const handleSelectGuideFromCommunity = (guide: GeneratedProcess) => {
        setGeneratedProcess(guide);
        setActiveView('generate');
    };
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'generate':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-1 space-y-8">
                            {firebaseReady && <HistorySidebar history={history} onSelectItem={handleSelectFromHistory} onClearHistory={handleClearHistory} activeTaskId={activeTaskId} />}
                            <TaskInputForm
                                userRole={user!.role}
                                onSubmit={handleGenerate}
                                isLoading={isGenerating}
                                remainingGenerations={user!.remainingGenerations}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <ProcessOutput
                                process={generatedProcess}
                                isLoading={isGenerating}
                                error={generationError}
                                onProcessUpdate={setGeneratedProcess}
                            />
                        </div>
                    </div>
                );
            case 'community':
                return <CommunityView onSelectGuide={handleSelectGuideFromCommunity} onAuthRequest={handleOpenAuthModal} />;
            case 'contribute':
                return <CollaboratorView onContribute={handleContribute} />;
            case 'halloffame':
                return <HallOfFameView onBack={() => handleNavigate('generate')} />;
            case 'admin':
                return <AdminView />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div></div>;
    }

    const suspenseFallback = (
        <div className="h-full w-full flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            {!firebaseReady && (
                <div className="bg-yellow-600/90 text-center text-white p-2 text-sm shadow-lg">
                    <strong>MODO DE DEMOSTRACIÓN:</strong> La aplicación se está ejecutando sin conexión. Para habilitar el guardado, el historial y las cuentas de usuario, por favor, <a href="https://github.com/google/aistudio-apps/blob/main/TUTORIAL%202.0/README.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-200">configura tus claves de API de Firebase</a>.
                </div>
            )}
            
            <Header 
                user={user} 
                activeView={activeView}
                onOpenAuthModal={handleOpenAuthModal} 
                onLogout={handleLogout} 
                onAccount={() => setIsAccountModalOpen(true)}
                onNavigate={handleNavigate}
            />

            {user && !user.isVerified && <VerificationBanner onResend={handleResendVerification} message={verificationMessage}/>}
            
            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                <Suspense fallback={suspenseFallback}>
                    {user ? renderActiveView() : <GuestView onLogin={() => handleOpenAuthModal('register')} />}
                </Suspense>
            </main>

            <footer className="bg-gray-800/50 border-t border-gray-700/50 mt-auto">
                <div className="container mx-auto p-4 text-center text-xs text-gray-500 flex justify-between items-center">
                   <span>&copy; {new Date().getFullYear()} TUTORIAL 2.0 - Creado con Google AI Studio</span>
                   <button onClick={() => setIsFeedbackModalOpen(true)} className="hover:text-cyan-400 hover:underline">Enviar Sugerencias</button>
                </div>
            </footer>
            
            <Suspense fallback={<div />}>
                {isAuthModalOpen && <LoginModal onClose={closeAllModals} onLoginSuccess={handleLoginSuccess} initialView={authModalView} />}
                {user && isAccountModalOpen && <AccountModal user={user} onClose={closeAllModals} onLogout={handleLogout} onManagePlan={() => { setIsAccountModalOpen(false); setIsManagePlanModalOpen(true); }} />}
                {user && isManagePlanModalOpen && <ManagePlanModal user={user} onClose={closeAllModals} onChangePlan={handleChangePlan}/>}
                {isFeedbackModalOpen && <FeedbackModal onClose={closeAllModals} />}
            </Suspense>
        </div>
    );
};

export default App;