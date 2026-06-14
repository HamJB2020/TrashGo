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
  return <span className={`text-base font-mono font-bold ${texto.includes('Ya') ? 'text-red-600' : 'text-bosque-700'}`}>{texto}</span>;
}

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`text-xl transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function SolicitudesPage() {
  const [tab, setTab] = useState('solicitudes');
  const [solicitudes, setSolicitudes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagarSolicitud, setPagarSolicitud] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmPagar, setConfirmPagar] = useState(null);
  const [reagendarId, setReagendarId] = useState(null);
  const [reagendarFecha, setReagendarFecha] = useState('');
  const [confirmReagendar, setConfirmReagendar] = useState(null);
  const cargando = useRef(false);
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
      } finally {
        setLoading(false);
        cargando.current = false;
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tab === 'pagos') {
      const fetchPagos = async () => {
        try {
          const res = await api.get('/recogidas/historial-pagos');
          setPagos(res.data.data || []);
        } catch {
          setPagos([]);
        }
      };
      fetchPagos();
    }
  }, [tab]);

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

  if (loading) return (
    <div className="min-h-screen bg-fondo flex items-center justify-center">
      <p className="text-gray-400">Cargando solicitudes...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <ToastContainer toasts={toasts} />
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver al panel</Link>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('solicitudes')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === 'solicitudes' ? 'bg-bosque-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-bosque-500'}`}
          >
            Mis solicitudes ({solicitudes.length})
          </button>
          <button onClick={() => setTab('pagos')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === 'pagos' ? 'bg-bosque-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-bosque-500'}`}
          >
            Pagos realizados ({pagos.length})
          </button>
        </div>

        {tab === 'pagos' && (
          <div className="space-y-4">
            {pagos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <p className="text-gray-400 text-lg">No hay pagos realizados.</p>
              </div>
            ) : (
              pagos.map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-300 flex items-center gap-1.5">✓ Pagado</span>
                    </div>
                    {p.coste != null && <span className="text-xl font-bold text-bosque-700">{p.coste.toFixed(2)} €</span>}
                  </div>
                  <p className="text-base text-gray-800 font-semibold">{Array.isArray(p.tipo_residuo) ? p.tipo_residuo.join(', ') : p.tipo_residuo}</p>
                  <div className="flex items-center gap-2 mt-2 text-base text-gray-500">
                    <span>📍</span>
                    <span>{p.direccion}</span>
                  </div>
                  {p.peso && <p className="text-sm text-gray-400 mt-1">Peso: {p.peso} kg</p>}
                  {p.fecha_creacion && (
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(p.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'solicitudes' && solicitudes.length === 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <p className="text-gray-400 text-lg">Aún no tienes solicitudes de recogida.</p>
            <Link to="/dashboard" className="text-bosque-600 hover:text-bosque-700 font-semibold mt-4 inline-block">Solicitar una recogida</Link>
          </div>
        )}

        {tab === 'solicitudes' && solicitudes.length > 0 && (
          <div className="space-y-6">
            {solicitudes.map((sol) => (
              <div key={sol.id} className="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${estadoBadge(sol.estado)}`}>
                    {sol.estado === 'cancelada' && '✕'}
                    {sol.estado === 'completada' && '✓'}
                    {sol.estado === 'pendiente' && '◷'}
                    {sol.estado === 'aceptada' && '◉'}
                    {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
                  </span>
                  {sol.urgencia === 'alta' && <span className="text-sm font-bold text-red-600">URGENTE</span>}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-lg text-gray-800 font-semibold">{Array.isArray(sol.tipo_residuo) ? sol.tipo_residuo.join(', ') : sol.tipo_residuo}</p>
                  {sol.coste != null && <span className="text-xl font-bold text-bosque-700">{sol.coste.toFixed(2)} €</span>}
                </div>
                {sol.descripcion && <p className="text-base text-gray-600 mt-1">{sol.descripcion}</p>}

                <div className="flex items-center gap-2 mt-3 text-base text-gray-500">
                  <span>📍</span>
                  <span>{sol.direccion}</span>
                </div>
                {sol.fecha_programada && sol.estado === 'pendiente' && (
                  <div className="flex items-center gap-2 mt-2 text-base text-gray-500">
                    <span>⏰</span>
                    <CuentaAtras fecha={sol.fecha_programada} />
                  </div>
                )}
                {sol.fecha_creacion && (
                  <p className="text-sm text-gray-400 mt-1">
                    Solicitado {new Date(sol.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {sol.latitud && sol.longitud && (
                  <div className="h-40 w-full rounded-lg overflow-hidden border border-gray-200 mt-3">
                    <MapContainer center={[sol.latitud, sol.longitud]} zoom={14} className="h-full w-full" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[sol.latitud, sol.longitud]} icon={miniIcon('#4A7C59')} />
                    </MapContainer>
                  </div>
                )}
                {sol.peso && <p className="text-sm text-gray-400 mt-2">Peso: {sol.peso} kg</p>}

                {sol.estado === 'pendiente' && !sol.pagado && sol.coste > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={() => setConfirmPagar(sol)} className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition text-base">
                      Pagar {sol.coste.toFixed(2)} €
                    </button>
                    <button onClick={() => { setReagendarId(sol.id); setReagendarFecha(''); }} className="px-4 py-3 text-base text-bosque-600 border border-bosque-300 rounded-lg hover:bg-bosque-50 transition">
                      Reagendar
                    </button>
                    <button onClick={() => setConfirmCancel({ id: sol.id, pagado: false })} className="px-5 py-3 text-base text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                      Cancelar
                    </button>
                  </div>
                )}
                {sol.pagado && sol.estado === 'pendiente' && (
                  <div className="flex flex-wrap gap-3 mt-4 items-center">
                    <span className="text-base text-green-600 font-semibold">✓ Pagado</span>
                    <button onClick={() => setConfirmCancel({ id: sol.id, pagado: true })} className="px-5 py-3 text-base text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                      Cancelar
                    </button>
                  </div>
                )}

                {reagendarId === sol.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                    <input type="date" value={reagendarFecha} min={minDate} onChange={e => setReagendarFecha(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosque-500" />
                    <button onClick={() => { if (reagendarFecha) setConfirmReagendar(sol); }} disabled={!reagendarFecha}
                      className="px-4 py-2 text-sm bg-bosque-600 text-white font-semibold rounded-lg hover:bg-bosque-700 transition disabled:opacity-50">
                      Guardar
                    </button>
                  </div>
                )}

                {sol.estado === 'completada' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Valoración</p>
                    <StarRating value={sol.valoracion || 0} onChange={sol.valoracion ? undefined : (v) => handleValorar(sol.id, v)} readonly={!!sol.valoracion} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
  );
}
