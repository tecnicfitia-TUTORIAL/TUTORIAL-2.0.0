
import React, { useState, useCallback, useEffect } from 'react';
import { UserRole, TaskComplexity, GeneratedProcess, ImageFile, AuthUser, TaskPriority, GuideStatus } from './types';
import Header from './components/Header';
import { TaskInputForm } from './components/TaskInputForm';
import { ProcessOutput } from './components/ProcessOutput';
import { CollaboratorView } from './components/CollaboratorView';
import { LoginModal } from './components/LoginModal';
import { GuestView } from './components/GuestView';
import { AccountModal } from './components/AccountModal';
import { HistorySidebar } from './components/HistorySidebar';
import { generateTaskProcess } from './services/geminiService';
import { AdminView } from './components/AdminView';
import * as apiService from './services/apiService';
import { FeedbackModal } from './components/FeedbackModal';
import { SpinnerIcon } from './components/icons';
import { HallOfFameView } from './components/HallOfFameView';

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'loading' | 'ready'>('loading');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  
  const [generatedProcess, setGeneratedProcess] = useState<GeneratedProcess | null>(null);
  const [taskHistory, setTaskHistory] = useState<GeneratedProcess[]>([]);
  const [allGuides, setAllGuides] = useState<GeneratedProcess[]>([]);
  const [topContributors, setTopContributors] = useState<{ email: string; count: number }[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false); // For AI generation
  const [error, setError] = useState<string | null>(null);
  const [collaboratorView, setCollaboratorView] = useState<'generate' | 'contribute'>('generate');
  const [guestView, setGuestView] = useState<'main' | 'hallOfFame'>('main');

  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }

    const initializeApp = async () => {
      try {
        const [user, guides, contributors] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getGuides(),
          apiService.getTopContributors()
        ]);
        
        setAllGuides(guides);
        setTopContributors(contributors);
        if (user) {
          setCurrentUser(user);
          const history = await apiService.getHistory();
          setTaskHistory(history);
        }
      } catch (e) {
        console.error("Error al inicializar la aplicación:", e);
        setError("No se pudieron cargar los datos de la aplicación. Por favor, refresca la página.");
      } finally {
        setAppStatus('ready');
      }
    };
    initializeApp();
  }, []);
  
  const handleLogin = useCallback(async (email: string) => {
    try {
        const user = await apiService.login(email);
        setCurrentUser(user);
        const history = await apiService.getHistory();
        setTaskHistory(history);
        setLoginModalOpen(false);
        setGeneratedProcess(null);
        setError(null);
    } catch(e) {
        setError("Error al iniciar sesión.");
    }
  }, []);
  
  const handleLogout = useCallback(async () => {
    await apiService.logout();
    setCurrentUser(null);
    setAccountModalOpen(false);
    setTaskHistory([]);
    setGeneratedProcess(null);
  }, []);

  const handlePlanChange = useCallback((newRole: UserRole) => {
    if (!currentUser || currentUser.role === newRole) return;
    
    // En una aplicación real, esto redirigiría a una pasarela de pago como Stripe.
    // Aquí simulamos esa acción con una alerta para demostrar el flujo.
    alert(`Serás redirigido a nuestra pasarela de pago segura para actualizar al plan ${newRole}.\n\n(Esta es una simulación. En un producto real, aquí se iniciaría el proceso de pago con Stripe).`);
    
    // TODO: Integrar aquí la redirección a Stripe Checkout.
    // Una vez el pago sea exitoso, un webhook de Stripe notificaría a nuestro backend,
    // y el backend actualizaría el rol del usuario en la base de datos.
    // El frontend vería el nuevo rol en la siguiente carga o a través de una actualización en tiempo real.
    
    setAccountModalOpen(false);
  }, [currentUser]);

  const handleProcessUpdate = async (updatedProcess: GeneratedProcess) => {
    setGeneratedProcess(updatedProcess);
    // Persist change in backend and then refetch all guides to ensure UI consistency
    await apiService.updateGuide(updatedProcess);
    const updatedGuides = await apiService.getGuides();
    setAllGuides(updatedGuides);
    // Also update history if the item exists there
    setTaskHistory(prevHistory => 
      prevHistory.map(item => item.id === updatedProcess.id ? updatedProcess : item)
    );
  };

  const handleContributeGuide = async (guideData: Omit<GeneratedProcess, 'id' | 'author' | 'status'>) => {
      if (!currentUser) return;
      // The backend will set author, authorEmail, status, and id
      await apiService.addGuide(guideData);
      
      const [updatedGuides, updatedContributors] = await Promise.all([
          apiService.getGuides(),
          apiService.getTopContributors()
      ]);
      setAllGuides(updatedGuides);
      setTopContributors(updatedContributors);
  };
  
  const handleUpdateGuideStatus = async (id: number, status: GuideStatus, moderatorFeedback?: string) => {
    const guide = allGuides.find(g => g.id === id);
    if (!guide) return;
    const updatedGuide = { ...guide, status, moderatorFeedback: moderatorFeedback || undefined };
    await apiService.updateGuide(updatedGuide);
    const [updatedGuides, updatedContributors] = await Promise.all([
        apiService.getGuides(),
        apiService.getTopContributors()
    ]);
    setAllGuides(updatedGuides);
    setTopContributors(updatedContributors);
  };

  const handleDeleteGuide = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta guía permanentemente? Esta acción no se puede deshacer.')) {
        await apiService.deleteGuide(id);
        const [updatedGuides, updatedContributors] = await Promise.all([
            apiService.getGuides(),
            apiService.getTopContributors()
        ]);
        setAllGuides(updatedGuides);
        setTopContributors(updatedContributors);
    }
  };


  const handleProcessGeneration = useCallback(async (
    description: string,
    complexity: TaskComplexity,
    priority: TaskPriority,
    image: ImageFile | null
  ) => {
    if (!currentUser || currentUser.remainingGenerations <= 0) {
      setError("No tienes generaciones restantes.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedProcess(null);
    
    try {
      // This single call now handles generation, saving to history, and adding to public guides on the backend
      const process = await generateTaskProcess(description, complexity, priority, image);
      setGeneratedProcess(process);
      
      // Refetch data to update the UI
      const [updatedHistory, updatedGuides, refreshedUser] = await Promise.all([
          apiService.getHistory(),
          apiService.getGuides(),
          apiService.getCurrentUser() // To get updated remainingGenerations
      ]);
      setTaskHistory(updatedHistory);
      setAllGuides(updatedGuides);
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      }

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Ha ocurrido un error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleSelectHistoryItem = useCallback((id: number) => {
    const selectedProcess = taskHistory.find(item => item.id === id) || allGuides.find(item => item.id === id);
    if (selectedProcess) {
        setGeneratedProcess(selectedProcess);
        setError(null);
        setGuestView('main'); // Ensure guest view returns to main screen if a guide is selected from another view
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [taskHistory, allGuides]);

  const handleClearHistory = useCallback(async () => {
      if(!currentUser) return;
      await apiService.clearHistory();
      setTaskHistory([]);
      setGeneratedProcess(null);
  }, [currentUser]);

  const GenerationView: React.FC<{ user: AuthUser }> = ({ user }) => (
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
          <TaskInputForm
            userRole={user.role}
            onSubmit={handleProcessGeneration}
            isLoading={isLoading}
            remainingGenerations={user.remainingGenerations}
          />
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
  
  const MainContent: React.FC<{ user: AuthUser }> = ({ user }) => {
    if (user.role === UserRole.ADMINISTRATOR) {
        return <AdminView 
            allGuides={allGuides} 
            onApprove={(id) => handleUpdateGuideStatus(id, GuideStatus.APPROVED)} 
            onRejectWithFeedback={(id, feedback) => handleUpdateGuideStatus(id, GuideStatus.REJECTED, feedback)}
            onDelete={handleDeleteGuide}
        />;
    }
    
    if (user.role === UserRole.COLLABORATOR) {
      return (
        <div>
            <div className="mb-6 border-b border-gray-700">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setCollaboratorView('generate')}
                        className={`px-3 py-2 font-medium text-sm rounded-t-md transition-colors ${
                            collaboratorView === 'generate'
                                ? 'border-b-2 border-cyan-500 text-cyan-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Generar Tareas
                    </button>
                    <button
                        onClick={() => setCollaboratorView('contribute')}
                        className={`px-3 py-2 font-medium text-sm rounded-t-md transition-colors ${
                            collaboratorView === 'contribute'
                                ? 'border-b-2 border-cyan-500 text-cyan-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Aportar Guía
                    </button>
                </nav>
            </div>
            {collaboratorView === 'generate' ? <GenerationView user={user} /> : <CollaboratorView onContribute={handleContributeGuide} />}
        </div>
      );
    }
    return <GenerationView user={user} />;
  };
  
  if (appStatus === 'loading') {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
            <SpinnerIcon className="w-12 h-12 text-cyan-500" />
            <p className="mt-4 text-lg">Cargando aplicación...</p>
        </div>
    );
  }

  const approvedGuides = allGuides.filter(guide => guide.status === GuideStatus.APPROVED);

  const renderGuestContent = () => {
    switch(guestView) {
      case 'hallOfFame':
        return <HallOfFameView topContributors={topContributors} onBack={() => setGuestView('main')} />;
      case 'main':
      default:
        return (
          <GuestView
            onLoginClick={() => setLoginModalOpen(true)}
            publicGuides={approvedGuides}
            onSelectGuide={handleSelectHistoryItem}
            selectedGuide={generatedProcess}
            onClearSelectedGuide={() => setGeneratedProcess(null)}
            onFeedbackClick={() => setFeedbackModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        user={currentUser} 
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onAccountClick={() => setAccountModalOpen(true)}
        onHallOfFameClick={() => setGuestView('hallOfFame')}
      />
      <main className="container mx-auto p-4 md:p-8">
        {error && !isLoginModalOpen && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
                <strong>Error:</strong> {error}
            </div>
        )}
        {currentUser ? (
            <MainContent user={currentUser} />
        ) : (
            renderGuestContent()
        )}
      </main>
      <footer className="text-center p-6 text-gray-500 text-sm border-t border-gray-800 space-y-2">
        <p>&copy; {new Date().getFullYear()} TUTORIAL 2.0. Todos los derechos reservados.</p>
        <p className="text-xs text-gray-600">Desarrollado con Gemini API. Los procesos generados son sugerencias y deben seguirse con precaución.</p>
      </footer>
      {isLoginModalOpen && (
        <LoginModal 
            onLogin={handleLogin}
            onClose={() => setLoginModalOpen(false)}
        />
      )}
      {isAccountModalOpen && currentUser && (
        <AccountModal
            user={currentUser}
            onClose={() => setAccountModalOpen(false)}
            onPlanChange={handlePlanChange}
        />
      )}
       {isFeedbackModalOpen && (
        <FeedbackModal
            onClose={() => setFeedbackModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
