import React from 'react';
import { WandIcon, UserIcon, CodeBracketIcon } from './icons';

interface GuestViewProps {
  onLogin: () => void;
}

const FeatureCard: React.FC<{ Icon: React.ElementType; title: string; children: React.ReactNode }> = ({ Icon, title, children }) => (
  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
    <Icon className="h-10 w-10 text-cyan-400 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{children}</p>
  </div>
);

export const GuestView: React.FC<GuestViewProps> = ({ onLogin }) => {
  return (
    <div className="text-center py-16 px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
        Tu Asistente Digital de Tareas con IA
      </h1>
      <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
        Genera guías paso a paso para cualquier tarea, explora el conocimiento de la comunidad y comparte tu propia experiencia.
      </p>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
        <FeatureCard Icon={WandIcon} title="Generación IA">
          Describe una tarea o sube una foto y obtén un tutorial detallado al instante.
        </FeatureCard>
        <FeatureCard Icon={UserIcon} title="Guías de la Comunidad">
          Accede a una biblioteca de guías creadas y validadas por otros usuarios como tú.
        </FeatureCard>
        <FeatureCard Icon={CodeBracketIcon} title="Aporta tu Conocimiento">
          ¿Eres un experto? Crea tus propias guías y ayuda a otros, ganando reconocimiento.
        </FeatureCard>
      </div>

      <button
        onClick={onLogin}
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg shadow-lg"
      >
        Únete Gratis o Inicia Sesión
      </button>
    </div>
  );
};