// src/components/ActionModal.js
// ---------------------------
// Modal genérico de acciones. Muestra:
//  - Título, mensaje con salto de línea preservado.
//  - Botones para cada acción definida en `actions`.
//  - Si `actions` está vacío, muestra botón “Cerrar”.

import React from 'react';

function ActionModal({ title, message, actions, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <h3 className="text-xl font-semibold text-sky-300 mb-3">{title}</h3>
        <p className="text-slate-300 mb-5 text-sm whitespace-pre-wrap">{message}</p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors text-white ${action.style || 'bg-slate-600 hover:bg-slate-500'}`}
            >
              {action.text}
            </button>
          ))}
          {actions.length === 0 && onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors text-white bg-slate-600 hover:bg-slate-500"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActionModal;
