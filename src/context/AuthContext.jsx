import { createContext, useState, useCallback } from "react";
import authService, { getStoredToken } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize synchronously from localStorage to prevent unnecessary cascading renders
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      if (data?.user) {
        setUser(data.user);
      } else {
        // Fallback user state if backend only returns token
        const placeholderUser = {
          email: credentials.email,
          name: credentials.email.split("@")[0],
        };
        setUser(placeholderUser);
        authService.setStoredUser(placeholderUser);
      }
      setToken(getStoredToken());
      return data;
    } catch (err) {
      setError(err.message || "Failed to log in.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(formData);
      if (data?.user) {
        setUser(data.user);
      }
      setToken(getStoredToken());
      return data;
    } catch (err) {
      setError(err.message || "Failed to register.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    authService.setStoredUser(updatedUser);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user || token),
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
