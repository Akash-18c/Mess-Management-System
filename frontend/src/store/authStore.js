import { create } from 'zustand';
import api from '../api';

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user')  || 'null'),
  token: localStorage.getItem('token') || null,
  logId: localStorage.getItem('logId') || null,

  login: (user, token, logId) => {
    localStorage.setItem('user',  JSON.stringify(user));
    localStorage.setItem('token', token);
    if (logId) localStorage.setItem('logId', logId);
    set({ user, token, logId: logId || null });
  },

  logout: async () => {
    const logId = localStorage.getItem('logId');
    try { if (logId) await api.post('/auth/logout', { logId }); } catch { }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('logId');
    set({ user: null, token: null, logId: null });
  },
}));

export default useAuthStore;
