import React, { useState, useEffect } from 'react';

const FRASES = [
  'Conectando con la pasarela de pago...',
  'Verificando tarjeta...',
  'Procesando pago...',
  'Confirmando transacción...',
  '¡Pago realizado con éxito!',
];

export default function PaymentModal({ coste, onClose, onSuccess }) {
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (paso >= FRASES.length - 1) {
      const t = setTimeout(() => { onSuccess(); onClose(); }, 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPaso(p => p + 1), 900);
    return () => clearTimeout(t);
  }, [paso, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          {paso < FRASES.length - 1 ? (
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-bosque-200 border-t-bosque-600 animate-spin" />
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
          <p className="text-lg font-bold text-gray-800 mb-2">{FRASES[paso]}</p>
          <p className="text-2xl font-bold text-bosque-700">{coste.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
}
