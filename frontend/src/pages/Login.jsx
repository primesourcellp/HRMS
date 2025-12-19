import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, User, Shield } from 'lucide-react'
import api from '../services/api'
import { isAuthenticated } from '../utils/auth'

const Login = () => {
  const [loginType, setLoginType] = useState('admin') // 'admin' or 'employee'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Always show login form - don't auto-redirect
    // User must login every time they access the login page
    const checkSuperAdmin = async () => {
      try {
        const response = await api.checkSuperAdminExists()
        if (!response.exists) {
          // No Super Admin exists, redirect to registration
          navigate('/register')
        }
      } catch (err) {
        console.error('Error checking super admin:', err)
      } finally {
        setChecking(false)
      }
    }
    // Only check super admin for admin login
    if (loginType === 'admin') {
      checkSuperAdmin()
    } else {
      setChecking(false)
    }
  }, [navigate, loginType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let response
      if (loginType === 'admin') {
        response = await api.login(email, password)
        if (response && response.success) {
          // Clear redirect flag on successful login
          try {
            sessionStorage.removeItem('isRedirecting')
          } catch {}
          // Tokens are now stored in HttpOnly cookies by backend
          // Only store user info in localStorage
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('userEmail', response.user.email)
          localStorage.setItem('userName', response.user.name)
          localStorage.setItem('userRole', response.user.role)
          localStorage.setItem('userId', response.user.id.toString())
          localStorage.setItem('userType', 'admin')
          navigate('/dashboard')
        } else {
          setError(response?.message || 'Invalid email or password')
        }
      } else {
        // Employee login
        response = await api.employeeLogin(email, password)
        if (response && response.success) {
          // Clear redirect flag on successful login
          try {
            sessionStorage.removeItem('isRedirecting')
          } catch {}
          // Tokens are now stored in HttpOnly cookies by backend
          // Only store employee info in localStorage
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('userEmail', response.employee.email)
          localStorage.setItem('userName', response.employee.name)
          localStorage.setItem('userRole', 'EMPLOYEE')
          localStorage.setItem('userId', response.employee.id.toString())
          localStorage.setItem('userType', 'employee')
          localStorage.setItem('employeeDepartment', response.employee.department)
          localStorage.setItem('employeePosition', response.employee.position)
          navigate('/dashboard')
        } else {
          setError(response?.message || 'Invalid email or password')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">HRMS Portal</h1>
          <p className="text-gray-600">Human Resource Management System</p>
        </div>

        {/* Login Type Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setLoginType('admin')
              setError('')
              setEmail('')
              setPassword('')
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              loginType === 'admin'
                ? 'bg-white text-primary-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Shield size={18} />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('employee')
              setError('')
              setEmail('')
              setPassword('')
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              loginType === 'employee'
                ? 'bg-white text-primary-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User size={18} />
            <span>Employee</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {loginType === 'admin' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have an account?</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-primary-600 hover:text-primary-700 font-medium mt-1"
            >
              Register as Super Admin
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

