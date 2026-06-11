import React, { useState, useEffect, useCallback, useRef } from 'react';
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
      return { calle, ciudad, pais };
    }
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return { calle: fallback, ciudad: '', pais: '' };
  } catch {
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return { calle: fallback, ciudad: '', pais: '' };
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

const PRECIOS_MATERIAL = {
  'orgánico': 3, 'inorgánico': 3, 'mixto': 4, 'especial': 10,
  'vidrio': 4, 'plástico': 4, 'papel/cartón': 3, 'metal': 5,
  'electrónico': 8, 'madera': 5, 'textil': 4, 'pilas/baterías': 6,
  'aceite': 5, 'escombros': 7, 'poda/jardín': 4, 'voluminoso': 8,
};

const MULTIPLICADOR_CUANDO = { hoy: 1.0, manana: 1.15, custom: 1.3 };
const MULTIPLICADOR_URGENCIA = { normal: 1.0, alta: 1.25 };

function calcularCoste(tipos, cuando, urgencia) {
  if (!Array.isArray(tipos) || tipos.length === 0) return 0;
  const base = tipos.reduce((sum, t) => sum + (PRECIOS_MATERIAL[t] || 0), 0);
  return base * (MULTIPLICADOR_CUANDO[cuando] || 1) * (MULTIPLICADOR_URGENCIA[urgencia] || 1);
}

export default function SolicitudRecogidaForm({ simple, onSuccess }) {
  const [posicion, setPosicion] = useState(null);
  const [buscandoDir, setBuscandoDir] = useState(false);
  const [formData, setFormData] = useState({
    calle: '',
    numero: '',
    ciudad: '',
    pais: '',
    piso: '',
    tipoResiduo: [],
    descripcion: '',
    urgencia: 'normal',
  });

  const direccionCompleta = () => {
    const partes = [formData.calle, formData.numero, formData.ciudad, formData.pais].filter(Boolean);
    const base = partes.join(', ');
    return formData.piso ? `${base}, ${formData.piso}` : base;
  };
  const [cuando, setCuando] = useState('hoy');
  const [fechaCustom, setFechaCustom] = useState('');
  const [guardarDir, setGuardarDir] = useState(!!localStorage.getItem('direccion_predeterminada'));
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

  const manejarMovimientoPin = useCallback(async (lat, lng) => {
    setPosicion([lat, lng]);
    setBuscandoDir(true);
    const addr = await reverseGeocode(lat, lng);
    setFormData(prev => ({ ...prev, calle: addr.calle, ciudad: addr.ciudad, pais: addr.pais }));
    setBuscandoDir(false);
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
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `~${d}d ${h}h ${m}m`;
    return `~${h}h ${m}m`;
  };

  const handleAddressBlur = useCallback(async () => {
    if (!formData.calle.trim() || posicion) return;
    setBuscandoDir(true);
    const q = [formData.calle, formData.numero, formData.ciudad].filter(Boolean).join(', ');
    const result = await geocodeAddress(q);
    if (result) {
      setPosicion([result.lat, result.lng]);
      setFormData(prev => ({ ...prev, calle: result.calle, ciudad: result.ciudad || prev.ciudad, pais: result.pais || prev.pais }));
      setErrors(prev => ({ ...prev, direccion: '' }));
    } else {
      setErrors(prev => ({ ...prev, direccion: 'Dirección no encontrada. Coloca un pin en el mapa.' }));
    }
    setBuscandoDir(false);
  }, [formData.calle, formData.numero, formData.ciudad, posicion]);

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!posicion) {
      nuevosErrores.direccion = 'Coloca un pin en el mapa o escribe una dirección válida';
    }
    if (!formData.calle.trim()) nuevosErrores.calle = 'La calle es obligatoria';
    if (cuando === 'custom' && !fechaCustom) {
      nuevosErrores.fechaCustom = 'Selecciona una fecha y hora';
    }
    const tiposValidos = ['orgánico', 'inorgánico', 'mixto', 'especial', 'vidrio', 'plástico', 'papel/cartón', 'metal', 'electrónico', 'madera', 'textil', 'pilas/baterías', 'aceite', 'escombros', 'poda/jardín', 'voluminoso'];
    if (!Array.isArray(formData.tipoResiduo) || formData.tipoResiduo.length === 0) {
      nuevosErrores.tipoResiduo = 'Selecciona al menos un tipo de residuo';
    } else if (formData.tipoResiduo.some(t => !tiposValidos.includes(t))) {
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
      const coste = calcularCoste(formData.tipoResiduo, cuando, formData.urgencia);
      const body = {
        direccion: direccionCompleta(),
        latitud: posicion?.[0] || null,
        longitud: posicion?.[1] || null,
        tipoResiduo: formData.tipoResiduo,
        descripcion: formData.descripcion || null,
        urgencia: formData.urgencia,
        fechaProgramada: calcularFechaProgramada(),
        coste,
      };

      await api.post('/recogidas', body);

      if (guardarDir) localStorage.setItem('direccion_predeterminada', direccionCompleta());

      setSuccessMessage('Solicitud creada. Venimos en ' + formatearCuentaAtras(calcularFechaProgramada()));
      setFormData({ calle: '', numero: '', ciudad: '', pais: '', piso: '', tipoResiduo: [], descripcion: '', urgencia: 'normal' });
      setCuando('hoy');
      setFechaCustom('');
      setPosicion(null);

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
                <MapContainer center={posicion || [19.4326, -99.1332]} zoom={posicion ? 14 : 3} className="h-full w-full" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController posicion={posicion} />
                  <Marcador posicion={posicion} onMove={manejarMovimientoPin} />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-400 mt-1">Haz clic en el mapa para colocar el pin o arrastra el pin para ajustar.</p>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input type="text" name="calle" value={formData.calle} onChange={handleInputChange} onBlur={handleAddressBlur}
                    placeholder="Calle *"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.calle ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.calle && <p className="text-red-600 text-xs mt-1">{errors.calle}</p>}
                </div>
                <div>
                  <input type="text" name="numero" value={formData.numero} onChange={handleInputChange}
                    placeholder="Nº"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange}
                    placeholder="Ciudad *"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                  />
                </div>
                <div>
                  <input type="text" name="pais" value={formData.pais} onChange={handleInputChange}
                    placeholder="País"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                  />
                </div>
              </div>

              <div className="mt-2">
                <input type="text" name="piso" value={formData.piso} onChange={handleInputChange}
                  placeholder="Piso / Puerta / Bloque (opcional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500"
                />
              </div>

              {errors.direccion && <p className="text-red-600 text-xs mt-1">{errors.direccion}</p>}
              {posicion && (
                <p className="text-xs text-gray-400 mt-1">Coordenadas: {posicion[0].toFixed(5)}, {posicion[1].toFixed(5)}</p>
              )}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={guardarDir} onChange={(e) => setGuardarDir(e.target.checked)} className="w-4 h-4 text-bosque-600 rounded border-gray-300" />
                <span className="text-sm text-gray-600">Guardar como dirección predeterminada</span>
              </label>
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
              {errors.fechaCustom && <p className="text-red-600 text-xs mt-1">{errors.fechaCustom}</p>}
              {fechaProg && (
                <p className="text-sm text-bosque-700 font-semibold mt-2">
                  Venimos en {formatearCuentaAtras(fechaProg)}
                </p>
              )}
            </div>

            {formData.tipoResiduo.length > 0 && (
              <div className="bg-bosque-50 border border-bosque-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total estimado</span>
                  <span className="text-2xl font-bold text-bosque-800">{calcularCoste(formData.tipoResiduo, cuando, formData.urgencia).toFixed(2)} €</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>Materiales: {formData.tipoResiduo.map(t => `${t} (${PRECIOS_MATERIAL[t]}€)`).join(', ')}</p>
                  <p>Cuándo: {cuando === 'hoy' ? 'Hoy (×1.0)' : cuando === 'manana' ? 'Mañana (×1.15)' : 'Programado (×1.3)'} | Urgencia: {formData.urgencia === 'normal' ? 'Normal (×1.0)' : 'Alta (×1.25)'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipos de Residuo *</label>
              <p className="text-xs text-gray-400 mb-2">Selecciona uno o varios tipos:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'orgánico', label: 'Orgánico' },
                  { value: 'inorgánico', label: 'Inorgánico' },
                  { value: 'vidrio', label: 'Vidrio' },
                  { value: 'plástico', label: 'Plástico' },
                  { value: 'papel/cartón', label: 'Papel / Cartón' },
                  { value: 'metal', label: 'Metal' },
                  { value: 'electrónico', label: 'Electrónico (RAEE)' },
                  { value: 'madera', label: 'Madera' },
                  { value: 'textil', label: 'Textil' },
                  { value: 'pilas/baterías', label: 'Pilas / Baterías' },
                  { value: 'aceite', label: 'Aceite' },
                  { value: 'escombros', label: 'Escombros' },
                  { value: 'poda/jardín', label: 'Poda / Jardín' },
                  { value: 'voluminoso', label: 'Voluminoso' },
                  { value: 'especial', label: 'Especial (peligrosos)' },
                  { value: 'mixto', label: 'Mixto (varios)' },
                ].map(({ value, label }) => (
                  <label key={value} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition text-sm ${formData.tipoResiduo.includes(value) ? 'bg-bosque-50 border-bosque-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={formData.tipoResiduo.includes(value)} onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        tipoResiduo: prev.tipoResiduo.includes(value)
                          ? prev.tipoResiduo.filter(t => t !== value)
                          : [...prev.tipoResiduo, value]
                      }));
                      if (errors.tipoResiduo) setErrors(prev => ({ ...prev, tipoResiduo: '' }));
                    }} className="w-4 h-4 text-bosque-600 rounded border-gray-300" />
                    {label}
                  </label>
                ))}
              </div>
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
              {formData.urgencia === 'alta' && (
                <p className="text-xs text-red-600 mt-1">Se priorizará la recogida nada más llegar el recolector. Diferencia estimada: 1-5 min</p>
              )}
              {formData.urgencia === 'normal' && (
                <p className="text-xs text-gray-500 mt-1">Se recogerá cuando haya tiempo disponible. Diferencia estimada: 10-30 min</p>
              )}
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
