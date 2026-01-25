/**
 * Email/Password Authentication for Admin Dashboard
 * Uses HTTP API calls instead of tRPC client
 */

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  loginMethod: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  try {
    const response = await fetch('/api/trpc/auth.register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.json?.message || 'Registration failed');
    }

    const data = await response.json();
    return data.result.data.user;
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
}

/**
 * Login with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  try {
    const response = await fetch('/api/trpc/auth.login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.json?.message || 'Login failed');
    }

    const data = await response.json();
    return data.result.data.user;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/trpc/auth.me', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.result.data;
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error);
    return null;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/trpc/auth.logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
}
