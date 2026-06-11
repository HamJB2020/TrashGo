import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SolicitudRecogidaForm from './SolicitudRecogidaForm';
import MisSolicitudes from './MisSolicitudes';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const solicitudesRef = useRef(null);

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
    setTimeout(() => {
      solicitudesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-fondo">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <SolicitudRecogidaForm simple onSuccess={handleSuccess} />
          </div>
          <div className="w-full lg:w-80 flex-shrink-0" ref={solicitudesRef}>
            <MisSolicitudes refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
