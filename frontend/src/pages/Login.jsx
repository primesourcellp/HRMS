import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, User, Shield, ArrowLeft, KeyRound } from 'lucide-react'
import api from '../services/api'
import { isAuthenticated } from '../utils/auth'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1) // 1: email, 2: OTP, 3: reset password
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
 
  useEffect(() => {
    // Check if a Super Admin exists; if not, redirect to register (run once on mount)
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
    checkSuperAdmin()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.login(email, password)
      if (response && response.success) {
        // Clear redirect flag on successful login
        try {
          sessionStorage.removeItem('isRedirecting')
        } catch {}
        // Tokens are stored in HttpOnly cookies by backend; store minimal user info locally
        localStorage.setItem('isAuthenticated', 'true')

        if (response.user) {
          localStorage.setItem('userEmail', response.user.email)
          localStorage.setItem('userName', response.user.name)
          localStorage.setItem('userRole', response.user.role)
          localStorage.setItem('userId', response.user.id.toString())
          // Set userType based on role
          const role = response.user.role
          if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER' || role === 'FINANCE') {
            localStorage.setItem('userType', 'admin')
          } else {
            localStorage.setItem('userType', 'employee')
          }
          navigate('/dashboard')
        } else if (response.employee) {
          localStorage.setItem('userEmail', response.employee.email)
          localStorage.setItem('userName', response.employee.name)
          localStorage.setItem('userRole', 'EMPLOYEE')
          localStorage.setItem('userId', response.employee.id.toString())
          localStorage.setItem('userType', 'employee')
          localStorage.setItem('employeeDepartment', response.employee.department)
          localStorage.setItem('employeePosition', response.employee.position)
          navigate('/dashboard')
        } else {
          setError('Invalid login response')
        }
      } else {
        setError(response?.message || 'Invalid email or password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setForgotPasswordLoading(true)

    try {
      const response = await api.forgotPassword(forgotEmail)
      if (response && response.success) {
        setSuccessMessage(response.message || 'OTP has been sent to your email')
        setForgotPasswordStep(2)
      } else {
        setError(response?.message || 'Failed to send OTP')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setForgotPasswordLoading(true)

    try {
      const response = await api.verifyOtp(forgotEmail, otp)
      if (response && response.success) {
        setSuccessMessage('OTP verified successfully')
        setForgotPasswordStep(3)
      } else {
        setError(response?.message || 'Invalid OTP')
      }
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError(err.message || 'Invalid or expired OTP')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setForgotPasswordLoading(true)

    try {
      const response = await api.resetPassword(forgotEmail, otp, newPassword)
      if (response && response.success) {
        setSuccessMessage('Password reset successfully! Please login with your new password.')
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotPasswordStep(1)
          setForgotEmail('')
          setOtp('')
          setNewPassword('')
          setConfirmPassword('')
          setError('')
          setSuccessMessage('')
        }, 2000)
      } else {
        setError(response?.message || 'Failed to reset password')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const resetForgotPasswordFlow = () => {
    setShowForgotPassword(false)
    setForgotPasswordStep(1)
    setForgotEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccessMessage('')
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

        {!showForgotPassword ? (
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

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              <button
                onClick={resetForgotPasswordFlow}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Back to login"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {successMessage}
              </div>
            )}

            {forgotPasswordStep === 1 && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send an OTP to your email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {forgotPasswordStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-semibold tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-digit OTP sent to {forgotEmail}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading || otp.length !== 6}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotPasswordStep(1)}
                  className="w-full text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Resend OTP
                </button>
              </form>
            )}

            {forgotPasswordStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

