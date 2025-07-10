import {
    doc, setDoc, getDoc, Timestamp, collection, addDoc, runTransaction, arrayUnion, serverTimestamp
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { UserProfile, GameRoom, Card } from "@/types";
import { createDeck, shuffleDeck } from "./game-logic";

// Función existente (sin cambios)
export const createUserProfile = async (user: User, displayName?: string): Promise<UserProfile> => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUserProfile: UserProfile = {
            uid: user.uid,
            displayName: displayName || user.displayName || `Jugador${user.uid.substring(0, 4)}`,
            email: user.email,
            photoURL: user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${displayName || user.email}`,
            coins: 100,
            gamesPlayed: 0,
            gamesWon: 0,
            currentRoomId: null,
            createdAt: Timestamp.now(),
        };
        await setDoc(userRef, newUserProfile);
        return newUserProfile;
    } else {
        const existingData = userSnap.data();
        return {
            ...existingData,
            uid: user.uid,
        } as UserProfile;
    }
};

// Función createGameRoom (CORREGIDA)
export const createGameRoom = async (user: UserProfile): Promise<string> => {
    if (!user || !user.uid) {
        throw new Error("El usuario debe estar autenticado para crear una sala.");
    }

    const newRoomData: Omit<GameRoom, 'roomId'> = {
        hostId: user.uid,
        players: [user.uid],
        playerNicknames: { [user.uid]: user.displayName || 'Anfitrión' },
        status: 'waiting',
        mode: 'caida',
        bet: 10,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        deck: [],
        hands: { [user.uid]: [] },
        tableCards: [],
        scores: { [user.uid]: 0 },
        currentPlayerId: null,
        lastPlayedCard: null,
        lastPlayerToCapture: null,
        roundStarter: user.uid,
        winnerId: null,
        gameLog: [{
            message: 'Sala creada. Esperando oponente...',
            // CORRECCIÓN: Usamos Timestamp.now() en lugar de serverTimestamp()
            timestamp: Timestamp.now(),
            type: 'system'
        }]
    };

    const docRef = await addDoc(collection(db, 'rooms'), newRoomData);
    return docRef.id;
};

// NUEVA FUNCIÓN: Unirse a una sala
export const joinGameRoom = async (roomId: string, user: UserProfile) => {
    const roomRef = doc(db, "rooms", roomId);
    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) { throw new Error("¡La sala ya no existe!"); }

        const roomData = roomDoc.data() as GameRoom;
        if (roomData.players.length >= 2) { return; }
        if (roomData.players.includes(user.uid)) { return; }

        transaction.update(roomRef, {
            players: arrayUnion(user.uid),
            [`playerNicknames.${user.uid}`]: user.displayName || 'Oponente',
            [`scores.${user.uid}`]: 0,
            gameLog: arrayUnion({
                message: `${user.displayName || 'Un jugador'} se ha unido.`,
                timestamp: serverTimestamp(),
                type: 'system'
            })
        });
    });
};

// NUEVA FUNCIÓN: Empezar la partida
export const startGame = async (roomId: string) => {
    const roomRef = doc(db, "rooms", roomId);
    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) { throw new Error("La sala no existe."); }

        const roomData = roomDoc.data() as GameRoom;
        if (roomData.status !== 'waiting' || roomData.players.length < 2) {
            throw new Error("No se puede iniciar la partida (se necesitan 2 jugadores).");
        }

        const deck = shuffleDeck(createDeck());
        const hands: { [key: string]: Card[] } = {};
        roomData.players.forEach(playerId => {
            hands[playerId] = deck.splice(0, 3);
        });

        const tableCards = deck.splice(0, 4);

        transaction.update(roomRef, {
            status: 'in_progress',
            deck: deck,
            hands: hands,
            tableCards: tableCards,
            currentPlayerId: roomData.players[0],
            roundStarter: roomData.players[0],
            updatedAt: serverTimestamp(),
            gameLog: arrayUnion({
                message: '¡La partida ha comenzado!',
                timestamp: serverTimestamp(),
                type: 'system'
            })
        });
    });
};