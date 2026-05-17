import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register({ onRegister }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    direccion: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.username.trim()) {
      nuevosErrores.username = 'El nombre de usuario es obligatorio';
    }

    if (!formData.email.trim()) {
      nuevosErrores.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nuevosErrores.email = 'Formato de correo inválido';
    }

    if (!formData.password) {
      nuevosErrores.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria';
    }

    return nuevosErrores;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validarFormulario();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      const data = response.data?.data;

      if (!data?.token || !data?.usuario?.username) {
        throw new Error('Respuesta del servidor inválida');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', data.usuario.username);
      onRegister(data.usuario.username);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error al registrar usuario:', error);

      // Control estricto de errores para evitar el fallo #299
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Error de comunicación con el servidor de Render.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            TrashGo
          </h1>
          <p className="text-lg text-gray-600">
            Registro de usuario
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">

          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-pulse">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Nombre de usuario *
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ej: juanperez"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.username
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Correo electrónico *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ej: juan@correo.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.email
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.password
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="direccion"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Dirección *
              </label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Ej: Calle Principal 123, Madrid"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.direccion
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              />
              {errors.direccion && (
                <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
