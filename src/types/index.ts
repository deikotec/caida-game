import { Timestamp } from "firebase/firestore";

// Tipos existentes sin cambios...
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
    // Se añade el valor numérico para facilitar la ordenación.
    numericValue: number;
    displayRank: string; // Ej: "As", "Sota"
}

export interface GameLogEntry {
    message: string;
    // Se actualiza el tipo para incluir los del prototipo.
    type: 'system' | 'player' | 'opponent' | 'points';
    // Se simplifica el timestamp para que sea manejado por el cliente.
    timestamp?: Date;
}

// Interfaz de GameRoom adaptada para el juego de Caída.
// NOTA: Se ha simplificado para un juego 1 vs 1 (IA), como en el prototipo.
export interface GameRoom {
    roomId: string;
    hostId: string;
    players: string[]; // [humanId, aiId]
    status: 'waiting' | 'choosing_order' | 'in_progress' | 'round_over' | 'finished';
    createdAt: Timestamp;

    // Estado del juego de Caída
    deck: Card[];
    playerHand: Card[];
    opponentHand: Card[];
    tableCards: Card[];

    playerScore: number;
    opponentScore: number;
    playerCapturedCount: number;
    opponentCapturedCount: number;

    isPlayerTurn: boolean;
    lastCardPlayedByPreviousPlayerRank: string | null;
    lastPlayerToCapture: 'player' | 'opponent' | null;

    roundStarter: 'player' | 'opponent';
    handNumber: number;

    winner: 'player' | 'opponent' | null;
    gameLog: GameLogEntry[];
}
