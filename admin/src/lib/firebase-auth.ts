/**
 * Firebase Authentication initialization
 * Uses Firebase SDK for email/password authentication
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('[Firebase] Initializing with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// Validate Firebase config
if (!firebaseConfig.apiKey) {
  console.warn('[Firebase] Missing VITE_FIREBASE_API_KEY environment variable');
}
if (!firebaseConfig.projectId) {
  console.warn('[Firebase] Missing VITE_FIREBASE_PROJECT_ID environment variable');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] App initialized successfully');
} catch (error) {
  console.error('[Firebase] Failed to initialize app:', error);
  // Don't throw - allow app to continue without Firebase
  // This allows development without Firebase credentials
}

// Initialize Firebase Authentication
export const auth = app ? getAuth(app) : (null as any);

// Initialize Firestore
export const db = app ? getFirestore(app) : (null as any);

console.log('[Firebase] Authentication initialized successfully');
console.log('[Firebase] Firestore initialized successfully');
