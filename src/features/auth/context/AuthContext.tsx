"use client";

import * as React from "react";
import { User, UserRole, AuthState } from "@/types/auth";
import { authApi, parseJwt } from "../services/authApi";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "iw3_auth_token";
const USER_KEY = "iw3_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  React.useEffect(() => {
    // Restore session from localStorage on mount
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const claims = parseJwt(storedToken);
        // Check expiration
        if (claims?.exp && claims.exp * 1000 < Date.now()) {
          logout();
        } else {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch {
        logout();
      }
    } else {
      // Create initial demo user if empty so developer can test instantly
      const defaultUser: User = {
        username: "admin_terminal",
        email: "admin@gas-terminal.com",
        roles: ["ROLE_ADMIN", "ROLE_SUPERVISOR", "ROLE_OPERADOR"],
      };
      const demoToken = "demo-jwt-token-terminal-admin";
      localStorage.setItem(TOKEN_KEY, demoToken);
      localStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
      setState({
        user: defaultUser,
        token: demoToken,
        isAuthenticated: true,
        isLoading: false,
      });
    }

    const handleUnauthorized = () => logout();
    window.addEventListener("iw3:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("iw3:unauthorized", handleUnauthorized);
  }, [logout]);

  const login = async (username: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { token, user } = await authApi.login(username, password);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return state.user.roles.some((r) => required.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
