/* ==========================================================================
   API Client — thin wrapper around fetch() for the Attendance Management API.
   Handles base URL, auth header injection, JSON parsing, and error surfacing.
   ========================================================================== */

const API = (() => {
  // Change this if the backend is hosted elsewhere (e.g. Render URL in production)
  const BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:5000/api';

  const getToken = () => localStorage.getItem('ams_token');

  const request = async (path, { method = 'GET', body, headers = {}, isBlob = false } = {}) => {
    const token = getToken();
    const finalHeaders = { ...headers };
    if (!isBlob) finalHeaders['Content-Type'] = 'application/json';
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (isBlob) {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errData.message || 'Request failed');
      }
      return res.blob();
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        // Token invalid/expired — force re-login
        localStorage.removeItem('ams_token');
        localStorage.removeItem('ams_user');
        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = 'login.html';
        }
      }
      throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
  };

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    del: (path) => request(path, { method: 'DELETE' }),
    downloadBlob: (path) => request(path, { isBlob: true }),
    BASE_URL,
  };
})();
