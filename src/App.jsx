import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './lib/firebase.js'

function App() {
  const [count, setCount] = useState(0)
  // Variables globales de Firebase
  let app, auth, db;

  // Se usa __app_id si está definido, de lo contrario un valor por defecto.
  const firestoreAppIdNamespace = typeof __app_id !== 'undefined' ? __app_id : 'caida-dev';
  let userId = null, dbRefGame = null;
  let confirmCallback = null;

  // --- Constantes y Estado del Juego ---
  const SUITS = { 'O': 'Oros', 'C': 'Copas', 'E': 'Espadas', 'B': 'Bastos' };
  const RANKS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
  const RANK_DISPLAY = { '1': 'As', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', 'S': 'Sota', 'C': 'Caballo', 'R': 'Rey' };
  const RANKS_ORDERED_NUMERIC = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'S': 8, 'C': 9, 'R': 10 };
  const CARD_POINTS_CAIDA = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, 'S': 2, 'C': 3, 'R': 4 };
  const CANTO_POINTS_RONDA = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, 'S': 2, 'C': 3, 'R': 4 };
  const GAME_TARGET_SCORE = 24, MESA_LIMPIA_BONUS = 4, CAPTURED_CARDS_BONUS_THRESHOLD = 20;

  const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/teributu/image/upload/";
  const RANK_TO_IMG = { '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', 'S': '10', 'C': '11', 'R': '12' };
  function getCardImage(rank, suit) {
    return `${CLOUDINARY_BASE_URL}${RANK_TO_IMG[rank]}${suit.toLowerCase()}.jpg`;
  }

  // Variables de estado del juego
  let fullShuffledDeck = [], deck = [], playerHand = [], opponentHand = [], tableCards = [];
  let playerScore = 0, opponentScore = 0, playerCapturedCount = 0, opponentCapturedCount = 0;
  let isPlayerTurn = true, lastCardPlayedByPreviousPlayerRank = null, lastPlayerToCapture = null;
  let gameInProgress = false, isDealingAutomatically = false, roundStarter = 'player', isFirstHandOfGame = true, handNumber = 0;

  // Caché de elementos del DOM
  let allDomElements = {};

  // --- Funciones de Utilidad y UI ---
  function assignDomElements() {
    const ids = ['authContainer', 'appContainer', 'logoutButton', 'loginButton', 'registerButton', 'emailInput', 'passwordInput', 'authMessageArea', 'navPlayerScore', 'navOpponentScore', 'navPlayerCaptured', 'navOpponentCaptured', 'gameLog', 'newGameButton', 'table-cards', 'playerHand', 'opponentHand', 'turnPlayerName', 'currentUserEmail', 'player-name', 'player-avatar', 'confirmationModal', 'modalMessage', 'modalConfirmYes', 'modalConfirmNo', 'tableChoiceModal', 'tableChoiceMessage', 'choiceAsc', 'choiceDesc', 'gameOverModal', 'gameOverIcon', 'gameOverMessage', 'gameOverNewGame', 'gameOverExit', 'handCounter', 'rotate-device-prompt'];
    allDomElements = {};
    ids.forEach(id => { allDomElements[id] = document.getElementById(id); });
  }

  function updateTurnIndicator() { if (!allDomElements.turnPlayerName) return; const turnName = isPlayerTurn ? (auth.currentUser?.email?.split('@')[0] || 'Jugador') : 'CaidaBot'; allDomElements.turnPlayerName.textContent = turnName; allDomElements.turnPlayerName.parentElement.style.color = isPlayerTurn ? '#818cf8' : '#fca5a5'; };
  function updateScoreDisplay() { if (allDomElements.navPlayerScore) allDomElements.navPlayerScore.textContent = playerScore || 0; if (allDomElements.navOpponentScore) allDomElements.navOpponentScore.textContent = opponentScore || 0; if (allDomElements.navPlayerCaptured) allDomElements.navPlayerCaptured.textContent = playerCapturedCount || 0; if (allDomElements.navOpponentCaptured) allDomElements.navOpponentCaptured.textContent = opponentCapturedCount || 0; };
  function updateHandDisplay() { const handCounterDiv = allDomElements.handCounter; if (!handCounterDiv) return; const totalHands = 5; if (handNumber > totalHands) { handCounterDiv.innerHTML = `Mano: <span class="ml-2 text-red-400">¡Última!</span>`; } else { handCounterDiv.innerHTML = `Mano: <span id="currentHand" class="ml-2 text-white">${handNumber} / ${totalHands}</span>`; } }
  function logAction(message, type = 'system') { if (!allDomElements.gameLog) return; const entry = document.createElement('li'); entry.classList.add('log-entry', `log-${type}`); const icons = { player: 'fa-user-astronaut', opponent: 'fa-robot', system: 'fa-info-circle', points: 'fa-star' }; entry.innerHTML = `<i class="fas ${icons[type]} mr-2 w-5 text-center"></i> <div>${message}</div>`; allDomElements.gameLog.prepend(entry); };
  function showConfirmationModal(message, onConfirm) { if (!allDomElements.confirmationModal) return; allDomElements.modalMessage.textContent = message; confirmCallback = onConfirm; allDomElements.confirmationModal.classList.add('visible'); };
  function hideConfirmationModal() { if (!allDomElements.confirmationModal) return; allDomElements.confirmationModal.classList.remove('visible'); confirmCallback = null; };
  function showTableChoiceModal() { if (!allDomElements.tableChoiceModal) return; allDomElements.tableChoiceMessage.textContent = "Eres mano. Elige el orden de la mesa:"; allDomElements.tableChoiceModal.classList.add('visible'); };
  function hideTableChoiceModal() { if (!allDomElements.tableChoiceModal) return; allDomElements.tableChoiceModal.classList.remove('visible'); };
  const showGameOverModal = (didPlayerWin) => { if (!allDomElements.gameOverModal) return; if (didPlayerWin) { allDomElements.gameOverIcon.className = "fas fa-trophy win-icon"; allDomElements.gameOverMessage.textContent = "¡Felicidades, Ganaste!"; } else { allDomElements.gameOverIcon.className = "fas fa-heart-crack lose-icon"; allDomElements.gameOverMessage.textContent = "¡Mejor suerte la próxima!"; } allDomElements.gameOverModal.classList.add('visible'); };
  const hideGameOverModal = () => { if (!allDomElements.gameOverModal) return; allDomElements.gameOverModal.classList.remove('visible'); };
  function mapAuthError(errorCode) { switch (errorCode) { case 'auth/invalid-email': return 'Correo electrónico inválido.'; case 'auth/user-not-found': return 'Usuario no encontrado.'; case 'auth/wrong-password': return 'Contraseña incorrecta.'; case 'auth/email-already-in-use': return 'Este correo ya está registrado.'; default: return `Error desconocido. Código: ${errorCode}`; } };

  // --- Lógica de Firebase y Persistencia ---
  async function saveGameScore() { if (!userId || !dbRefGame) return; const gameState = { playerScore, opponentScore, playerCapturedCount, opponentCapturedCount, gameInProgress, fullShuffledDeck, deck, playerHand, opponentHand, tableCards, isPlayerTurn, lastCardPlayedByPreviousPlayerRank, lastPlayerToCapture, roundStarter, isFirstHandOfGame, handNumber }; try { await setDoc(dbRefGame, gameState); } catch (error) { console.error("Error al guardar el estado del juego:", error); } };
  async function loadGameScore() { if (!userId || !dbRefGame) return; try { const docSnap = await getDoc(dbRefGame); if (docSnap.exists() && docSnap.data().gameInProgress) { const data = docSnap.data(); playerScore = data.playerScore || 0; opponentScore = data.opponentScore || 0; playerCapturedCount = data.playerCapturedCount || 0; opponentCapturedCount = data.opponentCapturedCount || 0; gameInProgress = data.gameInProgress || false; fullShuffledDeck = data.fullShuffledDeck || []; deck = data.deck || []; playerHand = data.playerHand || []; opponentHand = data.opponentHand || []; tableCards = data.tableCards || []; isPlayerTurn = data.isPlayerTurn === undefined ? true : data.isPlayerTurn; lastCardPlayedByPreviousPlayerRank = data.lastCardPlayedByPreviousPlayerRank || null; lastPlayerToCapture = data.lastPlayerToCapture || null; roundStarter = data.roundStarter || 'player'; isFirstHandOfGame = data.isFirstHandOfGame === undefined ? true : data.isFirstHandOfGame; handNumber = data.handNumber || 0; } else { gameInProgress = false; } } catch (error) { console.error("Error al cargar el estado del juego:", error); gameInProgress = false; } };

  // --- Lógica del Juego ---
  function createDeck() { deck = []; for (const suitCode in SUITS) { for (const rank of RANKS) { deck.push({ id: rank + suitCode, rank, suit: suitCode, displayRank: RANK_DISPLAY[rank], numericValue: RANKS_ORDERED_NUMERIC[rank] }); } } };
  function shuffleDeck() { for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[deck[i], deck[j]] = [deck[j], deck[i]]; } };

  function renderCard(cardData) {
    const div = document.createElement("div");
    div.className = "card";
    const img = document.createElement("img");
    img.className = "card-img";
    img.src = getCardImage(cardData.rank, cardData.suit);
    img.alt = `${cardData.displayRank} de ${SUITS[cardData.suit]}`;
    div.appendChild(img);
    return div;
  };

  function renderPlayerHand() { if (!allDomElements.playerHand) return; allDomElements.playerHand.innerHTML = ''; playerHand.sort((a, b) => a.numericValue - b.numericValue).forEach(card => { const cardDiv = renderCard(card); if (gameInProgress && isPlayerTurn) { cardDiv.addEventListener('click', () => playerPlayCard(card.id)); } else { cardDiv.classList.add('disabled'); } allDomElements.playerHand.appendChild(cardDiv); }); };
  function renderOpponentHand() { if (!allDomElements.opponentHand) return; allDomElements.opponentHand.innerHTML = ''; for (let i = 0; i < opponentHand.length; i++) { const cardBack = document.createElement('div'); cardBack.classList.add('card-back'); allDomElements.opponentHand.appendChild(cardBack); } };
  function renderTableCards() { if (!allDomElements['table-cards']) return; allDomElements['table-cards'].innerHTML = ''; tableCards.sort((a, b) => a.numericValue - b.numericValue).forEach(card => { const cardDiv = renderCard(card); cardDiv.classList.add('played'); allDomElements['table-cards'].appendChild(cardDiv); }); };

  const formatCantoMessage = (cantoResult) => { let msg = `canto de <strong>${cantoResult.type}</strong>`; if (cantoResult.rank) msg += ` de ${RANK_DISPLAY[cantoResult.rank]}`; return msg; };
  const checkCantos = (hand) => { if (hand.length < 3) return null; const sortedHand = [...hand].sort((a, b) => a.numericValue - b.numericValue); const r = sortedHand.map(c => c.rank); const v = sortedHand.map(c => c.numericValue); let possibleCantos = []; if (v[0] === v[1] && v[1] === v[2]) possibleCantos.push({ type: "Tribilín", points: isFirstHandOfGame ? GAME_TARGET_SCORE : 5, rank: r[0], autoWin: isFirstHandOfGame }); if (r.includes('1') && r.includes('C') && r.includes('R')) possibleCantos.push({ type: "Registro", points: 8, rank: 'R', autoWin: false }); const isVigia = (v[0] === v[1] && v[2] === v[0] + 1) || (v[1] === v[2] && v[0] === v[1] - 1); if (isVigia) possibleCantos.push({ type: "Vigía", points: 7, rank: v[0] === v[1] ? r[0] : r[1], autoWin: false }); if (v[0] + 1 === v[1] && v[1] + 1 === v[2]) possibleCantos.push({ type: "Patrulla", points: 6, rank: r[2], autoWin: false }); if (v[0] === v[1] || v[1] === v[2]) { const rondaRank = (v[0] === v[1]) ? r[0] : r[1]; possibleCantos.push({ type: "Ronda", points: CANTO_POINTS_RONDA[rondaRank], rank: rondaRank, autoWin: false }); } if (possibleCantos.length === 0) return null; return possibleCantos.sort((a, b) => b.points - a.points)[0]; };

  const dealHands = () => { if (deck.length < 6) { checkRoundEnd(); return; } handNumber++; updateHandDisplay(); logAction(`Repartiendo mano ${handNumber}...`, "system"); for (let i = 0; i < 3; i++) { playerHand.push(deck.shift()); opponentHand.push(deck.shift()); } const playerCanto = checkCantos(playerHand); const opponentCanto = checkCantos(opponentHand); if (playerCanto || opponentCanto) { let cantoWinner = null, winnerCanto = null; if (!opponentCanto || (playerCanto && playerCanto.points > opponentCanto.points)) { cantoWinner = 'player'; winnerCanto = playerCanto; } else if (!playerCanto || (opponentCanto && opponentCanto.points > playerCanto.points)) { cantoWinner = 'opponent'; winnerCanto = opponentCanto; } else { cantoWinner = RANKS_ORDERED_NUMERIC[playerCanto.rank] > RANKS_ORDERED_NUMERIC[opponentCanto.rank] ? 'player' : 'opponent'; winnerCanto = cantoWinner === 'player' ? playerCanto : opponentCanto; } const winnerName = cantoWinner === 'player' ? 'Tienes' : 'El oponente tiene'; logAction(`${winnerName} ${formatCantoMessage(winnerCanto)}. +${winnerCanto.points} pts.`, cantoWinner === 'player' ? 'points' : 'opponent'); if (cantoWinner === 'player') playerScore += winnerCanto.points; else opponentScore += winnerCanto.points; updateScoreDisplay(); if (checkGameWinner()) return; } isFirstHandOfGame = false; renderPlayerHand(); renderOpponentHand(); updateTurnIndicator(); if (!isPlayerTurn && gameInProgress) { setTimeout(opponentTurn, 1500); } };

  const processPlay = (playedCard, currentPlayer) => { if (!gameInProgress) return; if (lastCardPlayedByPreviousPlayerRank === playedCard.rank) { const caidaValue = CARD_POINTS_CAIDA[playedCard.rank]; logAction(`¡Caída con ${RANK_DISPLAY[playedCard.rank]}! +${caidaValue} pts.`, currentPlayer === 'player' ? 'points' : 'opponent'); if (currentPlayer === 'player') playerScore += caidaValue; else opponentScore += caidaValue; if (checkGameWinner()) return; } lastCardPlayedByPreviousPlayerRank = playedCard.rank; let capturedCardsOnPlay = []; const mainCaptureIndex = tableCards.findIndex(c => c.rank === playedCard.rank); if (mainCaptureIndex > -1) { capturedCardsOnPlay.push(playedCard); const mainCapturedCard = tableCards.splice(mainCaptureIndex, 1)[0]; capturedCardsOnPlay.push(mainCapturedCard); logAction(`Capturas ${RANK_DISPLAY[mainCapturedCard.rank]} con ${RANK_DISPLAY[playedCard.rank]}.`, currentPlayer); lastPlayerToCapture = currentPlayer; tableCards.sort((a, b) => a.numericValue - b.numericValue); let lastCapturedValue = mainCapturedCard.numericValue; let sequenceFound = true; while (sequenceFound) { sequenceFound = false; const nextInSequenceIndex = tableCards.findIndex(c => c.numericValue === lastCapturedValue + 1); if (nextInSequenceIndex > -1) { const sequenceCard = tableCards.splice(nextInSequenceIndex, 1)[0]; capturedCardsOnPlay.push(sequenceCard); lastCapturedValue = sequenceCard.numericValue; sequenceFound = true; } } if (capturedCardsOnPlay.length > 2) { logAction(`¡...y te llevas ${capturedCardsOnPlay.length - 2} más en escalera!`, currentPlayer); } if (tableCards.length === 0) { logAction(`¡Mesa Limpia! +${MESA_LIMPIA_BONUS} pts.`, 'points'); if (currentPlayer === 'player') playerScore += MESA_LIMPIA_BONUS; else opponentScore += MESA_LIMPIA_BONUS; if (checkGameWinner()) return; } const totalCapturedThisTurn = capturedCardsOnPlay.length; if (currentPlayer === 'player') playerCapturedCount += totalCapturedThisTurn; else opponentCapturedCount += totalCapturedThisTurn; } else { tableCards.push(playedCard); } updateScoreDisplay(); renderTableCards(); isPlayerTurn = !isPlayerTurn; updateTurnIndicator(); if (isPlayerTurn) { renderPlayerHand(); } else { renderOpponentHand(); setTimeout(opponentTurn, 1500); } checkHandEnd(); saveGameScore(); };
  const opponentTurn = () => { if (isPlayerTurn || !gameInProgress || opponentHand.length === 0) return; let cardToPlay = opponentHand[0]; const cardIndex = opponentHand.findIndex(c => c.id === cardToPlay.id); const playedCard = opponentHand.splice(cardIndex, 1)[0]; logAction(`Oponente jugó <strong>${RANK_DISPLAY[playedCard.rank]} de ${SUITS[playedCard.suit]}</strong>.`, 'opponent'); renderOpponentHand(); processPlay(playedCard, 'opponent'); };
  const playerPlayCard = (cardId) => { if (!isPlayerTurn || !gameInProgress) return; const cardIndex = playerHand.findIndex(c => c.id === cardId); if (cardIndex === -1) return; const playedCard = playerHand.splice(cardIndex, 1)[0]; logAction(`Jugaste <strong>${RANK_DISPLAY[playedCard.rank]} de ${SUITS[playedCard.suit]}</strong>.`, 'player'); renderPlayerHand(); processPlay(playedCard, 'player'); };
  const checkHandEnd = () => { if (!gameInProgress || isDealingAutomatically) return; if (playerHand.length === 0 && opponentHand.length === 0) { if (deck.length > 0) { isDealingAutomatically = true; logAction("Manos vacías. Repartiendo...", "system"); setTimeout(() => { if (gameInProgress) { dealHands(); isDealingAutomatically = false; } }, 1500); } else { checkRoundEnd(); } } };
  const checkRoundEnd = () => { if (!gameInProgress) return; logAction("Fin de la ronda.", "system"); if (tableCards.length > 0) { logAction(`${lastPlayerToCapture === 'player' ? 'Te llevas' : 'El oponente se lleva'} las cartas restantes.`, 'system'); if (lastPlayerToCapture === 'player') playerCapturedCount += tableCards.length; else opponentCapturedCount += tableCards.length; tableCards = []; renderTableCards(); } const playerBonus = Math.max(0, playerCapturedCount - CAPTURED_CARDS_BONUS_THRESHOLD); if (playerBonus > 0) { logAction(`Ganas ${playerBonus} punto(s) extra por capturar ${playerCapturedCount} cartas.`, 'points'); playerScore += playerBonus; } const opponentBonus = Math.max(0, opponentCapturedCount - CAPTURED_CARDS_BONUS_THRESHOLD); if (opponentBonus > 0) { logAction(`Oponente gana ${opponentBonus} punto(s) extra por capturar ${opponentCapturedCount} cartas.`, 'points'); opponentScore += opponentBonus; } updateScoreDisplay(); if (checkGameWinner()) return; logAction("Iniciando siguiente ronda...", "system"); roundStarter = roundStarter === 'player' ? 'opponent' : 'player'; resetGameScoresAndState(false); };
  const checkGameWinner = () => { if (playerScore >= GAME_TARGET_SCORE || opponentScore >= GAME_TARGET_SCORE) { gameInProgress = false; saveGameScore(); const winner = playerScore >= GAME_TARGET_SCORE ? 'player' : 'opponent'; showGameOverModal(winner === 'player'); return true; } return false; };
  const processTableOrderChoice = (choice) => { hideTableChoiceModal(); let points = 0; const sequence = choice === 'asc' ? ['1', '2', '3', '4'] : ['4', '3', '2', '1']; const sortedTableCards = [...tableCards].sort((a, b) => a.numericValue - b.numericValue); logAction(`${roundStarter === 'player' ? 'Elegiste' : 'El Bot eligió'} el orden <strong>${choice === 'asc' ? 'Ascendente' : 'Descendente'}</strong>.`, roundStarter === 'player' ? 'player' : 'opponent'); for (let i = 0; i < sortedTableCards.length; i++) { if (sortedTableCards[i].rank === sequence[i]) { points += sortedTableCards[i].numericValue; } } if (points === 0) { const otherPlayer = roundStarter === 'player' ? 'oponente' : 'jugador'; logAction(`No hubo coincidencias. <strong>+1 pt</strong> para el ${otherPlayer}.`, 'points'); if (roundStarter === 'player') opponentScore += 1; else playerScore += 1; } else { logAction(`¡Coincidencias! <strong>+${points} pts</strong>.`, 'points'); if (roundStarter === 'player') playerScore += points; else opponentScore += points; } updateScoreDisplay(); if (checkGameWinner()) return; isPlayerTurn = roundStarter !== 'player'; updateTurnIndicator(); dealHands(); };
  const dealInitialTableCardsAndPrompt = () => { deck = [...fullShuffledDeck]; tableCards = []; let drawnRanks = new Set(); while (tableCards.length < 4 && deck.length > 0) { const card = deck.shift(); if (!drawnRanks.has(card.rank)) { tableCards.push(card); drawnRanks.add(card.rank); } } renderTableCards(); const whoIsMano = roundStarter === 'player' ? 'Eres' : 'El oponente es'; logAction(`${whoIsMano} la mano.`, 'system'); if (roundStarter === 'player') { showTableChoiceModal(); } else { setTimeout(() => processTableOrderChoice(Math.random() < 0.5 ? 'asc' : 'desc'), 2000); } };
  const startGame = () => { gameInProgress = true; isDealingAutomatically = false; playerHand = []; opponentHand = []; tableCards = []; lastCardPlayedByPreviousPlayerRank = null; lastPlayerToCapture = roundStarter === 'player' ? 'opponent' : 'player'; isFirstHandOfGame = true; handNumber = 0; updateScoreDisplay(); dealInitialTableCardsAndPrompt(); };
  const resetGameScoresAndState = async (fullReset) => { if (allDomElements.gameLog) allDomElements.gameLog.innerHTML = ''; if (fullReset) { playerScore = 0; opponentScore = 0; playerCapturedCount = 0; opponentCapturedCount = 0; roundStarter = Math.random() < 0.5 ? 'player' : 'opponent'; createDeck(); shuffleDeck(); fullShuffledDeck = [...deck]; } else { playerCapturedCount = 0; opponentCapturedCount = 0; } updateScoreDisplay(); if (userId && dbRefGame) { await setDoc(dbRefGame, { playerScore: 0, opponentScore: 0, gameInProgress: false, fullShuffledDeck }); } startGame(); };

  // --- Inicialización y Autenticación ---
  const initialCanvasAuth = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { await signInAnonymously(auth); } } catch (error) { if (allDomElements.authMessageArea) { allDomElements.authMessageArea.textContent = mapAuthError(error.code); allDomElements.authMessageArea.style.display = 'block'; } } };

  // --- Event Listener Principal ---
  document.addEventListener('DOMContentLoaded', () => {
    // Se usa la configuración de Firebase proporcionada por el entorno si existe.
    const firebaseConfigFromUser = { apiKey: "AIzaSyCbligeo6IJw5qKhon5z_LzqGE6x-iSrf4", authDomain: "caida-game.firebaseapp.com", projectId: "caida-game", storageBucket: "caida-game.appspot.com", messagingSenderId: "707030975610", appId: "1:707030975610:web:e719a16b40d49008d0e7c3" };
    const effectiveFirebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfigFromUser;

    try {
      app = initializeApp(effectiveFirebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (e) {
      console.error("Error al inicializar Firebase:", e);
      document.body.innerHTML = "<h1>Error Crítico</h1><p>No se pudo conectar con los servicios del juego. Por favor, recarga la página o contacta al administrador.</p>";
      return;
    }

    assignDomElements();

    allDomElements.logoutButton.addEventListener('click', () => signOut(auth));
    allDomElements.loginButton.addEventListener('click', async () => { try { await signInWithEmailAndPassword(auth, allDomElements.emailInput.value, allDomElements.passwordInput.value); } catch (error) { allDomElements.authMessageArea.textContent = mapAuthError(error.code); allDomElements.authMessageArea.style.display = 'block'; } });
    allDomElements.registerButton.addEventListener('click', async () => { try { await createUserWithEmailAndPassword(auth, allDomElements.emailInput.value, allDomElements.passwordInput.value); } catch (error) { allDomElements.authMessageArea.textContent = mapAuthError(error.code); allDomElements.authMessageArea.style.display = 'block'; } });
    allDomElements.newGameButton.addEventListener('click', () => { showConfirmationModal("¿Seguro que quieres empezar un nuevo juego? Se perderá el progreso actual.", () => { resetGameScoresAndState(true); }); });
    allDomElements.modalConfirmYes.addEventListener('click', () => { if (confirmCallback) confirmCallback(); hideConfirmationModal(); });
    allDomElements.modalConfirmNo.addEventListener('click', hideConfirmationModal);
    allDomElements.choiceAsc.addEventListener('click', () => processTableOrderChoice('asc'));
    allDomElements.choiceDesc.addEventListener('click', () => processTableOrderChoice('desc'));
    allDomElements.gameOverNewGame.addEventListener('click', () => { hideGameOverModal(); resetGameScoresAndState(true); });
    allDomElements.gameOverExit.addEventListener('click', () => signOut(auth));

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        userId = user.uid;
        const userEmail = user.email || 'Anónimo';
        const displayName = userEmail.split('@')[0];
        allDomElements.currentUserEmail.textContent = displayName;
        allDomElements['player-name'].textContent = displayName;
        allDomElements['player-avatar'].textContent = displayName.charAt(0).toUpperCase();
        allDomElements.authContainer.style.display = 'none';
        allDomElements.appContainer.style.display = 'flex';
        dbRefGame = doc(db, 'artifacts', firestoreAppIdNamespace, 'users', userId, 'caidaGame', 'gameState');
        await loadGameScore();
        if (!gameInProgress) {
          resetGameScoresAndState(true);
        } else {
          renderPlayerHand();
          renderOpponentHand();
          renderTableCards();
          updateScoreDisplay();
          updateTurnIndicator();
          updateHandDisplay();
        }
      } else {
        userId = null;
        allDomElements.authContainer.style.display = 'flex';
        allDomElements.appContainer.style.display = 'none';
      }
    });
    initialCanvasAuth();
  });
  return (
    <>
      <div id="rotate-device-prompt"
        className="fixed inset-0 bg-gray-900 z-[4000] flex-col items-center justify-center text-center p-4">
        <i className="fas fa-mobile-screen-button text-6xl mb-4 animate-pulse"></i>
        <h2 className="text-2xl font-bold mb-2">Por favor, rota tu dispositivo</h2>
        <p className="text-lg text-gray-400">Este juego se disfruta mejor en modo horizontal.</p>
      </div>

      <div id="authContainer" className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[3000]">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl text-gray-800">
          <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">Caída Venezolana</h2>
          <div id="authMessageArea" className="text-center p-3 mb-4 rounded-md bg-red-100 text-red-700 font-medium"
            style="display: none;"></div>
          <input type="email" id="emailInput" placeholder="Correo Electrónico"
            className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition" />
          <input type="password" id="passwordInput" placeholder="Contraseña"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition" />
          <div className="flex space-x-4">
            <button id="loginButton" className="button flex-1">Entrar</button>
            <button id="registerButton"
              className="button !bg-emerald-600 hover:!bg-emerald-700 flex-1">Registrarse</button>
          </div>
        </div>
      </div>

      <div id="appContainer" className="min-h-screen flex flex-col" style="display: none;">
        <nav id="navbar" className="h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div id="newGameButtonContainer" className="nav-item gap-4 flex items-center">
            <button id="newGameButton" className="button text-sm"><i className="fas fa-gamepad mr-2"></i>Nuevo
              Juego</button>
          </div>
          <div className="nav-scores-container flex items-center space-x-4 text-sm">
            <div className="nav-item flex items-center bg-black bg-opacity-20 px-3 py-1 rounded-full">
              <i className="fas fa-user-astronaut mr-2 text-indigo-400"></i>
              <span>Tú: <span id="navPlayerScore" className="font-bold text-white">0</span></span>
              <span className="mx-2 text-gray-500">|</span>
              <i className="fas fa-layer-group mr-1 text-indigo-400"></i>
              <span id="navPlayerCaptured" className="font-bold text-white">0</span>
            </div>
            <div className="nav-item flex items-center bg-black bg-opacity-20 px-3 py-1 rounded-full">
              <i className="fas fa-robot mr-2 text-red-400"></i>
              <span>Bot: <span id="navOpponentScore" className="font-bold text-white">0</span></span>
              <span className="mx-2 text-gray-500">|</span>
              <i className="fas fa-layer-group mr-1 text-red-400"></i>
              <span id="navOpponentCaptured" className="font-bold text-white">0</span>
            </div>
          </div>
          <div id="turnIndicator" className="nav-item font-semibold text-lg">Turno: <span id="turnPlayerName"
            className="ml-2 font-bold"></span></div>
          <div id="handCounter" className="nav-item font-semibold text-lg hidden md:block">Mano: <span id="currentHand"
            className="ml-2 text-white">0 / 5</span></div>
          <div className="flex items-center gap-2">
            <span id="currentUserEmail" className="text-sm font-medium hidden md:block"></span>
            <button id="logoutButton" className="button logout !p-2 text-lg leading-none"><i
              className="fas fa-sign-out-alt"></i></button>
          </div>
        </nav>

        <main id="mainLayout">
          <aside id="left-panel" className="panel">
            <h3 className="panel-title"><i className="fas fa-scroll mr-2"></i>Registro de Jugadas</h3>
            <div id="gameLogContainer" className="panel-content">
              <ul id="gameLog"></ul>
            </div>
          </aside>
          <section id="center-panel">
            <div id="opponent-hand-area" className="hand-area">
              <div id="opponentHand" className="flex-grow flex justify-center items-center"></div>
              <div className="player-profile">
                <div className="avatar !bg-red-600 !border-red-400 !shadow-red-500/50">B</div>
                <div className="player-name">CaidaBot</div>
              </div>
            </div>
            <div id="game-board">
              <div id="table-cards"></div>
            </div>
            <div id="player-hand-area" className="hand-area">
              <div id="playerHand" className="flex-grow flex justify-center items-center"></div>
              <div className="player-profile">
                <div id="player-avatar" className="avatar">J</div>
                <div id="player-name" className="player-name">Jugador</div>
              </div>
            </div>
          </section>
        </main>
      </div>
      <div id="confirmationModal" className="modal-overlay">
        <div className="modal-content">
          <p id="modalMessage" className="text-lg font-semibold mb-4"></p>
          <div className="modal-buttons">
            <button id="modalConfirmYes" className="button logout">Sí, seguro</button>
            <button id="modalConfirmNo" className="button !bg-gray-500 hover:!bg-gray-600">Cancelar</button>
          </div>
        </div>
      </div>
      <div id="tableChoiceModal" className="modal-overlay">
        <div className="modal-content">
          <p id="tableChoiceMessage" className="text-xl font-bold mb-6"></p>
          <div className="modal-buttons">
            <div id="choiceAsc" className="card cursor-pointer"><img className="card-img"
              src="https://res.cloudinary.com/teributu/image/upload/1o.jpg" alt="As de Oro" /></div>
            <div id="choiceDesc" className="card cursor-pointer"><img className="card-img"
              src="https://res.cloudinary.com/teributu/image/upload/4o.jpg" alt="Cuatro de Oro" /></div>
          </div>
        </div>
      </div>
      <div id="gameOverModal" className="modal-overlay">
        <div className="modal-content">
          <i id="gameOverIcon"></i>
          <h2 id="gameOverMessage" className="text-3xl font-bold mb-4"></h2>
          <p className="mb-6 text-lg text-gray-300">¿Qué te gustaría hacer ahora?</p>
          <div className="modal-buttons">
            <button id="gameOverNewGame" className="button !bg-emerald-600 hover:!bg-emerald-700">Jugar de
              Nuevo</button>
            <button id="gameOverExit" className="button logout">Salir del Juego</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
