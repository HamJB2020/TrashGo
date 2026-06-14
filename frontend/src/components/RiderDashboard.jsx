import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import ToastContainer, { showToast } from './Toast';
import ConfirmModal from './ConfirmModal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TABS = ['disponibles', 'aceptadas'];

export default function RiderDashboard() {
  const [tab, setTab] = useState('disponibles');
  const [disponibles, setDisponibles] = useState([]);
  const [aceptadas, setAceptadas] = useState([]);
  const [gananciaTotal, setGananciaTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [miPais, setMiPais] = useState('');
  const [verOtros, setVerOtros] = useState(false);
  const [otrasCount, setOtrasCount] = useState(0);
  const [tipoFiltro, setTipoFiltro] = useState('');

  useEffect(() => {
    api.get('/auth/perfil').then(r => {
      if (r.data.data?.pais) setMiPais(r.data.data.pais);
    }).catch(() => {});
  }, []);

  const fetchDisponibles = async () => {
    try {
      const params = verOtros ? {} : { pais: miPais };
      if (tipoFiltro) params.tipoResiduo = tipoFiltro;
      const res = await api.get('/recogidas/disponibles', { params });
      setDisponibles(res.data.data || []);
      setOtrasCount(res.data.otrasCount || 0);
    } catch { setDisponibles([]); }
  };

  const fetchAceptadas = async () => {
    try {
      const res = await api.get('/recogidas/mis-aceptadas');
      setAceptadas(res.data.data || []);
      setGananciaTotal(res.data.gananciaTotal || 0);
    } catch { setAceptadas([]); }
  };

  useEffect(() => {
    if (!miPais && !verOtros) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDisponibles(), fetchAceptadas()]);
      setLoading(false);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [miPais, verOtros, tipoFiltro]);

  useEffect(() => {
    if (tab === 'aceptadas') fetchAceptadas();
    else if (miPais) fetchDisponibles();
  }, [tab]);

  const handleAceptar = async (id) => {
    try {
      await api.put(`/recogidas/${id}/aceptar`);
      showToast(setToasts, 'Solicitud aceptada', 'success');
      fetchDisponibles();
      fetchAceptadas();
    } catch {
      showToast(setToasts, 'No se pudo aceptar (ya no disponible)', 'error');
      fetchDisponibles();
    }
  };

  const handleCompletar = async (id) => {
    try {
      await api.put(`/recogidas/${id}/completar`);
      showToast(setToasts, 'Recogida marcada como completada', 'success');
      fetchAceptadas();
    } catch {
      showToast(setToasts, 'Error al completar', 'error');
    }
  };

  const badge = (estado) => {
    const map = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aceptada: 'bg-blue-100 text-blue-800 border-blue-300',
      completada: 'bg-green-100 text-green-800 border-green-300',
    };
    return map[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !miPais) return (
    <div className="min-h-screen bg-fondo flex items-center justify-center">
      <p className="text-gray-400">Cargando panel rider...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-fondo py-8 px-4">
      <ToastContainer toasts={toasts} />
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-sm text-gray-400 hover:text-bosque-600 transition inline-block mb-4">&larr; Volver</Link>
        <h1 className="text-3xl font-bold text-bosque-800 mb-2">Panel Rider</h1>

        {miPais && (
          <p className="text-sm text-gray-500 mb-1">País: <span className="font-semibold text-bosque-700">{miPais}</span></p>
        )}

        <div className="flex items-center gap-4 mb-1">
          <p className="text-sm text-gray-500">Ganancia total (80%): <span className="font-bold text-bosque-700 text-lg">{gananciaTotal.toFixed(2)} €</span></p>
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition capitalize ${tab === t ? 'bg-bosque-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-bosque-500'}`}
            >
              {t === 'disponibles' ? `Disponibles (${disponibles.length})` : `Aceptadas (${aceptadas.length})`}
            </button>
          ))}
        </div>

        {tab === 'disponibles' && miPais && (
          <div className="mb-4">
            <button onClick={() => setVerOtros(!verOtros)}
              className="text-sm text-bosque-600 hover:text-bosque-700 font-semibold bg-white border border-bosque-300 px-4 py-2 rounded-lg transition"
            >
              {verOtros ? 'Mostrar solo mi país' : `Ver solicitudes de otros países (${otrasCount})`}
            </button>
          </div>
        )}

        {tab === 'disponibles' && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button onClick={() => setTipoFiltro('')}
              className={`text-xs px-3 py-1.5 rounded-full border transition font-semibold ${tipoFiltro === '' ? 'bg-bosque-600 text-white border-bosque-600' : 'bg-white text-gray-600 border-gray-300 hover:border-bosque-500'}`}
            >
              Todos
            </button>
            {['orgánico','inorgánico','vidrio','plástico','papel/cartón','metal','electrónico','madera','textil','pilas/baterías','aceite','escombros','poda/jardín','voluminoso','especial','mixto'].map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition font-semibold ${tipoFiltro === t ? 'bg-bosque-600 text-white border-bosque-600' : 'bg-white text-gray-600 border-gray-300 hover:border-bosque-500'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {tab === 'disponibles' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {disponibles.length === 0 && (
              <div className="col-span-full bg-white rounded-xl p-8 text-center text-gray-400">No hay solicitudes disponibles ahora</div>
            )}
            {disponibles.map(sol => (
              <div key={sol.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge(sol.estado)}`}>{sol.estado}</span>
                  {sol.urgencia === 'alta' && <span className="text-xs font-bold text-red-600">URGENTE</span>}
                </div>
                <p className="text-sm font-semibold text-gray-700">{Array.isArray(sol.tipo_residuo) ? sol.tipo_residuo.join(', ') : sol.tipo_residuo}</p>
                {sol.peso && <p className="text-xs text-gray-400">{sol.peso} kg</p>}
                <p className="text-xs text-gray-500 mt-1">📍 {sol.direccion}</p>
                {sol.pais && <p className="text-xs text-gray-400">🌍 {sol.pais}</p>}
                {sol.usuario_nombre && <p className="text-xs text-gray-400 mt-1">Cliente: {sol.usuario_nombre}</p>}
                {sol.usuario_telefono && <p className="text-xs text-gray-400">📞 {sol.usuario_telefono}</p>}
                {sol.coste != null && <p className="text-xs font-semibold text-bosque-700 mt-1">{sol.coste.toFixed(2)} € {sol.pagado ? '✓ Pagado' : '(pendiente)'}</p>}
                <button onClick={() => setConfirmAction({ type: 'aceptar', id: sol.id })}
                  className="mt-3 w-full bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 transition">
                  Aceptar solicitud
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'aceptadas' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aceptadas.length === 0 && (
              <div className="col-span-full bg-white rounded-xl p-8 text-center text-gray-400">No has aceptado ninguna solicitud aún</div>
            )}
            {aceptadas.map(sol => (
              <div key={sol.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge(sol.estado)}`}>
                    {sol.estado === 'completada' && '✓'} {sol.estado}
                  </span>
                  {sol.urgencia === 'alta' && <span className="text-xs font-bold text-red-600">URGENTE</span>}
                </div>
                <p className="text-sm font-semibold text-gray-700">{Array.isArray(sol.tipo_residuo) ? sol.tipo_residuo.join(', ') : sol.tipo_residuo}</p>
                {sol.peso && <p className="text-xs text-gray-400">{sol.peso} kg</p>}
                <p className="text-xs text-gray-500 mt-1">📍 {sol.direccion}</p>
                {sol.usuario_nombre && <p className="text-xs text-gray-400 mt-1">Cliente: {sol.usuario_nombre}</p>}
                {sol.usuario_telefono && <p className="text-xs text-gray-400">📞 {sol.usuario_telefono}</p>}
                {sol.latitud && sol.longitud && (
                  <div className="h-28 w-full rounded-lg overflow-hidden border border-gray-200 mt-2">
                    <MapContainer center={[sol.latitud, sol.longitud]} zoom={14} className="h-full w-full" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[sol.latitud, sol.longitud]} />
                    </MapContainer>
                  </div>
                )}
                {sol.estado === 'aceptada' && (
                  <button onClick={() => setConfirmAction({ type: 'completar', id: sol.id })}
                    className="mt-3 w-full bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 transition">
                    Marcar como completada
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmAction && (
        <ConfirmModal
          mensaje={confirmAction.type === 'aceptar' ? '¿Aceptas esta solicitud de recogida?' : '¿Marcar esta recogida como completada?'}
          confirmText={confirmAction.type === 'aceptar' ? 'Sí, aceptar' : 'Sí, completada'}
          confirmBg="bg-green-600 hover:bg-green-700"
          onConfirm={() => {
            if (confirmAction.type === 'aceptar') handleAceptar(confirmAction.id);
            else handleCompletar(confirmAction.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
