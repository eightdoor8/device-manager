import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration
// ユーザーは自分のFirebaseプロジェクトの設定をここに入力する必要があります
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Check if Firebase is configured
const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value !== "");

if (!isFirebaseConfigured) {
  console.warn(
    "[Firebase] Configuration incomplete. Please set environment variables in .env file:",
    "EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID, etc.",
  );
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[Firebase] Initialized successfully");
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("[Firebase] Initialization error:", error);
  throw error;
}

export { app, auth, db, isFirebaseConfigured };
