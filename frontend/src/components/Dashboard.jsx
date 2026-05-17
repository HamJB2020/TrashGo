import React from 'react';
import SolicitudRecogidaForm from './SolicitudRecogidaForm';
import MisSolicitudes from './MisSolicitudes';

export default function Dashboard() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <SolicitudRecogidaForm simple />
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
          <MisSolicitudes />
        </div>
      </div>
    </div>
  );
}
