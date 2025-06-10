"use client";

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error durante el inicio de sesión con Google:", error);
        }
    };

    return (
        // Contenedor principal optimizado para móviles
        <div className="w-full max-w-sm p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
            <h1 className="text-4xl font-bold text-white mb-2 text-center">Bienvenido</h1>
            <p className="text-gray-300 mb-8 text-center">Inicia sesión para jugar.</p>
            <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center w-full px-4 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                <FcGoogle className="w-6 h-6 mr-3" />
                Continuar con Google
            </button>
        </div>
    );
}