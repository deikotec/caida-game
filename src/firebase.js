// Importamos las funciones necesarias de los SDK de Firebase.
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza el siguiente objeto con la configuración de tu propio proyecto de Firebase.
// Puedes obtenerlo en la consola de Firebase, en la configuración de tu proyecto web.
const firebaseConfig = {
    apiKey: "AIzaSyCbligeo6IJw5qKhon5z_LzqGE6x-iSrf4",
    authDomain: "caida-game.firebaseapp.com",
    projectId: "caida-game",
    storageBucket: "caida-game.appspot.com",
    messagingSenderId: "707030975610",
    appId: "1:707030975610:web:e719a16b40d49008d0e7c3"
};

// Inicializamos la aplicación de Firebase con nuestra configuración.
const app = initializeApp(firebaseConfig);

// Obtenemos y exportamos la instancia del servicio de Autenticación.
// La usaremos para registrar, iniciar sesión y gestionar usuarios.
export const auth = getAuth(app);

// Obtenemos y exportamos la instancia de Firestore, nuestra base de datos NoSQL.
// La usaremos más adelante para guardar el estado de las partidas, salas, etc.
export const db = getFirestore(app);

// Exportamos las funciones específicas de autenticación para tener un acceso más limpio.
export {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    signInAnonymously,
    signInWithCustomToken
};
