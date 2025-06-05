// src/components/LobbyComponents.js
// ---------------------------
// Componentes auxiliares para la p\u00e1gina Lobby:
//  - NavLink: enlace de navegaci\u00f3n lateral.
//  - GameCard: tarjeta que representa un juego disponible.

import React from 'react';
import {
  Home,
  Layers,
  Swords,
  BarChart2,
  Star,
  Gift,
  ShoppingCart,
  User,
  Percent,
  Settings,
  LifeBuoy
} from 'lucide-react';

export const NavLink = ({ icon: Icon, text, href = "#!", isActive = false, action }) => (
  <a
    href={href}
    onClick={(e) => {
      e.preventDefault();
      if (action) action();
    }}
    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out group ${
      isActive
        ? 'bg-sky-500 text-white shadow-md'
        : 'text-slate-300 hover:bg-slate-700 hover:text-sky-300'
    }`}
  >
    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'}`} />
    <span className="font-medium text-sm">{text}</span>
  </a>
);

export const GameCard = ({
  title,
  imageUrl,
  category,
  players,
  bgColor = "bg-slate-700",
  onPlayClick
}) => (
  <div className={`${bgColor} rounded-xl shadow-lg overflow-hidden hover:shadow-sky-500/30 transition-all duration-300 group`}>
    <div
      className="h-40 bg-cover bg-center"
      style={{
        backgroundImage: `url(${imageUrl ||
          'https://placehold.co/600x400/1E293B/94A3B8?text=Juego'})`
      }}
    ></div>
    <div className="p-5">
      <p className="text-xs text-sky-400 uppercase font-semibold mb-1">{category}</p>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
        {title}
      </h3>
      {players && (
        <p className="text-sm text-slate-400 flex items-center">
          <User size={16} className="mr-1.5" /> {players}
        </p>
      )}
      <button
        onClick={onPlayClick}
        className="mt-4 w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 text-sm flex items-center justify-center space-x-2"
      >
        <Gift size={18} />
        <span>Jugar Ahora</span>
      </button>
    </div>
  </div>
);
