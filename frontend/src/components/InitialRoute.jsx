import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { isAuthenticated } from '../utils/auth'

const InitialRoute = () => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAndRedirect = async () => {
      // First check if user is already authenticated
      if (isAuthenticated()) {
        navigate('/dashboard', { replace: true })
        setChecking(false)
        return
      }

      // If not authenticated, check if super admin exists
      try {
        const response = await api.checkSuperAdminExists()
        if (response.exists) {
          navigate('/login', { replace: true })
        } else {
          navigate('/register', { replace: true })
        }
      } catch (err) {
        console.error('Error checking super admin:', err)
        navigate('/register', { replace: true })
      } finally {
        setChecking(false)
      }
    }
    checkAndRedirect()
  }, [navigate])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}

export default InitialRoute

