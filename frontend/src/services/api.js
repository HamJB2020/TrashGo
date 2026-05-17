import axios from 'axios';

const API_BASE_URL = 'https://trashgo-backend.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Token expirado o inválido.');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    if (error.response?.status >= 500) {
      console.error('Error del servidor');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (datos) => {
    return apiClient.post('/auth/register', datos);
  },
};

export const recogidaService = {
  crear: (datos) => {
    return apiClient.post('/recogidas', datos);
  },
  obtener: (id) => {
    return apiClient.get(`/recogidas/${id}`);
  },
  listarDisponibles: () => {
    return apiClient.get('/recogidas/disponibles');
  },
};
