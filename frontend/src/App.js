import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Perfil from './components/Perfil';
import SolicitudesPage from './components/SolicitudesPage';
import ContactoPage from './components/ContactoPage';
import RiderDashboard from './components/RiderDashboard';
import RiderWelcomePage from './components/RiderWelcomePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(() => {
    const usuario = localStorage.getItem('usuario');
    try { return usuario ? JSON.parse(usuario) : null; }
    catch { return usuario || null; }
  });

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={() => setUser(null)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/rider" element={<ProtectedRoute><RiderWelcomePage /></ProtectedRoute>} />
        <Route path="/rider/dashboard" element={<ProtectedRoute><RiderDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil user={user} onLogout={() => setUser(null)} /></ProtectedRoute>} />
        <Route path="/solicitudes" element={<ProtectedRoute><SolicitudesPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
