// ======================================================
// CONFIGURACIÓN DE FIREBASE PARA NEXT.JS 15 (APP ROUTER)
// ======================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ===============================
// ⚙️ Configuración de tu proyecto Firebase
// Puedes encontrar esta info en el panel de configuración de tu app web
// ===============================
const firebaseConfig = {
    apiKey: "AIzaSyCbligeo6IJw5qKhon5z_LzqGE6x-iSrf4",
    authDomain: "caida-game.firebaseapp.com",
    projectId: "caida-game",
    storageBucket: "caida-game.firebasestorage.app",
    messagingSenderId: "707030975610",
    appId: "1:707030975610:web:e719a16b40d49008d0e7c3"
};

// ===============================
// 🚀 Inicializar la app de Firebase solo una vez (Next.js hace hot reload)
// getApps() verifica si ya hay una app inicializada
// ===============================
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ===============================
// 📦 Exportar servicios de Firebase: Auth, Firestore y Storage
// ===============================
export const auth = getAuth(app);           // Autenticación de usuarios
export const db = getFirestore(app);        // Base de datos (Cloud Firestore)
export const storage = getStorage(app);     // Almacenamiento de archivos (Firebase Storage)
