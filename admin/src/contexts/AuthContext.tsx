import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { auth } from "../lib/firebase-auth";

interface User {
  id: string;
  email: string;
  name: string;
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

  useEffect(() => {
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('[AuthContext] Firebase auth not initialized, using mock auth');
      setLoading(false);
      return;
    }

    // Firebase Authentication の状態を監視
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // ユーザーがログイン中
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || firebaseUser.email || "",
          };
          setUser(user);
          console.log("[AuthContext] User authenticated:", user.email);
        } else {
          // ユーザーがログアウト中
          setUser(null);
          console.log("[AuthContext] User not authenticated");
        }
        setLoading(false);
      });

      // クリーンアップ
      return () => unsubscribe();
    } catch (error) {
      console.error('[AuthContext] Error setting up auth listener:', error);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      console.log("[AuthContext] Logged out successfully");
    } catch (error) {
      console.error("[AuthContext] Logout failed:", error);
    }
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
