import { Card } from '@/types';

// --- CONSTANTES DEL JUEGO (MIGRADAS DEL HTML) ---
export const SUITS = { 'O': 'Oros', 'C': 'Copas', 'E': 'Espadas', 'B': 'Bastos' };
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
export const RANK_DISPLAY = { '1': 'As', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', 'S': 'Sota', 'C': 'Caballo', 'R': 'Rey' };
export const RANKS_ORDERED_NUMERIC = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'S': 8, 'C': 9, 'R': 10 };
export const CARD_POINTS_CAIDA = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, 'S': 2, 'C': 3, 'R': 4 };
export const CANTO_POINTS_RONDA = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, 'S': 2, 'C': 3, 'R': 4 };
export const GAME_TARGET_SCORE = 24;
export const MESA_LIMPIA_BONUS = 4;
export const CAPTURED_CARDS_BONUS_THRESHOLD = 20;

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/teributu/image/upload/";
const RANK_TO_IMG: { [key: string]: string } = { '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', 'S': '10', 'C': '11', 'R': '12' };

// --- FUNCIONES DE BARAJA Y CARTAS ---
export function getCardImage(rank: string, suit: string): string {
    return `${CLOUDINARY_BASE_URL}${RANK_TO_IMG[rank]}${suit.toLowerCase()}.jpg`;
}

export function createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suitCode in SUITS) {
        for (const rank of RANKS) {
            deck.push({
                id: rank + suitCode,
                rank,
                suit: suitCode,
                displayRank: RANK_DISPLAY[rank as keyof typeof RANK_DISPLAY],
                numericValue: RANKS_ORDERED_NUMERIC[rank as keyof typeof RANKS_ORDERED_NUMERIC]
            });
        }
    }
    return deck;
};

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// --- LÓGICA DE CANTOS (MIGRADA Y ADAPTADA) ---
export const checkCantos = (hand: Card[], isFirstHandOfGame: boolean): { type: string, points: number, rank: string, autoWin: boolean } | null => {
    if (hand.length < 3) return null;
    const sortedHand = [...hand].sort((a, b) => a.numericValue - b.numericValue);
    const r = sortedHand.map(c => c.rank);
    const v = sortedHand.map(c => c.numericValue);
    let possibleCantos = [];

    if (v[0] === v[1] && v[1] === v[2]) {
        possibleCantos.push({ type: "Tribilín", points: isFirstHandOfGame ? GAME_TARGET_SCORE : 5, rank: r[0], autoWin: isFirstHandOfGame });
    }
    if (r.includes('1') && r.includes('C') && r.includes('R')) {
        possibleCantos.push({ type: "Registro", points: 8, rank: 'R', autoWin: false });
    }
    const isVigia = (v[0] === v[1] && v[2] === v[0] + 1) || (v[1] === v[2] && v[0] === v[1] - 1);
    if (isVigia) {
        possibleCantos.push({ type: "Vigía", points: 7, rank: v[0] === v[1] ? r[0] : r[1], autoWin: false });
    }
    if (v[0] + 1 === v[1] && v[1] + 1 === v[2]) {
        possibleCantos.push({ type: "Patrulla", points: 6, rank: r[2], autoWin: false });
    }
    if (v[0] === v[1] || v[1] === v[2]) {
        const rondaRank = (v[0] === v[1]) ? r[0] : r[1];
        possibleCantos.push({ type: "Ronda", points: CANTO_POINTS_RONDA[rondaRank as keyof typeof CANTO_POINTS_RONDA], rank: rondaRank, autoWin: false });
    }
    if (possibleCantos.length === 0) return null;
    return possibleCantos.sort((a, b) => b.points - a.points)[0];
};
