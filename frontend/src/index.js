import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Asegúrate de que tu componente principal se llame App.js en esta misma carpeta

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);