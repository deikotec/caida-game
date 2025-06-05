// src/firebase.js
// ---------------------------
// Archivo para inicializar Firebase (Auth y Firestore).
// Exporta las instancias `auth` y `db` para que puedan ser usadas en toda la aplicaci\u00f3n.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCbligeo6IJw5qKhon5z_LzqGE6x-iSrf4",
  authDomain: "caida-game.firebaseapp.com",
  projectId: "caida-game",
  storageBucket: "caida-game.appspot.com",
  messagingSenderId: "707030975610",
  appId: "1:707030975610:web:e719a16b40d49008d0e7c3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const globalAppId = firebaseConfig.projectId;
