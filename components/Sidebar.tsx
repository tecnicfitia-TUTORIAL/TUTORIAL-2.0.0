import React from 'react';
import { HomeIcon, PlaygroundIcon, CodeBracketIcon, DashboardIcon, BookOpenIcon, KeyIcon, ToolIcon, MenuIcon, UserIcon } from './icons';

const NavItem: React.FC<{
    Icon: React.ElementType;
    label: string;
    isActive?: boolean;
    hasChild?: boolean;
}> = ({ Icon, label, isActive = false, hasChild = false }) => (
    <a href="#" className={`flex items-center p-2 text-sm rounded-md ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'} transition-colors`}>
        <Icon className="w-5 h-5 mr-3" />
        <span className="flex-grow">{label}</span>
        {hasChild && <span className="text-xs font-bold text-gray-500">&gt;</span>}
    </a>
);

const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <img src="https://www.gstatic.com/a/services/prod/images/Google_AI_Studio_logo_2023_207213e8134700f1352f7b889508006b.svg" alt="Google AI Studio Logo" className="w-8 h-8"/>
                    <span className="font-semibold text-lg text-white">Google AI Studio</span>
                </div>
                <button className="p-1 rounded-md text-gray-400 hover:bg-gray-700">
                    <MenuIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-grow space-y-2">
                <NavItem Icon={HomeIcon} label="Home" isActive />
                <div className="pl-4 border-l border-gray-700 ml-4 space-y-1">
                     <a href="#" className="flex items-center p-2 text-sm rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">No prompts yet</a>
                </div>
                <NavItem Icon={PlaygroundIcon} label="Playground" />
                <NavItem Icon={CodeBracketIcon} label="Build" hasChild />
                <NavItem Icon={DashboardIcon} label="Dashboard" hasChild />
                <NavItem Icon={BookOpenIcon} label="Documentation" />
            </div>

            <div className="space-y-2 border-t border-gray-800 pt-4">
                <NavItem Icon={KeyIcon} label="Get API key" />
                <NavItem Icon={ToolIcon} label="Settings" />
                <div className="flex items-center p-2 space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">M</div>
                    <div className="text-sm">
                        <p className="text-white font-medium">tecnicfitia@tecnicalfi...</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
