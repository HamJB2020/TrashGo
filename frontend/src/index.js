import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Arrancamos con createRoot puro y duro, sin hidratación ni StrictMode estricto
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);