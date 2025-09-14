// Importamos las funciones necesarias de los SDK de Firebase.
import { initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    FacebookAuthProvider,
    OAuthProvider, // Específico para Apple
    signInWithPopup,
    updateProfile
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza el siguiente objeto con la configuración de tu propio proyecto de Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyCbligeo6IJw5qKhon5z_LzqGE6x-iSrf4",
    authDomain: "caida-game.firebaseapp.com",
    projectId: "caida-game",
    storageBucket: "caida-game.appspot.com",
    messagingSenderId: "707030975610",
    appId: "1:707030975610:web:e719a16b40d49008d0e7c3"
};

// Inicializamos la aplicación de Firebase.
const app = initializeApp(firebaseConfig);

// Obtenemos las instancias de los servicios de Firebase.
const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos tanto las instancias como las funciones que necesitaremos en la app.
// MEJORA: Se ha eliminado la exportación duplicada de 'auth' y 'db' del objeto.
export {
    auth,
    db,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    FacebookAuthProvider,
    OAuthProvider,
    signInWithPopup,
    updateProfile
};

