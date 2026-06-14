import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import PaymentModal from './PaymentModal';
import ToastContainer, { showToast } from './Toast';
import ConfirmModal from './ConfirmModal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function miniIcon(markerColor) {
  const color = markerColor || '#4A7C59';
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="36" viewBox="0 0 24 36"><path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
  });
}

function CuentaAtras({ fecha }) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (!fecha) { setTexto(''); return; }
    function tick() {
      const diff = new Date(fecha).getTime() - Date.now();
      if (diff <= 0) { setTexto('Ya debería estar en camino!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTexto(`${d}d ${h}h ${m}m ${s}s`);
      else setTexto(`${h}h ${m}m ${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fecha]);

  if (!texto) return null;
  return <span className={`text-sm font-mono font-bold ${texto.includes('Ya') ? 'text-red-600' : 'text-bosque-700'}`}>{texto}</span>;
}

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`text-sm transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MisSolicitudes({ refreshKey }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const cargando = useRef(false);
  const [pagarSolicitud, setPagarSolicitud] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmPagar, setConfirmPagar] = useState(null);
  const [reagendarId, setReagendarId] = useState(null);
  const [reagendarFecha, setReagendarFecha] = useState('');
  const [confirmReagendar, setConfirmReagendar] = useState(null);
  const enviando = useRef(false);

  const handlePagar = async (id) => {
    if (enviando.current) return;
    enviando.current = true;
    try {
      await api.put(`/recogidas/${id}/pagar`);
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, pagado: true } : s));
      showToast(setToasts, 'Pago realizado correctamente', 'success');
    } catch (err) {
      showToast(setToasts, 'Error al procesar el pago', 'error');
    } finally {
      enviando.current = false;
    }
  };

  const handleCancelar = async (id) => {
    if (enviando.current) return;
    enviando.current = true;
    try {
      await api.put(`/recogidas/${id}/cancelar`);
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'cancelada' } : s));
      showToast(setToasts, 'Solicitud cancelada', 'info');
    } catch (err) {
      showToast(setToasts, 'Error al cancelar la solicitud', 'error');
    } finally {
      enviando.current = false;
    }
  };

  const handleValorar = async (id, valoracion) => {
    try {
      await api.put(`/recogidas/${id}/valorar`, { valoracion });
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, valoracion } : s));
      showToast(setToasts, 'Valoración guardada', 'success');
    } catch {
      showToast(setToasts, 'Error al guardar valoración', 'error');
    }
  };

  const handleReagendar = async (id) => {
    if (enviando.current) return;
    enviando.current = true;
    try {
      const res = await api.put(`/recogidas/${id}/reagendar`, { fechaProgramada: new Date(reagendarFecha).toISOString() });
      const nuevoCoste = res.data.data?.coste;
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, fecha_programada: new Date(reagendarFecha).toISOString(), coste: nuevoCoste || s.coste } : s));
      showToast(setToasts, 'Fecha reagendada. Nuevo coste: ' + (nuevoCoste || 0).toFixed(2) + ' €', 'success');
      setReagendarId(null);
      setReagendarFecha('');
    } catch {
      showToast(setToasts, 'Error al reagendar', 'error');
    } finally {
      enviando.current = false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (cargando.current) return;
      cargando.current = true;
      try {
        const res = await api.get('/recogidas/mis-recogidas');
        if (res.status === 200) {
          setSolicitudes(res.data.recogidas || res.data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        if (error.response?.status !== 401) setSolicitudes([]);
      } finally {
        cargando.current = false;
      }
    };
    fetchData();
  }, [refreshKey]);

  const estadoBadge = (estado) => {
    const map = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aceptada: 'bg-blue-100 text-blue-800 border-blue-300',
      completada: 'bg-green-100 text-green-800 border-green-300',
      cancelada: 'bg-red-100 text-red-800 border-red-300',
    };
    return map[estado] || map.pendiente;
  };

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const minDate = manana.toISOString().split('T')[0];

  if (solicitudes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Mis solicitudes</h3>
        <p className="text-gray-400 text-center py-8">Aún no tienes solicitudes de recogida.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ToastContainer toasts={toasts} />
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Mis solicitudes ({solicitudes.length})</h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {solicitudes.map((sol) => (
          <div key={sol.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${estadoBadge(sol.estado)}`}>
                {sol.estado === 'cancelada' && '✕'}
                {sol.estado === 'completada' && '✓'}
                {sol.estado === 'pendiente' && '◷'}
                {sol.estado === 'aceptada' && '◉'}
                {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
              </span>
              {sol.urgencia === 'alta' && <span className="text-xs font-bold text-red-600">URGENTE</span>}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 font-semibold">{Array.isArray(sol.tipo_residuo) ? sol.tipo_residuo.join(', ') : sol.tipo_residuo}</p>
              {sol.coste != null && <span className="text-sm font-bold text-bosque-700">{sol.coste.toFixed(2)} €</span>}
            </div>
            {sol.descripcion && <p className="text-xs text-gray-500 mt-1">{sol.descripcion}</p>}

            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>📍</span>
              <span className="truncate">{sol.direccion}</span>
            </div>
            {sol.fecha_programada && sol.estado === 'pendiente' && (
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>⏰</span>
                <CuentaAtras fecha={sol.fecha_programada} />
              </div>
            )}
            {sol.fecha_creacion && (
              <p className="text-xs text-gray-400 mt-1">
                Solicitado {new Date(sol.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {sol.latitud && sol.longitud && (
              <div className="h-28 w-full rounded-lg overflow-hidden border border-gray-200 mt-2">
                <MapContainer center={[sol.latitud, sol.longitud]} zoom={14} className="h-full w-full" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[sol.latitud, sol.longitud]} icon={miniIcon('#4A7C59')} />
                </MapContainer>
              </div>
            )}
            {sol.peso && <p className="text-xs text-gray-400 mt-1">Peso: {sol.peso} kg</p>}
            {sol.estado === 'pendiente' && !sol.pagado && sol.coste > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setConfirmPagar(sol)} className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-700 transition">
                  Pagar {sol.coste.toFixed(2)} €
                </button>
                <button onClick={() => { setReagendarId(sol.id); setReagendarFecha(''); }} className="px-3 text-xs text-bosque-600 border border-bosque-300 rounded-lg hover:bg-bosque-50 transition">
                  Reagendar
                </button>
                <button onClick={() => setConfirmCancel({ id: sol.id, pagado: sol.pagado })} className="px-3 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                  Cancelar
                </button>
              </div>
            )}
            {sol.pagado && sol.estado === 'pendiente' && (
              <div className="flex gap-2 mt-2">
                <span className="flex-1 text-xs text-green-600 font-semibold self-center">✓ Pagado</span>
                <button onClick={() => setConfirmCancel({ id: sol.id, pagado: true })} className="px-3 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                  Cancelar
                </button>
              </div>
            )}

            {reagendarId === sol.id && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                <input type="date" value={reagendarFecha} min={minDate} onChange={e => setReagendarFecha(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500" />
                <button onClick={() => { if (reagendarFecha) setConfirmReagendar(sol); }}
                  disabled={!reagendarFecha}
                  className="px-3 py-1.5 text-xs bg-bosque-600 text-white font-semibold rounded-lg hover:bg-bosque-700 transition disabled:opacity-50">
                  Guardar
                </button>
              </div>
            )}

            {sol.estado === 'completada' && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-1">Valoración</p>
                <StarRating value={sol.valoracion || 0} onChange={sol.valoracion ? undefined : (v) => handleValorar(sol.id, v)} readonly={!!sol.valoracion} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Link to="/solicitudes" className="block text-center text-sm text-bosque-600 hover:text-bosque-700 font-semibold mt-4 pt-3 border-t border-gray-100 transition">Ver todas las solicitudes →</Link>
      {confirmPagar && (
        <ConfirmModal
          mensaje={`¿Confirmas el pago de ${confirmPagar.coste.toFixed(2)} € por esta solicitud?`}
          confirmText="Sí, pagar"
          confirmBg="bg-green-600 hover:bg-green-700"
          onConfirm={() => { setPagarSolicitud(confirmPagar); setConfirmPagar(null); }}
          onCancel={() => setConfirmPagar(null)}
        />
      )}
      {pagarSolicitud && (
        <PaymentModal coste={pagarSolicitud.coste} onClose={() => setPagarSolicitud(null)} onSuccess={() => handlePagar(pagarSolicitud.id)} />
      )}
      {confirmCancel && (
        <ConfirmModal
          mensaje={confirmCancel.pagado ? '¿Estás seguro? La solicitud se cancelará sin reembolso.' : '¿Estás seguro de que quieres cancelar esta solicitud?'}
          confirmText="Sí, cancelar"
          onConfirm={() => { handleCancelar(confirmCancel.id); setConfirmCancel(null); }}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
      {confirmReagendar && (
        <ConfirmModal
          mensaje={`¿Reagendar para el ${new Date(reagendarFecha).toLocaleDateString('es-ES')}? El coste pasará de ${confirmReagendar.coste.toFixed(2)} € a ${(confirmReagendar.coste * 1.3).toFixed(2)} € (+30%).`}
          confirmText="Sí, reagendar"
          confirmBg="bg-bosque-600 hover:bg-bosque-700"
          onConfirm={() => { handleReagendar(confirmReagendar.id); setConfirmReagendar(null); }}
          onCancel={() => setConfirmReagendar(null)}
        />
      )}
    </div>
    </div>
  );
}
