import { Card } from '@/types';

// --- CONSTANTES DEL JUEGO (ACTUALIZADAS) ---
export const SUITS_DATA = {
    'O': { name: 'Oros' },
    'C': { name: 'Copas' },
    'E': { name: 'Espadas' },
    'B': { name: 'Bastos' }
};

// Se añade 'rankValue' para determinar la carta más alta en el sorteo inicial.
export const RANKS_DATA: { [key: string]: { display: string; long: string; value: number; caidaPoints: number; rankValue: number; } } = {
    '1': { display: 'A', long: 'As', value: 1, caidaPoints: 1, rankValue: 1 },
    '2': { display: '2', long: 'Dos', value: 1, caidaPoints: 1, rankValue: 2 },
    '3': { display: '3', long: 'Tres', value: 1, caidaPoints: 1, rankValue: 3 },
    '4': { display: '4', long: 'Cuatro', value: 1, caidaPoints: 1, rankValue: 4 },
    '5': { display: '5', long: 'Cinco', value: 1, caidaPoints: 1, rankValue: 5 },
    '6': { display: '6', long: 'Seis', value: 1, caidaPoints: 1, rankValue: 6 },
    '7': { display: '7', long: 'Siete', value: 1, caidaPoints: 1, rankValue: 7 },
    'S': { display: 'S', long: 'Sota', value: 2, caidaPoints: 2, rankValue: 10 },
    'C': { display: 'C', long: 'Caballo', value: 3, caidaPoints: 3, rankValue: 11 },
    'R': { display: 'R', long: 'Rey', value: 4, caidaPoints: 4, rankValue: 12 }
};

export const GAME_TARGET_SCORE = 24;
export const MESA_LIMPIA_BONUS = 4;

// --- FUNCIONES BÁSICAS DE BARAJA ---

