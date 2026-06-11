import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function Marcador({ posicion, onMove }) {
  useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); },
  });
  return posicion ? <Marker position={posicion} draggable eventHandlers={{ dragend: (e) => {
    const { lat, lng } = e.target.getLatLng();
    onMove(lat, lng);
  }}} /> : null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
      { headers: { 'User-Agent': 'TrashGo/1.0' } }
    );
    const data = await res.json();
    if (data?.display_name) return data.display_name;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function geocodeAddress(direccion) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1&accept-language=es`,
      { headers: { 'User-Agent': 'TrashGo/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lng), display_name: data[0].display_name };
    }
    return null;
  } catch {
    return null;
  }
}

export default function Register() {
  const navigate = useNavigate();
  const [posicion, setPosicion] = useState(null);
  const [buscandoDir, setBuscandoDir] = useState(false);
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
  const geoOk = useRef(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => { geoOk.current = true; setPosicion([p.coords.latitude, p.coords.longitude]); },
      () => {}
    );
  }, []);

  const manejarMovimientoPin = async (lat, lng) => {
    setPosicion([lat, lng]);
    setBuscandoDir(true);
    const addr = await reverseGeocode(lat, lng);
    setFormData(prev => ({ ...prev, direccion: addr }));
    setBuscandoDir(false);
  };

  const handleAddressBlur = async () => {
    if (!formData.direccion.trim() || posicion) return;
    setBuscandoDir(true);
    const result = await geocodeAddress(formData.direccion);
    if (result) {
      setPosicion([result.lat, result.lng]);
      setFormData(prev => ({ ...prev, direccion: result.display_name }));
      setErrors(prev => ({ ...prev, direccion: '' }));
    } else {
      setErrors(prev => ({ ...prev, direccion: 'Dirección no encontrada. Coloca un pin en el mapa.' }));
    }
    setBuscandoDir(false);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.username.trim()) nuevosErrores.username = 'El nombre de usuario es obligatorio';
    if (!formData.email.trim()) nuevosErrores.email = 'El correo electrónico es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nuevosErrores.email = 'Formato de correo inválido';
    if (!formData.password) nuevosErrores.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!posicion) nuevosErrores.direccion = 'Coloca un pin en el mapa o escribe una dirección válida';
    return nuevosErrores;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
      await api.post('/auth/register', formData);
      localStorage.setItem('direccion_predeterminada', formData.direccion);
      setSuccessMessage('Registrado correctamente. Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 5000);
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
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>
          <h1 className="text-4xl font-bold text-bosque-800 mb-2">TrashGo</h1>
          <p className="text-lg text-gray-600">Registro de usuario</p>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tu dirección *</label>
              <p className="text-xs text-gray-400 mb-2">Haz clic en el mapa para colocar tu ubicación. Arrastra el pin para ajustar.</p>
              <div className="h-52 w-full rounded-lg overflow-hidden border border-gray-300 z-0 mb-2">
                <MapContainer center={posicion || [19.4326, -99.1332]} zoom={posicion ? 14 : 3} className="h-full w-full" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marcador posicion={posicion} onMove={manejarMovimientoPin} />
                </MapContainer>
              </div>
              <div className="relative">
                <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} onBlur={handleAddressBlur}
                  placeholder="Dirección obtenida del mapa o escríbela manualmente"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition pr-16 ${errors.direccion ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
                />
                {buscandoDir && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscando...</span>}
              </div>
              {errors.direccion && <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>}
              {posicion && (
                <p className="text-xs text-gray-400 mt-1">Coordenadas: {posicion[0].toFixed(5)}, {posicion[1].toFixed(5)}</p>
              )}
            </div>

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
