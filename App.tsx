import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser, GeneratedProcess, TaskComplexity, ImageFile, TaskPriority, UserRole } from './types';
import * as apiService from './services/apiService';
import { firebaseState } from './services/firebase';

// Components
import Header from './components/Header';
import { TaskInputForm } from './components/TaskInputForm';
import { ProcessOutput } from './components/ProcessOutput';
import { HistorySidebar } from './components/HistorySidebar';
import LoginModal, { AuthView } from './components/LoginModal';
import AccountModal from './components/AccountModal';
import ManagePlanModal from './components/ManagePlanModal';
import SetupGuide from './components/SetupGuide';
import CommunityView from './components/CommunityView';
import CollaboratorView from './components/CollaboratorView';
import HallOfFameView from './components/HallOfFameView';
import AdminView from './components/AdminView';
import { VerificationBanner } from './components/VerificationBanner';
import FeedbackModal from './components/FeedbackModal';
import ChatAssistant from './components/ChatAssistant';
import { XCircleIcon } from './components/icons';

// Modal wrapper for the setup guide
const SetupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl m-4 relative animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="sticky top-4 right-4 float-right text-gray-400 hover:text-white transition-colors z-10">
                <XCircleIcon className="w-8 h-8" />
            </button>
            <div className="p-2">
              <SetupGuide />
            </div>
        </div>
    </div>
);


