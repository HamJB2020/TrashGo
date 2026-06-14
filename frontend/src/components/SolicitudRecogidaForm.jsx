import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import Swal from 'sweetalert2';
import ToastContainer, { showToast } from './Toast';

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

const PRECIOS_MATERIAL = {
  'orgánico': 0.30, 'inorgánico': 0.40, 'mixto': 0.50, 'especial': 5.00,
  'vidrio': 0.40, 'plástico': 0.60, 'papel/cartón': 0.30, 'metal': 1.50,
  'electrónico': 3.00, 'madera': 0.80, 'textil': 1.00, 'pilas/baterías': 4.00,
  'aceite': 2.00, 'escombros': 1.20, 'poda/jardín': 0.50, 'voluminoso': 2.50,
};

const MULTIPLICADOR_CUANDO = { hoy: 1.3, manana: 1.15, custom: 1.0 };
const MULTIPLICADOR_URGENCIA = { normal: 1.0, alta: 1.25 };

function calcularCoste(tipos, cuando, urgencia, peso) {
  if (!Array.isArray(tipos) || tipos.length === 0) return 0;
  const maxPrecio = Math.max(...tipos.map(t => PRECIOS_MATERIAL[t] || 0));
  return maxPrecio * (peso || 1) * (MULTIPLICADOR_CUANDO[cuando] || 1) * (MULTIPLICADOR_URGENCIA[urgencia] || 1);
}

