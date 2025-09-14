"use client";

import { useReducer, useEffect, useCallback } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { GameRoom, Card, GameLogEntry, UserProfile } from '@/types';
import * as GameLogic from '@/lib/game-logic';
import CardComponent from '@/components/game/Card';
import Image from 'next/image';

// --- ESTADO INICIAL Y REDUCTOR DEL JUEGO (ADAPTADO DEL HTML) ---

type GameState = Omit<GameRoom, 'roomId' | 'hostId' | 'createdAt' | 'players'> & {
    playerProfile: UserProfile | null;
    opponentProfile: { uid: string; displayName: string | null; photoURL: string | null; };
    isFirstHandOfGame: boolean;
    isDealingAutomatically: boolean;
    fullShuffledDeck: Card[];
};

const initialState: GameState = {
    playerProfile: null,
    opponentProfile: { uid: 'ai-player', displayName: 'CaidaBot', photoURL: `https://api.dicebear.com/8.x/initials/svg?seed=CaidaBot` },
    status: 'waiting',
    deck: [],
    fullShuffledDeck: [],
    playerHand: [],
    opponentHand: [],
    tableCards: [],
    playerScore: 0,
    opponentScore: 0,
    playerCapturedCount: 0,
    opponentCapturedCount: 0,
    isPlayerTurn: true,
    lastCardPlayedByPreviousPlayerRank: null,
    lastPlayerToCapture: null,
    roundStarter: 'player',
    handNumber: 0,
    winner: null,
    gameLog: [],
    isFirstHandOfGame: true,
    isDealingAutomatically: false,
};

