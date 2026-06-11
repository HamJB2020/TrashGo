import React from 'react';
import { Link } from 'react-router-dom';

export default function RiderWelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bosque-900 via-bosque-800 to-tierra-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <span className="text-7xl block mb-4">♻️</span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
            ¡Bienvenido, <span className="text-tierra-400">Rider</span>!
          </h1>
          <p className="text-bosque-300 text-lg mt-3">El mundo te necesita</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-bosque-400/20 shadow-2xl space-y-5 text-bosque-100 text-base leading-relaxed">
          <p className="text-xl font-bold text-white flex items-center gap-2">
            <span>🌍</span> Una ciudad te necesita...
          </p>

          <p>
            El <strong className="text-tierra-400">Monstruo de la Basura</strong> está causando estragos.
            Montañas de residuos amenazan las calles, los parques y los hogares.
            Solo personas valientes como tú pueden detenerlo.
          </p>

          <div className="bg-black/20 rounded-2xl p-5 space-y-3">
            <p className="flex items-start gap-3">
              <span className="text-2xl">🚛</span>
              <span><strong className="text-white">Cada solicitud es una misión.</strong> Los ciudadanos piden ayuda, y tú decides qué misiones aceptar.</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <span><strong className="text-white">Cada recogida completada es una victoria.</strong> Limpia la ciudad, una esquina a la vez.</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <span><strong className="text-white">Ganas el 80%</strong> de lo que paga el cliente. Cuantas más misiones completes, más salvarás el planeta (y tu bolsillo).</span>
            </p>
          </div>

          <p className="text-bosque-300 text-sm text-center pt-2">
            ¿Estás listo para convertirte en el héroe que esta ciudad necesita?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link to="/rider"
            className="bg-tierra-500 hover:bg-tierra-600 text-white font-bold text-lg px-10 py-4 rounded-2xl transition shadow-xl text-center"
          >
            🚀 ¡Aceptar misión!
          </Link>
          <Link to="/dashboard"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition text-center border border-white/20"
          >
            Volver al panel
          </Link>
        </div>

        <footer className="text-center mt-12 text-bosque-500 text-xs">
          TrashGo Rider Program · Salvemos el planeta juntos
        </footer>
      </div>
    </div>
  );
}