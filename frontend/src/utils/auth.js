// Authentication utility functions
import api from '../services/api'

/**
 * Check if user is authenticated
 * Since tokens are in HttpOnly cookies, we verify with backend
 * @returns {boolean} true if user appears to be authenticated (synchronous check)
 */
export const isAuthenticated = () => {
  // Quick synchronous check - verify flag exists
  // For actual validation, use verifyToken() which calls backend
  const authFlag = localStorage.getItem('isAuthenticated')
  return authFlag === 'true'
}

/**
 * Verify token with backend (async)
 * This actually validates the token on the server
 * @returns {Promise<boolean>} true if token is valid
 */
export const verifyToken = async () => {
  try {
    const result = await api.verifyToken()
    if (result.authenticated) {
      // Update localStorage flag to match backend state
      localStorage.setItem('isAuthenticated', 'true')
      return true
    } else {
      // Token invalid - clear auth data
      clearAuth()
      return false
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    clearAuth()
    return false
  }
}

/**
 * Clear all authentication data
 * Note: HttpOnly cookies are cleared by backend logout endpoint
 */
export const clearAuth = () => {
  // Clear localStorage (cookies are cleared by backend)
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  localStorage.removeItem('userType')
  localStorage.removeItem('employeeDepartment')
  localStorage.removeItem('employeePosition')
}

/**
 * Get current user info from localStorage
 */
export const getCurrentUser = () => {
  return {
    email: localStorage.getItem('userEmail'),
    name: localStorage.getItem('userName'),
    role: localStorage.getItem('userRole'),
    id: localStorage.getItem('userId'),
    userType: localStorage.getItem('userType'),
    department: localStorage.getItem('employeeDepartment'),
    position: localStorage.getItem('employeePosition')
  }
}

