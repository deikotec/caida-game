"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameRoom } from '@/types';

export const useGameRoom = (roomId: string | null) => {
    const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!roomId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const roomDocRef = doc(db, 'rooms', roomId);

        const unsubscribe = onSnapshot(roomDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setGameRoom({ roomId: docSnap.id, ...docSnap.data() } as GameRoom);
            } else {
                setError(new Error("La sala de juego no existe."));
                setGameRoom(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error al obtener la sala de juego: ", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [roomId]);

    return { gameRoom, loading, error };
};