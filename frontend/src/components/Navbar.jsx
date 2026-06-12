import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link to="/" className="text-2xl font-bold text-bosque-700 tracking-tight">
        TrashGo
      </Link>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link to="/perfil" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
              {user?.username || user}
            </Link>
            {user?.rol === 'rider' && (
              <Link to="/rider" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
                🚛 Rider
              </Link>
            )}
          </>
        ) : (
          <>
            <Link to="/login" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="bg-bosque-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition"
            >
              Registrarse
            </Link>
          </>
        )}
        <Link to="/contacto" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
          Contacto
        </Link>
      </div>
    </nav>
  );
}
