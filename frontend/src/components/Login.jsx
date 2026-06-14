import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ToastContainer, { showToast } from './Toast';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  const validarFormulario = () => {
    const e = {};
    if (!formData.email.trim()) e.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Correo inválido';
    if (!formData.password) e.password = 'La contraseña es obligatoria';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const v = validarFormulario();
    if (Object.keys(v).length > 0) { setErrors(v); showToast(setToasts, 'Corrige los campos marcados en rojo', 'error'); return; }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const data = res.data?.data;
      if (!data?.token || !data?.usuario?.username) throw new Error('Respuesta inválida');

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      onLogin(data.usuario);
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Credenciales inválidas';
      setErrorMessage(msg);
      showToast(setToasts, msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <ToastContainer toasts={toasts} />
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>
          <h1 className="text-4xl font-bold text-bosque-800 mb-2">TrashGo</h1>
          <p className="text-lg text-gray-600">Iniciar sesión</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={(e) => { setFormData(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                placeholder="tu@correo.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
              <input type="password" name="password" value={formData.password} onChange={(e) => { setFormData(p => ({ ...p, password: e.target.value })); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                placeholder="Ingresa tu contraseña"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-bosque-600 text-white font-bold py-3 rounded-lg hover:bg-bosque-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Iniciando sesión...</> : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
