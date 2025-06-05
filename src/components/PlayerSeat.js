// src/components/PlayerSeat.js
// ---------------------------
// Componente que muestra el “asiento” de un jugador en la mesa.
// Parámetros:
//  - playerProfile: { id, displayName, avatar }
//  - seatPosition: 'bottom' | 'top' | 'left' | 'right'
//  - hand: array de cartas
//  - isCurrentUser: booleano (si es el jugador humano actual)
//  - isCurrentTurn: booleano (si es el turno de este jugador)

import React from 'react';
import { Bot } from 'lucide-react';
import CardComponent from './CardComponent';

function PlayerSeat({ playerProfile, seatPosition, hand = [], isCurrentUser = false, isCurrentTurn = false }) {
  const positionClasses = {
    bottom: 'bottom-2 md:bottom-4 left-1/2 -translate-x-1/2',
    top: 'top-2 md:top-4 left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2 left-2 md:left-4',
    right: 'top-1/2 -translate-y-1/2 right-2 md:right-4'
  };

  const handOffset = hand.length > 1 ? (hand.length - 1) * -10 : 0;

  return (
    <div className={`absolute ${positionClasses[seatPosition]} flex flex-col items-center z-10`}>
      <div className={`p-1.5 md:p-2 bg-slate-800/80 rounded-lg shadow-xl backdrop-blur-sm mb-1.5 md:mb-2 border-2 ${isCurrentTurn ? 'border-yellow-400 animate-pulse' : 'border-transparent'}`}>
        <img
          src={playerProfile?.avatar || `https://placehold.co/64x64/cccccc/333333?text=${(playerProfile?.displayName || '?').charAt(0)}`}
          alt={playerProfile?.displayName}
          className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-sky-500 object-cover"
        />
        <p className="mt-1 text-[10px] md:text-xs font-semibold text-white truncate max-w-20 md:max-w-24 text-center">
          {playerProfile?.displayName || 'Jugador'}
        </p>
      </div>

      {!isCurrentUser && (
        <div className="flex justify-center items-end" style={{ marginLeft: `${handOffset}px` }}>
          {(hand || []).map((card, i) => (
            <div key={card?.id || i} className={`relative ${i > 0 ? 'ml-[-40px] md:ml-[-50px]' : ''}`}>
              <CardComponent card={card} isFaceDown={true} className="shadow-md" />
            </div>
          ))}
          {hand.length === 0 && (
            <div className="w-16 h-24 md:w-20 md:h-[116px] opacity-30 flex items-center justify-center">
              <Bot size={32} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayerSeat;
