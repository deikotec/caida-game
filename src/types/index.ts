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