type GameAction =
    | { type: 'RESET_GAME'; player: UserProfile }
    | { type: 'SET_TABLE_ORDER'; order: 'asc' | 'desc' }
    | { type: 'PLAY_CARD'; card: Card }
    | { type: 'PROCESS_PLAY'; playedCard: Card; currentPlayer: 'player' | 'opponent' }
    | { type: 'DEAL_HANDS' }
    | { type: 'CHECK_HAND_END' }
    | { type: 'END_ROUND' }
    | { type: 'SET_STATE'; payload: Partial<GameState> };

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'RESET_GAME': {
            const freshDeck = GameLogic.createDeck();
            const shuffledDeck = GameLogic.shuffleDeck(freshDeck);
            const fullDeck = [...shuffledDeck];

            const tableCards = [];
            let drawnRanks = new Set();
            while (tableCards.length < 4 && shuffledDeck.length > 0) {
                const card = shuffledDeck.shift()!;
                if (!drawnRanks.has(card.rank)) {
                    tableCards.push(card);
                    drawnRanks.add(card.rank);
                }
            }

            const roundStarter = Math.random() < 0.5 ? 'player' : 'opponent';

            return {
                ...initialState,
                playerProfile: action.player,
                status: 'choosing_order',
                deck: shuffledDeck,
                fullShuffledDeck: fullDeck,
                tableCards,
                roundStarter,
                isPlayerTurn: roundStarter === 'player',
                lastPlayerToCapture: roundStarter === 'player' ? 'opponent' : 'player',
                gameLog: [{ message: `${roundStarter === 'player' ? 'Eres' : 'El oponente es'} la mano.`, type: 'system' }]
            };
        }

        case 'SET_TABLE_ORDER': {
            let points = 0;
            const sequence = action.order === 'asc' ? ['1', '2', '3', '4'] : ['4', '3', '2', '1'];
            const sortedTableCards = [...state.tableCards].sort((a, b) => a.numericValue - b.numericValue);

            sortedTableCards.forEach((card, index) => {
                if (card.rank === sequence[index]) {
                    points += card.numericValue;
                }
            });

            let newPlayerScore = state.playerScore;
            let newOpponentScore = state.opponentScore;
            let logMessage: string;

            if (points === 0) {
                logMessage = `No hubo coincidencias. <strong>+1 pt</strong> para el ${state.roundStarter === 'player' ? 'oponente' : 'jugador'}.`;
                if (state.roundStarter === 'player') newOpponentScore += 1;
                else newPlayerScore += 1;
            } else {
                logMessage = `¡Coincidencias! <strong>+${points} pts</strong>.`;
                if (state.roundStarter === 'player') newPlayerScore += points;
                else newOpponentScore += points;
            }

            return {
                ...state,
                playerScore: newPlayerScore,
                opponentScore: newOpponentScore,
                status: 'in_progress',
                gameLog: [{ message: logMessage, type: 'points' }, ...state.gameLog]
            };
        }

        case 'PLAY_CARD': {
            if (!state.isPlayerTurn) return state;
            const cardIndex = state.playerHand.findIndex(c => c.id === action.card.id);
            if (cardIndex === -1) return state;

            const newHand = state.playerHand.filter(c => c.id !== action.card.id);

            return {
                ...state,
                playerHand: newHand,
                gameLog: [{ message: `Jugaste <strong>${action.card.displayRank} de ${GameLogic.SUITS[action.card.suit as keyof typeof GameLogic.SUITS]}</strong>.`, type: 'player' }, ...state.gameLog],
            };
        }

        case 'PROCESS_PLAY': {
            const { playedCard, currentPlayer } = action;
            let newPlayerScore = state.playerScore;
            let newOpponentScore = state.opponentScore;
            let newTableCards = [...state.tableCards];
            let newPlayerCapturedCount = state.playerCapturedCount;
            let newOpponentCapturedCount = state.opponentCapturedCount;
            let newLastPlayerToCapture: 'player' | 'opponent' | null = state.lastPlayerToCapture;
            const newLog = [...state.gameLog];

            if (state.lastCardPlayedByPreviousPlayerRank === playedCard.rank) {
                const caidaValue = GameLogic.CARD_POINTS_CAIDA[playedCard.rank as keyof typeof GameLogic.CARD_POINTS_CAIDA];
                newLog.unshift({ message: `¡Caída con ${playedCard.displayRank}! +${caidaValue} pts.`, type: currentPlayer === 'player' ? 'points' : 'opponent' });
                if (currentPlayer === 'player') newPlayerScore += caidaValue;
                else newOpponentScore += caidaValue;
            }

            let capturedCardsOnPlay: Card[] = [];
            const mainCaptureIndex = newTableCards.findIndex(c => c.rank === playedCard.rank);

            if (mainCaptureIndex > -1) {
                capturedCardsOnPlay.push(playedCard);
                const mainCapturedCard = newTableCards.splice(mainCaptureIndex, 1)[0];
                capturedCardsOnPlay.push(mainCapturedCard);
                newLog.unshift({ message: `${currentPlayer === 'player' ? 'Capturas' : 'Oponente captura'} ${mainCapturedCard.displayRank} con ${playedCard.displayRank}.`, type: 'player' });
                newLastPlayerToCapture = currentPlayer;

                newTableCards.sort((a, b) => a.numericValue - b.numericValue);
                let lastCapturedValue = mainCapturedCard.numericValue;
                let sequenceFound = true;
                while (sequenceFound) {
                    sequenceFound = false;
                    const nextInSequenceIndex = newTableCards.findIndex(c => c.numericValue === lastCapturedValue + 1);
                    if (nextInSequenceIndex > -1) {
                        const sequenceCard = newTableCards.splice(nextInSequenceIndex, 1)[0];
                        capturedCardsOnPlay.push(sequenceCard);
                        lastCapturedValue = sequenceCard.numericValue;
                        sequenceFound = true;
                    }
                }

                if (newTableCards.length === 0) {
                    newLog.unshift({ message: `¡Mesa Limpia! +${GameLogic.MESA_LIMPIA_BONUS} pts.`, type: 'points' });
                    if (currentPlayer === 'player') newPlayerScore += GameLogic.MESA_LIMPIA_BONUS;
                    else newOpponentScore += GameLogic.MESA_LIMPIA_BONUS;
                }

                if (currentPlayer === 'player') newPlayerCapturedCount += capturedCardsOnPlay.length;
                else newOpponentCapturedCount += capturedCardsOnPlay.length;

            } else {
                newTableCards.push(playedCard);
            }

            return {
                ...state,
                playerScore: newPlayerScore,
                opponentScore: newOpponentScore,
                tableCards: newTableCards,
                playerCapturedCount: newPlayerCapturedCount,
                opponentCapturedCount: newOpponentCapturedCount,
                lastPlayerToCapture: newLastPlayerToCapture,
                lastCardPlayedByPreviousPlayerRank: playedCard.rank,
                isPlayerTurn: !state.isPlayerTurn,
                gameLog: newLog,
            }
        }

        case 'SET_STATE': {
            return { ...state, ...action.payload };
        }

        default:
            return state;
    }
}

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---

