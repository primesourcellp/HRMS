// Authentication utility functions

/**
 * Check if user is authenticated
 * Since tokens are in HttpOnly cookies, we can't check them directly
 * We rely on the isAuthenticated flag and backend validation
 * @returns {boolean} true if user appears to be authenticated
 */
export const isAuthenticated = () => {
  // Tokens are in HttpOnly cookies (not accessible to JavaScript)
  // Check the authentication flag set during login
  const authFlag = localStorage.getItem('isAuthenticated')
  return authFlag === 'true'
  
  // Note: Actual token validation happens on the backend
  // If token is invalid/expired, backend will return 401 and user will be redirected
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

