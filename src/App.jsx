import React, { useState, useEffect } from 'react';
// Importamos 'auth' y 'onAuthStateChanged' de nuestra configuración de Firebase.
// La extensión .js es importante para asegurar que el módulo se resuelva correctamente.
import { auth, onAuthStateChanged, signOut } from './firebase.js';
// Importamos nuestro nuevo componente de autenticación.
import Auth from './components/auth/Auth.jsx';

function App() {
  // 'user' almacenará el objeto de usuario si está logueado, o 'null' si no lo está.
  // 'loading' nos ayudará a mostrar un estado de carga mientras Firebase verifica la sesión.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect se ejecuta cuando el componente se monta por primera vez.
  // Es el lugar perfecto para configurar un "oyente" como onAuthStateChanged.
  useEffect(() => {
    // onAuthStateChanged es una función de Firebase que se dispara cada vez que
    // el estado de autenticación cambia (login, logout).
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Actualizamos nuestro estado con el usuario actual.
      setLoading(false);    // Dejamos de cargar una vez que tenemos la respuesta.
    });

    // La función de limpieza de useEffect se ejecuta cuando el componente se desmonta.
    // Aquí nos "desuscribimos" del oyente para evitar fugas de memoria.
    return () => unsubscribe();
  }, []); // El array vacío `[]` asegura que esto se ejecute solo una vez.

  // Función para cerrar sesión.
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Mientras Firebase está verificando la sesión, mostramos un mensaje de carga.
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark-primary)] flex items-center justify-center">
        <h1 className="text-white text-2xl">Cargando...</h1>
      </div>
    );
  }

  // Renderizado condicional:
  // Si 'user' no es null (hay un usuario logueado), mostramos la app del juego.
  // Si 'user' es null, mostramos el componente de autenticación.
  return (
    <>
      {user ? (
        // --- VISTA CUANDO EL USUARIO ESTÁ LOGUEADO ---
        <div className="min-h-screen bg-[var(--bg-dark-primary)] text-[var(--text-light)] p-4">
          <header className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Bienvenido, {user.email}</h1>
            <button
              onClick={handleLogout}
              className="bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </header>

          <main className="text-center">
            <h2 className="text-3xl font-bold text-[var(--primary-accent)] mt-16">
              ¡Listo para Jugar!
            </h2>
            <p className="mt-4 text-xl text-[var(--text-muted)]">
              Aquí construiremos el lobby y el tablero de juego.
            </p>
          </main>
        </div>
      ) : (
        // --- VISTA CUANDO EL USUARIO NO ESTÁ LOGUEADO ---
        <Auth />
      )}
    </>
  );
}

export default App;