export const createDeck = (): Card[] => {
    const deck: Card[] = [];
    Object.keys(SUITS_DATA).forEach(suit => {
        Object.keys(RANKS_DATA).forEach(rank => {
            deck.push({ id: `${rank}${suit}`, rank, suit });
        });
    });
    return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// --- NUEVAS FUNCIONES DE LÓGICA DE JUEGO ---

/**
 * Determina el repartidor inicial sacando una carta al azar para cada jugador.
 * @param playerIds - Un array con los UIDs de los jugadores.
 * @returns El UID del jugador que sacó la carta más alta.
 */
export const determineFirstDealer = (playerIds: string[]): { dealerId: string; drawDetails: { playerId: string, card: Card }[] } => {
    let deck = shuffleDeck(createDeck());
    const drawnCards: { playerId: string, card: Card }[] = [];
    let highestCardValue = -1;
    let winners: string[] = [];

    playerIds.forEach(id => {
        const card = deck.pop()!;
        drawnCards.push({ playerId: id, card });
        const cardValue = RANKS_DATA[card.rank].rankValue;

        if (cardValue > highestCardValue) {
            highestCardValue = cardValue;
            winners = [id];
        } else if (cardValue === highestCardValue) {
            winners.push(id);
        }
    });

    if (winners.length > 1) {
        // En caso de empate, se repite el sorteo solo con los ganadores.
        return determineFirstDealer(winners);
    }

    return { dealerId: winners[0], drawDetails: drawnCards };
};


/**
 * Evalúa las 4 cartas iniciales de la mesa.
 * @param tableCards - Las 4 cartas en la mesa.
 * @param sequence - La secuencia cantada por el repartidor.
 * @returns Un objeto con el resultado.
 */
export const checkMesaEchada = (tableCards: Card[], sequence: 'ascendente' | 'descendente'): { type: 'mal_echada' | 'bien_echada' | 'invalida', points: number } => {
    const ranks = tableCards.map(c => c.rank);
    if (new Set(ranks).size !== ranks.length) {
        return { type: 'invalida', points: 0 }; // Regla: no puede haber números repetidos.
    }

    const sequenceRanks = sequence === 'ascendente' ? ['1', '2', '3', '4'] : ['4', '3', '2', '1'];
    let points = 0;

    tableCards.forEach((card, index) => {
        if (card.rank === sequenceRanks[index]) {
            points += RANKS_DATA[card.rank].value;
        }
    });

    if (points > 0) {
        return { type: 'bien_echada', points };
    } else {
        return { type: 'mal_echada', points: 1 };
    }
};

/**
 * Detecta si un conjunto de cartas recogidas forma un "canto".
 * @param collectedCards - Las cartas que un jugador ha recogido.
 * @returns El canto de mayor valor, o null.
 */
export const detectCantos = (collectedCards: Card[]): { name: string, points: number, autoWin: boolean } | null => {
    if (!collectedCards || collectedCards.length < 3) return null;

    const ranks = collectedCards.map(c => c.rank);
    const rankCounts = ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const foundCantos = [];

    // Trivilín (3 iguales)
    const trivilinRank = Object.keys(rankCounts).find(r => rankCounts[r] === 3);
    if (trivilinRank) {
        // La regla de primera/última mano se debe aplicar fuera de esta función.
        const points = trivilinRank === 'R' ? GAME_TARGET_SCORE : 5;
        foundCantos.push({ name: `Trivilín de ${RANKS_DATA[trivilinRank].long}`, points, autoWin: trivilinRank === 'R' });
    }

    // Registro (1, 11, 12 - o As, Caballo, Rey)
    if (['1', 'C', 'R'].every(r => ranks.includes(r))) {
        foundCantos.push({ name: 'Registro', points: 8, autoWin: false });
    }

    // Vigía (Par + carta secuencial)
    const pairRankForVigia = Object.keys(rankCounts).find(r => rankCounts[r] === 2);
    if (pairRankForVigia) {
        const otherCards = ranks.filter(r => r !== pairRankForVigia);
        if (otherCards.length > 0) {
            const pairValue = RANKS_DATA[pairRankForVigia].rankValue;
            const otherValue = RANKS_DATA[otherCards[0]].rankValue;
            if (Math.abs(pairValue - otherValue) === 1) {
                foundCantos.push({ name: `Vigía de ${RANKS_DATA[pairRankForVigia].long}`, points: 7, autoWin: false });
            }
        }
    }

    // Patrulla (Secuencia de 3)
    const sortedUniqueValues = [...new Set(ranks.map(r => RANKS_DATA[r].rankValue))].sort((a, b) => a - b);
    if (sortedUniqueValues.length >= 3) {
        for (let i = 0; i <= sortedUniqueValues.length - 3; i++) {
            if (sortedUniqueValues[i] + 1 === sortedUniqueValues[i + 1] && sortedUniqueValues[i + 1] + 1 === sortedUniqueValues[i + 2]) {
                foundCantos.push({ name: 'Patrulla', points: 6, autoWin: false });
                break;
            }
        }
    }

    // Ronda (Par)
    const pairRankForRonda = Object.keys(rankCounts).find(r => rankCounts[r] === 2);
    if (pairRankForRonda) {
        foundCantos.push({ name: `Ronda de ${RANKS_DATA[pairRankForRonda].long}`, points: RANKS_DATA[pairRankForRonda].caidaPoints, autoWin: false });
    }

    if (foundCantos.length === 0) return null;

    // Devolver el canto de mayor valor
    return foundCantos.sort((a, b) => b.points - a.points)[0];
};

/**
 * Calcula los puntos al final de una ronda según el "cupo" de cartas.
 */
export const calculateEndOfRoundPoints = (collectedCardsCount: number, playerCount: number, playerRole: 'repartidor' | 'normal') => {
    let cupo = 0;
    if (playerCount === 2) {
        cupo = 20;
    } else if (playerCount === 4) {
        cupo = 10;
    } else if (playerCount === 3) {
        cupo = playerRole === 'repartidor' ? 14 : 13;
    }

    const bonusPoints = collectedCardsCount - cupo;
    return bonusPoints > 0 ? bonusPoints : 0;
};
/**
 * Calcula los puntos totales de un jugador al final de la partida.
 * @param collectedCards - Las cartas recogidas por el jugador.
 * @param playerCount - Número total de jugadores.
 * @param playerRole - Rol del jugador ('repartidor' o 'normal').
 * @returns El total de puntos del jugador.
 */
export const calculateTotalPoints = (collectedCards: Card[], playerCount: number, playerRole: 'repartidor' | 'normal'): number => {
    const basePoints = collectedCards.reduce((total, card) => total + RANKS_DATA[card.rank].caidaPoints, 0);
    const endOfRoundPoints = calculateEndOfRoundPoints(collectedCards.length, playerCount, playerRole);
    return basePoints + endOfRoundPoints;
}
/**
 * 
 * @param collectedCards - Las cartas recogidas por el jugador.
 * @param playerCount - Número total de jugadores.
 * @param playerRole - Rol del jugador ('repartidor' o 'normal').
 * @returns Un objeto con el total de puntos y los puntos por ronda.
 **/

export const calculateTotalPointsWithRounds = (collectedCards: Card[], playerCount: number, playerRole: 'repartidor' | 'normal'): { totalPoints: number; roundPoints: number } => {
    const basePoints = collectedCards.reduce((total, card) => total + RANKS_DATA[card.rank].caidaPoints, 0);
    const roundPoints = calculateEndOfRoundPoints(collectedCards.length, playerCount, playerRole);
    const totalPoints = basePoints + roundPoints;
    return { totalPoints, roundPoints };
}

/**
 * Verifica si un jugador ha ganado la partida.
 * @param scores - Objeto con los puntajes de cada jugador.
 * @returns El UID del jugador ganador, o null si no hay ganador.
 */
export const checkForGameWinner = (scores: { [playerId: string]: number }): string | null => {
    for (const playerId in scores) {
        if (scores[playerId] >= GAME_TARGET_SCORE) {
            return playerId; // Retorna el UID del jugador ganador.
        }
    }
    return null; // No hay ganador aún. 
}

