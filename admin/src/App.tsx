import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { useEffect, useState } from 'react'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Devices } from './pages/Devices'
import { Users } from './pages/Users'
import RentalHistory from './pages/RentalHistory'

import { Navbar } from './components/Navbar'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setIsInitialized(true)
  }, [])

  if (!isInitialized || loading) {
    return <div className="container"><p>ロード中...</p></div>
  }

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/devices" 
          element={
            isAuthenticated ? <Devices user={user} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/users" 
          element={
            isAuthenticated ? <Users user={user} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/rental-history" 
          element={
            isAuthenticated ? <RentalHistory /> : <Navigate to="/login" />
          } 
        />

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
