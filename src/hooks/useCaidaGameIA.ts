"use client";

import { useReducer, useEffect, useCallback } from 'react';
import { Card, GameLogEntry, UserProfile } from '@/types';
import * as GameLogic from '@/lib/game-logic';

interface GameState {
    status: 'idle' | 'dealer_action' | 'in_progress' | 'finished';
    players: { [id: string]: { profile: Partial<UserProfile> & { uid: string }, hand: Card[], collected: Card[] } };
    deck: Card[];
    tableCards: Card[];
    scores: { [id: string]: number };
    dealerId: string | null;
    manoId: string | null;
    currentPlayerId: string | null;
    log: GameLogEntry[];
}

type GameAction =
    | { type: 'START_GAME'; player: UserProfile, opponent: { uid: string, displayName: string } }
    | { type: 'CHOOSE_TABLE_ORDER'; order: 'ascendente' | 'descendente' }
    | { type: 'PLAY_CARD'; playerId: string; card: Card };

const initialState: GameState = {
    status: 'idle',
    players: {},
    deck: [],
    tableCards: [],
    scores: {},
    dealerId: null,
    manoId: null,
    currentPlayerId: null,
    log: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'START_GAME': {
            const playerIds = [action.player.uid, action.opponent.uid];
            const { dealerId, drawDetails } = GameLogic.determineFirstDealer(playerIds);
            const manoId = playerIds.find(id => id !== dealerId)!;

            return {
                ...initialState,
                status: 'dealer_action',
                players: {
                    [action.player.uid]: { profile: action.player, hand: [], collected: [] },
                    [action.opponent.uid]: { profile: { ...action.opponent, photoURL: '' }, hand: [], collected: [] },
                },
                scores: { [action.player.uid]: 0, [action.opponent.uid]: 0 },
                dealerId,
                manoId,
                log: [{
                    message: `Sorteo de repartidor: ${dealerId === action.player.uid ? action.player.displayName : action.opponent.displayName} reparte.`,
                    type: 'system',
                    timestamp: new Date()
                }],
            };
        }

        case 'CHOOSE_TABLE_ORDER': {
            if (state.status !== 'dealer_action') return state;

            let deck = GameLogic.shuffleDeck(GameLogic.createDeck());
            let tableCards: Card[];
            let checkResult;

            // Bucle para asegurar que la mesa no tenga cartas repetidas
            while (true) {
                tableCards = deck.splice(0, 4);
                checkResult = GameLogic.checkMesaEchada(tableCards, action.order);
                if (checkResult.type !== 'invalida') break;
                // Si es inválida, se devuelven las cartas y se baraja de nuevo
                deck.push(...tableCards);
                deck = GameLogic.shuffleDeck(deck);
            }

            const newScores = { ...state.scores };
            let logEntry: GameLogEntry;

            if (checkResult.type === 'bien_echada') {
                newScores[state.dealerId!] += checkResult.points;
                logEntry = { message: `¡Mesa Bien Echada! ${state.players[state.dealerId!].profile.displayName} gana ${checkResult.points} puntos.`, type: 'score', timestamp: new Date() };
            } else { // mal_echada
                newScores[state.manoId!] += checkResult.points;
                logEntry = { message: `Mesa Mal Echada. ${state.players[state.manoId!].profile.displayName} gana 1 punto.`, type: 'score', timestamp: new Date() };
            }

            const hands: { [key: string]: Card[] } = {};
            Object.keys(state.players).forEach(id => {
                hands[id] = deck.splice(0, 3);
            });

            return {
                ...state,
                status: 'in_progress',
                deck,
                tableCards,
                scores: newScores,
                players: {
                    ...state.players,
                    [state.dealerId!]: { ...state.players[state.dealerId!], hand: hands[state.dealerId!] },
                    [state.manoId!]: { ...state.players[state.manoId!], hand: hands[state.manoId!] }
                },
                currentPlayerId: state.manoId,
                log: [logEntry, ...state.log]
            };
        }

        case 'PLAY_CARD': {
            const { playerId, card } = action;
            if (state.status !== 'in_progress' || state.currentPlayerId !== playerId) return state;

            const playerState = state.players[playerId];
            const newHand = playerState.hand.filter(c => c.id !== card.id);

            // Lógica de recogida (simplificada por ahora)
            const matchInTable = state.tableCards.find(tc => tc.rank === card.rank);
            const nextPlayerId = playerId === state.dealerId ? state.manoId : state.dealerId;

            if (matchInTable) {
                const newTableCards = state.tableCards.filter(tc => tc.rank !== card.rank);
                const collected = [card, matchInTable];
                return {
                    ...state,
                    players: {
                        ...state.players,
                        [playerId]: { ...playerState, hand: newHand, collected: [...playerState.collected, ...collected] }
                    },
                    tableCards: newTableCards,
                    currentPlayerId: nextPlayerId,
                    log: [{ message: `${playerState.profile.displayName} recoge con ${card.id}`, type: 'capture', timestamp: new Date() }, ...state.log]
                };
            } else {
                return {
                    ...state,
                    players: { ...state.players, [playerId]: { ...playerState, hand: newHand } },
                    tableCards: [...state.tableCards, card],
                    currentPlayerId: nextPlayerId,
                    log: [{ message: `${playerState.profile.displayName} templa ${card.id}`, type: 'play', timestamp: new Date() }, ...state.log]
                };
            }
        }

        default:
            return state;
    }
}

export const useCaidaGameIA = (player: UserProfile | null) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const opponent = { uid: 'ai-player', displayName: 'CaídaBot' };

    useEffect(() => {
        if (player) dispatch({ type: 'START_GAME', player, opponent });
    }, [player]);

    useEffect(() => {
        // Lógica de turno de IA
        if (state.status === 'in_progress' && state.currentPlayerId === opponent.uid) {
            const timeout = setTimeout(() => {
                const aiHand = state.players[opponent.uid]?.hand;
                if (aiHand && aiHand.length > 0) {
                    let cardToPlay = aiHand.find(c => state.tableCards.some(tc => tc.rank === c.rank)) || aiHand[0];
                    dispatch({ type: 'PLAY_CARD', playerId: opponent.uid, card: cardToPlay });
                }
            }, 1500);
            return () => clearTimeout(timeout);
        }

        // Lógica de repartidor IA
        if (state.status === 'dealer_action' && state.dealerId === opponent.uid) {
            const timeout = setTimeout(() => {
                const order = Math.random() < 0.5 ? 'ascendente' : 'descendente';
                dispatch({ type: 'CHOOSE_TABLE_ORDER', order });
            }, 2000);
            return () => clearTimeout(timeout);
        }

    }, [state.status, state.currentPlayerId, opponent.uid]);

    return { gameState: state, dispatch };
};