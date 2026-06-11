import React, { useState, useEffect, useCallback } from 'react';
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

function Marcador({ posicion, setPosicion }) {
  useMapEvents({
    click(e) { setPosicion([e.latlng.lat, e.latlng.lng]); },
  });
  return posicion ? <Marker position={posicion} draggable eventHandlers={{ dragend: (e) => {
    const { lat, lng } = e.target.getLatLng();
    setPosicion([lat, lng]);
  }}} /> : null;
}

export default function SolicitudRecogidaForm({ simple, onSuccess }) {
  const [posicion, setPosicion] = useState(null);
  const [formData, setFormData] = useState({
    direccion: localStorage.getItem('direccion_predeterminada') || '',
    tipoResiduo: 'mixto',
    descripcion: '',
    urgencia: 'normal',
  });
  const [cuando, setCuando] = useState('hoy');
  const [fechaCustom, setFechaCustom] = useState('');
  const [guardarDir, setGuardarDir] = useState(!!localStorage.getItem('direccion_predeterminada'));
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setPosicion([p.coords.latitude, p.coords.longitude]),
      () => setPosicion([40.4168, -3.7038])
    );
  }, []);

  const calcularFechaProgramada = useCallback(() => {
    const ahora = new Date();
    if (cuando === 'hoy') {
      return new Date(ahora.getTime() + 3 * 60 * 60 * 1000);
    }
    if (cuando === 'manana') {
      const m = new Date(ahora);
      m.setDate(m.getDate() + 1);
      m.setHours(10, 0, 0, 0);
      return m;
    }
    if (cuando === 'custom' && fechaCustom) {
      return new Date(fechaCustom);
    }
    return null;
  }, [cuando, fechaCustom]);

  const formatearCuentaAtras = (fecha) => {
    if (!fecha) return '';
    const diff = fecha.getTime() - Date.now();
    if (diff <= 0) return 'Ahora';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `~${h}h ${m}m`;
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.direccion.trim() && !posicion) {
      nuevosErrores.direccion = 'Indica la dirección o coloca un pin en el mapa';
    }
    const tiposValidos = ['orgánico', 'inorgánico', 'mixto', 'especial'];
    if (!tiposValidos.includes(formData.tipoResiduo)) {
      nuevosErrores.tipoResiduo = 'Tipo de residuo inválido';
    }
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
      const body = {
        direccion: formData.direccion || `${posicion[0].toFixed(5)}, ${posicion[1].toFixed(5)}`,
        latitud: posicion?.[0] || null,
        longitud: posicion?.[1] || null,
        tipoResiduo: formData.tipoResiduo,
        descripcion: formData.descripcion || null,
        urgencia: formData.urgencia,
        fechaProgramada: calcularFechaProgramada(),
      };

      await api.post('/recogidas', body);

      if (guardarDir) localStorage.setItem('direccion_predeterminada', formData.direccion);

      setSuccessMessage('Solicitud creada. Venimos en ' + formatearCuentaAtras(calcularFechaProgramada()));
      setFormData({ direccion: localStorage.getItem('direccion_predeterminada') || '', tipoResiduo: 'mixto', descripcion: '', urgencia: 'normal' });
      setCuando('hoy');
      setFechaCustom('');

      if (onSuccess) onSuccess();
      setTimeout(() => setSuccessMessage(''), 4000);

    } catch (error) {
      console.error('Error al crear recogida:', error);
      if (error.response?.data?.message) setErrorMessage(error.response.data.message);
      else if (error.response?.data?.error) setErrorMessage(error.response.data.error);
      else setErrorMessage('Error de comunicación con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const fechaProg = calcularFechaProgramada();

  return (
    <div className={simple ? '' : 'min-h-screen bg-fondo py-12 px-4'}>
      <div className={simple ? '' : 'max-w-2xl mx-auto'}>
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ubicación</label>
              <div className="h-52 w-full rounded-lg overflow-hidden border border-gray-300 z-0">
                <MapContainer center={posicion || [40.4168, -3.7038]} zoom={14} className="h-full w-full" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marcador posicion={posicion} setPosicion={setPosicion} />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-400 mt-1">Haz clic en el mapa para colocar el pin o arrastra el pin existente.</p>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="O escribe la dirección manualmente"
                className={`mt-2 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.direccion ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.direccion && <p className="text-red-600 text-xs mt-1">{errors.direccion}</p>}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={guardarDir} onChange={(e) => setGuardarDir(e.target.checked)} className="w-4 h-4 text-bosque-600 rounded border-gray-300" />
                <span className="text-sm text-gray-600">Guardar como dirección predeterminada</span>
              </label>
              {localStorage.getItem('direccion_predeterminada') && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-bosque-600">Dirección predeterminada guardada.</span>
                  <button type="button" onClick={() => { localStorage.removeItem('direccion_predeterminada'); setGuardarDir(false); setFormData(prev => ({ ...prev, direccion: '' })); }} className="text-xs text-red-500 hover:text-red-700 underline">Eliminar</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">¿Cuándo?</label>
              <div className="flex flex-wrap gap-2">
                {['hoy', 'manana', 'custom'].map((opt) => (
                  <button type="button" key={opt} onClick={() => setCuando(opt)}
                    className={`px-4 py-2 text-sm rounded-lg border transition ${cuando === opt ? 'bg-bosque-600 text-white border-bosque-600' : 'bg-white text-gray-600 border-gray-300 hover:border-bosque-500'}`}
                  >
                    {opt === 'hoy' ? 'Hoy' : opt === 'manana' ? 'Mañana' : 'Elegir fecha'}
                  </button>
                ))}
              </div>
              {cuando === 'custom' && (
                <input type="datetime-local" value={fechaCustom} onChange={(e) => setFechaCustom(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500" />
              )}
              {fechaProg && (
                <p className="text-sm text-bosque-700 font-semibold mt-2">
                  Venimos en {formatearCuentaAtras(fechaProg)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="tipoResiduo" className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Residuo *</label>
              <select id="tipoResiduo" name="tipoResiduo" value={formData.tipoResiduo} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 bg-white text-sm">
                <option value="mixto">Mixto (varios tipos)</option>
                <option value="orgánico">Orgánico</option>
                <option value="inorgánico">Inorgánico</option>
                <option value="especial">Especial</option>
              </select>
              {errors.tipoResiduo && <p className="text-red-600 text-xs mt-1">{errors.tipoResiduo}</p>}
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-2">Descripción (opcional)</label>
              <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={3}
                placeholder="Ej: 2 bolsas grandes, incluye vidrio"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition resize-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Urgencia</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="urgencia" value="normal" checked={formData.urgencia === 'normal'} onChange={handleInputChange} className="w-4 h-4 text-bosque-500" />
                  <span className="ml-2 text-sm text-gray-700">Normal</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="urgencia" value="alta" checked={formData.urgencia === 'alta'} onChange={handleInputChange} className="w-4 h-4 text-bosque-500" />
                  <span className="ml-2 text-sm text-gray-700">Alta</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-bosque-600 text-white font-semibold py-3 rounded-lg hover:bg-bosque-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {isLoading ? 'Enviando...' : 'Solicitar recogida'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
