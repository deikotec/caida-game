// src/constants.js
// ---------------------------
// Contiene constantes globales para el juego de Ca\u00edda (Cartas espa\u00f1olas).

export const SUITS_DATA = {
  'O': { name: 'Oros', iconName: 'Coins', color: 'text-yellow-500', borderColor: 'border-yellow-500' },
  'C': { name: 'Copas', iconName: 'Heart', color: 'text-red-600', borderColor: 'border-red-600' },
  'E': { name: 'Espadas', iconName: 'Spade', color: 'text-green-600', borderColor: 'border-green-600' },
  'B': { name: 'Bastos', iconName: 'Club', color: 'text-blue-600', borderColor: 'border-blue-600' }
};

export const RANKS_DATA = {
  '1': { display: 'A', long: 'As', value: 1, caidaPoints: 1 },
  '2': { display: '2', long: 'Dos', value: 2, caidaPoints: 1 },
  '3': { display: '3', long: 'Tres', value: 3, caidaPoints: 1 },
  '4': { display: '4', long: 'Cuatro', value: 4, caidaPoints: 1 },
  '5': { display: '5', long: 'Cinco', value: 5, caidaPoints: 1 },
  '6': { display: '6', long: 'Seis', value: 6, caidaPoints: 1 },
  '7': { display: '7', long: 'Siete', value: 7, caidaPoints: 1 },
  'S': { display: 'S', long: 'Sota', value: 8, caidaPoints: 2 },
  'C': { display: 'C', long: 'Caballo', value: 9, caidaPoints: 3 },
  'R': { display: 'R', long: 'Rey', value: 10, caidaPoints: 4 }
};

export const PLAYER_ID_PREFIX = 'player_';
export const CPU_ID_PREFIX = 'cpu_';
export const GAME_TARGET_SCORE = 24;
export const MESA_LIMPIA_BONUS = 4;
export const CAPTURED_CARDS_THRESHOLD_FOR_BONUS = 20;
