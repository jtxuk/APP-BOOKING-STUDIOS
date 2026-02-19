import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Detectar automáticamente la IP del host de desarrollo
const getApiUrl = () => {
  // En desarrollo con Expo, obtener la IP del debugger host
  const debuggerHost = Constants.expoConfig?.hostUri;
  
  if (debuggerHost) {
    // Extraer solo la IP (sin el puerto del metro bundler)
    const host = debuggerHost.split(':')[0];
    return `http://${host}:5000/api`;
  }
  
  // Fallback a localhost (útil para emuladores)
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

console.log('📡 API URL configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
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

export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
};

export const studioAPI = {
  getStudios: () => 
    api.get('/studios'),
  getTimeSlots: (studioId, date) => 
    api.get(`/studios/${studioId}/slots/${date}`),
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
