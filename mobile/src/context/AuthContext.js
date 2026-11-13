import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import chatWS from '../services/websocket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredSession = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (accessToken) {
        // Fetch current user and couple
        const userRes = await api.get('/auth/me/');
        setUser(userRes.data);

        try {
          const coupleRes = await api.get('/couples/me/');
          setCouple(coupleRes.data);
          // Connect to real-time WebSocket
          chatWS.connect();
        } catch (coupleErr) {
          setCouple(null);
        }
      }
    } catch (e) {
      console.warn('Session restoration failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredSession();
    return () => {
      chatWS.disconnect();
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    const { access, refresh, user: userData } = res.data;

    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    setUser(userData);

    try {
      const coupleRes = await api.get('/couples/me/');
      setCouple(coupleRes.data);
      chatWS.connect();
    } catch {
      setCouple(null);
    }
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register/', userData);
    const { access, refresh, user: createdUser } = res.data;

    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    setUser(createdUser);
    setCouple(null);
    return createdUser;
  };

  const refreshCouple = async () => {
    try {
      const coupleRes = await api.get('/couples/me/');
      setCouple(coupleRes.data);
      chatWS.connect();
      return coupleRes.data;
    } catch {
      setCouple(null);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const userRes = await api.get('/auth/me/');
      setUser(userRes.data);
      return userRes.data;
    } catch (e) {
      console.warn('Error refreshing user:', e);
    }
  };

  const logout = async () => {
    try {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      console.warn('Logout API call error:', e);
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      chatWS.disconnect();
      setUser(null);
      setCouple(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        couple,
        isLoading,
        login,
        register,
        logout,
        refreshCouple,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

