import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { HRMSProvider } from './context/HRMSContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import LeaveManagement from './pages/LeaveManagement'
import Payroll from './pages/Payroll'
import Performance from './pages/Performance'
import Settings from './pages/Settings'
import Users from './pages/Users'
import Shifts from './pages/Shifts'
import HRTickets from './pages/HRTickets'
import Analytics from './pages/Analytics'
import InitialRoute from './components/InitialRoute'
import { isAuthenticated, verifyToken } from './utils/auth'

function App() {
  return (
    <HRMSProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<InitialRoute />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="performance" element={<Performance />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="tickets" element={<HRTickets />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </HRMSProvider>
  )
}

// Protected Route Component
function ProtectedRoute() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Quick check first
      if (!isAuthenticated()) {
        setIsValid(false)
        setIsVerifying(false)
        return
      }

      // Verify token with backend
      try {
        const valid = await verifyToken()
        setIsValid(valid)
      } catch (error) {
        console.error('Auth verification error:', error)
        setIsValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    checkAuth()
  }, [])

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isValid) {
    return <Navigate to="/login" replace />
  }

  return <Layout />
}

export default App

