// src/components/CardComponent.js
// ---------------------------
// Componente que muestra una carta:
// – Puede mostrarse boca abajo (`isFaceDown = true`) o boca arriba con su palo y rango.
// Resalta la carta si es jugable y llama a `onClick(card)` cuando el usuario hace click (si `isPlayable`).

import React from 'react';
import { Zap } from 'lucide-react';
import { SUITS_DATA, RANKS_DATA } from '../constants';

function CardComponent({
  card,
  onClick,
  isPlayable = false,
  isFaceDown = false,
  className = ""
}) {
  if (isFaceDown) {
    return (
      <div
        className={`
          w-16 h-24 md:w-20 md:h-[116px]
          bg-slate-600 border-2 border-slate-500 rounded-lg
          shadow-md flex items-center justify-center
          ${className}
        `}
      >
        <Zap size={32} className="text-slate-400 opacity-50" />
      </div>
    );
  }

  if (
    !card ||
    !card.rank ||
    !card.suit ||
    !SUITS_DATA[card.suit] ||
    !RANKS_DATA[card.rank]
  ) {
    return (
      <div
        className={`
          w-16 h-24 md:w-20 md:h-[116px]
          bg-red-200 border-2 border-red-400 rounded-lg
          shadow-md flex items-center justify-center
          text-xs text-red-700 p-1 ${className}
        `}
      >
        Carta Inv\u00e1lida
      </div>
    );
  }

  const suitInfo = SUITS_DATA[card.suit];
  const rankInfo = RANKS_DATA[card.rank];

  return (
    <button
      onClick={onClick && isPlayable ? () => onClick(card) : undefined}
      disabled={!isPlayable}
      title={`${rankInfo.long} de ${suitInfo.name}`}
      className={`
        relative w-16 h-24 md:w-20 md:h-[116px]
        bg-white border-2 ${suitInfo.borderColor} rounded-lg shadow-lg
        flex flex-col items-center justify-between p-1.5
        transform transition-all ease-out duration-150
        ${isPlayable
          ? 'cursor-pointer hover:scale-105 hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
          : 'cursor-default opacity-90'}
        ${suitInfo.color} ${className}
      `}
    >
      <div className="absolute top-1 left-1.5 flex flex-col items-center">
        <span className="text-lg md:text-xl font-bold leading-none">
          {rankInfo.display}
        </span>
        <div className="w-3 h-3 md:w-4 md:h-4">{suitInfo.icon}</div>
      </div>
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center transform rotate-180">
        <span className="text-lg md:text-xl font-bold leading-none">
          {rankInfo.display}
        </span>
        <div className="w-3 h-3 md:w-4 md:h-4">{suitInfo.icon}</div>
      </div>

      <div className={`flex-grow flex items-center justify-center text-3xl md:text-4xl ${suitInfo.color} opacity-60`}>
        {['S', 'C', 'R'].includes(card.rank) ? (
          <span className="font-black">{rankInfo.display}</span>
        ) : (
          <div className="w-8 h-8 md:w-10 md:h-10">{suitInfo.icon}</div>
        )}
      </div>
    </button>
  );
}

export default CardComponent;
