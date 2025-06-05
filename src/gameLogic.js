// src/gameLogic.js
// ---------------------------
// Contiene la l\u00f3gica pura del juego de Ca\u00edda (Cartas espa\u00f1olas):
// - Creaci\u00f3n y barajado de mazo
// - Preparaci\u00f3n de datos iniciales
// - Verificaci\u00f3n de cantos

import {
  SUITS_DATA,
  RANKS_DATA,
  PLAYER_ID_PREFIX,
  CPU_ID_PREFIX,
  GAME_TARGET_SCORE,
  MESA_LIMPIA_BONUS,
  CAPTURED_CARDS_THRESHOLD_FOR_BONUS
} from './constants';

export function createDeck() {
  const deck = [];
  Object.keys(SUITS_DATA).forEach(suit => {
    Object.keys(RANKS_DATA).forEach(rank => {
      deck.push({ id: `${rank}${suit}`, rank, suit });
    });
  });
  return deck;
}

export function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function prepareInitialGameData(hostUserId, cpuIndex = 1) {
  let deck = createDeck();
  shuffleInPlace(deck);

  const hostPlayerId = PLAYER_ID_PREFIX + hostUserId;
  const cpuPlayerId = CPU_ID_PREFIX + String(cpuIndex);

  const initialPlayerHand = [];
  const initialCpuHand = [];

  for (let i = 0; i < 3; i++) {
    if (deck.length > 0) initialPlayerHand.push(deck.pop());
    if (deck.length > 0) initialCpuHand.push(deck.pop());
  }

  const initialTableCards = [];
  const tableCardRanks = new Set();

  while (initialTableCards.length < 4 && deck.length > 0) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    const potentialCard = deck[randomIndex];
    if (!tableCardRanks.has(potentialCard.rank)) {
      tableCardRanks.add(potentialCard.rank);
      initialTableCards.push(deck.splice(randomIndex, 1)[0]);
    } else if (deck.filter(c => !tableCardRanks.has(c.rank)).length === 0) {
      console.warn("No fue posible encontrar 4 cartas de rangos \u00fanicos. Se usar\u00e1n las disponibles.");
      break;
    }
  }

  while (initialTableCards.length < 4 && deck.length > 0) {
    initialTableCards.push(deck.pop());
  }

  const initialScores = { [hostPlayerId]: 0, [cpuPlayerId]: 0 };

  return {
    hostPlayerId,
    cpuPlayerId,
    initialDeck: deck,
    hands: { [hostPlayerId]: initialPlayerHand, [cpuPlayerId]: initialCpuHand },
    tableCards: initialTableCards,
    scores: initialScores,
    roundStarter: hostPlayerId
  };
}

export function checkCantos(hand, isFirstHandOfTheGame) {
  if (!hand || hand.length !== 3) return null;

  const ranks = hand.map(c => c.rank);
  const values = hand.map(c => RANKS_DATA[c.rank].value);

  if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
    const rank = ranks[0];
    const puntos = isFirstHandOfTheGame ? GAME_TARGET_SCORE : 5;
    return {
      type: 'Tribil\u00edn',
      points: puntos,
      autoWin: isFirstHandOfTheGame,
      message: `\u00a1Tribil\u00edn de ${RANKS_DATA[rank].long}! ${
        isFirstHandOfTheGame
          ? 'Partida ganada autom\u00e1ticamente.'
          : `+${puntos} pts.`
      }`
    };
  }

  const hasAs = ranks.includes('1');
  const hasCaballo = ranks.includes('C');
  const hasRey = ranks.includes('R');
  if (hasAs && hasCaballo && hasRey) {
    return {
      type: 'Registro',
      points: 8,
      autoWin: false,
      message: '\u00a1Registro! (As, Caballo, Rey) \u2192 +8 pts.'
    };
  }

  const rankCounts = {};
  ranks.forEach(r => (rankCounts[r] = (rankCounts[r] || 0) + 1));
  const pairedRank = Object.keys(rankCounts).find(r => rankCounts[r] === 2);

  if (pairedRank) {
    const otherRank = ranks.find(r => r !== pairedRank);
    if (otherRank) {
      const pairedValue = RANKS_DATA[pairedRank].value;
      const otherValue = RANKS_DATA[otherRank].value;
      if (Math.abs(pairedValue - otherValue) === 1) {
        return {
          type: 'Vig\u00eda',
          points: 7,
          rank: pairedRank,
          autoWin: false,
          message: `\u00a1Vig\u00eda con par de ${RANKS_DATA[pairedRank].long}! \u2192 +7 pts.`
        };
      }
    }
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  if (
    sortedValues[0] + 1 === sortedValues[1] &&
    sortedValues[1] + 1 === sortedValues[2]
  ) {
    const rankSecuencia = ranks.find(
      r => RANKS_DATA[r].value === sortedValues[2]
    );
    return {
      type: 'Patrulla',
      points: 6,
      rank: rankSecuencia,
      autoWin: false,
      message: `\u00a1Patrulla! Secuencia ${sortedValues
        .map(v => Object.keys(RANKS_DATA).find(r => RANKS_DATA[r].value === v))
        .join('-')} \u2192 +6 pts.`
    };
  }

  if (pairedRank) {
    return {
      type: 'Ronda',
      points: RANKS_DATA[pairedRank].caidaPoints,
      rank: pairedRank,
      autoWin: false,
      message: `\u00a1Ronda de ${RANKS_DATA[pairedRank].long}! \u2192 +${RANKS_DATA[
        pairedRank
      ].caidaPoints} pts.`
    };
  }

  return null;
}
