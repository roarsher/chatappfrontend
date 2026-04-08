 import axios from 'axios';

// ─── In-memory token store ────────────────────────────────────────────────────
// Avoids localStorage (XSS risk). Token lives only for the current page session.
// On refresh, checkAuth() re-authenticates via the HTTP-only cookie.
// If the cookie is blocked cross-domain, the user must log in again after refresh
// — acceptable trade-off for security.
let memoryToken = null;

export const setMemoryToken = (token) => { memoryToken = token; };
export const getMemoryToken = () => memoryToken;
export const clearMemoryToken = () => { memoryToken = null; };

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach Bearer token on every request as a fallback for cross-domain cookie issues
api.interceptors.request.use((config) => {
  if (memoryToken) {
    config.headers['Authorization'] = `Bearer ${memoryToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code;
    const status = error.response?.status;
    if (status === 401 && (code === 'TOKEN_EXPIRED' || !code)) {
      clearMemoryToken();
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;