import React from 'react';
import { Link } from 'react-router-dom';

const pasos = [
  { icon: '📝', titulo: 'Regístrate', desc: 'Crea tu cuenta en menos de un minuto con tu correo y dirección.' },
  { icon: '📱', titulo: 'Solicita', desc: 'Indica qué residuos tienes, tu dirección y el nivel de urgencia.' },
  { icon: '🚛', titulo: 'Recogemos', desc: 'Un rider asignado pasa a recoger tus residuos en la franja horaria elegida.' },
];

export default function Home() {
  const token = localStorage.getItem('token');

  return (
    <div className="bg-fondo min-h-[calc(100vh-64px)]">
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-bosque-800 mb-4 leading-tight">
          Recogida de residuos
          <br />
          <span className="text-tierra-500">a domicilio</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          TrashGo conecta hogares con riders para recoger y gestionar residuos de forma
          rápida, responsable y sin complicaciones. Solicita desde tu móvil y olvídate.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={token ? '/dashboard' : '/register'}
            className="bg-bosque-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-bosque-700 transition shadow-md"
          >
            Empezar ahora
          </Link>
          {!token && (
            <Link
              to="/login"
              className="border-2 border-bosque-600 text-bosque-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-bosque-50 transition"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-bosque-800 mb-3">Cómo funciona</h2>
          <p className="text-gray-500 text-center mb-12 max-w-md mx-auto">
            Tres pasos y tus residuos dejarán de ser un problema
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pasos.map((paso, i) => (
              <div key={i} className="text-center">
                <span className="text-4xl block mb-4">{paso.icon}</span>
                <h3 className="text-xl font-semibold text-bosque-700 mb-2">{paso.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-bosque-600 rounded-2xl p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para probarlo?</h2>
          <p className="text-bosque-100 mb-8 max-w-lg mx-auto">
            Únete a las personas que ya gestionan sus residuos de forma responsable con TrashGo.
          </p>
          <Link
            to="/register"
            className="inline-block bg-tierra-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-tierra-600 transition shadow-md"
          >
            Crear cuenta gratuita
          </Link>
        </div>
      </section>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} TrashGo. Todos los derechos reservados.
      </footer>
    </div>
  );
}
