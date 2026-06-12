import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ToastContainer, { showToast } from './Toast';

const PAISES = [
  { value: 'España', coords: [40.4168, -3.7038] },
  { value: 'México', coords: [19.4326, -99.1332] },
  { value: 'Argentina', coords: [-34.6037, -58.3816] },
  { value: 'Colombia', coords: [4.7110, -74.0721] },
  { value: 'Chile', coords: [-33.4489, -70.6693] },
  { value: 'Perú', coords: [-12.0464, -77.0428] },
  { value: 'Ecuador', coords: [-0.1807, -78.4678] },
  { value: 'Venezuela', coords: [10.4806, -66.9036] },
  { value: 'Uruguay', coords: [-34.9011, -56.1645] },
  { value: 'Paraguay', coords: [-25.2637, -57.5759] },
  { value: 'Bolivia', coords: [-16.5000, -68.1500] },
  { value: 'Costa Rica', coords: [9.9281, -84.0907] },
  { value: 'Panamá', coords: [8.9824, -79.5199] },
  { value: 'Guatemala', coords: [14.6349, -90.5069] },
  { value: 'Honduras', coords: [14.0723, -87.1921] },
  { value: 'El Salvador', coords: [13.6929, -89.2182] },
  { value: 'Nicaragua', coords: [12.1149, -86.2362] },
  { value: 'República Dominicana', coords: [18.4861, -69.9312] },
  { value: 'Cuba', coords: [23.1136, -82.3666] },
  { value: 'Puerto Rico', coords: [18.4655, -66.1057] },
  { value: 'Estados Unidos', coords: [38.9072, -77.0369] },
  { value: 'Francia', coords: [48.8566, 2.3522] },
  { value: 'Italia', coords: [41.9028, 12.4964] },
  { value: 'Portugal', coords: [38.7223, -9.1393] },
  { value: 'Reino Unido', coords: [51.5074, -0.1278] },
  { value: 'Alemania', coords: [52.5200, 13.4050] },
  { value: 'Brasil', coords: [-15.7934, -47.8822] },
];

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    telefono: '',
    pais: '',
    esRider: false,
  });
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.username.trim()) nuevosErrores.username = 'El nombre de usuario es obligatorio';
    if (!formData.email.trim()) nuevosErrores.email = 'El correo electrónico es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nuevosErrores.email = 'Formato de correo inválido';
    if (!formData.password) nuevosErrores.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!formData.pais) nuevosErrores.pais = 'Selecciona tu país';
    return nuevosErrores;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validarFormulario();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast(setToasts, 'Corrige los campos marcados en rojo antes de continuar', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const payload = { ...formData, rol: formData.esRider ? 'rider' : 'usuario' };
      delete payload.esRider;
      await api.post('/auth/register', payload);
      showToast(setToasts, 'Registrado correctamente. Redirigiendo...', 'success');
      setSuccessMessage('Registrado correctamente. Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      if (error.response?.data?.message) setErrorMessage(error.response.data.message);
      else if (error.response?.data?.error) setErrorMessage(error.response.data.error);
      else setErrorMessage('Error de comunicación con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>
          <h1 className="text-4xl font-bold text-bosque-800 mb-2">TrashGo</h1>
          <p className="text-lg text-gray-600">Registro de usuario</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <ToastContainer toasts={toasts} />

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
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Nombre de usuario *</label>
              <input id="username" type="text" name="username" value={formData.username} onChange={handleInputChange}
                placeholder="Ej: juanperez"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
              />
              {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico *</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                placeholder="Ej: juan@correo.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input id="telefono" type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange}
                placeholder="Ej: +34 600 000 000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition bg-white"
              />
              {errors.telefono && <p className="text-red-600 text-sm mt-1">{errors.telefono}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Contraseña *</label>
              <input id="password" type="password" name="password" value={formData.password} onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="pais" className="block text-sm font-semibold text-gray-700 mb-2">País *</label>
              <select id="pais" name="pais" value={formData.pais} onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition bg-white ${errors.pais ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">Selecciona tu país</option>
                {PAISES.map(p => (
                  <option key={p.value} value={p.value}>{p.value}</option>
                ))}
              </select>
              {errors.pais && <p className="text-red-600 text-sm mt-1">{errors.pais}</p>}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="esRider" checked={formData.esRider} onChange={handleInputChange}
                className="w-5 h-5 text-bosque-600 rounded border-gray-300" />
              <span className="text-sm text-gray-700">Registrarme como <strong>rider</strong> (recolector de residuos)</span>
            </label>

            <button type="submit" disabled={isLoading}
              className="w-full bg-bosque-600 text-white font-bold py-3 rounded-lg hover:bg-bosque-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><span className="animate-spin">⏳</span> Registrando...</> : 'Registrarse'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}