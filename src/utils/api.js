//  import axios from 'axios';

// // ─── In-memory token store ────────────────────────────────────────────────────
// // Avoids localStorage (XSS risk). Token lives only for the current page session.
// // On refresh, checkAuth() re-authenticates via the HTTP-only cookie.
// // If the cookie is blocked cross-domain, the user must log in again after refresh
// // — acceptable trade-off for security.
// let memoryToken = null;

// export const setMemoryToken = (token) => { memoryToken = token; };
// export const getMemoryToken = () => memoryToken;
// export const clearMemoryToken = () => { memoryToken = null; };

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || '/api',
//   withCredentials: true,
//   headers: { 'Content-Type': 'application/json' },
//   timeout: 15000,
// });

// // Attach Bearer token on every request as a fallback for cross-domain cookie issues
// api.interceptors.request.use((config) => {
//   if (memoryToken) {
//     config.headers['Authorization'] = `Bearer ${memoryToken}`;
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const code = error.response?.data?.code;
//     const status = error.response?.status;
//     if (status === 401 && (code === 'TOKEN_EXPIRED' || !code)) {
//       clearMemoryToken();
//       if (
//         !window.location.pathname.startsWith('/login') &&
//         !window.location.pathname.startsWith('/register')
//       ) {
//         window.location.href = '/login?expired=true';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from 'axios';

// ─── Token storage ────────────────────────────────────────────────────────────
// sessionStorage: survives page refresh, cleared on tab close, never sent
// cross-origin automatically, not accessible from other origins — safe enough
// for a JWT that already has a short expiry.
// Falls back to memory-only if sessionStorage is unavailable (private browsing).
const TOKEN_KEY = 'nx_tok';

const storage = (() => {
  try {
    sessionStorage.setItem('__test__', '1');
    sessionStorage.removeItem('__test__');
    return sessionStorage;
  } catch {
    // sessionStorage blocked (some private modes) — use memory fallback
    const mem = {};
    return {
      getItem: (k) => mem[k] ?? null,
      setItem: (k, v) => { mem[k] = v; },
      removeItem: (k) => { delete mem[k]; },
    };
  }
})();

export const setToken    = (t) => storage.setItem(TOKEN_KEY, t);
export const getToken    = ()  => storage.getItem(TOKEN_KEY);
export const clearToken  = ()  => storage.removeItem(TOKEN_KEY);

// Legacy aliases used in AuthContext / SocketContext
export const setMemoryToken   = setToken;
export const getMemoryToken   = getToken;
export const clearMemoryToken = clearToken;

// ─── Axios instance ───────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL
  || 'https://chatappbackend-4bim.onrender.com/api'; // hard fallback for production

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,   // send cookie when available
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach Bearer token on every request (cross-domain cookie fallback)
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code   = err.response?.data?.code;
    if (status === 401 && code !== 'SKIP_REDIRECT') {
      clearToken();
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(err);
  }
);

export default api;