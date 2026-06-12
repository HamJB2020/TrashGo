import React from 'react';
import { Link } from 'react-router-dom';

export default function RiderWelcomePage() {
  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>

        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🚛</span>
          <h1 className="text-4xl font-bold text-bosque-800 mb-2">Eres Rider</h1>
          <p className="text-lg text-gray-600">Bienvenido al equipo de recogida de TrashGo</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-bosque-800 mb-4">Cómo funciona</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-bosque-100 text-bosque-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">1</span>
                <p className="text-gray-700 text-sm">Te aparecen solicitudes de recogida pendientes. Ves la dirección, el tipo de residuo y cuánto paga el cliente.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-bosque-100 text-bosque-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">2</span>
                <p className="text-gray-700 text-sm">Eliges cuáles aceptar. Cuando completas una, te llevas <strong className="text-bosque-700">el 80% de lo que pagó el cliente</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-bosque-100 text-bosque-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">3</span>
                <p className="text-gray-700 text-sm">Vas, recoges los residuos y marcas la recogida como completada. El dinero se acumula en tu cuenta.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">💡 Tip</p>
            <p>Las solicitudes con urgencia "alta" se pagan igual pero se priorizan. Acepta varias y organiza tu ruta.</p>
          </div>

          <Link to="/rider/dashboard"
            className="block w-full bg-bosque-600 hover:bg-bosque-700 text-white font-semibold text-center py-3 rounded-lg transition"
          >
            Ver solicitudes disponibles
          </Link>
        </div>
      </div>
    </div>
  );
}
