import { describe, it, expect } from 'vitest';
import { db, auth } from '../firebase-auth';

describe('Firebase Initialization', () => {
  it('should initialize Firebase with valid credentials', () => {
    // Check if db is initialized
    expect(db).toBeDefined();
    expect(db).not.toBeNull();
  });

  it('should initialize Firebase Auth', () => {
    // Check if auth is initialized
    expect(auth).toBeDefined();
    expect(auth).not.toBeNull();
  });

  it('should have valid Firebase config from environment variables', () => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(projectId).toBeDefined();
    expect(projectId).not.toBe('');
  });
});
