import React from 'react';

const TIPOS = {
  success: { bg: 'bg-green-600', icon: '✓' },
  error: { bg: 'bg-red-600', icon: '✕' },
  info: { bg: 'bg-bosque-600', icon: 'ℹ' },
};

let toastId = 0;

export function showToast(setFn, mensaje, tipo = 'info') {
  const id = ++toastId;
  setFn(prev => [...prev, { id, mensaje, tipo }]);
  setTimeout(() => setFn(prev => prev.filter(t => t.id !== id)), 4000);
}

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => {
        const cfg = TIPOS[t.tipo] || TIPOS.info;
        return (
          <div key={t.id}
            className={`${cfg.bg} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slide-in`}
          >
            <span className="text-lg">{cfg.icon}</span>
            {t.mensaje}
          </div>
        );
      })}
    </div>
  );
}
