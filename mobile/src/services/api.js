import axios from 'axios';
import { Platform } from 'react-native';
import storage from './storage';

const DEFAULT_API_URL = 'https://man-ak-bae.onrender.com/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 65000, // Allow Render free-tier cold start (~50s)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach JWT Access Token & handle FormData on Web
api.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await storage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (e) {
      console.warn('Could not read access_token from storage', e);
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      // Let browser / RN set multipart/form-data with proper boundary
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function appendImageToFormData(formData, fieldName, asset, fallbackName = 'image.jpg') {
  if (Platform.OS === 'web') {
    if (asset.file) {
      formData.append(fieldName, asset.file, asset.fileName || fallbackName);
    } else {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      formData.append(fieldName, blob, asset.fileName || fallbackName);
    }
  } else {
    formData.append(fieldName, {
      uri: asset.uri,
      name: asset.fileName || fallbackName,
      type: asset.mimeType || 'image/jpeg',
    });
  }
}

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/media/')) {
    return `https://man-ak-bae.onrender.com${url}`;
  }
  return url.replace(/^http:\/\/man-ak-bae\.onrender\.com/, 'https://man-ak-bae.onrender.com');
}

// Response interceptor: retry transient Render cold-start errors + auto-refresh JWT
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Auto-retry up to 2 times when Render free tier is waking up (429/502/503/504/network)
    if (
      originalRequest &&
      (status === 429 || status === 502 || status === 503 || status === 504 || !error.response) &&
      (originalRequest._coldRetry || 0) < 2
    ) {
      originalRequest._coldRetry = (originalRequest._coldRetry || 0) + 1;
      await new Promise((r) => setTimeout(r, 3500));
      return api(originalRequest);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          await storage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh token expired or revoked, purge tokens
        await storage.deleteItem('access_token');
        await storage.deleteItem('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