export default function SolicitudRecogidaForm({ simple, onSuccess, initialCalle }) {
  const [posicion, setPosicion] = useState(null);
  const [formData, setFormData] = useState({
    calle: '',
    numero: '',
    ciudad: '',
    pais: '',
    piso: '',
    peso: 1,
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
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const enviando = useRef(false);
  const direccionVerificada = useRef(false);

  useEffect(() => {
    const centrarEnPais = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/auth/perfil');
        const userPais = res.data.data?.pais;
        if (!userPais) return;
        const paises = {
          'España': [40.4168, -3.7038], 'México': [19.4326, -99.1332],
          'Argentina': [-34.6037, -58.3816], 'Colombia': [4.7110, -74.0721],
          'Chile': [-33.4489, -70.6693], 'Perú': [-12.0464, -77.0428],
          'Ecuador': [-0.1807, -78.4678], 'Venezuela': [10.4806, -66.9036],
          'Uruguay': [-34.9011, -56.1645], 'Paraguay': [-25.2637, -57.5759],
          'Bolivia': [-16.5000, -68.1500], 'Costa Rica': [9.9281, -84.0907],
          'Panamá': [8.9824, -79.5199], 'Guatemala': [14.6349, -90.5069],
          'Honduras': [14.0723, -87.1921], 'El Salvador': [13.6929, -89.2182],
          'Nicaragua': [12.1149, -86.2362], 'República Dominicana': [18.4861, -69.9312],
          'Cuba': [23.1136, -82.3666], 'Puerto Rico': [18.4655, -66.1057],
          'Estados Unidos': [38.9072, -77.0369], 'Francia': [48.8566, 2.3522],
          'Italia': [41.9028, 12.4964], 'Portugal': [38.7223, -9.1393],
          'Reino Unido': [51.5074, -0.1278], 'Alemania': [52.5200, 13.4050],
          'Brasil': [-15.7934, -47.8822],
        };
        const coords = paises[userPais];
        if (coords) setPosicion(coords);
      } catch {}
    };
    centrarEnPais();
  }, []);

  useEffect(() => {
    if (initialCalle) {
      setFormData(prev => ({ ...prev, calle: initialCalle }));
      (async () => {
        const result = await geocodeAddress(initialCalle);
        if (result) {
          setPosicion([result.lat, result.lng]);
          setFormData(prev => ({ ...prev, calle: result.calle, ciudad: result.ciudad || prev.ciudad, pais: result.pais || prev.pais }));
          direccionVerificada.current = true;
          setErrors(prev => ({ ...prev, direccion: '' }));
        }
      })();
    }
  }, [initialCalle]);

  const manejarMovimientoPin = useCallback(async (lat, lng) => {
    setPosicion([lat, lng]);
    const addr = await reverseGeocode(lat, lng);
    if (addr.valido) {
      setFormData(prev => ({ ...prev, calle: addr.calle, ciudad: addr.ciudad, pais: addr.pais }));
      setErrors(prev => ({ ...prev, direccion: '' }));
      direccionVerificada.current = true;
    } else {
      setFormData(prev => ({ ...prev, calle: '', ciudad: '', pais: '' }));
      setPosicion(null);
      setErrors(prev => ({ ...prev, direccion: 'Ubicación no válida. Selecciona una zona habitada.' }));
    }
  }, []);

  const calcularFechaProgramada = useCallback(() => {
    const ahora = new Date();
    const h = ahora.getHours();
    const m = ahora.getMinutes();
    if (cuando === 'hoy') {
      if (h < 9) {
        const d = new Date(ahora); d.setHours(9, 0, 0, 0); return d;
      }
      if (h >= 18 || (h === 17 && m > 30)) {
        const manana = new Date(ahora);
        manana.setDate(manana.getDate() + 1);
        manana.setHours(9, 0, 0, 0);
        return manana;
      }
      if (h >= 14 && h < 16) {
        const d = new Date(ahora); d.setHours(16, 0, 0, 0); return d;
      }
      return new Date(ahora.getTime() + 3 * 60 * 60 * 1000);
    }
    if (cuando === 'manana') {
      const m = new Date(ahora);
      m.setDate(m.getDate() + 1);
      m.setHours(9, 0, 0, 0);
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
    if (!formData.calle.trim()) return;
    const q = [formData.calle, formData.numero, formData.ciudad].filter(Boolean).join(', ');
    const result = await geocodeAddress(q);
    if (result) {
      setPosicion([result.lat, result.lng]);
      setFormData(prev => ({ ...prev, calle: result.calle, ciudad: result.ciudad || prev.ciudad, pais: result.pais || prev.pais }));
      setErrors(prev => ({ ...prev, direccion: '' }));
      direccionVerificada.current = true;
    } else {
      setPosicion(null);
      setErrors(prev => ({ ...prev, direccion: 'Dirección no encontrada. Coloca un pin en el mapa.' }));
    }
  }, [formData.calle, formData.numero, formData.ciudad]);

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!posicion || !direccionVerificada.current) {
      nuevosErrores.direccion = 'Selecciona una dirección válida en el mapa o búscala con "Buscar"';
    }
    if (!formData.calle.trim()) nuevosErrores.calle = 'La calle es obligatoria';
    if (!formData.peso || formData.peso < 1) nuevosErrores.peso = 'El peso mínimo es 1 kg';
    else if (formData.peso > 50) nuevosErrores.peso = 'No recogemos más de 50 kg';
    if (cuando === 'custom') {
      if (!fechaCustom) {
        nuevosErrores.fechaCustom = 'Selecciona una fecha';
      } else if (new Date(fechaCustom) <= new Date(new Date().toDateString())) {
        nuevosErrores.fechaCustom = 'La fecha debe ser posterior a hoy';
      }
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
    if (['calle', 'numero', 'ciudad'].includes(name)) direccionVerificada.current = false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando.current) return;
    setToasts([]);

    const validationErrors = validarFormulario();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast(setToasts, 'Corrige los campos marcados en rojo antes de continuar', 'error');
      return;
    }

    enviando.current = true;
    setIsLoading(true);

    try {
      const coste = calcularCoste(formData.tipoResiduo, cuando, formData.urgencia, formData.peso);
      const body = {
        direccion: direccionCompleta(),
        latitud: posicion?.[0] || null,
        longitud: posicion?.[1] || null,
        tipoResiduo: formData.tipoResiduo,
        pais: formData.pais,
        descripcion: formData.descripcion || null,
        urgencia: formData.urgencia,
        fechaProgramada: calcularFechaProgramada(),
        coste,
        peso: formData.peso,
      };

      await api.post('/recogidas', body);

      Swal.fire({ icon: 'success', title: 'Solicitud creada', text: 'Venimos en ' + formatearCuentaAtras(calcularFechaProgramada()) + '. No olvides pagar para confirmar.', timer: 3000, showConfirmButton: false });
      setFormData({ calle: '', numero: '', ciudad: '', pais: '', piso: '', peso: 1, tipoResiduo: [], descripcion: '', urgencia: 'normal' });
      setCuando('hoy');
      setFechaCustom('');
      setPosicion(null);

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error al crear recogida:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Error de comunicación con el servidor.';
      showToast(setToasts, msg, 'error');
    } finally {
      setIsLoading(false);
      enviando.current = false;
    }
  };

  const fechaProg = calcularFechaProgramada();

  return (
    <div className={simple ? '' : 'min-h-screen bg-fondo py-12 px-4'}>
      <div className={simple ? '' : 'max-w-2xl mx-auto'}>
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">

          <ToastContainer toasts={toasts} />

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

              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <input type="text" name="calle" value={formData.calle} onChange={handleInputChange}
                    placeholder="Calle *"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500 transition ${errors.calle ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.calle && <p className="text-red-600 text-xs mt-1">{errors.calle}</p>}
                </div>
                <button type="button" onClick={handleAddressBlur}
                  className="px-4 py-2 text-sm bg-bosque-600 text-white rounded-lg hover:bg-bosque-700 transition font-semibold self-start">
                  Buscar
                </button>
                <div className="w-20">
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
                <input type="date" value={fechaCustom} onChange={(e) => setFechaCustom(e.target.value)}
                  min={new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]}
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
                  <span className="text-2xl font-bold text-bosque-800">{calcularCoste(formData.tipoResiduo, cuando, formData.urgencia, formData.peso).toFixed(2)} €</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>{formData.tipoResiduo.map(t => `${t} (${PRECIOS_MATERIAL[t]}€/kg)`).join(', ')} — Precio más caro: {Math.max(...formData.tipoResiduo.map(t => PRECIOS_MATERIAL[t] || 0)).toFixed(2)}€/kg × {formData.peso} kg</p>
                  <p>Cuándo: {cuando === 'hoy' ? 'Hoy (×1.3)' : cuando === 'manana' ? 'Mañana (×1.15)' : 'Programado (×1.0)'} | Urgencia: {formData.urgencia === 'normal' ? 'Normal (×1.0)' : 'Alta (×1.25)'}</p>
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

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Peso aproximado</label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="50" value={formData.peso} onChange={(e) => setFormData(prev => ({ ...prev, peso: parseInt(e.target.value) }))}
                  className="flex-1 accent-bosque-600" />
                <span className="text-sm font-bold text-bosque-700 min-w-[4rem] text-right">{formData.peso} kg</span>
              </div>
              {errors.peso && <p className="text-red-600 text-xs mt-1">{errors.peso}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-bosque-600 text-white font-semibold py-3 rounded-lg hover:bg-bosque-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
              {isLoading ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Enviando...</> : 'Solicitar recogida'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
