"use client";

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import CardComponent from '@/components/game/Card';
import PlayerInfo from '@/components/game/PlayerInfo';
import GameLog from '@/components/game/GameLog';
import CollectedPile from '@/components/game/CollectedPile';
import { ArrowLeft } from 'lucide-react';
import { useCaidaGameIA } from '@/hooks/useCaidaGameIA';

export default function GameRoomPage() {
    const router = useRouter();
    const { user } = useUserStore();
    const { gameState, dispatch } = useCaidaGameIA(user);

    if (gameState.status === 'idle' || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#280C0B]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#FFB22D]"></div>
            </div>
        );
    }

    const humanPlayer = gameState.players[user.uid];
    const aiPlayerId = Object.keys(gameState.players).find(id => id !== user.uid);
    if (!aiPlayerId) return null; // Esperando a que se inicialice el estado del oponente
    const aiPlayer = gameState.players[aiPlayerId];

    const isMyTurn = gameState.currentPlayerId === user.uid;

    return (
        <div className="h-screen w-screen flex flex-col bg-[#280C0B] text-white p-2 sm:p-4 gap-4" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cardboard-flat.png')" }}>
            <div className="w-full flex-grow flex flex-col lg:flex-row gap-4 overflow-hidden">
                <GameLog logs={gameState.log} />
                <main className="w-full lg:w-2/3 xl:w-3/4 bg-cover bg-center rounded-lg p-4 flex flex-col justify-between items-center gap-4 order-1 lg:order-2 relative" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')" }}>

                    {gameState.status === 'dealer_action' && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 text-center">
                            {gameState.dealerId === user.uid ? (
                                <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-[#560301]/90 border-2 border-[#FFB22D]">
                                    <h3 className="text-xl font-bold">Eres el repartidor. Elige el orden:</h3>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={() => dispatch({ type: 'CHOOSE_TABLE_ORDER', order: 'ascendente' })} className="p-4 bg-[#025300] hover:bg-green-800 rounded-lg">Ascendente (1, 2, 3, 4)</button>
                                        <button onClick={() => dispatch({ type: 'CHOOSE_TABLE_ORDER', order: 'descendente' })} className="p-4 bg-[#025300] hover:bg-green-800 rounded-lg">Descendente (4, 3, 2, 1)</button>
                                    </div>
                                </div>
                            ) : (
                                <h3 className="text-2xl font-bold animate-pulse">Esperando que {aiPlayer.profile.displayName} eche la mesa...</h3>
                            )}
                        </div>
                    )}

                    <PlayerInfo player={aiPlayer.profile} isOpponent={true} />
                    <CollectedPile count={aiPlayer.collected.length} isOpponent={true} />

                    <div className="flex justify-center items-center gap-2 -space-x-8 sm:-space-x-12">
                        {aiPlayer.hand.map((card, index) => (
                            <div
                                key={index}
                                className="relative"
                                style={{ zIndex: index, left: `${index * -30}px` }}
                            >
                                <CardComponent card={card} isFaceDown={true} />
                            </div>
                        ))}
                    </div>

                    <div className="flex-grow flex items-center justify-center p-4">
                        <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
                            {gameState.tableCards.map((card) => <CardComponent key={card.id} card={card} />)}
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-4">
                        {humanPlayer.hand.map((card) => (
                            <CardComponent key={card.id} card={card} isPlayable={isMyTurn} onClick={() => dispatch({ type: 'PLAY_CARD', playerId: user.uid, card })} />
                        ))}
                    </div>

                    <PlayerInfo player={{ ...humanPlayer.profile, coins: 1250 }} />
                    <CollectedPile count={humanPlayer.collected.length} />
                </main>
            </div>
        </div>
    );
}
