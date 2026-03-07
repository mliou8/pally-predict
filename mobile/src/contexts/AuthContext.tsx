import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { API_BASE_URL } from '../constants/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);

      // Open Twitter OAuth in browser
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'pallypredict',
        path: 'auth',
      });

      console.log('Redirect URL:', redirectUrl);
      const authUrl = `${API_BASE_URL}/api/auth/twitter/mobile?redirect_uri=${encodeURIComponent(redirectUrl)}`;
      console.log('Auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      console.log('Auth result:', result);

      if (result.type === 'success' && result.url) {
        // Extract token from redirect URL
        const url = new URL(result.url);
        const token = url.searchParams.get('token');

        if (token) {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          await refreshUser();
        } else {
          Alert.alert('Login Error', 'No token received from server');
        }
      } else if (result.type === 'cancel') {
        // User cancelled, no alert needed
      } else if (result.type === 'dismiss') {
        // Browser dismissed
      } else {
        Alert.alert('Login Error', `Authentication failed: ${result.type}`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
