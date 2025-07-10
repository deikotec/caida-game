"use client";

import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LobbyHeader from '@/components/lobby/Header';
import RoomList from '@/components/lobby/RoomList';
import { createGameRoom } from '@/lib/firestore-actions';
import { Swords } from 'lucide-react';

export default function LobbyPage() {
    const { user, isLoading: isUserLoading } = useUserStore();
    const router = useRouter();
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    // Redirige al login si el usuario no está autenticado después de cargar.
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleCreateRoom = async () => {
        if (!user) {
            alert("Debes estar logueado para crear una sala.");
            return;
        }
        setIsCreatingRoom(true);
        try {
            const newRoomId = await createGameRoom(user);
            router.push(`/room/${newRoomId}`);
        } catch (error) {
            console.error(error);
            alert("Error al crear la sala. Inténtalo de nuevo.");
            setIsCreatingRoom(false);
        }
    };

    // Muestra un loader mientras se verifica el estado del usuario.
    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="w-16 h-16 border-4 border-t-transparent border-teal-400 border-solid rounded-full animate-spin"></div>
            </div>
        );
    }

    // Si el usuario no existe (y ya no está cargando), no renderiza nada para evitar un parpadeo.
    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
            <div className="flex-1 flex flex-col overflow-hidden">
                <LobbyHeader />

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                    <div className="relative bg-gradient-to-r from-sky-600 to-indigo-700 p-6 md:p-12 rounded-xl shadow-2xl mb-8 overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Juega Caída Española</h2>
                            <p className="text-md md:text-lg text-sky-200 mb-6 max-w-2xl">
                                Experimenta la emoción del clásico juego de cartas. ¡Crea tu mesa o únete a una existente!
                            </p>
                            <button
                                onClick={handleCreateRoom}
                                disabled={isCreatingRoom}
                                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <Swords size={20} />
                                <span>{isCreatingRoom ? 'Creando...' : 'Crear Partida de Caída'}</span>
                            </button>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-2xl font-semibold text-sky-300 mb-5">Mesas Públicas</h3>
                        <RoomList />
                    </section>
                </main>
            </div>
        </div>
    );
}
