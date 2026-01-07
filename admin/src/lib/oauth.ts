/**
 * OAuth configuration for admin web panel
 * Uses the same OAuth setup as the mobile app
 */

const env = {
  portalUrl: import.meta.env.VITE_OAUTH_PORTAL_URL || "",
  appId: import.meta.env.VITE_APP_ID || "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl(),
};

/**
 * Get the API base URL, deriving from current hostname if not set.
 * URL pattern: https://PORT-sandboxid.region.domain
 * Replace 5173 (admin dev port) with 3000 (API server port)
 */
function getDefaultApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    // Pattern: 5173-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^5173-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }
  return "";
}

export function getLoginUrl(): string {
  const redirectUri = `${env.apiBaseUrl}/api/oauth/callback`;
  const state = encodeState(redirectUri);

  const url = new URL(`${env.portalUrl}/app-auth`);
  url.searchParams.set("appId", env.appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
}

export function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

export function decodeIdToken(idToken: string): { sub: string; email: string; name: string } {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const decoded = JSON.parse(atob(parts[1]));
  return {
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name,
  };
}
