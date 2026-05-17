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
    <nav className="bg-gradient-to-r from-green-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <Link to="/" className="text-2xl font-bold tracking-tight">
        TrashGo
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm font-medium">{user}</span>
            <button
              onClick={handleLogout}
              className="bg-white text-green-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold hover:underline"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="bg-white text-green-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
