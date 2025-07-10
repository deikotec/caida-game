"use client";

import { useUserStore } from '@/stores/useUserStore';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { Search, Bell, Gift, LogOut } from 'lucide-react';

export default function LobbyHeader() {
    const { user } = useUserStore();

    if (!user) return null;

    return (
        <header className="bg-slate-800/80 backdrop-blur-md shadow-md h-16 flex items-center justify-between px-6 shrink-0 border-b border-slate-700/60">
            <div className="relative hidden md:block">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="search" placeholder="Buscar juegos..." className="bg-slate-700/50 border border-slate-600/70 text-slate-300 text-sm rounded-lg pl-10 pr-3 py-2 w-64 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" />
            </div>

            <div className="flex items-center space-x-3 md:space-x-4 ml-auto">
                <button className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 font-semibold px-3 sm:px-5 py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-1 sm:space-x-1.5">
                    <Gift size={16} />
                    <span className="hidden sm:inline">Depositar</span>
                </button>
                <button className="text-slate-400 hover:text-sky-400 relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </button>
                <div className="flex items-center space-x-2 p-1 pr-2 sm:pr-3 rounded-lg bg-slate-700/50 border border-slate-600/70">
                    <Image
                        src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName}`}
                        alt="Avatar"
                        width={36}
                        height={36}
                        className="rounded-md object-cover"
                    />
                    <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-white leading-tight">{user.displayName}</p>
                        <p className="text-xs text-yellow-400 leading-tight">
                            {user.coins} Monedas
                        </p>
                    </div>
                </div>
                <button onClick={() => auth.signOut()} className="text-slate-400 hover:text-red-500 p-1.5 sm:p-2 rounded-md hover:bg-slate-700 transition-colors" title="Cerrar Sesión">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}