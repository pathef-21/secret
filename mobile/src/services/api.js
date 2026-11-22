import axios from 'axios';
import { Platform } from 'react-native';
import storage from './storage';

const DEFAULT_API_URL =
  Platform.OS === 'web'
    ? '/api'
    : 'https://man-ak-bae.onrender.com/api';

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

// Response interceptor to automatically refresh expired token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
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

