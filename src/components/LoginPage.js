// src/components/LoginPage.js
// ---------------------------
// P\u00e1gina de Login / Registro.
// Permite:
//  - Ingresar con email + contrase\u00f1a.
//  - Registrarse.
//  - Login an\u00f3nimo (como invitado).

import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { PlayCircle } from 'lucide-react';
import { auth } from '../firebase';

function LoginPage({ setCurrentPage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingForm(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error en autenticaci\u00f3n Firebase:", err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setLoadingForm(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError(err.message);
      console.error("Error en login an\u00f3nimo:", err);
      if (
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/operation-not-allowed'
      ) {
        setError("El login como invitado no est\u00e1 habilitado en Firebase.");
        console.warn(
          "LOGIN AN\u00d3NIMO FALL\u00d3: Habilita el login an\u00f3nimo en la consola de Firebase."
        );
      }
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 p-4 font-sans">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl space-y-6 border border-slate-700">
        <div className="text-center">
          <PlayCircle className="mx-auto h-16 w-16 text-sky-400" />
          <h2 className="mt-4 text-4xl font-bold text-sky-400">Casino Royal</h2>
          <p className="mt-2 text-sm text-slate-400">Tu portal a la emoci\u00f3n</p>
        </div>

        {error && (
          <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-sm text-center border border-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-sky-300 mb-1"
            >
              Correo Electr\u00f3nico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none sm:text-sm transition-all"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-sky-300 mb-1"
            >
              Contrase\u00f1a
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none sm:text-sm transition-all"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />
          </div>
          <button
            type="submit"
            disabled={loadingForm}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-60 transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            {loadingForm && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>
              {loadingForm
                ? isRegistering
                  ? 'Registrando...'
                  : 'Ingresando...'
                : isRegistering
                ? 'Registrarse'
                : 'Ingresar'}
            </span>
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-sm text-center text-sky-400 hover:text-sky-300 hover:underline"
        >
          {isRegistering
            ? '\u00bfYa tienes cuenta? Inicia Sesi\u00f3n'
            : '\u00bfNo tienes cuenta? Reg\u00edstrate'}
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs">O</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <button
          onClick={handleAnonymousLogin}
          disabled={loadingForm}
          className="w-full py-3 px-4 border border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-60 transition-colors duration-150 flex items-center justify-center space-x-2"
        >
          {loadingForm && (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>{loadingForm ? 'Ingresando...' : 'Entrar como Invitado'}</span>
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center">
        ID de Usuario (actual): {auth.currentUser ? auth.currentUser.uid : 'No autenticado'}
      </p>
    </div>
  );
}

export default LoginPage;
