import React from 'react';
import Register from './components/Register';
import Login from './components/Login';
import SolicitudRecogidaForm from './components/SolicitudRecogidaForm';

function App() {
  return (
    <div className="App">
      <Register />
      <Login />
      <SolicitudRecogidaForm />
    </div>
  );
}

export default App;