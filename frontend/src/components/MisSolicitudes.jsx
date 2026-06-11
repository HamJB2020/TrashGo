import React, { useState, useEffect } from 'react';
import api from '../services/api';

const estadoEstilos = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aceptada: 'bg-bosque-100 text-bosque-800',
  completada: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-red-100 text-red-800'
};

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      const res = await api.get('/recogidas/mis-recogidas');
      setSolicitudes(res.data.data);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Solicitudes</h2>

      {cargando ? (
        <p className="text-gray-500 text-center">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <p className="text-gray-500 text-center">No tienes solicitudes aún.</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {solicitudes.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-gray-700 truncate max-w-[180px]">
                  {s.direccion}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${estadoEstilos[s.estado] || 'bg-gray-100 text-gray-800'}`}>
                  {s.estado}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {s.tipo_residuo} {s.urgencia === 'alta' ? '⚡ Alta' : 'Normal'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(s.fecha_creacion).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
