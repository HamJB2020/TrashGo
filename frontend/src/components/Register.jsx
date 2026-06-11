import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) map.setView(posicion, 14, { animate: true });
  }, [posicion, map]);
  return null;
}

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
    if (data?.address) {
      const a = data.address;
      const calle = [a.road, a.house_number].filter(Boolean).join(', ');
      const ciudad = a.city || a.town || a.village || a.municipality || a.county || '';
      const pais = a.country || '';
      const valido = (a.road || a.city || a.town || a.village || a.municipality || a.county) && (ciudad || calle);
      return { calle, ciudad, pais, valido };
    }
    return { calle: '', ciudad: '', pais: '', valido: false };
  } catch {
    return { calle: '', ciudad: '', pais: '', valido: false };
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
      const r = data[0];
      const addr = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${r.lat}&lon=${r.lon}&addressdetails=1&accept-language=es`,
        { headers: { 'User-Agent': 'TrashGo/1.0' } }
      );
      const rev = await addr.json();
      const a = rev?.address || {};
      return {
        lat: parseFloat(r.lat), lng: parseFloat(r.lon),
        calle: [a.road, a.house_number].filter(Boolean).join(', '),
        ciudad: a.city || a.town || a.village || a.municipality || a.county || '',
        pais: a.country || ''
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function Register() {
  const navigate = useNavigate();
  const [posicion, setPosicion] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    telefono: '',
    calle: '',
    numero: '',
    ciudad: '',
    pais: '',
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
    const addr = await reverseGeocode(lat, lng);
    if (addr.valido) {
      setFormData(prev => ({ ...prev, calle: addr.calle, ciudad: addr.ciudad, pais: addr.pais }));
      setErrors(prev => ({ ...prev, direccion: '' }));
    } else {
      setFormData(prev => ({ ...prev, calle: '', ciudad: '', pais: '' }));
      setPosicion(null);
      setErrors(prev => ({ ...prev, direccion: 'Ubicación no válida. Selecciona una zona habitada.' }));
    }
  };

  const handleAddressBlur = async () => {
    if (!formData.calle.trim() || posicion) return;
    const q = [formData.calle, formData.numero, formData.ciudad].filter(Boolean).join(', ');
    const result = await geocodeAddress(q);
    if (result) {
      setPosicion([result.lat, result.lng]);
      setFormData(prev => ({ ...prev, calle: result.calle, ciudad: result.ciudad || prev.ciudad, pais: result.pais || prev.pais }));
      setErrors(prev => ({ ...prev, direccion: '' }));
    } else {
      setErrors(prev => ({ ...prev, direccion: 'Dirección no encontrada. Coloca un pin en el mapa.' }));
    }
  };

  const direccionCompleta = () => {
    const partes = [formData.calle, formData.numero, formData.ciudad, formData.pais].filter(Boolean);
    return partes.join(', ');
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.username.trim()) nuevosErrores.username = 'El nombre de usuario es obligatorio';
    if (!formData.email.trim()) nuevosErrores.email = 'El correo electrónico es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nuevosErrores.email = 'Formato de correo inválido';
    if (!formData.password) nuevosErrores.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!posicion) nuevosErrores.direccion = 'Coloca un pin en el mapa o escribe una dirección válida';
    if (!formData.calle.trim()) nuevosErrores.calle = 'La calle es obligatoria';
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
      const payload = { ...formData, direccion: direccionCompleta() };
      delete payload.calle; delete payload.numero; delete payload.ciudad; delete payload.pais;
      await api.post('/auth/register', payload);
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
              <p className="text-xs text-gray-400 mb-2">Haz clic en el mapa para colocar tu ubicación o escribe la dirección.</p>
              <div className="h-52 w-full rounded-lg overflow-hidden border border-gray-300 z-0 mb-2">
                <MapContainer center={posicion || [19.4326, -99.1332]} zoom={posicion ? 14 : 3} className="h-full w-full" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController posicion={posicion} />
                  <Marcador posicion={posicion} onMove={manejarMovimientoPin} />
                </MapContainer>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input type="text" name="calle" value={formData.calle} onChange={handleInputChange} onBlur={handleAddressBlur}
                    placeholder="Calle *"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.calle ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
                  />
                  {errors.calle && <p className="text-red-600 text-sm mt-1">{errors.calle}</p>}
                </div>
                <div>
                  <input type="text" name="numero" value={formData.numero} onChange={handleInputChange}
                    placeholder="Nº"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange}
                    placeholder="Ciudad *"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                  />
                </div>
                <div>
                  <input type="text" name="pais" value={formData.pais} onChange={handleInputChange}
                    placeholder="País"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                  />
                </div>
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
