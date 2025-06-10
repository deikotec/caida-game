"use client";

import { auth } from '@/lib/firebase';
import { useUserStore } from '@/stores/useUserStore';
import Image from 'next/image';
import { FiLogOut } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';

export default function UserProfile() {
    const { user } = useUserStore();

    if (!user) return null;

    return (
        // Contenedor principal optimizado para móviles
        <div className="w-full max-w-sm flex flex-col items-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl text-white shadow-lg border border-gray-700">
            <Image
                src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName}`}
                alt={user.displayName || 'Avatar'}
                width={80}
                height={80}
                className="rounded-full border-4 border-teal-400 object-cover"
            />
            <h2 className="mt-4 text-2xl font-bold text-center">{user.displayName}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>

            <div className="flex items-center justify-center mt-4 bg-gray-700/60 px-4 py-2 rounded-full">
                <FaCoins className="text-yellow-400 mr-2" />
                <span className="font-semibold">{user.coins} monedas</span>
            </div>

            <button
                onClick={() => auth.signOut()}
                className="mt-6 flex items-center justify-center w-full px-4 py-2 bg-red-600 hover:bg-red-700 font-semibold rounded-lg transition-colors duration-300"
            >
                <FiLogOut className="mr-2" />
                Cerrar Sesión
            </button>
        </div>
    );
}