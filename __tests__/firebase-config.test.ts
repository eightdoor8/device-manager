import { describe, it, expect, beforeAll } from 'vitest';

// Load environment variables from .env file
beforeAll(() => {
  // Environment variables should be loaded by the test runner
  // This is just a safety check
  if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
    console.warn('[Firebase Test] Environment variables not loaded. Make sure .env file exists.');
  }
});

/**
 * Firebase設定の検証テスト
 * 環境変数が正しく設定されているか確認します
 */
describe('Firebase Configuration', () => {
  it('should have all required Firebase environment variables', () => {
    const requiredEnvVars = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'EXPO_PUBLIC_FIREBASE_APP_ID',
    ];

    requiredEnvVars.forEach((envVar) => {
      const value = process.env[envVar];
      expect(value).toBeDefined();
      expect(value).not.toBe('');
      expect(typeof value).toBe('string');
    });
  });

  it('should have valid Firebase API Key format', () => {
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^AIza/); // Firebase API keys start with "AIza"
  });

  it('should have valid Firebase Auth Domain format', () => {
    const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
    expect(authDomain).toBeDefined();
    expect(authDomain).toMatch(/\.firebaseapp\.com$/);
  });

  it('should have valid Firebase Project ID format', () => {
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
    expect(projectId).toBeDefined();
    expect(projectId).toMatch(/^[a-z0-9-]+$/);
  });

  it('should have valid Firebase Storage Bucket format', () => {
    const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
    expect(storageBucket).toBeDefined();
    expect(storageBucket).toMatch(/\.firebasestorage\.app$/);
  });

  it('should have valid Firebase Messaging Sender ID format', () => {
    const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    expect(messagingSenderId).toBeDefined();
    expect(messagingSenderId).toMatch(/^\d+$/); // Should be numeric
  });

  it('should have valid Firebase App ID format', () => {
    const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).toMatch(/^\d+:\d+:web:/); // Should match Firebase App ID format
  });

  it('should validate Firebase configuration object', () => {
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    };

    // All values should be non-empty strings
    Object.values(firebaseConfig).forEach((value) => {
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    });
  });
});
