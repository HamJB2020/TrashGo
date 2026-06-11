import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

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

export default function MisSolicitudes({ refreshKey }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const cargando = useRef(false);

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

  if (solicitudes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Mis solicitudes</h3>
        <p className="text-gray-400 text-center py-8">Aún no tienes solicitudes de recogida.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Mis solicitudes ({solicitudes.length})</h3>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {solicitudes.map((sol) => (
          <div key={sol.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${estadoBadge(sol.estado)}`}>
                {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
              </span>
              {sol.urgencia === 'alta' && <span className="text-xs font-bold text-red-600">URGENTE</span>}
            </div>

            <p className="text-sm text-gray-700 font-semibold">{sol.tipo_residuo}</p>
            {sol.descripcion && <p className="text-xs text-gray-500 mt-1">{sol.descripcion}</p>}

            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>📍</span>
              <span className="truncate">{sol.direccion}</span>
            </div>
            {sol.fecha_programada && (
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
          </div>
        ))}
      </div>
    </div>
  );
}
