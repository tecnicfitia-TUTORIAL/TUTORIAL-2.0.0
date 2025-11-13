import React from 'react';
import { AuthUser, UserRole } from '../types';
import { UserIcon, TrophyIcon, CodeBracketIcon, SparklesIcon, QuestionMarkCircleIcon } from './icons';
import { adtLogo } from '../assets';
import { AuthView } from './LoginModal';

type ActiveView = 'generate' | 'community' | 'contribute' | 'halloffame' | 'admin';

interface HeaderProps {
  user: AuthUser | null;
  activeView: ActiveView;
  onOpenAuthModal: (view: AuthView) => void;
  onLogout: () => void;
  onAccount: () => void;
  onNavigate: (view: ActiveView) => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    Icon: React.ElementType;
    label: string;
}> = ({ isActive, onClick, Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-cyan-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ user, activeView, onOpenAuthModal, onLogout, onAccount, onNavigate }) => {
  return (
    <header className="bg-gray-800/80 backdrop-blur-sm shadow-lg p-4 sticky top-0 z-20 border-b border-gray-700/50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={adtLogo} alt="TUTORIAL 2.0 Logo" className="h-10 w-10"/>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight hidden md:block">
            TUTORIAL 2.0
          </h1>
        </div>

        {user && (
            <nav className="hidden lg:flex items-center space-x-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700">
                <NavButton isActive={activeView === 'generate'} onClick={() => onNavigate('generate')} Icon={SparklesIcon} label="Generador IA" />
                <NavButton isActive={activeView === 'community'} onClick={() => onNavigate('community')} Icon={UserIcon} label="Guías Comunidad" />
                {[UserRole.COLLABORATOR, UserRole.ADMINISTRATOR].includes(user.role) && (
                    <NavButton isActive={activeView === 'contribute'} onClick={() => onNavigate('contribute')} Icon={CodeBracketIcon} label="Aportar Guía" />
                )}
                <NavButton isActive={activeView === 'halloffame'} onClick={() => onNavigate('halloffame')} Icon={TrophyIcon} label="Salón de la Fama" />
                {user.role === UserRole.ADMINISTRATOR && (
                    <NavButton isActive={activeView === 'admin'} onClick={() => onNavigate('admin')} Icon={QuestionMarkCircleIcon} label="Panel Admin" />
                )}
            </nav>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button onClick={onAccount} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                <UserIcon className="h-5 w-5"/>
                <span>Cuenta</span>
              </button>
              <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Salir
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => onNavigate('halloffame')}
                className="hidden sm:flex items-center space-x-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <TrophyIcon className="h-5 w-5" />
                <span>Salón de la Fama</span>
              </button>
              <button onClick={() => onOpenAuthModal('login')} className="text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Iniciar Sesión
              </button>
              <button onClick={() => onOpenAuthModal('register')} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Crear Usuario
              </button>
            </div>
          )}
        </div>
      </div>
       {user && (
            <nav className="lg:hidden flex items-center justify-center space-x-2 bg-gray-900/50 p-1 mt-4 rounded-lg border border-gray-700 overflow-x-auto">
                <NavButton isActive={activeView === 'generate'} onClick={() => onNavigate('generate')} Icon={SparklesIcon} label="Generador" />
                <NavButton isActive={activeView === 'community'} onClick={() => onNavigate('community')} Icon={UserIcon} label="Comunidad" />
                {[UserRole.COLLABORATOR, UserRole.ADMINISTRATOR].includes(user.role) && (
                    <NavButton isActive={activeView === 'contribute'} onClick={() => onNavigate('contribute')} Icon={CodeBracketIcon} label="Aportar" />
                )}
                <NavButton isActive={activeView === 'halloffame'} onClick={() => onNavigate('halloffame')} Icon={TrophyIcon} label="Fama" />
                {user.role === UserRole.ADMINISTRATOR && (
                     <NavButton isActive={activeView === 'admin'} onClick={() => onNavigate('admin')} Icon={QuestionMarkCircleIcon} label="Admin" />
                )}
            </nav>
        )}
    </header>
  );
};

export default Header;