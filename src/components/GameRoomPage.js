// src/components/GameRoomPage.js
// ---------------------------
// P\u00e1gina de la sala de juego (Game Room).
// Controla las fases de la partida, conexi\u00f3n a Firestore, creaci\u00f3n, renderizado, l\u00f3gica de turnos, etc.

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, runTransaction, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeftRight, AlertTriangle, Award, Bot } from 'lucide-react';
import { auth, db, globalAppId } from '../firebase';
import { 
  prepareInitialGameData, 
  checkCantos, 
  shuffleInPlace, 
  createDeck 
} from '../gameLogic';
import { 
  PLAYER_ID_PREFIX, 
  CPU_ID_PREFIX, 
  RANKS_DATA, 
  SUITS_DATA, 
  GAME_TARGET_SCORE, 
  MESA_LIMPIA_BONUS, 
  CAPTURED_CARDS_THRESHOLD_FOR_BONUS 
} from '../constants';
import CardComponent from './CardComponent';
import PlayerSeat from './PlayerSeat';
import ActionModal from './ActionModal';

function GameRoomPage({ user, setCurrentPage, gameId }) {
  const [gameState, setGameState] = useState(null); 
  const [playerHandDisplay, setPlayerHandDisplay] = useState([]); 
  const [tableCardsDisplay, setTableCardsDisplay] = useState([]); 
  const [opponentPlayerProfiles, setOpponentPlayerProfiles] = useState([]); 
  const [gameLog, setGameLog] = useState([]); 
  const [currentUserProfile, setCurrentUserProfile] = useState({ balance: 0, vipLevel: 1, displayName: '', avatar: '' });
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', actions: [] });
  const [showTableForPlay, setShowTableForPlay] = useState(false);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, `artifacts/${globalAppId}/users/${user.uid}/profile`, 'data');
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) setCurrentUserProfile(docSnap.data());
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !gameId) {
      console.warn("GameRoomPage: falta usuario o ID de partida:", { userId: user?.uid, gameId });
      return;
    }
    setIsLoadingGame(true);
    setShowTableForPlay(false);

    addLog(`Conectando a la partida: ${gameId}...`);

    const gameDocRef = doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`);
    const unsubscribeGame = onSnapshot(gameDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const gameData = docSnap.data();
        setGameState(gameData);

        const hostPlayerId = PLAYER_ID_PREFIX + user.uid;
        setPlayerHandDisplay(gameData.hands?.[hostPlayerId] || []);

        if (gameData.status !== 'waiting_for_table_order') {
          setTableCardsDisplay(gameData.tableCards || []);
          setShowTableForPlay(true);
        } else {
          setTableCardsDisplay([]);
          setShowTableForPlay(false);
        }

        const opponentIds = gameData.players?.filter(pId => pId !== PLAYER_ID_PREFIX + user.uid) || [];
        if (
          opponentPlayerProfiles.length !== opponentIds.length ||
          !opponentIds.every(id => opponentPlayerProfiles.find(p => p.id === id))
        ) {
          const profiles = [];
          for (const pId of opponentIds) {
            if (pId.startsWith(CPU_ID_PREFIX)) {
              profiles.push({
                id: pId,
                displayName: gameData.playerNicknames?.[pId] || 'Oponente IA',
                avatar: `https://placehold.co/64x64/A0AEC0/FFFFFF?text=${pId.substring(CPU_ID_PREFIX.length, CPU_ID_PREFIX.length + 2).toUpperCase()}`,
                seat: 'top'
              });
            }
          }
          setOpponentPlayerProfiles(profiles);
        }

        if (gameData.status === 'finished' && gameData.winnerId) {
          addLog(`Partida finalizada. Ganador: ${gameData.playerNicknames?.[gameData.winnerId] || 'Desconocido'}`);
        }
      } else {
        if (gameId.startsWith('new-caida-game') || gameId === 'caida-default') {
          if (!gameState) {
            addLog("Partida no encontrada, creando nueva partida...");
            await createNewCaidaGame(doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`), user, gameId);
          } else {
            addLog(`La partida "${gameId}" fue eliminada. Volviendo al lobby.`, true);
            setCurrentPage('lobby');
          }
        } else {
          addLog(`Error: La partida ${gameId} no existe.`, true);
          setCurrentPage('lobby');
        }
      }
      setIsLoadingGame(false);
    });

    return () => unsubscribeGame();
  }, [user, gameId]);

  useEffect(() => {
    if (
      gameState &&
      gameState.status === 'in_progress' &&
      gameState.currentPlayerId &&
      gameState.currentPlayerId.startsWith(CPU_ID_PREFIX) &&
      opponentPlayerProfiles.length > 0
    ) {
      const currentOpponentProfile = opponentPlayerProfiles.find(
        p => p.id === gameState.currentPlayerId
      );
      if (currentOpponentProfile) {
        const aiThinkTime = setTimeout(() => {
          handleOpponentPlay(gameState, currentOpponentProfile);
        }, 1200 + Math.random() * 800);
        return () => clearTimeout(aiThinkTime);
      }
    }
  }, [gameState, opponentPlayerProfiles, user]);

  const addLog = (message, isError = false) => {
    console.log(message);
    setGameLog(prev => {
      const newLogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        isError
      };
      return [newLogEntry, ...prev.slice(0, 49)];
    });
  };

  const createNewCaidaGame = async (gameDocRef, hostUser, specificGameId) => {
    try {
      const hostDisplayName =
        hostUser.displayName || hostUser.email || `Invitado-${hostUser.uid.substring(0, 5)}`;

      const {
        hostPlayerId,
        cpuPlayerId,
        initialDeck,
        hands: initialHands,
        tableCards: initialTableCards,
        scores: initialScores,
        roundStarter
      } = prepareInitialGameData(hostUser.uid, 1);

      const newGameData = {
        gameId: specificGameId,
        hostId: hostUser.uid,
        players: [hostPlayerId, cpuPlayerId],
        playerNicknames: {
          [hostPlayerId]: hostDisplayName,
          [cpuPlayerId]: "Ca\u00eddaBot"
        },
        deck: initialDeck,
        hands: initialHands,
        tableCards: initialTableCards,
        scores: initialScores,
        currentPlayerId: roundStarter,
        lastPlayedCard: null,
        lastPlayerToCapture: null,
        roundStarter: roundStarter,
        status: 'waiting_for_table_order',
        gameLog: [
          {
            timestamp: new Date().toISOString(),
            message: `Partida creada por ${hostDisplayName}. Esperando orden de la mesa.`
          }
        ],
        isFirstHandOfTheGame: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        playerRoundCapturedCounts: { [hostPlayerId]: 0, [cpuPlayerId]: 0 }
      };

      await setDoc(gameDocRef, newGameData);
      addLog(`Nueva partida "${specificGameId}" creada con \u00e9xito por ${hostDisplayName}.`);
    } catch (error) {
      addLog(`Error al crear la partida "${specificGameId}": ${error.message}`, true);
      console.error("Error al crear nueva partida:", error);
      setCurrentPage('lobby');
    }
  };

  useEffect(() => {
    if (
      gameState?.status === 'waiting_for_table_order' &&
      gameState.roundStarter === PLAYER_ID_PREFIX + user.uid
    ) {
      if (showActionModal || !gameState.tableCards || gameState.tableCards.length === 0)
        return;

      const tableCardsDescription =
        gameState.tableCards && gameState.tableCards.length > 0
          ? gameState.tableCards
              .map(c => `${RANKS_DATA[c.rank]?.long || c.rank} de ${SUITS_DATA[c.suit]?.name || c.suit}`)
              .join(', ')
          : "ninguna (error en datos)";

      setModalContent({
        title: 'Elegir Orden de la Mesa',
        message: `Las cartas en la mesa para elegir orden son:\n${tableCardsDescription}.\n\u00bfC\u00f3mo quieres ordenarlas para la puntuaci\u00f3n inicial?`,
        actions: [
          {
            text: '1, 2, 3, 4 (Ascendente)',
            onClick: () => processTableOrderChoice('asc'),
            style: 'bg-sky-600 hover:bg-sky-500'
          },
          {
            text: '4, 3, 2, 1 (Descendente)',
            onClick: () => processTableOrderChoice('desc'),
            style: 'bg-purple-600 hover:bg-purple-500'
          }
        ]
      });
      setShowActionModal(true);
    } else if (
      gameState?.status === 'waiting_for_table_order' &&
      gameState.roundStarter &&
      gameState.roundStarter.startsWith(CPU_ID_PREFIX)
    ) {
      addLog(`Esperando que ${gameState.playerNicknames?.[gameState.roundStarter] || 'el oponente'} elija el orden de la mesa.`);
      const cpuChoiceDelay = setTimeout(() => {
        const choice = Math.random() < 0.5 ? 'asc' : 'desc';
        processTableOrderChoice(choice);
      }, 2000 + Math.random() * 1000);
      return () => clearTimeout(cpuChoiceDelay);
    } else {
      if (showActionModal) setShowActionModal(false);
    }
  }, [
    gameState?.status,
    gameState?.roundStarter,
    user?.uid,
    gameState?.tableCards,
    gameState?.playerNicknames,
    showActionModal
  ]);

  const processTableOrderChoice = async (choice) => {
    if (!gameState || gameState.status !== 'waiting_for_table_order') return;

    setShowActionModal(false);
    const chooserNickname = gameState.playerNicknames?.[gameState.roundStarter] || 'Alguien';
    const gameDocRef = doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`);

    try {
      await runTransaction(db, async (transaction) => {
        const freshGameSnap = await transaction.get(gameDocRef);
        if (!freshGameSnap.exists()) throw new Error("La partida no existe para la transacci\u00f3n.");

        const freshGameState = freshGameSnap.data();
        if (freshGameState.status !== 'waiting_for_table_order') {
          console.warn("Elecci\u00f3n de orden ya procesada o estado incorrecto.");
          return;
        }

        let currentRoundPoints = 0;
        const scoringMessages = [];
        const chosenSequenceRanks = choice === 'asc' ? ['1', '2', '3', '4'] : ['4', '3', '2', '1'];
        const sortedTableForScoring = [...freshGameState.tableCards].sort(
          (a, b) => RANKS_DATA[a.rank].value - RANKS_DATA[b.rank].value
        );

        for (let i = 0; i < sortedTableForScoring.length; i++) {
          const card = sortedTableForScoring[i];
          const targetRank = chosenSequenceRanks[i];
          if (card.rank === targetRank) {
            const pts = RANKS_DATA[targetRank].value;
            currentRoundPoints += pts;
            scoringMessages.push(`\u00a1${RANKS_DATA[card.rank].long} de ${SUITS_DATA[card.suit].name} coincide con ${targetRank}! +${pts} pts.`);
          }
        }

        if (freshGameState.tableCards.length >= 3 && freshGameState.tableCards[2].rank === '2') {
          currentRoundPoints += 2;
          scoringMessages.push("\u00a1La tercera carta en la mesa es un 2! +2 pts de bonificaci\u00f3n.");
        }

        let newLogEntries = [
          {
            timestamp: new Date().toISOString(),
            message: `${chooserNickname} eligi\u00f3 el orden: ${choice === 'asc' ? 'Ascendente' : 'Descendente'}.`
          },
          {
            timestamp: new Date().toISOString(),
            message: scoringMessages.join(' ') || "No se obtuvieron puntos por el orden de la mesa."
          }
        ];

        const updates = {
          status: 'in_progress_dealing_hands',
          updatedAt: serverTimestamp(),
          scores: { ...freshGameState.scores },
          gameLog: [...(freshGameState.gameLog || []), ...newLogEntries]
        };

        if (currentRoundPoints > 0) {
          updates.scores[freshGameState.roundStarter] = (updates.scores[freshGameState.roundStarter] || 0) + currentRoundPoints;
          updates.gameLog.push({
            timestamp: new Date().toISOString(),
            message: `${chooserNickname} gana ${currentRoundPoints} pts por el orden de la mesa.`
          });
        } else {
          const otherPlayerId = freshGameState.players.find(pId => pId !== freshGameState.roundStarter);
          if (otherPlayerId) {
            updates.scores[otherPlayerId] = (updates.scores[otherPlayerId] || 0) + 1;
            updates.gameLog.push({
              timestamp: new Date().toISOString(),
              message: `${freshGameState.playerNicknames?.[otherPlayerId]} gana 1 pt porque ${chooserNickname} no acert\u00f3 el orden.`
            });
          }
        }

        updates.currentPlayerId = freshGameState.players.find(pId => pId !== freshGameState.roundStarter) || freshGameState.players[0];

        transaction.update(gameDocRef, updates);
      });
    } catch (error) {
      addLog(`Error al procesar elecci\u00f3n de orden: ${error.message}`, true);
      console.error("Error actualizando estado despu\u00e9s de elegir orden:", error);
    }
  };

  useEffect(() => {
    if (gameState?.status === 'in_progress_dealing_hands') {
      (async () => {
        const gameDocRef = doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`);
        try {
          await runTransaction(db, async (transaction) => {
            const freshGameSnap = await transaction.get(gameDocRef);
            if (!freshGameSnap.exists()) throw new Error("Partida no existe.");

            const currentData = freshGameSnap.data();
            if (currentData.status !== 'in_progress_dealing_hands') return;

            let newDeck = [...currentData.deck];
            let newHands = { ...currentData.hands };
            let newScores = { ...currentData.scores };
            const logEntries = [];
            let isGameOver = false;
            let winnerByCanto = null;

            currentData.players.forEach(playerId => {
              if (newDeck.length >= 3) {
                const handToAdd = newDeck.splice(0, 3);
                newHands[playerId] = [...(newHands[playerId] || []), ...handToAdd];

                const cantoResult = checkCantos(newHands[playerId].slice(-3), currentData.isFirstHandOfTheGame);
                if (cantoResult) {
                  logEntries.push({
                    timestamp: new Date().toISOString(),
                    message: `${currentData.playerNicknames?.[playerId] || playerId}: ${cantoResult.message}`
                  });
                  newScores[playerId] = (newScores[playerId] || 0) + cantoResult.points;
                  if (cantoResult.autoWin) {
                    isGameOver = true;
                    winnerByCanto = playerId;
                  }
                }
              } else {
                logEntries.push({
                  timestamp: new Date().toISOString(),
                  message: `No hay suficientes cartas en el mazo para repartir a ${currentData.playerNicknames?.[playerId]}.`
                });
              }
            });

            const updates = {
              deck: newDeck,
              hands: newHands,
              scores: newScores,
              status: isGameOver ? 'finished' : 'in_progress',
              currentPlayerId: isGameOver ? null : currentData.currentPlayerId,
              winnerId: isGameOver ? winnerByCanto : null,
              isFirstHandOfTheGame: false,
              updatedAt: serverTimestamp(),
              gameLog: [...(currentData.gameLog || []), ...logEntries]
            };

            if (isGameOver && winnerByCanto) {
              updates.gameLog.push({
                timestamp: new Date().toISOString(),
                message: `${currentData.playerNicknames?.[winnerByCanto]} gana la partida por Canto!`
              });
            }

            transaction.update(gameDocRef, updates);
          });
        } catch (error) {
          addLog(`Error al repartir manos y verificar cantos: ${error.message}`, true);
          console.error("Error al repartir y comprobar cantos:", error);
        }
      })();
    }
  }, [gameState?.status]);

  const handlePlayCard = async (cardToPlay) => {
    if (
      !gameState ||
      gameState.status !== 'in_progress' ||
      gameState.currentPlayerId !== PLAYER_ID_PREFIX + user.uid ||
      !cardToPlay
    ) {
      addLog("No es tu turno, la partida no est\u00e1 en curso o no se seleccion\u00f3 carta.", true);
      return;
    }

    const gameDocRef = doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`);
    const playerId = PLAYER_ID_PREFIX + user.uid;
    const playerNickname = currentUserProfile.displayName || "T\u00fa";

    try {
      await runTransaction(db, async (transaction) => {
        const freshGameSnap = await transaction.get(gameDocRef);
        if (!freshGameSnap.exists()) throw new Error("La partida no existe.");

        const currentData = freshGameSnap.data();
        if (currentData.currentPlayerId !== playerId || currentData.status !== 'in_progress') {
          throw new Error("No es tu turno o la partida no est\u00e1 en el estado correcto.");
        }

        const playerHand = currentData.hands[playerId] || [];
        if (!playerHand.some(c => c.id === cardToPlay.id)) {
          throw new Error("Carta no encontrada en tu mano.");
        }

        const newPlayerHand = playerHand.filter(c => c.id !== cardToPlay.id);

        let table = [...currentData.tableCards];
        let scores = { ...currentData.scores };
        let pointsThisTurn = 0;
        let capturedSomething = false;
        let newLastPlayerToCapture = currentData.lastPlayerToCapture;
        const logEntries = [];
        let playerRoundCapturedCounts = { ...currentData.playerRoundCapturedCounts };

        logEntries.push({
          timestamp: new Date().toISOString(),
          message: `${playerNickname} jug\u00f3 ${RANKS_DATA[cardToPlay.rank].long} de ${SUITS_DATA[cardToPlay.suit].name}.`
        });

        if (currentData.lastPlayedCard && currentData.lastPlayedCard.rank === cardToPlay.rank) {
          pointsThisTurn = RANKS_DATA[cardToPlay.rank].caidaPoints;
          logEntries.push({
            timestamp: new Date().toISOString(),
            message: `\u00a1Ca\u00edda directa! +${pointsThisTurn} pts para ${playerNickname}.`
          });
          newLastPlayerToCapture = playerId;
          capturedSomething = true;
        } else {
          const matchingIdx = table.findIndex(tc => tc.rank === cardToPlay.rank);
          if (matchingIdx !== -1) {
            capturedSomething = true;
            newLastPlayerToCapture = playerId;
            const capturedOnTable = [table.splice(matchingIdx, 1)[0]];
            pointsThisTurn += RANKS_DATA[cardToPlay.rank].value;
            pointsThisTurn += RANKS_DATA[capturedOnTable[0].rank].value;
            let lastCapturedValue = RANKS_DATA[cardToPlay.rank].value;
            let continueEscalera = true;
            while (continueEscalera) {
              continueEscalera = false;
              table.sort((a, b) => RANKS_DATA[a.rank].value - RANKS_DATA[b.rank].value);
              const nextIndex = table.findIndex(tc => RANKS_DATA[tc.rank].value === lastCapturedValue + 1);
              if (nextIndex !== -1) {
                const escaleraCard = table.splice(nextIndex, 1)[0];
                capturedOnTable.push(escaleraCard);
                pointsThisTurn += RANKS_DATA[escaleraCard.rank].value;
                lastCapturedValue = RANKS_DATA[escaleraCard.rank].value;
                continueEscalera = true;
              }
            }
            logEntries.push({
              timestamp: new Date().toISOString(),
              message: `${playerNickname} captur\u00f3 ${capturedOnTable.map(c => RANKS_DATA[c.rank].long).join(', ')} y su ${RANKS_DATA[cardToPlay.rank].long}. +${pointsThisTurn} pts.`
            });
            if (table.length === 0) {
              pointsThisTurn += MESA_LIMPIA_BONUS;
              logEntries.push({
                timestamp: new Date().toISOString(),
                message: `\u00a1Mesa Limpia para ${playerNickname}! +${MESA_LIMPIA_BONUS} pts.`
              });
            }
            playerRoundCapturedCounts[playerId] = (playerRoundCapturedCounts[playerId] || 0) + capturedOnTable.length + 1;
          } else {
            table.push(cardToPlay);
            logEntries.push({
              timestamp: new Date().toISOString(),
              message: `${RANKS_DATA[cardToPlay.rank].long} de ${SUITS_DATA[cardToPlay.suit].name} queda en mesa.`
            });
          }
        }

        scores[playerId] = (scores[playerId] || 0) + pointsThisTurn;
        const nextPlayerId = currentData.players.find(pId => pId !== playerId) || currentData.players[0];

        const updates = {
          hands: { ...currentData.hands, [playerId]: newPlayerHand },
          tableCards: table,
          scores,
          lastPlayedCard: cardToPlay,
          lastPlayerToCapture: newLastPlayerToCapture,
          currentPlayerId: nextPlayerId,
          playerRoundCapturedCounts,
          updatedAt: serverTimestamp(),
          gameLog: [...(currentData.gameLog || []), ...logEntries]
        };

        const opponentId = nextPlayerId;
        const playerHandNowEmpty = newPlayerHand.length === 0;
        const opponentHandNowEmpty = (currentData.hands[opponentId] || []).length === 0;

        if (playerHandNowEmpty && opponentHandNowEmpty) {
          if (currentData.deck && currentData.deck.length >= currentData.players.length * 3) {
            let newDeckForReparto = [...currentData.deck];
            currentData.players.forEach(pid => {
              updates.hands[pid] = [...(updates.hands[pid] || []), ...newDeckForReparto.splice(0, 3)];
            });
            updates.deck = newDeckForReparto;
            updates.gameLog.push({
              timestamp: new Date().toISOString(),
              message: "Repartiendo nuevas manos..."
            });

            let isGameOverByCanto = false;
            let winnerByCantoId = null;
            currentData.players.forEach(pid => {
              const newHandSlice = updates.hands[pid].slice(-3);
              const cantoResult = checkCantos(newHandSlice, false);
              if (cantoResult) {
                updates.gameLog.push({
                  timestamp: new Date().toISOString(),
                  message: `${currentData.playerNicknames?.[pid]}: ${cantoResult.message}`
                });
                updates.scores[pid] = (updates.scores[pid] || 0) + cantoResult.points;
                if (cantoResult.autoWin && !isGameOverByCanto) {
                  isGameOverByCanto = true;
                  winnerByCantoId = pid;
                }
              }
            });

            if (isGameOverByCanto) {
              updates.status = 'finished';
              updates.winnerId = winnerByCantoId;
              updates.gameLog.push({
                timestamp: new Date().toISOString(),
                message: `${currentData.playerNicknames?.[winnerByCantoId]} gana por Canto!`
              });
            }
          } else {
            updates.status = 'round_end';
            updates.gameLog.push({
              timestamp: new Date().toISOString(),
              message: "Fin de mano, no hay suficientes cartas para repartir. Evaluando fin de ronda..."
            });
          }
        }

        if (updates.scores[playerId] >= GAME_TARGET_SCORE && updates.status !== 'finished') {
          updates.status = 'finished';
          updates.winnerId = playerId;
          updates.gameLog.push({
            timestamp: new Date().toISOString(),
            message: `${playerNickname} alcanza ${updates.scores[playerId]} puntos y gana la partida!`
          });
        } else if (updates.scores[opponentId] >= GAME_TARGET_SCORE && updates.status !== 'finished') {
          updates.status = 'finished';
          updates.winnerId = opponentId;
          updates.gameLog.push({
            timestamp: new Date().toISOString(),
            message: `${currentData.playerNicknames[opponentId]} alcanza ${updates.scores[opponentId]} puntos y gana la partida!`
          });
        }

        transaction.update(gameDocRef, updates);
      });
    } catch (error) {
      addLog(`Error al procesar jugada: ${error.message}`, true);
      console.error("Error en la transacci\u00f3n de jugada:", error);
    }
  };

  useEffect(() => {
    if (gameState?.status === 'round_end') {
      (async () => {
        const gameDocRef = doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`);
        addLog("Procesando fin de ronda...");
        try {
          await runTransaction(db, async (transaction) => {
            const freshGameSnap = await transaction.get(gameDocRef);
            if (!freshGameSnap.exists()) throw new Error("Partida no existe para fin de ronda.");

            const currentData = freshGameSnap.data();
            if (currentData.status !== 'round_end') return;

            let updatedScores = { ...currentData.scores };
            const logEntries = [];
            let remainingTableCards = [...currentData.tableCards];
            let playerRoundCapturedCounts = { ...currentData.playerRoundCapturedCounts };

            if (currentData.lastPlayerToCapture && remainingTableCards.length > 0) {
              const captor = currentData.lastPlayerToCapture;
              const captorNickname = currentData.playerNicknames?.[captor] || captor;
              let pointsFromTable = 0;
              remainingTableCards.forEach(card => (pointsFromTable += RANKS_DATA[card.rank].value));
              updatedScores[captor] = (updatedScores[captor] || 0) + pointsFromTable;
              playerRoundCapturedCounts[captor] = (playerRoundCapturedCounts[captor] || 0) + remainingTableCards.length;
              logEntries.push({
                timestamp: new Date().toISOString(),
                message: `${captorNickname} recoge ${remainingTableCards.length} carta(s) de la mesa (+${pointsFromTable} pts).`
              });
              remainingTableCards = [];
            }

            currentData.players.forEach(pid => {
              const capturedCount = playerRoundCapturedCounts[pid] || 0;
              if (capturedCount >= CAPTURED_CARDS_THRESHOLD_FOR_BONUS) {
                const bonusPoints = capturedCount - (CAPTURED_CARDS_THRESHOLD_FOR_BONUS - 1);
                updatedScores[pid] = (updatedScores[pid] || 0) + bonusPoints;
                logEntries.push({
                  timestamp: new Date().toISOString(),
                  message: `${currentData.playerNicknames?.[pid]} captur\u00f3 ${capturedCount} cartas, \u00a1+${bonusPoints} pts de bono!`
                });
              }
            });

            let winnerThisRound = null;
            currentData.players.forEach(pid => {
              if (updatedScores[pid] >= GAME_TARGET_SCORE) {
                winnerThisRound = pid;
              }
            });

            const updates = {
              gameLog: [...(currentData.gameLog || []), ...logEntries]
            };

            if (winnerThisRound) {
              updates.status = 'finished';
              updates.winnerId = winnerThisRound;
              updates.scores = updatedScores;
              updates.tableCards = remainingTableCards;
              updates.playerRoundCapturedCounts = playerRoundCapturedCounts;
              updates.updatedAt = serverTimestamp();
              updates.gameLog.push({
                timestamp: new Date().toISOString(),
                message: `${currentData.playerNicknames?.[winnerThisRound]} gana la partida con ${updatedScores[winnerThisRound]} puntos!`
              });
            } else {
              let newDeckForRound = createDeck();
              shuffleInPlace(newDeckForRound);
              const newTableForRound = newDeckForRound.splice(0, 4);
              const nextStarterId = currentData.players.find(p => p !== currentData.roundStarter) || currentData.players[0];

              Object.assign(updates, {
                status: 'waiting_for_table_order',
                deck: newDeckForRound,
                tableCards: newTableForRound,
                hands: currentData.players.reduce((acc, pid) => ({ ...acc, [pid]: [] }), {}),
                scores: updatedScores,
                lastPlayedCard: null,
                lastPlayerToCapture: null,
                roundStarter: nextStarterId,
                currentPlayerId: nextStarterId,
                isFirstHandOfTheGame: true,
                playerRoundCapturedCounts: currentData.players.reduce(
                  (acc, pid) => ({ ...acc, [pid]: 0 }),
                  {}
                ),
                updatedAt: serverTimestamp()
              });
              updates.gameLog.push({
                timestamp: new Date().toISOString(),
                message: `Fin de ronda. Iniciando nueva ronda. ${currentData.playerNicknames?.[nextStarterId]} elige orden.`
              });
            }

            transaction.update(gameDocRef, updates);
          });
        } catch (error) {
          addLog(`Error procesando fin de ronda: ${error.message}`, true);
          console.error("Error al procesar fin de ronda:", error);
        }
      })();
    }
  }, [gameState?.status]);

  const handleOpponentPlay = async (currentGameData, opponent) => {
    if (!currentGameData || currentGameData.status !== 'in_progress' || currentGameData.currentPlayerId !== opponent.id) return;

    const gameDocRef = doc(db, `artifacts/${globalAppId}/public/data/caidaGames/${gameId}`);
    const opponentNickname = opponent.displayName || "Oponente IA";

    try {
      await runTransaction(db, async (transaction) => {
        const freshGameSnap = await transaction.get(gameDocRef);
        if (!freshGameSnap.exists()) throw new Error("La partida no existe para el turno de la IA.");

        const currentData = freshGameSnap.data();
        if (currentData.currentPlayerId !== opponent.id || currentData.status !== 'in_progress') {
          console.warn("Turno de IA omitido, estado cambi\u00f3.");
          return;
        }

        const opponentHand = currentData.hands?.[opponent.id] || [];
        if (opponentHand.length === 0) return;

        let cardToPlay = opponentHand[0];
        let foundPlay = false;

        if (currentData.lastPlayedCard) {
          const caidaCard = opponentHand.find(c => c.rank === currentData.lastPlayedCard.rank);
          if (caidaCard) {
            cardToPlay = caidaCard;
            foundPlay = true;
          }
        }

        if (!foundPlay) {
          for (const handCard of opponentHand) {
            if (currentData.tableCards.some(tableCard => tableCard.rank === handCard.rank)) {
              cardToPlay = handCard;
              foundPlay = true;
              break;
            }
          }
        }

        const newOpponentHand = opponentHand.filter(c => c.id !== cardToPlay.id);

        let table = [...currentData.tableCards];
        let scores = { ...currentData.scores };
        let pointsThisTurn = 0;
        let capturedSomethingAI = false;
        let newLastPlayerToCaptureAI = currentData.lastPlayerToCapture;
        const logEntries = [];
        let playerRoundCapturedCountsAI = { ...currentData.playerRoundCapturedCounts };

        logEntries.push({
          timestamp: new Date().toISOString(),
          message: `${opponentNickname} jug\u00f3 ${RANKS_DATA[cardToPlay.rank].long} de ${SUITS_DATA[cardToPlay.suit].name}.`
        });

        if (currentData.lastPlayedCard && currentData.lastPlayedCard.rank === cardToPlay.rank) {
          pointsThisTurn = RANKS_DATA[cardToPlay.rank].caidaPoints;
          logEntries.push({
            timestamp: new Date().toISOString(),
            message: `\u00a1Ca\u00edda de ${opponentNickname}! +${pointsThisTurn} pts.`
          });
          newLastPlayerToCaptureAI = opponent.id;
          capturedSomethingAI = true;
        } else {
          const matchingIdx = table.findIndex(tc => tc.rank === cardToPlay.rank);
          if (matchingIdx !== -1) {
            capturedSomethingAI = true;
            newLastPlayerToCaptureAI = opponent.id;
            const capturedOnTableAI = [table.splice(matchingIdx, 1)[0]];
            pointsThisTurn += RANKS_DATA[cardToPlay.rank].value;
            pointsThisTurn += RANKS_DATA[capturedOnTableAI[0].rank].value;
            logEntries.push({
              timestamp: new Date().toISOString(),
              message: `${opponentNickname} captur\u00f3 ${RANKS_DATA[capturedOnTableAI[0].rank].long} con su ${RANKS_DATA[cardToPlay.rank].long}. +${pointsThisTurn} pts.`
            });
            if (table.length === 0) {
              pointsThisTurn += MESA_LIMPIA_BONUS;
              logEntries.push({
                timestamp: new Date().toISOString(),
                message: `\u00a1Mesa Limpia para ${opponentNickname}! +${MESA_LIMPIA_BONUS} pts.`
              });
            }
            playerRoundCapturedCountsAI[opponent.id] = (playerRoundCapturedCountsAI[opponent.id] || 0) + capturedOnTableAI.length + 1;
          } else {
            table.push(cardToPlay);
            logEntries.push({
              timestamp: new Date().toISOString(),
              message: `${RANKS_DATA[cardToPlay.rank].long} de ${SUITS_DATA[cardToPlay.suit].name} queda en mesa.`
            });
          }
        }

        scores[opponent.id] = (scores[opponent.id] || 0) + pointsThisTurn;
        const nextPlayerHumanId = PLAYER_ID_PREFIX + user.uid;

        const updates = {
          hands: { ...currentData.hands, [opponent.id]: newOpponentHand },
          tableCards: table,
          scores,
          lastPlayedCard: cardToPlay,
          lastPlayerToCapture: newLastPlayerToCaptureAI,
          currentPlayerId: nextPlayerHumanId,
          playerRoundCapturedCounts: playerRoundCapturedCountsAI,
          updatedAt: serverTimestamp(),
          gameLog: [...(currentData.gameLog || []), ...logEntries]
        };

        const playerHandNowEmptyAI = (currentData.hands[nextPlayerHumanId] || []).length === 0;
        const opponentHandNowEmptyAI = newOpponentHand.length === 0;

        if (playerHandNowEmptyAI && opponentHandNowEmptyAI) {
          if (currentData.deck && currentData.deck.length >= currentData.players.length * 3) {
            let newDeckForRepartoAI = [...currentData.deck];
            currentData.players.forEach(pid => {
              updates.hands[pid] = [...(updates.hands[pid] || []), ...newDeckForRepartoAI.splice(0, 3)];
            });
            updates.deck = newDeckForRepartoAI;
            updates.gameLog.push({
              timestamp: new Date().toISOString(),
              message: "Repartiendo nuevas manos (turno IA)..."
            });

            let isGameOverByCantoAI = false;
            let winnerByCantoIdAI = null;
            currentData.players.forEach(pid => {
              const newHandSliceAI = updates.hands[pid].slice(-3);
              const cantoResultAI = checkCantos(newHandSliceAI, false);
              if (cantoResultAI) {
                updates.gameLog.push({
                  timestamp: new Date().toISOString(),
                  message: `${currentData.playerNicknames?.[pid]}: ${cantoResultAI.message}`
                });
                updates.scores[pid] = (updates.scores[pid] || 0) + cantoResultAI.points;
                if (cantoResultAI.autoWin && !isGameOverByCantoAI) {
                  isGameOverByCantoAI = true;
                  winnerByCantoIdAI = pid;
                }
              }
            });
            if (isGameOverByCantoAI) {
              updates.status = 'finished';
              updates.winnerId = winnerByCantoIdAI;
              updates.gameLog.push({
                timestamp: new Date().toISOString(),
                message: `${currentData.playerNicknames?.[winnerByCantoIdAI]} gana por Canto!`
              });
            }
          } else {
            updates.status = 'round_end';
            updates.gameLog.push({
              timestamp: new Date().toISOString(),
              message: "Fin de mano (turno IA), no hay suficientes cartas. Evaluando fin de ronda..."
            });
          }
        }

        if (updates.scores[opponent.id] >= GAME_TARGET_SCORE && updates.status !== 'finished') {
          updates.status = 'finished';
          updates.winnerId = opponent.id;
          updates.gameLog.push({
            timestamp: new Date().toISOString(),
            message: `${opponentNickname} alcanza ${updates.scores[opponent.id]} puntos y gana la partida!`
          });
        } else if (updates.scores[nextPlayerHumanId] >= GAME_TARGET_SCORE && updates.status !== 'finished') {
          updates.status = 'finished';
          updates.winnerId = nextPlayerHumanId;
          updates.gameLog.push({
            timestamp: new Date().toISOString(),
            message: `${currentData.playerNicknames[nextPlayerHumanId]} alcanza ${updates.scores[nextPlayerHumanId]} puntos y gana la partida!`
          });
        }

        transaction.update(gameDocRef, updates);
      });
    } catch (error) {
      addLog(`Error en el turno del oponente: ${error.message}`, true);
      console.error("Error durante la TX del turno IA:", error);
    }
  };

  if (isLoadingGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-xl mb-4">Cargando sala de juego: {gameId}...</div>
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="w-full max-w-md text-xs text-slate-400 p-2 bg-slate-800 rounded max-h-40 overflow-y-auto">
          {gameLog.map((logEntry, i) => (
            <p key={i} className={`leading-tight ${logEntry.isError ? 'text-red-400' : ''}`}> 
              {logEntry.message}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (!gameState && !isLoadingGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <p className="text-xl mb-2">Error al cargar la partida.</p>
        <p className="text-sm text-slate-400 mb-4">No se pudo encontrar o inicializar la partida: {gameId}</p>
        <div className="w-full max-w-md text-xs text-slate-400 p-2 bg-slate-800 rounded max-h-40 overflow-y-auto mb-4">
          {gameLog.map((logEntry, i) => (
            <p key={i} className={`leading-tight ${logEntry.isError ? 'text-red-400' : ''}`}>{logEntry.message}</p>
          ))}
        </div>
        <button
          onClick={() => setCurrentPage('lobby')}
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Volver al Lobby
        </button>
      </div>
    );
  }

  if (gameState?.status === 'finished') {
    const winnerNickname = gameState.playerNicknames?.[gameState.winnerId] || 'Alguien';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <Award size={64} className="text-yellow-400 mb-4" />
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">\u00a1Partida Terminada!</h2>
        <p className="text-xl text-white mb-4">
          Ganador: <span className="font-bold">{winnerNickname}</span>
        </p>

        <div className="bg-slate-800 p-4 rounded-lg shadow-md w-full max-w-sm mb-6">
          <h3 className="text-lg font-semibold text-sky-300 mb-2 text-center">Puntuaciones Finales</h3>
          {gameState.players.map(pid => (
            <div key={pid} className="flex justify-between text-sm">
              <span>{gameState.playerNicknames?.[pid] || pid}:</span>
              <span className="font-semibold">{gameState.scores?.[pid] || 0} pts</span>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => navigateToGameRoom('new-caida-game-' + Date.now())}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
          >
            Jugar de Nuevo
          </button>
          <button
            onClick={() => setCurrentPage('lobby')}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
          >
            Volver al Lobby
          </button>
        </div>

        <div className="mt-6 w-full max-w-md text-xs text-slate-400 p-2 bg-slate-800/50 rounded max-h-60 overflow-y-auto scrollbar-thin">
          <h4 className="font-semibold text-slate-300 mb-1">Registro Final de la Partida:</h4>
          {gameLog.map((logEntry, i) => (
            <p key={i} className={`leading-tight ${logEntry.isError ? 'text-red-400' : ''}`}>{logEntry.message}</p>
          ))}
        </div>
      </div>
    );
  }

  const mainOpponent =
    opponentPlayerProfiles.length > 0
      ? opponentPlayerProfiles[0]
      : {
          id: CPU_ID_PREFIX + 'unknown',
          displayName: 'Oponente (IA)',
          avatar: `https://placehold.co/64x64/A0AEC0/FFFFFF?text=IA`,
          seat: 'top'
        };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 font-sans overflow-hidden">
      <header className="bg-slate-800/80 backdrop-blur-md shadow-md h-14 flex items-center justify-between px-2 sm:px-4 shrink-0 border-b border-slate-700/60">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setCurrentPage('lobby')}
            className="text-sky-400 hover:text-sky-300 p-1.5 sm:p-2 rounded-md hover:bg-slate-700 transition-colors text-xs sm:text-sm flex items-center"
          >
            <ArrowLeftRight size={16} className="mr-1 inline-block transform rotate-180" /> Salir
          </button>
          <h1 className="text-sm sm:text-lg font-semibold text-sky-400 truncate max-w-[100px] sm:max-w-xs">
            Mesa: {gameId.replace('new-caida-game', 'Nueva').replace('caida-default', 'Cl\u00e1sica')}
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <p className="text-xs sm:text-sm text-slate-300">
            Puntos: <span className="font-bold text-yellow-400">{gameState?.scores?.[PLAYER_ID_PREFIX + user.uid] || 0}</span>
          </p>
          <div className="w-px h-5 sm:h-6 bg-slate-600"></div>
          <p className="text-xs sm:text-sm text-slate-300 truncate max-w-[100px] sm:max-w-xs">
            Turno: <span className="font-bold text-white">{gameState?.playerNicknames?.[gameState.currentPlayerId] || 'Nadie'}</span>
          </p>
        </div>
      </header>

      <main className="flex-1 flex p-1 sm:p-2 md:p-4 overflow-hidden relative">
        <div
          className={`
            absolute left-1 top-1 bottom-1 w-1/3 sm:w-1/4 xl:w-1/5
            p-1.5 sm:p-2 bg-slate-800/60 rounded-lg shadow-md overflow-y-auto
            scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50
            md:static z-20 md:z-0
          `}
        >
          <h3 className="text-xs sm:text-sm font-semibold text-sky-300 border-b border-slate-700 pb-1 mb-1 sm:pb-2 sm:mb-2">Registro</h3>
          <div className="space-y-1 text-[10px] sm:text-xs">
            {gameLog.map((logEntry, index) => (
              <p key={index} className={`text-slate-400 leading-tight ${logEntry.isError ? 'text-red-400' : ''}`}> {logEntry.message} </p>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative p-1 md:p-2">
          <div
            className={`
              absolute inset-x-2 md:inset-x-8 top-[15%] md:top-[20%] bottom-[25%] md:bottom-[30%]
              bg-green-800/40 border-4 ${
                gameState?.currentPlayerId === PLAYER_ID_PREFIX + user.uid && gameState?.status === 'in_progress'
                  ? 'border-sky-500/70'
                  : 'border-green-700/60'
              } rounded-[30px] md:rounded-[60px] shadow-2xl flex items-center justify-center p-2 md:p-4
            `}
          >
            <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2">
              {showTableForPlay && tableCardsDisplay.map(card => (
                <CardComponent key={card.id} card={card} className="shadow-black/30" />
              ))}

              {!showTableForPlay && gameState?.status === 'waiting_for_table_order' && (
                <p className="text-green-300/50 italic text-sm">
                  {gameState.roundStarter === PLAYER_ID_PREFIX + user.uid
                    ? "Elige el orden de la mesa en el modal."
                    : `Esperando que ${gameState.playerNicknames?.[gameState.roundStarter] || 'el oponente'} elija el orden...`}
                </p>
              )}

              {showTableForPlay && tableCardsDisplay.length === 0 && (
                <p className="text-green-300/50 italic text-sm">Mesa Vac\u00eda</p>
              )}
            </div>
          </div>

          <PlayerSeat
            playerProfile={mainOpponent}
            seatPosition="top"
            hand={gameState?.hands?.[mainOpponent.id]}
            isCurrentTurn={gameState?.currentPlayerId === mainOpponent.id}
          />

          <PlayerSeat
            playerProfile={{
              id: PLAYER_ID_PREFIX + user.uid,
              displayName: currentUserProfile.displayName || 'T\u00fa',
              avatar: currentUserProfile.avatar
            }}
            seatPosition="bottom"
            hand={playerHandDisplay}
            isCurrentUser={true}
            isCurrentTurn={gameState?.currentPlayerId === PLAYER_ID_PREFIX + user.uid}
          />
        </div>

        <div
          className={`
            absolute right-1 top-1 bottom-1 w-1/3 sm:w-1/4 xl:w-1/5 p-1.5 sm:p-2 bg-slate-800/60 rounded-lg shadow-md
            md:static z-20 md:z-0 hidden sm:flex flex-col
          `}
        >
          <h3 className="text-xs sm:text-sm font-semibold text-sky-300 border-b border-slate-700 pb-1 mb-1 sm:pb-2 sm:mb-2">Chat</h3>
          <div className="flex-grow bg-slate-900/40 rounded p-1 sm:p-2 mb-1 sm:mb-2 overflow-y-auto scrollbar-thin h-24 text-[10px] sm:text-xs">
            {mainOpponent && gameState?.playerNicknames?.[mainOpponent.id] && (
              <p>
                <span className="text-sky-400">{gameState.playerNicknames[mainOpponent.id]}:</span> \u00a1Buena suerte!
              </p>
            )}
            <p>
              <span className="text-yellow-400">{currentUserProfile.displayName || 'T\u00fa'}:</span> \u00a1Igualmente!
            </p>
          </div>
          <div className="flex">
            <input
              type="text"
              placeholder="Escribe..."
              className="flex-grow bg-slate-700 text-[10px] sm:text-xs p-1.5 sm:p-2 rounded-l-md border-slate-600 focus:ring-sky-500 outline-none"
            />
            <button className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] sm:text-xs px-2 sm:px-3 rounded-r-md">
              Enviar
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-slate-800/80 backdrop-blur-md shadow-inner min-h-[100px] md:min-h-[140px] p-2 md:p-3 shrink-0 border-t border-slate-700/60 flex flex-col items-center justify-center space-y-2">
        <div className="flex justify-center items-end space-x-1 md:space-x-1.5 min-h-[80px] md:min-h-[100px]">
          {playerHandDisplay.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              onClick={handlePlayCard}
              isPlayable={gameState?.status === 'in_progress' && gameState?.currentPlayerId === PLAYER_ID_PREFIX + user.uid}
            />
          ))}
          {playerHandDisplay.length === 0 && gameState?.status === 'in_progress' && (
            <p className="text-slate-400 text-sm italic self-center">
              No tienes cartas. Esperando reparto...
            </p>
          )}
          {gameState?.status !== 'in_progress' && gameState?.status !== 'waiting_for_table_order' && !isLoadingGame && (
            <p className="text-slate-400 text-sm italic self-center">
              La partida ha terminado o est\u00e1 esperando inicio.
            </p>
          )}
        </div>
      </footer>

      <ActionModal
        isOpen={showActionModal}
        title={modalContent.title}
        message={modalContent.message}
        actions={modalContent.actions}
        onClose={() => setShowActionModal(false)}
      />
    </div>
  );
}

export default GameRoomPage;
