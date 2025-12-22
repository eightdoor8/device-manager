import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User } from "@/types/device";
import { getUser, createOrUpdateUser } from "@/services/user-service";

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

  const signOut = async () => {
    try {
      console.log("[useFirebaseAuth] Sign out");
      setError(null);
      await firebaseSignOut(auth);
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
    signOut,
    isAuthenticated: !!user,
  };
}
