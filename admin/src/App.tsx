import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { TRPCProvider } from "./lib/trpc-provider";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { OAuthCallback } from "./pages/OAuthCallback";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Devices } from "./pages/Devices";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <TRPCProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Devices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TRPCProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
