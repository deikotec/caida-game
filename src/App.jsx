import React, { useState, useEffect } from 'react';
// Importamos los servicios de autenticación de Firebase.
// CORRECCIÓN: Se ajustan las rutas de importación para que sean relativas a la carpeta 'src'.
import { auth, onAuthStateChanged, signOut } from './firebase.js';

// Actualizamos la ruta para apuntar a la nueva subcarpeta 'auth'.
import Auth from './components/auth/Auth.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Limpia el 'listener' cuando el componente se desmonta para evitar fugas de memoria.
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Muestra un mensaje de carga mientras se verifica el estado de autenticación.
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-dark-primary)] flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">Cargando...</p>
      </div>
    );
  }

  // Renderizado condicional: si hay un usuario, muestra la bienvenida. Si no, muestra el formulario de autenticación.
  return (
    <>
      {user ? (
        <div className="min-h-screen bg-[var(--bg-dark-primary)] flex flex-col items-center justify-center text-white p-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">¡Bienvenido, <span className="text-[var(--primary-accent)]">{user.displayName || user.email}</span>!</h1>
            <p className="text-lg text-[var(--text-muted)] mb-8">Estás listo para entrar al lobby.</p>
            <button onClick={handleLogout} className="button logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;

