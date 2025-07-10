"use client";

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    AuthError
} from 'firebase/auth';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

// Función para mapear códigos de error de Firebase a mensajes en español.
const getFirebaseAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'El formato del correo electrónico no es válido.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Correo o contraseña incorrectos.';
        case 'auth/email-already-in-use':
            return 'Este correo electrónico ya está registrado.';
        case 'auth/weak-password':
            return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        default:
            return 'Ocurrió un error. Por favor, intenta de nuevo.';
    }
};

export default function AuthForm() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isRegistering) {
                // Lógica de Registro
                if (!displayName) {
                    setError("El nombre de usuario es obligatorio.");
                    setIsLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Actualizamos el perfil en Firebase Auth con el nombre de usuario.
                await updateProfile(userCredential.user, { displayName });
                // La creación del perfil en Firestore se dispara automáticamente por el AuthProvider.
            } else {
                // Lógica de Inicio de Sesión
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            const authError = err as AuthError;
            setError(getFirebaseAuthErrorMessage(authError.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/10">
            <div>
                <h2 className="text-3xl font-bold text-center text-white">
                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>
                <p className="mt-2 text-sm text-center text-gray-400">
                    {isRegistering ? 'Únete a la comunidad de jugadores.' : '¡Qué bueno verte de nuevo!'}
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {isRegistering && (
                    <div className="relative">
                        <FiUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Nombre de usuario"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        />
                    </div>
                )}
                <div className="relative">
                    <FiMail className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    />
                </div>
                <div className="relative">
                    <FiLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    />
                </div>

                {error && <p className="text-sm text-center text-red-400 bg-red-900/50 p-2 rounded-md">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-300 disabled:bg-teal-800 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
                </button>
            </form>

            <p className="text-sm text-center text-gray-400">
                {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError(null);
                    }}
                    className="ml-2 font-medium text-teal-400 hover:text-teal-300"
                >
                    {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
                </button>
            </p>
        </div>
    );
}
