import React, { useState } from 'react';

// Importamos los iconos que creamos en el archivo separado.
import { GoogleIcon, FacebookIcon, AppleIcon } from './AuthIcons.jsx';

// Importamos todas las funciones y proveedores necesarios de nuestra configuración de Firebase.
import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    OAuthProvider,
    signInWithPopup,
    updateProfile
} from '../../firebase.js';

function Auth() {
    // Estado para controlar si el formulario está en modo "Iniciar Sesión" (true) o "Crear Cuenta" (false).
    const [isLoginMode, setIsLoginMode] = useState(true);

    // Estados para los campos del formulario.
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Estados para la experiencia de usuario.
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Función genérica para manejar el inicio de sesión con proveedores (Google, Facebook, Apple).
    const handleProviderSignIn = async (provider) => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
            // No necesitamos hacer nada más aquí, el 'onAuthStateChanged' en App.jsx se encargará del resto.
        } catch (err) {
            setError('No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
            console.error("Error de proveedor social:", err);
        }
        setLoading(false);
    };

    // Función para manejar el envío del formulario de email/contraseña.
    const handleEmailSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue.
        if (!email || !password || (!isLoginMode && !username)) {
            setError('Por favor, completa todos los campos.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            if (isLoginMode) {
                // Lógica para Iniciar Sesión
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Lógica para Crear Cuenta
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Después de crear el usuario, actualizamos su perfil para añadir el nombre de usuario.
                await updateProfile(userCredential.user, {
                    displayName: username
                });
            }
        } catch (err) {
            // Mapeamos errores comunes de Firebase a mensajes amigables.
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Correo o contraseña incorrectos.');
            } else {
                setError('Ocurrió un error. Inténtalo de nuevo.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-[var(--bg-dark-primary)] flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-[var(--bg-dark-secondary)] rounded-xl shadow-2xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">
                        {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>
                    <p className="mt-2 text-[var(--text-muted)]">
                        {isLoginMode ? 'Bienvenido de nuevo' : 'Únete a la comunidad'}
                    </p>
                </div>

                {/* Formulario principal */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {!isLoginMode && (
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nombre de Usuario"
                            className="w-full px-4 py-3 bg-[#111827] border border-[var(--border-color)] rounded-lg text-white focus:ring-2 focus:ring-[var(--primary-accent)] focus:outline-none transition"
                            disabled={loading}
                        />
                    )}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Correo Electrónico"
                        className="w-full px-4 py-3 bg-[#111827] border border-[var(--border-color)] rounded-lg text-white focus:ring-2 focus:ring-[var(--primary-accent)] focus:outline-none transition"
                        disabled={loading}
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="w-full px-4 py-3 bg-[#111827] border border-[var(--border-color)] rounded-lg text-white focus:ring-2 focus:ring-[var(--primary-accent)] focus:outline-none transition"
                        disabled={loading}
                    />

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 font-bold text-white bg-[var(--primary-accent)] rounded-lg hover:bg-[var(--primary-accent-hover)] disabled:bg-gray-500 transition-all duration-300"
                    >
                        {loading ? 'Cargando...' : (isLoginMode ? 'Entrar' : 'Crear Cuenta')}
                    </button>
                </form>

                {/* Separador */}
                <div className="flex items-center justify-center space-x-2">
                    <span className="h-px w-full bg-[var(--border-color)]"></span>
                    <span className="text-sm text-[var(--text-muted)]">O</span>
                    <span className="h-px w-full bg-[var(--border-color)]"></span>
                </div>

                {/* Botones de redes sociales */}
                <div className="space-y-3">
                    <button onClick={() => handleProviderSignIn(new GoogleAuthProvider())} disabled={loading} className="w-full flex items-center justify-center px-4 py-2.5 border border-[var(--border-color)] rounded-lg text-white hover:bg-white/10 transition">
                        <GoogleIcon /> Continuar con Google
                    </button>
                    {/* Puedes añadir Facebook y Apple de la misma manera */}
                    {/* <button onClick={() => handleProviderSignIn(new FacebookAuthProvider())} disabled={loading} className="..."> <FacebookIcon /> ... </button> */}
                    {/* <button onClick={() => handleProviderSignIn(new OAuthProvider('apple.com'))} disabled={loading} className="..."> <AppleIcon /> ... </button> */}
                </div>

                {/* Enlace para cambiar de modo */}
                <p className="text-sm text-center text-[var(--text-muted)]">
                    {isLoginMode ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                    <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="ml-2 font-semibold text-[var(--primary-accent)] hover:underline">
                        {isLoginMode ? 'Regístrate' : 'Inicia Sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Auth;