// Main App Component
const App: React.FC = () => {
    // App State
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [process, setProcess] = useState<GeneratedProcess | null>(null);
    const [history, setHistory] = useState<GeneratedProcess[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // View & Modal State
    type ActiveView = 'generate' | 'community' | 'contribute' | 'halloffame' | 'admin';
    const [activeView, setActiveView] = useState<ActiveView>('community');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<AuthView>('login');
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isManagePlanModalOpen, setIsManagePlanModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

    // --- Effects ---

    // Check user session on initial load
    useEffect(() => {
        if (firebaseState.isConfigured) {
            apiService.checkSession().then(sessionUser => {
                setUser(sessionUser);
                if (sessionUser) {
                    setActiveView('generate');
                } else {
                    setActiveView('community');
                }
            }).catch(console.error).finally(() => setIsCheckingSession(false));
        } else {
            setIsCheckingSession(false);
            setActiveView('community');
        }
    }, []);

    // Fetch user history when user logs in or changes
    const fetchHistory = useCallback(async () => {
        if (user) {
            try {
                const userHistory = await apiService.getHistory();
                setHistory(userHistory);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        } else {
            setHistory([]);
        }
    }, [user]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    // --- Handlers ---

    const handleGenerateProcess = async (description: string, complexity: TaskComplexity, priority: TaskPriority, image: ImageFile | null) => {
        setIsLoading(true);
        setError(null);
        setProcess(null);
        setActiveTaskId(null);
        try {
            const newProcess = await apiService.generateProcessProxy(description, complexity, priority, image);
            setProcess(newProcess);
            setHistory(prev => [newProcess, ...prev]);
            setActiveTaskId(newProcess.id);
            // Refresh user data to get updated generation count
            if(user) {
                const updatedUser = await apiService.getUserData(user.email);
                setUser(updatedUser);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectHistoryItem = (id: string) => {
        const selectedProcess = history.find(item => item.id === id);
        if (selectedProcess) {
            setProcess(selectedProcess);
            setActiveTaskId(id);
            setActiveView('generate');
        }
    };

    const handleClearHistory = async () => {
        if (window.confirm('¿Estás seguro de que quieres borrar todo tu historial? Esta acción no se puede deshacer.')) {
            await apiService.clearHistory();
            setHistory([]);
            setProcess(null);
            setActiveTaskId(null);
        }
    };
    
    const handleLoginSuccess = (loggedInUser: AuthUser) => {
        setUser(loggedInUser);
        setIsLoginModalOpen(false);
        setActiveView('generate');
    };
    
    const handleLogout = async () => {
        await apiService.logout();
        setUser(null);
        setProcess(null);
        setHistory([]);
        setActiveTaskId(null);
        setIsAccountModalOpen(false);
        setActiveView('community');
    };
    
    const handleOpenAuthModal = (view: AuthView) => {
        setAuthModalView(view);
        setIsLoginModalOpen(true);
    };

    const handleChangePlan = async (newRole: UserRole) => {
        if (!user) return;
        try {
            const updatedUser = await apiService.changePlan(user.email, newRole);
            setUser(updatedUser);
            alert(`¡Plan actualizado a ${newRole}!`);
            setIsManagePlanModalOpen(false);
            setIsAccountModalOpen(false);
        } catch (error) {
            console.error("Error changing plan:", error);
            alert("Hubo un error al cambiar tu plan.");
        }
    };
    
    const handleContribute = async (guideData: Omit<GeneratedProcess, 'id' | 'author' | 'status'>) => {
        try {
            await apiService.addGuide(guideData);
            // Optionally, refresh community guides or show a success message
        } catch (error) {
            console.error("Error contributing guide:", error);
            alert("Hubo un error al enviar tu guía.");
        }
    };
    
     const handleResendVerification = async () => {
        try {
            await apiService.resendVerificationEmail();
            setVerificationMessage('¡Correo de verificación reenviado! Revisa tu bandeja de entrada.');
            setTimeout(() => setVerificationMessage(null), 5000);
        } catch (error) {
             setVerificationMessage('Error al reenviar el correo. Inténtalo de nuevo más tarde.');
             setTimeout(() => setVerificationMessage(null), 5000);
        }
    };
    
    const handleNavigate = (view: ActiveView) => {
        if (!user && (view === 'generate' || view === 'contribute' || view === 'admin')) {
            handleOpenAuthModal('login');
            return;
        }
        if (view === 'generate') {
            setProcess(null);
            setActiveTaskId(null);
        }
        setActiveView(view);
    };

    // --- Render Logic ---

    if (isCheckingSession) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                 <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
            </div>
        );
    }
    
    const renderActiveView = () => {
        // Guest view guards
        if (!user && (activeView === 'generate' || activeView === 'contribute' || activeView === 'admin')) {
            return <CommunityView onSelectGuide={() => handleOpenAuthModal('login')} onAuthRequest={handleOpenAuthModal} onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)} />;
        }

        switch (activeView) {
            case 'generate':
                return (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            {user && <TaskInputForm userRole={user.role} onSubmit={handleGenerateProcess} isLoading={isLoading} remainingGenerations={user.remainingGenerations}/>}
                        </div>
                        <div className="lg:col-span-2">
                            <ProcessOutput process={process} isLoading={isLoading} error={error} onProcessUpdate={setProcess} />
                        </div>
                    </div>
                );
            case 'community':
                return <CommunityView onSelectGuide={user ? (guide) => { setProcess(guide); setActiveView('generate'); } : () => handleOpenAuthModal('login')} onAuthRequest={handleOpenAuthModal} onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)} />;
            case 'contribute':
                 if (!user || ![UserRole.COLLABORATOR, UserRole.ADMINISTRATOR].includes(user.role)) {
                    return <CommunityView onSelectGuide={() => handleOpenAuthModal('login')} onAuthRequest={handleOpenAuthModal} onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)} />;
                 }
                return <CollaboratorView onContribute={handleContribute}/>;
            case 'halloffame':
                return <HallOfFameView onBack={() => setActiveView(user ? 'generate' : 'community')} />;
            case 'admin':
                if (!user || user.role !== UserRole.ADMINISTRATOR) {
                     return <CommunityView onSelectGuide={() => handleOpenAuthModal('login')} onAuthRequest={handleOpenAuthModal} onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)} />;
                }
                return <AdminView />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            {!firebaseState.isConfigured && (
                 <div className="bg-yellow-500 text-black text-center p-2 text-sm font-semibold">
                    <span>
                        <strong>MODO DE DEMOSTRACIÓN:</strong> La aplicación se está ejecutando sin conexión. Para habilitar el guardado, el historial y las cuentas de usuario, por favor,{' '}
                        <button onClick={() => setIsSetupModalOpen(true)} className="underline hover:text-white font-bold">
                            configura tus claves de API de Firebase
                        </button>.
                    </span>
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

            {user && !user.isVerified && (
                <VerificationBanner onResend={handleResendVerification} message={verificationMessage}/>
            )}

            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                {user ? (
                    <div className="grid xl:grid-cols-4 gap-8">
                        <aside className="hidden xl:block xl:col-span-1">
                            <HistorySidebar
                                history={history}
                                onSelectItem={handleSelectHistoryItem}
                                onClearHistory={handleClearHistory}
                                activeTaskId={activeTaskId}
                            />
                        </aside>
                        <div className="xl:col-span-3">
                            {renderActiveView()}
                        </div>
                    </div>
                ) : (
                   renderActiveView()
                )}
            </main>

            <footer className="container mx-auto p-4 text-center text-gray-500 text-sm border-t border-gray-700/50">
                <div className="flex justify-between items-center">
                    <span>© {new Date().getFullYear()} TUTORIAL 2.0 - Creado con Google AI Studio</span>
                    <button onClick={() => setIsFeedbackModalOpen(true)} className="hover:text-cyan-400 hover:underline">
                        Enviar Sugerencias
                    </button>
                </div>
            </footer>
            
            {/* Modals & Floating Components */}
            {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} initialView={authModalView} />}
            {isAccountModalOpen && user && <AccountModal user={user} onClose={() => setIsAccountModalOpen(false)} onLogout={handleLogout} onManagePlan={() => setIsManagePlanModalOpen(true)} />}
            {isManagePlanModalOpen && user && <ManagePlanModal user={user} onClose={() => setIsManagePlanModalOpen(false)} onChangePlan={handleChangePlan} />}
            {isFeedbackModalOpen && <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />}
            {isSetupModalOpen && <SetupModal onClose={() => setIsSetupModalOpen(false)} />}
            {user && firebaseState.isConfigured && <ChatAssistant />}
        </div>
    );
};

export default App;