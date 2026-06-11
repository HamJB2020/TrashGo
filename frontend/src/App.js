import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
          <Route
            path="/rider"
            element={user ? <RiderWelcomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/rider/dashboard"
            element={user ? <RiderDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/perfil"
            element={user ? <Perfil user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}
          />
          <Route
            path="/solicitudes"
            element={user ? <SolicitudesPage /> : <Navigate to="/login" />}
          />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
