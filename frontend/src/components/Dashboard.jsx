import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SolicitudRecogidaForm from './SolicitudRecogidaForm';
import MisSolicitudes from './MisSolicitudes';

export default function Dashboard({ user }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [miCalle, setMiCalle] = useState('');
  const [casaKey, setCasaKey] = useState(0);
  const formRef = useRef(null);
  const solicitudesRef = useRef(null);

  useEffect(() => {
    api.get('/auth/perfil').then(r => {
      if (r.data.data?.calle) setMiCalle(r.data.data.calle);
    }).catch(() => {});
  }, []);

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
    setTimeout(() => {
      solicitudesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const usarMiCasa = () => {
    setCasaKey(k => k + 1);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const esRider = user?.rol === 'rider';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-fondo">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>
        {esRider ? (
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <span className="text-5xl block mb-4">🚛</span>
            <h2 className="text-2xl font-bold text-bosque-800 mb-2">Eres un Rider</h2>
            <p className="text-gray-500 mb-6">Los riders no pueden solicitar recogidas. Ve a tu panel para gestionar las recogidas.</p>
            <Link to="/rider" className="bg-bosque-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-bosque-700 transition inline-block">
              Ir al panel Rider 🚀
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              {miCalle && (
                <button onClick={usarMiCasa}
                  className="mb-4 flex items-center gap-2 bg-white border border-bosque-300 text-bosque-700 px-4 py-2.5 rounded-xl hover:bg-bosque-50 transition shadow-sm"
                >
                  <span className="w-10 h-10 rounded-full bg-bosque-100 flex items-center justify-center text-lg">🏠</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Mi casa</p>
                    <p className="text-xs text-gray-500">{miCalle}</p>
                  </div>
                </button>
              )}
              <div ref={formRef}>
                <SolicitudRecogidaForm key={casaKey} simple onSuccess={handleSuccess} initialCalle={miCalle} />
              </div>
            </div>
            <div className="w-full lg:w-80 flex-shrink-0" ref={solicitudesRef}>
              <MisSolicitudes refreshKey={refreshKey} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
