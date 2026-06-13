import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

export default function Perfil({ user, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '', pais: '', calle: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/perfil');
        const data = res.data.data;
        setProfile(data);
        setForm({ nombre: data.nombre || '', telefono: data.telefono || '', pais: data.pais || '', calle: data.calle || '' });
      } catch (err) {
        if (err.response?.status === 401) { onLogout(); navigate('/login'); }
        else setError('Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [onLogout, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await api.put('/auth/perfil', form);
      setProfile(res.data.data);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-fondo flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver al panel</Link>
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-bosque-800 mb-6">Mi Perfil</h1>

          {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">{error}</div>}

          {profile && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" value={profile.email} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
              </div>

              <div>
                <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500" />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                <input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: +34 600 000 000" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500" />
              </div>

              <div>
                <label htmlFor="pais" className="block text-sm font-semibold text-gray-700 mb-1">País</label>
                <select id="pais" name="pais" value={form.pais} onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 bg-white"
                >
                  <option value="">Selecciona tu país</option>
                  {[
                    'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú',
                    'Ecuador', 'Venezuela', 'Uruguay', 'Paraguay', 'Bolivia',
                    'Costa Rica', 'Panamá', 'Guatemala', 'Honduras', 'El Salvador',
                    'Nicaragua', 'República Dominicana', 'Cuba', 'Puerto Rico',
                    'Estados Unidos', 'Francia', 'Italia', 'Portugal', 'Reino Unido',
                    'Alemania', 'Brasil'
                  ].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="calle" className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
                <input id="calle" name="calle" value={form.calle} onChange={handleChange} placeholder="Ej: Av. Siempre Viva 123" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500" />
                <p className="text-xs text-gray-400 mt-1">Esta dirección aparecerá como "Mi casa" en el dashboard</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-bosque-600 text-white font-semibold py-2.5 rounded-lg hover:bg-bosque-700 transition disabled:opacity-50 text-sm">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => setShowConfirm(true)} className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                  Cerrar sesión
                </button>
              </div>
            </form>
          )}

          {showConfirm && (
            <ConfirmModal
              mensaje="¿Estás seguro de que quieres cerrar sesión?"
              onConfirm={() => { setShowConfirm(false); localStorage.removeItem('token'); localStorage.removeItem('usuario'); onLogout(); navigate('/'); }}
              onCancel={() => setShowConfirm(false)}
            />
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link to="/dashboard" className="text-sm text-bosque-600 hover:text-bosque-700 transition">Ir al panel de solicitudes</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
