import React from 'react';
import { AuthUser, UserRole } from '../types';
import { XCircleIcon, UserIcon } from './icons';

interface AccountModalProps {
  user: AuthUser;
  onClose: () => void;
  onLogout: () => void;
  onManagePlan: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ user, onClose, onLogout, onManagePlan }) => {

  const planBenefits = {
    [UserRole.BASIC]: ["10 generaciones/mes", "Acceso a guías de la comunidad"],
    [UserRole.STANDARD]: ["50 generaciones/mes", "Acceso a guías de la comunidad", "Aportar guías"],
    [UserRole.PRO]: ["Generaciones ilimitadas", "Soporte para imágenes y vídeos", "Acceso prioritario a betas"],
    [UserRole.COLLABORATOR]: ["Beneficios de Pro", "Acceso al portal de colaborador"],
    [UserRole.ADMINISTRATOR]: ["Acceso total al sistema"],
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8 w-full max-w-md m-4 relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
            <UserIcon className="w-16 h-16 text-cyan-400 bg-gray-700 p-3 rounded-full mb-4"/>
            <h2 className="text-2xl font-bold text-white">{user.email}</h2>
            <p className="text-gray-400 mb-6">Rol: <span className="font-semibold text-cyan-400">{user.role}</span></p>

            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 w-full mb-6">
                <p className="text-sm text-gray-400">Generaciones restantes</p>
                <p className="text-3xl font-bold text-white">{user.remainingGenerations === Infinity ? '∞' : user.remainingGenerations}</p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 w-full mb-6 text-left">
                <h3 className="font-semibold text-white mb-2">Beneficios de tu plan:</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {planBenefits[user.role]?.map((benefit, i) => <li key={i}>{benefit}</li>) ?? <li>Beneficios no definidos.</li>}
                </ul>
            </div>


            <div className="w-full space-y-3">
                 <button 
                    onClick={onManagePlan}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    Gestionar Plan
                </button>
                <button onClick={onLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    Cerrar Sesión
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;