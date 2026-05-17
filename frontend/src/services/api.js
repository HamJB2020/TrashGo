import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  console.error('API_URL no configurada.');
  if (process.env.NODE_ENV === 'development') {
    window.alert('Advertencia: API_URL no configurada.');
  }
}

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
