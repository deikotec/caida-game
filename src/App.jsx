import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// Definimos las constantes del juego y los assets fuera del componente para evitar re-renderizados innecesarios.
const SUITS = { 'O': 'Oros', 'C': 'Copas', 'E': 'Espadas', 'B': 'Bastos' };
const RANKS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
const RANK_DISPLAY = { '1': 'As', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', 'S': 'Sota', 'C': 'Caballo', 'R': 'Rey' };
const RANKS_ORDERED_NUMERIC = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'S': 8, 'C': 9, 'R': 10 };
const CARD_POINTS_CAIDA = { '1': 1, '2': 1, '3': 1, '4': 4, '5': 5, '6': 6, '7': 7, 'S': 8, 'C': 9, 'R': 10 };
const CANTO_POINTS_RONDA = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, 'S': 2, 'C': 3, 'R': 4 };
const GAME_TARGET_SCORE = 24, MESA_LIMPIA_BONUS = 4, CAPTURED_CARDS_BONUS_THRESHOLD = 20;
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/teributu/image/upload/";
const RANK_TO_IMG = { '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', 'S': '10', 'C': '11', 'R': '12' };

function getCardImage(rank, suit) {
  return `${CLOUDINARY_BASE_URL}${RANK_TO_IMG[rank]}${suit.toLowerCase()}.jpg`;
}

