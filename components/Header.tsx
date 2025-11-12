import React from 'react';
import { AuthUser } from '../types';
import { UserIcon, TrophyIcon } from './icons';
import { adtLogo } from '../assets';

interface HeaderProps {
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onAccountClick: () => void;
  onHallOfFameClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLoginClick, onLogout, onAccountClick, onHallOfFameClick }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 sticky top-0 z-20 border-b border-gray-700/50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={adtLogo} alt="TUTORIAL 2.0 Logo" className="h-10 w-10"/>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            TUTORIAL 2.0
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {!user && onHallOfFameClick && (
            <button
              onClick={onHallOfFameClick}
              className="hidden sm:flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <TrophyIcon className="w-5 h-5 text-yellow-400"/>
              <span>Muro de la Fama</span>
            </button>
          )}

          {user ? (
            <>
              <button 
                onClick={onAccountClick} 
                className="flex items-center space-x-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                aria-label="Gestionar cuenta"
              >
                <UserIcon className="h-5 w-5 text-white"/>
                <span className="font-semibold text-white hidden sm:inline">{user.role}</span>
              </button>
              <button
                onClick={onLogout}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition duration-200 hidden sm:block"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;