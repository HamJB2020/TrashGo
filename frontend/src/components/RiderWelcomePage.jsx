import React from 'react';
import { Link } from 'react-router-dom';

export default function RiderWelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bosque-800 to-bosque-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-bosque-600 px-8 py-10 text-center text-white">
            <span className="text-5xl block mb-3">🚛</span>
            <h1 className="text-3xl font-bold">Eres Rider</h1>
            <p className="text-bosque-200 text-sm mt-1">Bienvenido a TrashGo</p>
          </div>

          <div className="p-6 md:p-8 space-y-4 text-gray-700 text-sm leading-relaxed">
            <p className="text-base font-semibold text-gray-800">¿Cómo funciona?</p>

            <div className="flex items-start gap-3">
              <span className="bg-bosque-100 text-bosque-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">1</span>
              <span>Te aparecen solicitudes de recogida cerca de ti. Ves la dirección, el tipo de residuo y cuánto paga el cliente.</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="bg-bosque-100 text-bosque-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">2</span>
              <span>Eliges cuáles aceptas. Cuando aceptas una, te llevas <strong className="text-bosque-700">el 80% de lo que pagó el cliente</strong>.</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="bg-bosque-100 text-bosque-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">3</span>
              <span>Vas, recoges los residuos y marcas la recogida como completada. El dinero se acumula en tu cuenta.</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 mt-4">
              <p className="font-semibold text-gray-700 mb-1">💡 Tip</p>
              <p>Las solicitudes con urgencia "alta" pagan lo mismo pero se priorizan. Acepta varias y completa la ruta.</p>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <Link to="/rider/dashboard"
              className="block w-full bg-bosque-600 hover:bg-bosque-700 text-white font-semibold text-center py-3 rounded-xl transition shadow-md"
            >
              Ver solicitudes disponibles
            </Link>
          </div>
        </div>

        <p className="text-center text-bosque-400 text-xs mt-6">TrashGo · Recogida de residuos a domicilio</p>
      </div>
    </div>
  );
}