export default function GameRoomPage() {
    const { user } = useUserStore();
    const [state, dispatch] = useReducer(gameReducer, initialState);

    const handlePlayCard = useCallback((card: Card) => {
        if (!state.isPlayerTurn) return;

        dispatch({ type: 'PLAY_CARD', card });

        setTimeout(() => {
            dispatch({ type: 'PROCESS_PLAY', playedCard: card, currentPlayer: 'player' });
        }, 500);
    }, [state.isPlayerTurn]);

    useEffect(() => {
        if (user) {
            dispatch({ type: 'RESET_GAME', player: user });
        }
    }, [user]);

    useEffect(() => {
        if (state.status === 'in_progress' && !state.isPlayerTurn) {
            const timeout = setTimeout(() => {
                const aiHand = state.opponentHand;
                if (aiHand.length > 0) {
                    let cardToPlay = aiHand.find(c => state.tableCards.some(tc => tc.rank === c.rank)) || aiHand[0];

                    const newOpponentHand = state.opponentHand.filter(c => c.id !== cardToPlay.id);
                    dispatch({ type: 'SET_STATE', payload: { opponentHand: newOpponentHand, gameLog: [{ message: `Oponente jugó <strong>${cardToPlay.displayRank} de ${GameLogic.SUITS[cardToPlay.suit as keyof typeof GameLogic.SUITS]}</strong>.`, type: 'opponent' }, ...state.gameLog] } });

                    setTimeout(() => {
                        dispatch({ type: 'PROCESS_PLAY', playedCard: cardToPlay, currentPlayer: 'opponent' });
                    }, 500);
                }
            }, 1500);
            return () => clearTimeout(timeout);
        }

        if (state.status === 'choosing_order' && state.roundStarter === 'opponent' && !state.isDealingAutomatically) {
            const timeout = setTimeout(() => {
                const order = Math.random() < 0.5 ? 'asc' : 'desc';
                dispatch({ type: 'SET_TABLE_ORDER', order });

                setTimeout(() => dispatch({ type: 'DEAL_HANDS' }), 1000);

            }, 2000);
            return () => clearTimeout(timeout);
        }

    }, [state.isPlayerTurn, state.status, state.opponentHand, state.tableCards, state.roundStarter, state.isDealingAutomatically, state.gameLog]);

    if (!user || !state.playerProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-t-transparent border-teal-400 border-solid rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div id="appContainer" className="min-h-screen flex flex-col bg-dark-primary text-text-light">
            {/* Aquí iría el Navbar, adaptado como un componente */}

            <main id="mainLayout" className="flex-grow flex p-1 md:p-4 gap-4 overflow-hidden">
                {/* Panel de Registro de Jugadas */}
                <aside className="panel w-1/3 lg:w-1/4 hidden md:flex">
                    <h3 className="panel-title"><i className="fas fa-scroll mr-2"></i>Registro de Jugadas</h3>
                    <div className="panel-content p-2">
                        <ul className="flex flex-col-reverse">
                            {state.gameLog.map((log, i) => (
                                <li key={i} className={`log-entry log-${log.type} border-l-4 p-2 mb-2 rounded-r-md`} dangerouslySetInnerHTML={{ __html: log.message }} />
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Panel Central del Juego */}
                <section id="center-panel" className="flex-grow flex flex-col relative">
                    <div className="absolute top-0 right-0 p-2 z-10">
                        <div className="player-profile text-center">
                            <Image src={state.opponentProfile.photoURL!} alt="Opponent" width={60} height={60} className="avatar rounded-full border-2 border-danger" unoptimized />
                            <div className="player-name bg-dark-secondary px-2 py-1 rounded-md">{state.opponentProfile.displayName}</div>
                        </div>
                    </div>

                    <div id="opponent-hand-area" className="hand-area h-24">
                        <div id="opponentHand" className="flex justify-center items-center w-full h-full relative">
                            {state.opponentHand.map((card, i) =>
                                <div key={i} className="absolute" style={{ transform: `translateX(${(i - (state.opponentHand.length - 1) / 2) * 30}px) translateY(-40%)` }}>
                                    <CardComponent card={card} isFaceDown />
                                </div>
                            )}
                        </div>
                    </div>

                    <div id="game-board" className="bg-gradient-to-br from-game-board-start to-game-board-end flex-grow w-full max-w-4xl mx-auto h-64 md:h-96 rounded-2xl shadow-inner border-2 border-secondary-accent flex items-center justify-center">
                        <div id="table-cards" className="flex items-center justify-center -space-x-8">
                            {state.tableCards.map(card => <CardComponent key={card.id} card={card} />)}
                        </div>
                    </div>

                    <div id="player-hand-area" className="hand-area h-32">
                        <div id="playerHand" className="flex justify-center items-center w-full h-full relative">
                            {state.playerHand.sort((a, b) => a.numericValue - b.numericValue).map((card, i) => (
                                <div
                                    key={card.id}
                                    className="absolute transition-transform duration-300 hover:-translate-y-8 hover:z-20"
                                    style={{ transform: `translateX(${(i - (state.playerHand.length - 1) / 2) * 40}px) translateY(40%)` }}
                                >
                                    <CardComponent
                                        card={card}
                                        isPlayable={state.isPlayerTurn}
                                        onClick={() => handlePlayCard(card)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 p-2 z-10">
                        <div className="player-profile text-center">
                            <Image src={state.playerProfile.photoURL!} alt="Player" width={60} height={60} className="avatar rounded-full border-2 border-primary-accent" unoptimized />
                            <div className="player-name bg-dark-secondary px-2 py-1 rounded-md">{state.playerProfile.displayName}</div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal para elegir orden */}
            {state.status === 'choosing_order' && state.roundStarter === 'player' && (
                <div className="modal-overlay visible fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="modal-content bg-dark-secondary p-8 rounded-lg shadow-lg text-center">
                        <p className="text-xl font-bold mb-6">Eres mano. Elige el orden de la mesa:</p>
                        <div className="flex justify-center gap-4">
                            <button className="button" onClick={() => dispatch({ type: 'SET_TABLE_ORDER', order: 'asc' })}>Ascendente</button>
                            <button className="button" onClick={() => dispatch({ type: 'SET_TABLE_ORDER', order: 'desc' })}>Descendente</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

