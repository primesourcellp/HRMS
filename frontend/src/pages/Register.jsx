import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, User, Shield } from 'lucide-react'
import api from '../services/api'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await api.checkSuperAdminExists()
        if (response.exists) {
          // Super Admin already exists, redirect to login
          navigate('/login')
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

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      if (response.success) {
        // Auto login after registration
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userEmail', response.user.email)
        localStorage.setItem('userName', response.user.name)
        localStorage.setItem('userRole', response.user.role)
        localStorage.setItem('userId', response.user.id)
        navigate('/dashboard')
      } else {
        setError(response.message || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
<<<<<<< HEAD
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <p className="text-gray-600">Checking system status...</p>
=======
        <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 text-center">
          <p className="text-sm md:text-base text-gray-600">Checking system status...</p>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
<<<<<<< HEAD
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Super Admin Registration</h1>
          <p className="text-gray-600">Create the first Super Administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
=======
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full mb-3 md:mb-4">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Super Admin Registration</h1>
          <p className="text-sm md:text-base text-gray-600">Create the first Super Administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
<<<<<<< HEAD
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
=======
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
<<<<<<< HEAD
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
=======
                className="w-full pl-10 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
<<<<<<< HEAD
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
=======
                className="w-full pl-10 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                placeholder="Enter password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
<<<<<<< HEAD
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
=======
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
<<<<<<< HEAD
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
=======
                className="w-full pl-10 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
<<<<<<< HEAD
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
=======
            className="w-full bg-purple-600 text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          >
            {loading ? 'Creating Account...' : 'Register Super Admin'}
          </button>
        </form>

<<<<<<< HEAD
        <div className="mt-6 text-center text-sm text-gray-600">
=======
        <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-600">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          <p className="text-xs">This will create the first Super Administrator account.</p>
          <p className="text-xs mt-1">Only one Super Admin is allowed in the system.</p>
        </div>
      </div>
    </div>
  )
}

export default Register

