import React, { useState, useCallback, useEffect } from 'react';
import { UserRole, GeneratedProcess, ImageFile, AuthUser, TaskPriority, TaskComplexity } from './types';
import Header from './components/Header';
import { TaskInputForm } from './components/TaskInputForm';
import { ProcessOutput } from './components/ProcessOutput';
import { HistorySidebar } from './components/HistorySidebar';
import { generateTaskProcess } from './services/geminiService';
import * as apiService from './services/apiService';
import { SpinnerIcon } from './components/icons';
import { LoginModal, AuthView } from './components/LoginModal';
import { AccountModal } from './components/AccountModal';
import { CollaboratorView } from './components/CollaboratorView';
import { HallOfFameView } from './components/HallOfFameView';
import { AdminView } from './components/AdminView';
import { CommunityView } from './components/CommunityView';
import { ManagePlanModal } from './components/ManagePlanModal';
import { VerificationBanner } from './components/VerificationBanner';
import { FeedbackModal } from './components/FeedbackModal';

type ActiveView = 'generate' | 'community' | 'contribute' | 'halloffame' | 'admin';

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'loading' | 'ready'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const [generatedProcess, setGeneratedProcess] = useState<GeneratedProcess | null>(null);
  const [taskHistory, setTaskHistory] = useState<GeneratedProcess[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView>('login');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isManagePlanModalOpen, setIsManagePlanModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  const [activeView, setActiveView] = useState<ActiveView>('community');
  
  const [verificationBannerMessage, setVerificationBannerMessage] = useState<string | null>(null);

  const checkUserSession = useCallback(async () => {
    try {
      const sessionUser = await apiService.checkSession();
      setUser(sessionUser);
      if (sessionUser) {
        const history = await apiService.getHistory();
        setTaskHistory(history);
        if (activeView !== 'admin' && activeView !== 'contribute') {
            setActiveView('generate');
        }
      } else {
        setActiveView('community');
      }
    } catch (error) {
      console.error("Error al inicializar la sesión:", error);
      setActiveView('community');
    } finally {
      setAppStatus('ready');
    }
  }, [activeView]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const handleOpenAuthModal = (view: AuthView) => {
    setAuthModalView(view);
    setIsLoginModalOpen(true);
  };
  
  const handleLoginSuccess = useCallback(async (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    try {
        const history = await apiService.getHistory();
        setTaskHistory(history);
        setActiveView('generate');
    } catch(e) {
        console.error("Failed to fetch history after login", e);
    }
    setIsLoginModalOpen(false);
  }, []);

  const handleProcessUpdate = async (updatedProcess: GeneratedProcess) => {
    setGeneratedProcess(updatedProcess);
    await apiService.updateGuide(updatedProcess);
    setTaskHistory(prevHistory => 
      prevHistory.map(item => item.id === updatedProcess.id ? updatedProcess : item)
    );
  };
  
  const handleContribute = async (guideData: Omit<GeneratedProcess, 'id' | 'author' | 'status'>) => {
      try {
          await apiService.addGuide(guideData);
          setActiveView('community');
      } catch (error) {
          console.error("Error al contribuir con la guía:", error);
          setError("No se pudo enviar tu guía. Inténtalo de nuevo.");
      }
  };

  const handleProcessGeneration = useCallback(async (
    description: string,
    complexity: TaskComplexity,
    priority: TaskPriority,
    image: ImageFile | null
  ) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setGeneratedProcess(null);
    
    try {
      const process = await generateTaskProcess(description, complexity, priority, image);
      setGeneratedProcess(process);
      
      const updatedHistory = await apiService.getHistory();
      setTaskHistory(updatedHistory);
      
      const updatedUser = await apiService.getUserData(user.email);
      setUser(updatedUser);

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Ha ocurrido un error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleSelectHistoryItem = useCallback((id: string) => {
    const selectedProcess = taskHistory.find(item => item.id === id);
    if (selectedProcess) {
        setGeneratedProcess(selectedProcess);
        setError(null);
        setActiveView('generate');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [taskHistory]);

  const handleClearHistory = useCallback(async () => {
      await apiService.clearHistory();
      setTaskHistory([]);
      setGeneratedProcess(null);
  }, []);
  
  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    setIsAccountModalOpen(false);
    setTaskHistory([]);
    setGeneratedProcess(null);
    setActiveView('community');
  };
  
  const handlePlanChange = async (newRole: UserRole) => {
      if(user) {
        const updatedUser = await apiService.changePlan(user.email, newRole);
        setUser(updatedUser);
        setIsManagePlanModalOpen(false);
      }
  };

  const handleResendVerification = async () => {
      try {
          await apiService.resendVerificationEmail();
          setVerificationBannerMessage("¡Correo reenviado! Revisa tu bandeja de entrada.");
          setTimeout(() => setVerificationBannerMessage(null), 4000);
      } catch (error) {
          console.error(error);
          setVerificationBannerMessage("Error al reenviar el correo. Inténtalo de nuevo más tarde.");
          setTimeout(() => setVerificationBannerMessage(null), 4000);
      }
  };
  
  const handleManagePlan = () => {
    setIsAccountModalOpen(false);
    setIsManagePlanModalOpen(true);
  };

  const GenerationView: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-3 lg:sticky lg:top-28">
        <HistorySidebar
          history={taskHistory}
          onSelectItem={handleSelectHistoryItem}
          onClearHistory={handleClearHistory}
          activeTaskId={generatedProcess?.id ?? null}
        />
      </aside>
      <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="xl:sticky xl:top-28">
         {user && <TaskInputForm
            userRole={user.role}
            onSubmit={handleProcessGeneration}
            isLoading={isLoading}
            remainingGenerations={user.remainingGenerations}
          />}
        </div>
        <div className="min-h-[400px]">
          <ProcessOutput
            process={generatedProcess}
            isLoading={isLoading}
            error={error}
            onProcessUpdate={handleProcessUpdate}
          />
        </div>
      </div>
    </div>
  );
  
  const renderActiveView = () => {
      switch (activeView) {
          case 'generate':
              return <GenerationView />;
          case 'community':
              return <CommunityView 
                onSelectGuide={(guide) => {
                    setGeneratedProcess(guide);
                    setActiveView('generate');
                }} 
                onAuthRequest={handleOpenAuthModal}
              />;
          case 'contribute':
             if (!user || ![UserRole.COLLABORATOR, UserRole.ADMINISTRATOR].includes(user.role)) {
                return (
                    <div className="text-center p-8 text-gray-400">
                        <h2 className="text-xl font-bold text-white">Acceso Restringido</h2>
                        <p>Debes ser un Colaborador para acceder a esta página.</p>
                    </div>
                );
            }
            return <CollaboratorView onContribute={handleContribute} />;
          case 'halloffame':
              return <HallOfFameView onBack={() => setActiveView('community')} />;
          case 'admin':
              return user?.role === UserRole.ADMINISTRATOR ? <AdminView /> : (
                 <div className="text-center p-8 text-gray-400">
                    <h2 className="text-xl font-bold text-white">Acceso Denegado</h2>
                    <p>Esta sección es solo para administradores.</p>
                </div>
              );
          default:
              return <CommunityView 
                onSelectGuide={(guide) => {
                    setGeneratedProcess(guide);
                    setActiveView('generate');
                }} 
                onAuthRequest={handleOpenAuthModal}
              />;
      }
  };
  
  if (appStatus === 'loading') {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
            <SpinnerIcon className="w-12 h-12 text-cyan-500" />
            <p className="mt-4 text-lg">Cargando aplicación...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
          user={user}
          activeView={activeView}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          onAccount={() => setIsAccountModalOpen(true)}
          onNavigate={setActiveView}
      />
      {user && !user.isVerified && <VerificationBanner onResend={handleResendVerification} message={verificationBannerMessage} />}
      <main className="container mx-auto p-4 md:p-8">
        {renderActiveView()}
      </main>
      <footer className="text-center p-6 text-gray-500 text-sm border-t border-gray-800 space-y-2 mt-8">
        <p>&copy; {new Date().getFullYear()} TUTORIAL 2.0. Todos los derechos reservados. | <button onClick={() => setIsFeedbackModalOpen(true)} className="text-cyan-400 hover:underline">Enviar Sugerencia</button></p>
        <p className="text-xs text-gray-600">Desarrollado con Gemini API. Los procesos generados son sugerencias y deben seguirse con precaución.</p>
      </footer>
      
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} initialView={authModalView} />}
      {isAccountModalOpen && user && (
        <AccountModal 
            user={user} 
            onClose={() => setIsAccountModalOpen(false)} 
            onLogout={handleLogout}
            onManagePlan={handleManagePlan}
        />
      )}
      {isManagePlanModalOpen && user && (
        <ManagePlanModal 
          user={user}
          onClose={() => setIsManagePlanModalOpen(false)}
          onChangePlan={handlePlanChange}
        />
      )}
      {isFeedbackModalOpen && <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />}
    </div>
  );
};

export default App;