import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/auth/perfil');
        const data = res.data.data;
        if (data) setForm(prev => ({ ...prev, nombre: data.nombre || '', email: data.email || '' }));
      } catch {}
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) e.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (!form.mensaje.trim()) e.mensaje = 'Escribe tu duda o problema';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setErrorMsg('');
    const v = validar();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setIsLoading(true);
    try {
      await api.post('/contacto', form);
      setSuccess('Mensaje enviado correctamente. Te responderemos pronto.');
      setForm({ nombre: '', email: '', mensaje: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al enviar el mensaje.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-bosque-800 mb-2">Contacto</h1>
          <p className="text-lg text-gray-600">Cuéntanos tu duda o problema</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">{success}</div>}
          {errorMsg && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 ${errors.nombre ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje</label>
              <textarea name="mensaje" value={form.mensaje} onChange={handleChange} rows={5} placeholder="Describe tu duda o problema..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 resize-none ${errors.mensaje ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.mensaje && <p className="text-red-600 text-sm mt-1">{errors.mensaje}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-bosque-600 text-white font-bold py-3 rounded-lg hover:bg-bosque-700 transition disabled:opacity-50">
              {isLoading ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}