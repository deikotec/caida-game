// src/index.js
// ---------------------------
// Punto de entrada principal de React.
// Renderiza el componente <App /> dentro del elemento con id "root".

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