function App() {
  // --- Estados del Juego ---
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerCapturedCount, setPlayerCapturedCount] = useState(0);
  const [opponentCapturedCount, setOpponentCapturedCount] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const [tableCards, setTableCards] = useState([]);
  const [lastCardPlayedByPreviousPlayerRank, setLastCardPlayedByPreviousPlayerRank] = useState(null);
  const [lastPlayerToCapture, setLastPlayerToCapture] = useState(null);
  const [isDealingAutomatically, setIsDealingAutomatically] = useState(false);
  const [roundStarter, setRoundStarter] = useState('player');
  const [isFirstHandOfGame, setIsFirstHandOfGame] = useState(true);
  const [handNumber, setHandNumber] = useState(0);
  const [gameLog, setGameLog] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTableChoiceModal, setShowTableChoiceModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [gameOverIcon, setGameOverIcon] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationCallback, setConfirmationCallback] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('Anónimo');
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para Firebase
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [dbRefGame, setDbRefGame] = useState(null);
  const [fullShuffledDeck, setFullShuffledDeck] = useState([]);
  const [deck, setDeck] = useState([]);

  // --- Funciones de Utilidad y Lógica del Juego ---
  const logAction = (message, type = 'system') => {
    setGameLog(prevLog => {
      const icons = { player: 'fas fa-user-astronaut', opponent: 'fas fa-robot', system: 'fas fa-info-circle', points: 'fas fa-star' };
      const entry = { message, type, icon: icons[type] };
      return [entry, ...prevLog].slice(0, 50);
    });
  };

  const showConfirmation = (message, onConfirm) => {
    setConfirmationMessage(message);
    setConfirmationCallback(() => onConfirm);
    setShowConfirmationModal(true);
  };

  const mapAuthError = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email': return 'Correo electrónico inválido.';
      case 'auth/user-not-found': return 'Usuario no encontrado.';
      case 'auth/wrong-password': return 'Contraseña incorrecta.';
      case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
      default: return `Error desconocido. Código: ${errorCode}`;
    }
  };

  const createDeck = () => {
    const newDeck = [];
    for (const suitCode in SUITS) {
      for (const rank of RANKS) {
        newDeck.push({
          id: rank + suitCode,
          rank,
          suit: suitCode,
          displayRank: RANK_DISPLAY[rank],
          numericValue: RANKS_ORDERED_NUMERIC[rank]
        });
      }
    }
    return newDeck;
  };

  const shuffleDeck = (deckToShuffle) => {
    for (let i = deckToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckToShuffle[i], deckToShuffle[j]] = [deckToShuffle[j], deckToShuffle[i]];
    }
    return deckToShuffle;
  };

  const formatCantoMessage = (cantoResult) => {
    let msg = `canto de <strong>${cantoResult.type}</strong>`;
    if (cantoResult.rank) msg += ` de ${RANK_DISPLAY[cantoResult.rank]}`;
    return msg;
  };

  const checkCantos = (hand) => {
    if (hand.length < 3) return null;
    const sortedHand = [...hand].sort((a, b) => a.numericValue - b.numericValue);
    const r = sortedHand.map(c => c.rank);
    const v = sortedHand.map(c => c.numericValue);
    let possibleCantos = [];
    if (v[0] === v[1] && v[1] === v[2]) possibleCantos.push({ type: "Tribilín", points: isFirstHandOfGame ? GAME_TARGET_SCORE : 5, rank: r[0], autoWin: isFirstHandOfGame });
    if (r.includes('1') && r.includes('C') && r.includes('R')) possibleCantos.push({ type: "Registro", points: 8, rank: 'R', autoWin: false });
    const isVigia = (v[0] === v[1] && v[2] === v[0] + 1) || (v[1] === v[2] && v[0] === v[1] - 1);
    if (isVigia) possibleCantos.push({ type: "Vigía", points: 7, rank: v[0] === v[1] ? r[0] : r[1], autoWin: false });
    if (v[0] + 1 === v[1] && v[1] + 1 === v[2]) possibleCantos.push({ type: "Patrulla", points: 6, rank: r[2], autoWin: false });
    if (v[0] === v[1] || v[1] === v[2]) {
      const rondaRank = (v[0] === v[1]) ? r[0] : r[1];
      possibleCantos.push({ type: "Ronda", points: CANTO_POINTS_RONDA[rondaRank], rank: rondaRank, autoWin: false });
    }
    if (possibleCantos.length === 0) return null;
    return possibleCantos.sort((a, b) => b.points - a.points)[0];
  };

  const checkGameWinner = () => {
    if (playerScore >= GAME_TARGET_SCORE || opponentScore >= GAME_TARGET_SCORE) {
      setGameInProgress(false);
      const winner = playerScore >= GAME_TARGET_SCORE ? 'player' : 'opponent';
      setGameOverMessage(winner === 'player' ? "¡Felicidades, Ganaste!" : "¡Mejor suerte la próxima!");
      setGameOverIcon(winner === 'player' ? "fas fa-trophy win-icon" : "fas fa-heart-crack lose-icon");
      setShowGameOverModal(true);
      return true;
    }
    return false;
  };

  const processPlay = (playedCard, currentPlayer) => {
    if (!gameInProgress) return;

    let newTableCards = [...tableCards];
    let newPlayerScore = playerScore;
    let newOpponentScore = opponentScore;
    let newPlayerCapturedCount = playerCapturedCount;
    let newOpponentCapturedCount = opponentCapturedCount;
    let newLastCardPlayedByPreviousPlayerRank = playedCard.rank;
    let newLastPlayerToCapture = lastPlayerToCapture;

    // Lógica de "Caída"
    if (lastCardPlayedByPreviousPlayerRank === playedCard.rank) {
      const caidaValue = CARD_POINTS_CAIDA[playedCard.rank];
      logAction(`¡Caída con ${RANK_DISPLAY[playedCard.rank]}! +${caidaValue} pts.`, currentPlayer === 'player' ? 'points' : 'opponent');
      if (currentPlayer === 'player') {
        newPlayerScore += caidaValue;
      } else {
        newOpponentScore += caidaValue;
      }
      if (checkGameWinner()) return;
    }

    // Lógica de captura
    const mainCaptureIndex = newTableCards.findIndex(c => c.rank === playedCard.rank);
    if (mainCaptureIndex > -1) {
      let capturedCardsOnPlay = [playedCard, newTableCards.splice(mainCaptureIndex, 1)[0]];
      logAction(`Capturas ${RANK_DISPLAY[capturedCardsOnPlay[1].rank]} con ${RANK_DISPLAY[playedCard.rank]}.`, currentPlayer);
      newLastPlayerToCapture = currentPlayer;
      newTableCards.sort((a, b) => a.numericValue - b.numericValue);
      let lastCapturedValue = capturedCardsOnPlay[1].numericValue;
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
      if (capturedCardsOnPlay.length > 2) {
        logAction(`¡...y te llevas ${capturedCardsOnPlay.length - 2} más en escalera!`, currentPlayer);
      }
      if (newTableCards.length === 0) {
        logAction(`¡Mesa Limpia! +${MESA_LIMPIA_BONUS} pts.`, 'points');
        if (currentPlayer === 'player') {
          newPlayerScore += MESA_LIMPIA_BONUS;
        } else {
          newOpponentScore += MESA_LIMPIA_BONUS;
        }
        if (checkGameWinner()) return;
      }
      const totalCapturedThisTurn = capturedCardsOnPlay.length;
      if (currentPlayer === 'player') {
        newPlayerCapturedCount += totalCapturedThisTurn;
      } else {
        newOpponentCapturedCount += totalCapturedThisTurn;
      }
    } else {
      newTableCards.push(playedCard);
    }

    // Actualizamos los estados
    setPlayerScore(newPlayerScore);
    setOpponentScore(newOpponentScore);
    setPlayerCapturedCount(newPlayerCapturedCount);
    setOpponentCapturedCount(newOpponentCapturedCount);
    setTableCards(newTableCards);
    setLastCardPlayedByPreviousPlayerRank(newLastCardPlayedByPreviousPlayerRank);
    setLastPlayerToCapture(newLastPlayerToCapture);
    setIsPlayerTurn(prev => !prev);
    // Verificar si la mano terminó
    if (playerHand.length === 0 && opponentHand.length === 0) {
      checkHandEnd();
    }
  };


  const playerPlayCard = (cardId) => {
    if (!isPlayerTurn || !gameInProgress) return;
    const cardIndex = playerHand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const playedCard = playerHand[cardIndex];
    const remainingHand = playerHand.filter(c => c.id !== cardId);
    setPlayerHand(remainingHand);
    logAction(`Jugaste <strong>${RANK_DISPLAY[playedCard.rank]} de ${SUITS[playedCard.suit]}</strong>.`, 'player');
    processPlay(playedCard, 'player');
  };

  const opponentTurn = () => {
    if (isPlayerTurn || !gameInProgress || opponentHand.length === 0) return;
    const cardToPlay = opponentHand[0];
    const remainingHand = opponentHand.slice(1);
    setOpponentHand(remainingHand);
    logAction(`Oponente jugó <strong>${RANK_DISPLAY[cardToPlay.rank]} de ${SUITS[cardToPlay.suit]}</strong>.`, 'opponent');
    processPlay(cardToPlay, 'opponent');
  };

  const checkHandEnd = () => {
    if (!gameInProgress || isDealingAutomatically) return;
    if (playerHand.length === 0 && opponentHand.length === 0) {
      if (fullShuffledDeck.length > 0) {
        setIsDealingAutomatically(true);
        logAction("Manos vacías. Repartiendo...", "system");
        setTimeout(() => {
          if (gameInProgress) {
            dealHands();
            setIsDealingAutomatically(false);
          }
        }, 1500);
      } else {
        checkRoundEnd();
      }
    }
  };

  const checkRoundEnd = () => {
    if (!gameInProgress) return;
    logAction("Fin de la ronda.", "system");

    let newPlayerCapturedCount = playerCapturedCount;
    let newOpponentCapturedCount = opponentCapturedCount;
    let newPlayerScore = playerScore;
    let newOpponentScore = opponentScore;

    if (tableCards.length > 0) {
      logAction(`${lastPlayerToCapture === 'player' ? 'Te llevas' : 'El oponente se lleva'} las cartas restantes.`, 'system');
      if (lastPlayerToCapture === 'player') newPlayerCapturedCount += tableCards.length;
      else newOpponentCapturedCount += tableCards.length;
      setTableCards([]);
    }

    const playerBonus = Math.max(0, newPlayerCapturedCount - CAPTURED_CARDS_BONUS_THRESHOLD);
    if (playerBonus > 0) {
      logAction(`Ganas ${playerBonus} punto(s) extra por capturar ${newPlayerCapturedCount} cartas.`, 'points');
      newPlayerScore += playerBonus;
    }

    const opponentBonus = Math.max(0, newOpponentCapturedCount - CAPTURED_CARDS_BONUS_THRESHOLD);
    if (opponentBonus > 0) {
      logAction(`Oponente gana ${opponentBonus} punto(s) extra por capturar ${newOpponentCapturedCount} cartas.`, 'points');
      newOpponentScore += opponentBonus;
    }

    setPlayerScore(newPlayerScore);
    setOpponentScore(newOpponentScore);
    setPlayerCapturedCount(newPlayerCapturedCount);
    setOpponentCapturedCount(newOpponentCapturedCount);

    if (checkGameWinner()) return;

    logAction("Iniciando siguiente ronda...", "system");
    setRoundStarter(prev => prev === 'player' ? 'opponent' : 'player');
    resetGameScoresAndState(false);
  };

  const processTableOrderChoice = (choice) => {
    setShowTableChoiceModal(false);
    let points = 0;
    const sequence = choice === 'asc' ? ['1', '2', '3', '4'] : ['4', '3', '2', '1'];
    const sortedTableCards = [...tableCards].sort((a, b) => a.numericValue - b.numericValue);
    logAction(`${roundStarter === 'player' ? 'Elegiste' : 'El Bot eligió'} el orden <strong>${choice === 'asc' ? 'Ascendente' : 'Descendente'}</strong>.`, roundStarter === 'player' ? 'player' : 'opponent');
    for (let i = 0; i < sortedTableCards.length; i++) {
      if (sortedTableCards[i].rank === sequence[i]) {
        points += sortedTableCards[i].numericValue;
      }
    }

    if (points === 0) {
      const otherPlayer = roundStarter === 'player' ? 'oponente' : 'jugador';
      logAction(`No hubo coincidencias. <strong>+1 pt</strong> para el ${otherPlayer}.`, 'points');
      if (roundStarter === 'player') setOpponentScore(prev => prev + 1);
      else setPlayerScore(prev => prev + 1);
    } else {
      logAction(`¡Coincidencias! <strong>+${points} pts</strong>.`, 'points');
      if (roundStarter === 'player') setPlayerScore(prev => prev + points);
      else setOpponentScore(prev => prev + points);
    }

    if (checkGameWinner()) return;
    setIsPlayerTurn(roundStarter !== 'player');
    dealHands();
  };

  const dealHands = () => {
    let newPlayerHand = [];
    let newOpponentHand = [];
    let newDeck = [...deck];
    if (newDeck.length < 6) {
      checkRoundEnd();
      return;
    }
    setHandNumber(prev => prev + 1);
    logAction(`Repartiendo mano ${handNumber}...`, "system");
    for (let i = 0; i < 3; i++) {
      newPlayerHand.push(newDeck.shift());
      newOpponentHand.push(newDeck.shift());
    }
    setPlayerHand(newPlayerHand);
    setOpponentHand(newOpponentHand);
    setDeck(newDeck);

    const playerCanto = checkCantos(newPlayerHand);
    const opponentCanto = checkCantos(newOpponentHand);
    if (playerCanto || opponentCanto) {
      let cantoWinner = null;
      let winnerCanto = null;
      if (!opponentCanto || (playerCanto && playerCanto.points > opponentCanto.points)) {
        cantoWinner = 'player';
        winnerCanto = playerCanto;
      } else if (!playerCanto || (opponentCanto && opponentCanto.points > playerCanto.points)) {
        cantoWinner = 'opponent';
        winnerCanto = opponentCanto;
      } else {
        cantoWinner = RANKS_ORDERED_NUMERIC[playerCanto.rank] > RANKS_ORDERED_NUMERIC[opponentCanto.rank] ? 'player' : 'opponent';
        winnerCanto = cantoWinner === 'player' ? playerCanto : opponentCanto;
      }
      const winnerName = cantoWinner === 'player' ? 'Tienes' : 'El oponente tiene';
      logAction(`${winnerName} ${formatCantoMessage(winnerCanto)}. +${winnerCanto.points} pts.`, cantoWinner === 'player' ? 'points' : 'opponent');
      if (cantoWinner === 'player') setPlayerScore(prev => prev + winnerCanto.points);
      else setOpponentScore(prev => prev + winnerCanto.points);
      if (checkGameWinner()) return;
    }
    setIsFirstHandOfGame(false);

    if (!isPlayerTurn && gameInProgress) {
      setTimeout(opponentTurn, 1500);
    }
  };

  const dealInitialTableCardsAndPrompt = () => {
    let newDeck = [...fullShuffledDeck];
    let newTableCards = [];
    let drawnRanks = new Set();
    while (newTableCards.length < 4 && newDeck.length > 0) {
      const card = newDeck.shift();
      if (!drawnRanks.has(card.rank)) {
        newTableCards.push(card);
        drawnRanks.add(card.rank);
      }
    }
    setTableCards(newTableCards);
    setDeck(newDeck);

    const whoIsMano = roundStarter === 'player' ? 'Eres' : 'El oponente es';
    logAction(`${whoIsMano} la mano.`, 'system');
    if (roundStarter === 'player') {
      setShowTableChoiceModal(true);
    } else {
      setTimeout(() => processTableOrderChoice(Math.random() < 0.5 ? 'asc' : 'desc'), 2000);
    }
  };

  const startGame = () => {
    setGameInProgress(true);
    setIsDealingAutomatically(false);
    setPlayerHand([]);
    setOpponentHand([]);
    setTableCards([]);
    setLastCardPlayedByPreviousPlayerRank(null);
    setLastPlayerToCapture(roundStarter === 'player' ? 'opponent' : 'player');
    setIsFirstHandOfGame(true);
    setHandNumber(0);
    dealInitialTableCardsAndPrompt();
  };

  const resetGameScoresAndState = (fullReset) => {
    setGameLog([]);
    if (fullReset) {
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerCapturedCount(0);
      setOpponentCapturedCount(0);
      const newDeck = createDeck();
      const shuffledDeck = shuffleDeck(newDeck);
      setFullShuffledDeck(shuffledDeck);
      setRoundStarter(Math.random() < 0.5 ? 'player' : 'opponent');
    } else {
      setPlayerCapturedCount(0);
      setOpponentCapturedCount(0);
    }
    startGame();
  };

  // --- Efecto para la inicialización de Firebase y la autenticación ---
  useEffect(() => {
    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
        apiKey: "AIzaSyCbligeo6IJw5qKhon5z_LzqGE6x-iSrf4",
        authDomain: "caida-game.firebaseapp.com",
        projectId: "caida-game",
        storageBucket: "caida-game.appspot.com",
        messagingSenderId: "707030975610",
        appId: "1:707030975610:web:e719a16b40d49008d0e7c3"
      };
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          const userEmail = user.email || 'Anónimo';
          setUserEmail(userEmail);

          const appId = typeof __app_id !== 'undefined' ? __app_id.replace(/\//g, '-') : 'caida-dev';
          setDbRefGame(doc(dbInstance, 'artifacts', appId, 'users', user.uid, 'caidaGame', 'gameState'));
        } else {
          setUserId(null);
          setGameInProgress(false);
        }
        setIsAuthReady(true);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Error al inicializar Firebase:", e);
    }
  }, []);

  // Efecto para la autenticación inicial con el token
  useEffect(() => {
    if (auth && !userId && isAuthReady) {
      const initialAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          setAuthError(mapAuthError(error.code));
        }
      };
      initialAuth();
    }
  }, [auth, userId, isAuthReady]);

  // Efecto para cargar o iniciar el juego cuando el usuario y la referencia a la DB estén listos
  useEffect(() => {
    const loadGame = async () => {
      if (dbRefGame) {
        try {
          const docSnap = await getDoc(dbRefGame);
          if (docSnap.exists() && docSnap.data().gameInProgress) {
            const data = docSnap.data();
            setPlayerScore(data.playerScore || 0);
            setOpponentScore(data.opponentScore || 0);
            setPlayerCapturedCount(data.playerCapturedCount || 0);
            setOpponentCapturedCount(data.opponentCapturedCount || 0);
            setGameInProgress(data.gameInProgress || false);
            setPlayerHand(data.playerHand || []);
            setOpponentHand(data.opponentHand || []);
            setTableCards(data.tableCards || []);
            setIsPlayerTurn(data.isPlayerTurn === undefined ? true : data.isPlayerTurn);
            setLastCardPlayedByPreviousPlayerRank(data.lastCardPlayedByPreviousPlayerRank || null);
            setLastPlayerToCapture(data.lastPlayerToCapture || null);
            setRoundStarter(data.roundStarter || 'player');
            setIsFirstHandOfGame(data.isFirstHandOfGame === undefined ? true : data.isFirstHandOfGame);
            setHandNumber(data.handNumber || 0);
            logAction("Juego cargado desde la base de datos.", "system");
          } else {
            resetGameScoresAndState(true);
          }
        } catch (error) {
          console.error("Error al cargar el estado del juego:", error);
          setGameInProgress(false);
        }
      }
    };
    loadGame();
  }, [dbRefGame]);

  // Efecto para guardar el estado del juego en Firestore cada vez que cambie
  useEffect(() => {
    if (dbRefGame && gameInProgress) {
      const saveState = async () => {
        const gameState = { playerScore, opponentScore, playerCapturedCount, opponentCapturedCount, gameInProgress, playerHand, opponentHand, tableCards, isPlayerTurn, lastCardPlayedByPreviousPlayerRank, lastPlayerToCapture, roundStarter, isFirstHandOfGame, handNumber, fullShuffledDeck };
        try {
          await setDoc(dbRefGame, gameState);
        } catch (error) {
          console.error("Error al guardar el estado del juego:", error);
        }
      };
      saveState();
    }
  }, [playerScore, opponentScore, playerCapturedCount, opponentCapturedCount, gameInProgress, playerHand, opponentHand, tableCards, isPlayerTurn, lastCardPlayedByPreviousPlayerRank, lastPlayerToCapture, roundStarter, isFirstHandOfGame, handNumber, fullShuffledDeck]);


  // Lógica de renderizado de la interfaz
  const renderCard = (cardData) => (
    <div
      key={cardData.id}
      className={`card ${!isPlayerTurn || !gameInProgress ? 'disabled' : ''}`}
      onClick={isPlayerTurn && gameInProgress ? () => playerPlayCard(cardData.id) : null}
    >
      <img className="card-img" src={getCardImage(cardData.rank, cardData.suit)} alt={`${cardData.displayRank} de ${SUITS[cardData.suit]}`} />
    </div>
  );

  const renderPlayerHand = () => playerHand.sort((a, b) => a.numericValue - b.numericValue).map(card => renderCard(card));
  const renderOpponentHand = () => opponentHand.map((_, index) => <div key={index} className="card-back"></div>);
  const renderTableCards = () => tableCards.sort((a, b) => a.numericValue - b.numericValue).map(card => <div key={card.id} className="card played"><img className="card-img" src={getCardImage(card.rank, card.suit)} alt={`${card.displayRank} de ${SUITS[card.suit]}`} /></div>);

  const displayName = userEmail.split('@')[0];
  const turnName = isPlayerTurn ? (displayName || 'Jugador') : 'CaidaBot';
  const turnColor = isPlayerTurn ? 'text-indigo-400' : 'text-red-400';

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthError('');
    } catch (error) {
      setAuthError(mapAuthError(error.code));
    }
  };

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthError('');
    } catch (error) {
      setAuthError(mapAuthError(error.code));
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --bg-dark-primary: #111827;
            --bg-dark-secondary: #1F2937;
            --panel-bg: #1a2035;
            --border-color: #374151;
            --primary-accent: #4338CA;
            --primary-accent-hover: #3730A3;
            --secondary-accent: #10B981;
            --text-light: #E5E7EB;
            --text-muted: #9CA3AF;
            --text-gold: #FBBF24;
            --danger: #DC2626;
            --danger-hover: #B91C1C;
          }

          @import "tailwindcss";

          body {
            font-family: 'Poppins', sans-serif;
            overflow-x: hidden;
            background-color: var(--bg-dark-primary);
            color: var(--text-light);
            background-image: radial-gradient(circle at top left, rgba(67, 56, 202, 0.15), transparent 30%),
              radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.15), transparent 30%);
          }
        `}
      </style>
      <div id="rotate-device-prompt" className="fixed inset-0 bg-gray-900 z-[4000] flex-col items-center justify-center text-center p-4">
        <i className="fas fa-mobile-screen-button text-6xl mb-4 animate-pulse"></i>
        <h2 className="text-2xl font-bold mb-2">Por favor, rota tu dispositivo</h2>
        <p className="text-lg text-gray-400">Este juego se disfruta mejor en modo horizontal.</p>
      </div>

      <div id="authContainer" className={`fixed inset-0 bg-gray-900 flex items-center justify-center z-[3000] ${userId ? 'hidden' : 'flex'}`}>
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl text-gray-800">
          <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">Caída Venezolana</h2>
          {authError && <div className="text-center p-3 mb-4 rounded-md bg-red-100 text-red-700 font-medium">{authError}</div>}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo Electrónico" className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition" />
          <div className="flex space-x-4">
            <button id="loginButton" className="button flex-1" onClick={handleLogin}>Entrar</button>
            <button id="registerButton" className="button !bg-emerald-600 hover:!bg-emerald-700 flex-1" onClick={handleRegister}>Registrarse</button>
          </div>
        </div>
      </div>

      <div id="appContainer" className={`min-h-screen flex flex-col ${userId ? 'flex' : 'hidden'}`}>
        <nav id="navbar" className="h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div id="newGameButtonContainer" className="nav-item gap-4 flex items-center">
            <button id="newGameButton" className="button text-sm" onClick={() => showConfirmation("¿Seguro que quieres empezar un nuevo juego? Se perderá el progreso actual.", () => resetGameScoresAndState(true))}>
              <i className="fas fa-gamepad mr-2"></i>Nuevo Juego
            </button>
          </div>
          <div className="nav-scores-container flex items-center space-x-4 text-sm">
            <div className="nav-item flex items-center bg-black bg-opacity-20 px-3 py-1 rounded-full">
              <i className="fas fa-user-astronaut mr-2 text-indigo-400"></i>
              <span>Tú: <span id="navPlayerScore" className="font-bold text-white">{playerScore}</span></span>
              <span className="mx-2 text-gray-500">|</span>
              <i className="fas fa-layer-group mr-1 text-indigo-400"></i>
              <span id="navPlayerCaptured" className="font-bold text-white">{playerCapturedCount}</span>
            </div>
            <div className="nav-item flex items-center bg-black bg-opacity-20 px-3 py-1 rounded-full">
              <i className="fas fa-robot mr-2 text-red-400"></i>
              <span>Bot: <span id="navOpponentScore" className="font-bold text-white">{opponentScore}</span></span>
              <span className="mx-2 text-gray-500">|</span>
              <i className="fas fa-layer-group mr-1 text-red-400"></i>
              <span id="navOpponentCaptured" className="font-bold text-white">{opponentCapturedCount}</span>
            </div>
          </div>
          <div id="turnIndicator" className={`nav-item font-semibold text-lg ${turnColor}`}>Turno: <span id="turnPlayerName" className="ml-2 font-bold">{turnName}</span></div>
          <div id="handCounter" className="nav-item font-semibold text-lg hidden md:block">Mano: <span id="currentHand" className="ml-2 text-white">{handNumber} / 5</span></div>
          <div className="flex items-center gap-2">
            <span id="currentUserEmail" className="text-sm font-medium hidden md:block">{displayName}</span>
            <button id="logoutButton" className="button logout !p-2 text-lg leading-none" onClick={() => auth.signOut()}><i className="fas fa-sign-out-alt"></i></button>
          </div>
        </nav>

        <main id="mainLayout">
          <aside id="left-panel" className="panel">
            <h3 className="panel-title"><i className="fas fa-scroll mr-2"></i>Registro de Jugadas</h3>
            <div id="gameLogContainer" className="panel-content">
              <ul id="gameLog">
                {gameLog.map((entry, index) => (
                  <li key={index} className={`log-entry log-${entry.type}`}>
                    <i className={`${entry.icon} mr-2 w-5 text-center`}></i>
                    <div dangerouslySetInnerHTML={{ __html: entry.message }}></div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <section id="center-panel">
            <div id="opponent-hand-area" className="hand-area">
              <div id="opponentHand" className="flex-grow flex justify-center items-center">
                {renderOpponentHand()}
              </div>
              <div className="player-profile">
                <div className="avatar !bg-red-600 !border-red-400 !shadow-red-500/50">B</div>
                <div className="player-name">CaidaBot</div>
              </div>
            </div>
            <div id="game-board">
              <div id="table-cards">
                {renderTableCards()}
              </div>
            </div>
            <div id="player-hand-area" className="hand-area">
              <div id="playerHand" className="flex-grow flex justify-center items-center">
                {renderPlayerHand()}
              </div>
              <div className="player-profile">
                <div id="player-avatar" className="avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div id="player-name" className="player-name">{displayName}</div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showConfirmationModal && (
        <div id="confirmationModal" className="modal-overlay">
          <div className="modal-content">
            <p id="modalMessage" className="text-lg font-semibold mb-4">{confirmationMessage}</p>
            <div className="modal-buttons">
              <button id="modalConfirmYes" className="button logout" onClick={() => { confirmationCallback(); setShowConfirmationModal(false); }}>Sí, seguro</button>
              <button id="modalConfirmNo" className="button !bg-gray-500 hover:!bg-gray-600" onClick={() => setShowConfirmationModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showTableChoiceModal && (
        <div id="tableChoiceModal" className="modal-overlay">
          <div className="modal-content">
            <p id="tableChoiceMessage" className="text-xl font-bold mb-6">Eres mano. Elige el orden de la mesa:</p>
            <div className="modal-buttons">
              <div id="choiceAsc" className="card cursor-pointer" onClick={() => processTableOrderChoice('asc')}>
                <img className="card-img" src="https://res.cloudinary.com/teributu/image/upload/1o.jpg" alt="As de Oro" />
              </div>
              <div id="choiceDesc" className="card cursor-pointer" onClick={() => processTableOrderChoice('desc')}>
                <img className="card-img" src="https://res.cloudinary.com/teributu/image/upload/4o.jpg" alt="Cuatro de Oro" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showGameOverModal && (
        <div id="gameOverModal" className="modal-overlay">
          <div className="modal-content">
            <i id="gameOverIcon" className={gameOverIcon}></i>
            <h2 id="gameOverMessage" className="text-3xl font-bold mb-4">{gameOverMessage}</h2>
            <p className="mb-6 text-lg text-gray-300">¿Qué te gustaría hacer ahora?</p>
            <div className="modal-buttons">
              <button id="gameOverNewGame" className="button !bg-emerald-600 hover:!bg-emerald-700" onClick={() => { setShowGameOverModal(false); resetGameScoresAndState(true); }}>Jugar de Nuevo</button>
              <button id="gameOverExit" className="button logout" onClick={() => auth.signOut()}>Salir del Juego</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
