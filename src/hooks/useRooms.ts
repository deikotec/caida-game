"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameRoom } from '@/types';

export const useRooms = () => {
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        // Creamos una consulta para traer las salas que están esperando jugadores.
        const q = query(
            collection(db, 'rooms'),
            where('status', '==', 'waiting')
            // Quitamos el orderBy por ahora para evitar errores de índice.
            // orderBy('createdAt', 'desc') 
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const roomsData: GameRoom[] = [];
            querySnapshot.forEach((doc) => {
                roomsData.push({ roomId: doc.id, ...doc.data() } as GameRoom);
            });
            setRooms(roomsData);
            setLoading(false);
        }, (err) => {
            console.error("Error al obtener las salas: ", err);
            setError(err);
            setLoading(false);
        });

        // Limpiamos el listener cuando el componente se desmonta
        return () => unsubscribe();
    }, []);

    return { rooms, loading, error };
};