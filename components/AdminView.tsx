import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import * as apiService from '../services/apiService';
import { SpinnerIcon, AlertTriangleIcon, CheckCircleIcon } from './icons';

interface AdminViewProps {}

const UserRow: React.FC<{ user: AuthUser }> = ({ user }) => {
    return (
        <tr className="border-b border-gray-700 hover:bg-gray-800/50">
            <td className="p-3 text-sm text-gray-300">{user.email}</td>
            <td className="p-3 text-sm text-gray-400">{user.role}</td>
            <td className="p-3 text-center">
                {user.isVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-green-300 bg-green-900/50">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Verificada
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-yellow-300 bg-yellow-900/50">
                        <AlertTriangleIcon className="w-3.5 h-3.5" />
                        Pendiente
                    </span>
                )}
            </td>
             <td className="p-3 text-sm text-center text-cyan-400 font-mono">
                {user.remainingGenerations === Infinity ? '∞' : user.remainingGenerations}
            </td>
        </tr>
    );
};

const AdminView: React.FC<AdminViewProps> = () => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setStatus('loading');
                const allUsers = await apiService.getAllUsersForAdmin();
                setUsers(allUsers);
                setStatus('ready');
            } catch (error) {
                console.error("Error fetching users for admin:", error);
                setStatus('error');
            }
        };

        fetchUsers();
    }, []);

    if (status === 'loading') {
        return <div className="flex justify-center items-center p-16"><SpinnerIcon className="w-12 h-12 text-cyan-500" /></div>;
    }

    if (status === 'error') {
        return <div className="text-center p-16 text-red-400">Error al cargar la lista de usuarios.</div>;
    }

    return (
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">Panel de Administración de Usuarios</h2>
            <p className="text-gray-400 mb-8">
                Visualiza todos los usuarios registrados, su rol y el estado de verificación de su cuenta.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-xs text-gray-300 uppercase">
                        <tr>
                            <th className="p-3">Email de Usuario</th>
                            <th className="p-3">Rol</th>
                            <th className="p-3 text-center">Verificación</th>
                            <th className="p-3 text-center">Generaciones Restantes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <UserRow key={user.uid} user={user} />
                        ))}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && <p className="text-center text-gray-400 py-8">No hay usuarios registrados.</p>}
        </div>
    );
};

export default AdminView;