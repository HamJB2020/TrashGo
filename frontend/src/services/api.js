import axios from 'axios';

// Metemos la URL que te acaba de responder en Google directamente aquí
const API_URL = "https://trashgo-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
