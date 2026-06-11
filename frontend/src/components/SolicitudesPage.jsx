import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import PaymentModal from './PaymentModal';

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

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagarSolicitud, setPagarSolicitud] = useState(null);
  const cargando = useRef(false);

  const handlePagar = async (id) => {
    try {
      await api.put(`/recogidas/${id}/pagar`);
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, pagado: true } : s));
    } catch (err) {
      console.error('Error al pagar:', err);
    }
  };

  const handleCancelar = async (id) => {
    try {
      await api.put(`/recogidas/${id}/cancelar`);
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'cancelada' } : s));
    } catch (err) {
      console.error('Error al cancelar:', err);
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

  const estadoBadge = (estado) => {
    const map = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aceptada: 'bg-blue-100 text-blue-800 border-blue-300',
      completada: 'bg-green-100 text-green-800 border-green-300',
      cancelada: 'bg-red-100 text-red-800 border-red-300',
    };
    return map[estado] || map.pendiente;
  };

  if (loading) return (
    <div className="min-h-screen bg-fondo flex items-center justify-center">
      <p className="text-gray-400">Cargando solicitudes...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-fondo py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver al panel</Link>
        <h1 className="text-3xl font-bold text-bosque-800 mb-6">Mis solicitudes ({solicitudes.length})</h1>

        {solicitudes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <p className="text-gray-400 text-lg">Aún no tienes solicitudes de recogida.</p>
            <Link to="/dashboard" className="text-bosque-600 hover:text-bosque-700 font-semibold mt-4 inline-block">Solicitar una recogida</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {solicitudes.map((sol) => (
              <div key={sol.id} className="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${estadoBadge(sol.estado)}`}>
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
                {sol.fecha_programada && (
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
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setPagarSolicitud(sol)} className="flex-1 bg-bosque-600 text-white font-semibold py-3 rounded-lg hover:bg-bosque-700 transition text-base">
                      Pagar {sol.coste.toFixed(2)} €
                    </button>
                    <button onClick={() => handleCancelar(sol.id)} className="px-5 py-3 text-base text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                      Cancelar
                    </button>
                  </div>
                )}
                {sol.pagado && <span className="mt-3 text-base text-green-600 font-semibold block">✓ Pagado</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {pagarSolicitud && (
        <PaymentModal coste={pagarSolicitud.coste} onClose={() => setPagarSolicitud(null)} onSuccess={() => handlePagar(pagarSolicitud.id)} />
      )}
    </div>
  );
}
