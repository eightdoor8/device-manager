import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  openId: string;
  email: string;
  name: string;
  role: "admin" | "user";
  loginMethod?: string;
  lastSignedIn?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info from backend
  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Map backend user format to frontend User interface
          const backendUser = data.user;
          const user: User = {
            id: backendUser.id || backendUser.openId,
            openId: backendUser.openId,
            email: backendUser.email || "",
            name: backendUser.name || "",
            role: "user", // Default role, will be updated by backend later if needed
            loginMethod: backendUser.loginMethod,
            lastSignedIn: backendUser.lastSignedIn,
          };
          setUser(user);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }

    // If backend fetch fails, try localStorage as fallback
    const storedUser = localStorage.getItem("admin_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        return;
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("admin_user");
      }
    }

    setUser(null);
  };

  useEffect(() => {
    fetchUserInfo().finally(() => {
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    setUser(null);
    localStorage.removeItem("admin_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
