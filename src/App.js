// src/App.js
// ---------------------------
// Componente principal de la aplicaci\u00f3n (App).
// Controla la l\u00f3gica de navegaci\u00f3n entre LoginPage, LobbyPage y GameRoomPage
// seg\u00fan el estado del usuario (auth) y la existencia de una partida activa.

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db, globalAppId } from './firebase';
import { PLAYER_ID_PREFIX } from './constants';

import LoginPage from './components/LoginPage';
import LobbyPage from './components/LobbyPage';
import GameRoomPage from './components/GameRoomPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('login');
  const [activeGameId, setActiveGameId] = useState(null);
  const [initialAuthAttempted, setInitialAuthAttempted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setInitialAuthAttempted(true);
        if (activeGameId) setCurrentPage('gameRoom');
        else setCurrentPage('lobby');

        const userDocRef = doc(db, `artifacts/${globalAppId}/users/${currentUser.uid}/profile`, 'data');
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.isAnonymous
                ? `Invitado-${currentUser.uid.substring(0, 5)}`
                : `Jugador-${currentUser.uid.substring(0, 5)}`,
              createdAt: new Date().toISOString(),
              isAnonymous: currentUser.isAnonymous || false,
              balance: 1000,
              vipLevel: 1,
              avatar: `https://placehold.co/64x64/${Math.floor(Math.random() * 16777215).toString(16)}/FFFFFF?text=${(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}`
            });
          }
        } catch (error) {
          console.error("Error al acceder o crear perfil de usuario:", error);
        }
        setLoading(false);
      } else {
        setUser(null);
        setCurrentPage('login');
        setActiveGameId(null);

        if (!initialAuthAttempted) {
          setInitialAuthAttempted(true);
          setLoading(true);

          let autoSignedIn = false;

          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
              console.log("Intentando sign-in inicial con custom token...");
              await signInWithCustomToken(auth, __initial_auth_token);
              autoSignedIn = true;
              console.log("Sign-in con custom token exitoso.");
              return;
            } catch (error) {
              console.error("Error en sign-in con custom token:", error);
            }
          }

          if (!autoSignedIn) {
            try {
              console.log("Intentando sign-in an\u00f3nimo como fallback...");
              await signInAnonymously(auth);
              autoSignedIn = true;
              console.log("Sign-in an\u00f3nimo exitoso.");
              return;
            } catch (anonError) {
              console.error("Error en sign-in an\u00f3nimo:", anonError);
              if (
                anonError.code === 'auth/admin-restricted-operation' ||
                anonError.code === 'auth/operation-not-allowed'
              ) {
                console.warn(
                  "SIGN-IN AN\u00d3NIMO FALL\u00d3: Habilita el login an\u00f3nimo en la consola de Firebase."
                );
              }
            }
          }

          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [activeGameId, initialAuthAttempted]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesi\u00f3n:", error);
    }
  };

  const navigateToGameRoom = (gameIdToJoinOrCreate) => {
    if (!user) {
      console.error("Debe estar autenticado para unirse a una partida.");
      setCurrentPage('login');
      return;
    }
    setActiveGameId(gameIdToJoinOrCreate);
    setCurrentPage('gameRoom');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-2xl font-bold animate-pulse">Cargando Casino...</div>
      </div>
    );
  }

  if (currentPage === 'gameRoom' && user && activeGameId) {
    return (
      <GameRoomPage
        user={user}
        setCurrentPage={setCurrentPage}
        gameId={activeGameId}
      />
    );
  }

  if (currentPage === 'lobby' && user) {
    return (
      <LobbyPage
        user={user}
        onLogout={handleLogout}
        navigateToGameRoom={navigateToGameRoom}
      />
    );
  }

  return <LoginPage setCurrentPage={setCurrentPage} />;
}

export default App;
