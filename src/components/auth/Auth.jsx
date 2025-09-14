import React, { useState } from 'react';
// Importamos las funciones de autenticación desde nuestro archivo de configuración.
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../firebase';

// Este componente funcional representa la pantalla de inicio de sesión y registro.
function Auth() {
    // Estados para almacenar el email, la contraseña y los mensajes de error.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Función para manejar el registro de un nuevo usuario.
    const handleRegister = async () => {
        try {
            setError(''); // Limpiamos errores previos.
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            // Mapeamos los códigos de error de Firebase a mensajes más amigables.
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('El formato del correo electrónico es inválido.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Este correo electrónico ya está registrado.');
                    break;
                case 'auth/weak-password':
                    setError('La contraseña debe tener al menos 6 caracteres.');
                    break;
                default:
                    setError('Ocurrió un error al intentar registrarse.');
                    break;
            }
        }
    };

    // Función para manejar el inicio de sesión de un usuario existente.
    const handleLogin = async () => {
        try {
            setError(''); // Limpiamos errores previos.
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Correo o contraseña incorrectos.');
                    break;
                default:
                    setError('Ocurrió un error al iniciar sesión.');
                    break;
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl text-gray-800">
                <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">Caída Venezolana</h2>

                {/* Mostramos el mensaje de error solo si existe. */}
                {error && (
                    <div className="text-center p-3 mb-4 rounded-md bg-red-100 text-red-700 font-medium">
                        {error}
                    </div>
                )}

                {/* Campo de entrada para el correo electrónico */}
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo Electrónico"
                    className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                />

                {/* Campo de entrada para la contraseña */}
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                />

                {/* Contenedor para los botones de acción */}
                <div className="flex space-x-4">
                    <button onClick={handleLogin} className="flex-1 bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white font-bold py-2 px-4 rounded-lg transition">
                        Entrar
                    </button>
                    <button onClick={handleRegister} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Registrarse
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;
