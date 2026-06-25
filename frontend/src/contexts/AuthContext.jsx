import { createContext, useState, useCallback } from 'react';
import * as api from '../api';

// Guarda o token JWT e o usuario logado, persistindo no localStorage para
// sobreviver a um reload.
export const AuthContext = createContext();

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(readUser);
  const [error, setError] = useState('');

  const login = useCallback(async (username, password) => {
    setError('');
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) await api.logout(token);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
