import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchNoLeidas = async () => {
      try {
        const res = await api.get('/notificaciones/no-leidas');
        setNoLeidas(res.data.count || 0);
      } catch {}
    };
    fetchNoLeidas();
    const id = setInterval(fetchNoLeidas, 15000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = async () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }
    try {
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data.data || []);
    } catch {}
    setDropdownOpen(true);
  };

  const marcarLeida = async (notif) => {
    try {
      await api.put(`/notificaciones/${notif.id}/leer`);
      setNoLeidas(prev => Math.max(0, prev - 1));
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n));
      if (notif.referencia_id) navigate('/solicitudes');
    } catch {}
  };

  const tiempoRelativo = (fecha) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const seg = Math.floor(diff / 1000);
    if (seg < 60) return 'hace unos segundos';
    const min = Math.floor(seg / 60);
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    return `hace ${d}d`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link to="/" className="text-2xl font-bold text-bosque-700 tracking-tight">
        TrashGo
      </Link>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <div ref={dropdownRef} className="relative">
              <button onClick={toggleDropdown} className="relative p-2 text-gray-600 hover:text-bosque-600 transition text-xl">
                🔔
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </span>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">Notificaciones</p>
                  </div>
                  {notificaciones.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">No hay notificaciones</div>
                  ) : (
                    notificaciones.map(n => (
                      <button key={n.id} onClick={() => marcarLeida(n)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex flex-col gap-0.5 ${n.leida ? '' : 'bg-bosque-50/50'}`}
                      >
                        <span className="text-sm text-gray-700">{n.mensaje}</span>
                        <span className="text-xs text-gray-400">{tiempoRelativo(n.created_at || n.fecha_creacion)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Link to="/perfil" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
              {user?.username || user}
            </Link>
            {user?.rol === 'rider' && (
              <Link to="/rider" className="bg-bosque-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-bosque-700 transition">
                Rider
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
