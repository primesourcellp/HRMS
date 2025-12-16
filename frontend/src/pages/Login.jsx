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
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
      return
    }

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
<<<<<<< HEAD
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
=======
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary-100 rounded-full mb-3 md:mb-4">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">HRMS Portal</h1>
          <p className="text-sm md:text-base text-gray-600">Human Resource Management System</p>
        </div>

        {/* Login Type Tabs */}
        <div className="flex gap-2 mb-4 md:mb-6 bg-gray-100 p-1 rounded-lg">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          <button
            type="button"
            onClick={() => {
              setLoginType('admin')
              setError('')
              setEmail('')
              setPassword('')
            }}
<<<<<<< HEAD
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
=======
            className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-md transition-all text-sm md:text-base ${
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              loginType === 'admin'
                ? 'bg-white text-primary-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
<<<<<<< HEAD
            <Shield size={18} />
=======
            <Shield size={16} className="md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
=======
            className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-md transition-all text-sm md:text-base ${
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              loginType === 'employee'
                ? 'bg-white text-primary-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
<<<<<<< HEAD
            <User size={18} />
=======
            <User size={16} className="md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <span>Employee</span>
          </button>
        </div>

<<<<<<< HEAD
        <form onSubmit={handleSubmit} className="space-y-6">
=======
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
=======
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
<<<<<<< HEAD
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
=======
                className="w-full pl-10 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
=======
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
=======
                className="w-full pl-10 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
<<<<<<< HEAD
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
=======
            className="w-full bg-primary-600 text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {loginType === 'admin' && (
<<<<<<< HEAD
          <div className="mt-6 text-center text-sm text-gray-600">
=======
          <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-600">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <p>Don't have an account?</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
<<<<<<< HEAD
              className="text-primary-600 hover:text-primary-700 font-medium mt-1"
=======
              className="text-primary-600 hover:text-primary-700 font-medium mt-1 text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

