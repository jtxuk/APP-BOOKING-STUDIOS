import axios from 'axios';
import Constants from 'expo-constants';
import storage from '../utils/storage';

// En producción usa /api (ruta local a través de Apache)
// En desarrollo usa localhost:5000
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'reservas.millenia.es'
  ? 'http://reservas.millenia.es/api'
  : 'http://localhost:5000/api';

console.log('📡 API URL configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('userToken');
    console.log('🔑 Token recuperado:', token ? 'Sí (length: ' + token.length + ')' : 'No');
    console.log('📤 Request a:', config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Header Authorization agregado');
    } else {
      console.log('❌ No hay token para agregar');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Error en respuesta:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
};

export const studioAPI = {
  getStudios: () => 
    api.get('/studios'),
  getTimeSlots: (studioId, date) => 
    api.get(`/studios/${studioId}/slots/${date}`),
  getHolidays: () =>
    api.get('/studios/holidays'),
};

export const bookingAPI = {
  createBooking: (studioId, timeSlotId, bookingDate) =>
    api.post('/bookings/create', { studioId, timeSlotId, bookingDate }),
  getMyBookings: () =>
    api.get('/bookings/my-bookings'),
  cancelBooking: (bookingId) =>
    api.delete(`/bookings/${bookingId}`),
};

export const userAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  changePassword: (currentPassword, newPassword) => 
    api.put('/users/change-password', { currentPassword, newPassword }),
};

export const adminAPI = {
  getAllUsers: () =>
    api.get('/admin/users'),
  getUser: (userId) =>
    api.get(`/admin/users/${userId}`),
  createUser: (userData) =>
    api.post('/admin/users', userData),
  updateUser: (userId, userData) =>
    api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) =>
    api.delete(`/admin/users/${userId}`),
  
  // Gestión de reservas
  getAllBookings: () =>
    api.get('/admin/bookings'),
  createBooking: (userId, timeSlotId) =>
    api.post('/admin/bookings', { userId, timeSlotId }),
  cancelBooking: (bookingId) =>
    api.delete(`/admin/bookings/${bookingId}`),
  
  // Bloqueo de slots
  blockSlot: (timeSlotId) =>
    api.post('/admin/slots/block', { timeSlotId }),
  unblockSlot: (timeSlotId) =>
    api.delete(`/admin/slots/unblock/${timeSlotId}`),
};

export default api;
