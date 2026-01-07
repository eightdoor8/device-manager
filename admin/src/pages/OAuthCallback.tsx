import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code || !state) {
          setError("Authorization code or state not found");
          return;
        }

        // The backend OAuth callback endpoint handles token exchange and sets the session cookie
        // We just need to redirect to it with the code and state parameters
        // The backend will then redirect back to the frontend
        const callbackUrl = `/api/oauth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        
        // Redirect to backend callback endpoint
        window.location.href = callbackUrl;
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Authentication Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Authenticating...</h1>
      <p>Please wait while we complete your login.</p>
    </div>
  );
}
