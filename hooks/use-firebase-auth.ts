import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User } from "@/types/device";
import { getUser, createOrUpdateUser } from "@/services/user-service";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[useFirebaseAuth] Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[useFirebaseAuth] Auth state changed:", fbUser?.email || "null");
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          console.log("[useFirebaseAuth] Creating/updating user document for:", fbUser.uid);
          // Get or create user document in Firestore
          const userData = await createOrUpdateUser(
            fbUser.uid,
            fbUser.email || "",
            fbUser.displayName || undefined,
          );
          console.log("[useFirebaseAuth] User document created/updated successfully");
          setUser(userData);
        } catch (err) {
          console.error("[useFirebaseAuth] Error creating user document:", err);
          setError("Failed to load user data");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[useFirebaseAuth] Sign in attempt for:", email);
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[useFirebaseAuth] Sign in successful for:", result.user.uid);
      // User state will be updated by onAuthStateChanged
    } catch (err: any) {
      console.error("[useFirebaseAuth] Sign in error:", err.code, err.message);
      setError(err.message || "Failed to sign in");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("[useFirebaseAuth] Sign up attempt for:", email);
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[useFirebaseAuth] Sign up successful for:", result.user.uid);
      // User state will be updated by onAuthStateChanged
    } catch (err: any) {
      console.error("[useFirebaseAuth] Sign up error:", err.code, err.message);
      setError(err.message || "Failed to sign up");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("[useFirebaseAuth] Google sign in attempt");
      setError(null);
      setLoading(true);

      // Google Sign-In を実行
      const userInfo = await GoogleSignin.signIn();
      console.log("[useFirebaseAuth] Google sign in successful:", userInfo.data?.user?.email);

      // Google ID Token を取得
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error("Failed to get Google ID token");
      }

      // Firebase Credential を作成
      const credential = GoogleAuthProvider.credential(idToken);

      // Firebase で認証
      const result = await signInWithCredential(auth, credential);
      console.log("[useFirebaseAuth] Firebase authentication successful:", result.user.uid);
      // User state will be updated by onAuthStateChanged
    } catch (err: any) {
      console.error("[useFirebaseAuth] Google sign in error:", err.code, err.message);
      setError(err.message || "Failed to sign in with Google");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("[useFirebaseAuth] Sign out");
      setError(null);
      await firebaseSignOut(auth);
      // Google Sign-Out も実行
      try {
        await GoogleSignin.signOut();
      } catch (err) {
        console.warn("[useFirebaseAuth] Google sign out error (non-fatal):", err);
      }
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      console.error("[useFirebaseAuth] Sign out error:", err);
      setError(err.message || "Failed to sign out");
      throw err;
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
