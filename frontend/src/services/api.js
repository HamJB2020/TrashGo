import axios from 'axios';

// Forzamos la URL de producción de Render directamente
const API_URL = "https://trashgo-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
