import axios from 'axios';

// Ponemos la URL real directamente sin condicionales ni 'if' que rompan la carga
const API_URL = "https://trashgo-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exportamos la instancia limpia
export default api;
