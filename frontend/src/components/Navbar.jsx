import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    onLogout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link to="/" className="text-2xl font-bold text-bosque-700 tracking-tight">
        TrashGo
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/contacto" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
          Contacto
        </Link>
        {user ? (
          <>
            <Link to="/perfil" className="text-sm font-medium text-gray-600 hover:text-bosque-600 transition ml-2">{user}</Link>
            <button
              onClick={handleLogout}
              className="bg-bosque-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-bosque-600 transition">
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
      </div>
    </nav>
  );
}
