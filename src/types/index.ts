import { Timestamp } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    coins: number;
    gamesPlayed: number;
    gamesWon: number;
    currentRoomId: string | null;
    createdAt: Timestamp;
}

export interface Card {
    id: string; // Ej: "1O", "SE"
    rank: string; // Ej: "1", "S"
    suit: string; // Ej: "O", "E"
}

export interface GameLogEntry {
    message: string;
    timestamp: Timestamp | Date;
    type: 'system' | 'deal' | 'play' | 'capture' | 'canto' | 'score' | 'error';
    payload?: any; // Para guardar datos adicionales, como las cartas de un canto.
}

export interface GameRoom {
    roomId: string;
    hostId: string;
    players: string[];
    playerNicknames: { [key: string]: string };
    status: 'waiting' | 'choosing_dealer' | 'dealer_action' | 'in_progress' | 'round_over' | 'finished';
    mode: 'caida';
    bet: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // --- Estado detallado del juego ---
    initialDeckOrder?: Card[]; // Para el registro histórico de la partida.
    deck: Card[];
    hands: { [playerId: string]: Card[] };
    tableCards: Card[];
    collectedCards: { [playerId: string]: Card[] };
    scores: { [playerId: string]: number };

    // --- Control de Turnos y Rondas ---
    dealerId: string | null; // UID del repartidor actual
    manoId: string | null; // UID del jugador que es "mano"
    currentPlayerId: string | null;

    // --- Control de Jugadas ---
    lastPlayedCard: Card | null;
    lastPlayerToCapture: string | null;

    winnerId: string | null;
    gameLog: GameLogEntry[];
}