// src/lib/firebase.ts

// =================================================
// ARCHIVO DE CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// Este archivo centraliza la configuración de Firebase para toda la aplicación.
// Importa las variables de entorno y exporta los servicios inicializados.
// =================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Objeto de configuración de Firebase, utilizando variables de entorno.
// Es crucial que estas variables estén definidas en el archivo .env.local.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
// Inicialización de la aplicación de Firebase.
// Se comprueba si ya existe una instancia para evitar reinicializaciones (importante en Next.js).
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportación de los servicios de Firebase para ser utilizados en otras partes de la aplicación.
const auth = getAuth(app); // Servicio de Autenticación
const db = getFirestore(app); // Cloud Firestore DB
const storage = getStorage(app); // Storage para archivos
const realtimeDB = getDatabase(app); // Realtime Database para estados en tiempo real

export { app, auth, db, storage, realtimeDB };