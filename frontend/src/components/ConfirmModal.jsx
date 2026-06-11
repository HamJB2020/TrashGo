import React from 'react';

export default function ConfirmModal({ mensaje, onConfirm, onCancel, confirmText = 'Sí', cancelText = 'No' }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-slide-in">
        <p className="text-gray-700 text-base font-semibold text-center">{mensaje}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}