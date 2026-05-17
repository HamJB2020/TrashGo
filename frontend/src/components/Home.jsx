import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          TrashGo
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Servicio de recogida de residuos a domicilio
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition shadow"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
