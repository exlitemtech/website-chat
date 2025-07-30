"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "agent";
  websiteIds: string[];
  avatar?: string;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isInitializing: boolean; // New state for initial auth check
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profileData: {
    email?: string;
    name?: string;
    avatar?: string;
    password?: string;
    role?: string;
    status?: string;
    websiteIds?: string[];
  }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // For initial auth check
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = localStorage.getItem("auth_tokens");
        const storedUser = localStorage.getItem("auth_user");

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);

          // Check if tokens are still valid
          if (isTokenValid(parsedTokens.accessToken)) {
            setTokens(parsedTokens);
            setUser(parsedUser);
          } else {
            // Try to refresh token
            refreshAuth().catch(() => {
              clearAuth();
            });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuth();
      } finally {
        setIsInitializing(false); // Use isInitializing instead of isLoading
      }
    };

    initializeAuth();
  }, []);

  // Check token validity
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  // Clear auth data
  const clearAuth = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");
  };

  // Login function
  const login = async (email: string, password: string): Promise<{success: boolean; error?: string}> => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || "Login failed" };
      }

      const data = await response.json();

      // Store tokens and user data
      const authTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      setTokens(authTokens);
      setUser(data.user);

      localStorage.setItem("auth_tokens", JSON.stringify(authTokens));
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      clearAuth();
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await fetch(`${API_BASE_URL}${API_ENDPOINTS.logout}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  // Refresh auth tokens
  const refreshAuth = async (): Promise<boolean> => {
    try {
      if (!tokens?.refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.refresh}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      setTokens(newTokens);
      localStorage.setItem("auth_tokens", JSON.stringify(newTokens));

      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      clearAuth();
      return false;
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    }
  };

  // Add this function to your AuthContext
  const updateProfile = async (profileData: {
    email?: string;
    name?: string;
    avatar?: string;
    password?: string;
    role?: string;
    status?: string;
    websiteIds?: string[];
  }) => {
    try {
      if (!user || !tokens) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.users}/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Profile update failed");
      }

      const updatedUser = await response.json();

      // Update local state with the server response
      updateUser({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        websiteIds: updatedUser.websiteIds || user.websiteIds, // Use server response if available
        status: updatedUser.status,
        createdAt: updatedUser.created_at,
        lastLogin: updatedUser.last_login,
      });

      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isInitializing, // Add this to the context value
    isAuthenticated: !!user && !!tokens,
    login,
    logout,
    refreshAuth,
    updateProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
