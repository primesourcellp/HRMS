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
import CTCTemplates from './pages/CTCTemplates'
import InitialRoute from './components/InitialRoute'
import { isAuthenticated, verifyToken } from './utils/auth'
import { hasPermission, getUserRole } from './utils/roles'

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
            <Route path="ctc-templates" element={<CTCTemplates />} />
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
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Quick check first
        if (!isAuthenticated()) {
          setIsValid(false)
          setIsVerifying(false)
          return
        }

        // Verify token with backend
        const valid = await verifyToken()
        setIsValid(valid)
      } catch (error) {
        console.error('Auth verification error:', error)
        setError(error.message || 'Authentication verification failed')
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isValid) {
    return <Navigate to="/login" replace />
  }

  try {
    return <Layout />
  } catch (error) {
    console.error('Layout rendering error:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Rendering Error</h2>
          <p className="text-gray-600 mb-4">An error occurred while loading the page. Please try refreshing.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

// Role-Based Route Protection Component
function RoleProtectedRoute({ children, permission }) {
  try {
    const userRole = getUserRole()
    
    if (!hasPermission(userRole, permission)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
    
    return children
  } catch (error) {
    console.error('RoleProtectedRoute error:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">An error occurred while checking permissions.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

export default App

