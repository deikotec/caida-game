"use client";

import { useRooms } from '@/hooks/useRooms';
import { useRouter } from 'next/navigation';
import { Swords, Users, AlertTriangle } from 'lucide-react';

export default function RoomList() {
    const { rooms, loading, error } = useRooms();
    const router = useRouter();

    const handleJoinRoom = (roomId: string) => {
        // Aquí iría la lógica para unirse a la sala. Por ahora, solo navegamos.
        // En un futuro, updateDoc en la sala para añadir el UID del jugador.
        console.log(`Intentando unirse a la sala: ${roomId}`);
        router.push(`/room/${roomId}`);
    };

    if (loading) {
        return <div className="text-center text-slate-400">Buscando mesas...</div>;
    }

    if (error) {
        return <div className="text-center text-red-400 flex items-center justify-center"><AlertTriangle className="mr-2" />Error al cargar las mesas.</div>;
    }

    if (rooms.length === 0) {
        return <p className="text-center text-slate-500 italic mt-4">No hay mesas públicas disponibles en este momento. ¡Crea una!</p>;
    }

    return (
        <div className="space-y-4">
            {rooms.map((room) => (
                <div key={room.roomId} className="bg-slate-800/70 p-4 rounded-lg flex items-center justify-between shadow-md border border-slate-700 hover:border-sky-500 transition-all">
                    <div>
                        <h4 className="font-bold text-white">Mesa de {room.playerNicknames[room.hostId] || 'Anónimo'}</h4>
                        <p className="text-sm text-slate-400 flex items-center"><Swords size={14} className="mr-1.5" /> {room.mode}</p>
                        <p className="text-sm text-slate-400 flex items-center"><Users size={14} className="mr-1.5" /> {room.players.length} / 2 Jugadores</p>
                    </div>
                    <button onClick={() => handleJoinRoom(room.roomId)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Unirse
                    </button>
                </div>
            ))}
        </div>
    );
}