// Importamos 'useState' y 'useEffect' de React. Son "Hooks" esenciales.
// useState: Nos permite añadir estado a nuestros componentes (memoria).
// useEffect: Nos permite ejecutar código como respuesta a cambios en el componente (ej. al cargarse).
import React, { useState, useEffect } from 'react';

// Este es el componente principal de nuestra aplicación.
// Funciona como el punto de entrada que orquesta qué se muestra en la pantalla.
function App() {

  // Aquí podríamos añadir lógica en el futuro, como por ejemplo:
  // - Comprobar si el usuario está autenticado.
  // - Cargar datos iniciales.
  // - Gestionar el estado global del juego.

  // El 'return' define qué va a renderizar (dibujar) este componente en el HTML.
  // Por ahora, solo mostraremos un mensaje de bienvenida.
  // Usamos 'className' en lugar de 'class' para las clases CSS, es la sintaxis de JSX (JavaScript XML).
  return (
    <div className="min-h-screen bg-[var(--bg-dark-primary)] text-[var(--text-light)] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-[var(--primary-accent)]">Casino - Basta de Excusas</h1>
      <p className="mt-4 text-xl text-[var(--text-muted)]">
        Próximamente, la plataforma de juegos de cartas.
      </p>
      <div className="mt-8 text-center">
        <p className="font-semibold">Siguiente paso:</p>
        <p className="mt-2 text-sm">Implementar la autenticación con Firebase y la pantalla de inicio de sesión.</p>
      </div>
    </div>
  );
}

// Exportamos el componente App para que pueda ser utilizado por otros archivos (principalmente 'main.jsx').
export default App;
