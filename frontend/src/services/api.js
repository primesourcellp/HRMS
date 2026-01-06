// frontend/src/services/api.js
const API_BASE_URL = 'http://localhost:8080/api'

// Flag to prevent redirect loops - use sessionStorage to persist across page loads
const getRedirectFlag = () => {
  try {
    return sessionStorage.getItem('isRedirecting') === 'true'
  } catch {
    return false
  }
}

const setRedirectFlag = (value) => {
  try {
    if (value) {
      sessionStorage.setItem('isRedirecting', 'true')
    } else {
      sessionStorage.removeItem('isRedirecting')
    }
  } catch {
    // Ignore if sessionStorage is not available
  }
}

/**
 * Helper to read response body safely for error messages.
 * Tries to parse JSON, falls back to text.
 */
const readResponseBody = async (response) => {
  try {
    const ct = response.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      return await response.json()
    } else {
      return await response.text()
    }
  } catch (err) {
    return null
  }
}

// Helper function to handle API requests with cookies (HttpOnly)
const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    ...(options.headers || {})
  }

  // Don't override Content-Type if it's FormData (browser sets it automatically)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    // Include credentials (cookies) in all requests
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Required for HttpOnly cookies
    })

    // If token is invalid or expired, try to refresh
    if (response.status === 401) {
      const currentPath = window.location.pathname

      // Don't redirect if already on login/register page
      if (currentPath === '/login' || currentPath === '/register') {
        return response
      }

      try {
        // Refresh token is also in HttpOnly cookie, so just call refresh endpoint
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include' // Cookies are automatically sent
        })

        if (refreshResponse.ok) {
          // New access token is set in cookie by backend
          // Retry original request
          return fetch(url, {
            ...options,
            headers,
            credentials: 'include'
          })
        }
      } catch (err) {
        console.error('Token refresh failed:', err)
      }

      // If refresh fails (401 or 400), handle redirect
      // Use sessionStorage to prevent redirect loops across page loads
      if (!getRedirectFlag()) {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        
        // Always redirect on 401 if we're on a protected route
        // This ensures users are sent to login when session expires
        const isProtectedRoute = currentPath !== '/login' && 
                                 currentPath !== '/register' && 
                                 currentPath !== '/' &&
                                 (isAuthenticated || 
                                  currentPath.startsWith('/dashboard') || 
                                  currentPath.startsWith('/employees') ||
                                  currentPath.startsWith('/attendance') || 
                                  currentPath.startsWith('/leave') ||
                                  currentPath.startsWith('/payroll') || 
                                  currentPath.startsWith('/performance') ||
                                  currentPath.startsWith('/shifts') ||
                                  currentPath.startsWith('/tickets') ||
                                  currentPath.startsWith('/users') ||
                                  currentPath.startsWith('/settings'))

        if (isProtectedRoute) {
          setRedirectFlag(true)
          // Clear auth data
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('userEmail')
          localStorage.removeItem('userRole')
          localStorage.removeItem('userId')
          localStorage.removeItem('userType')
          // Redirect immediately
          console.log('Session expired or invalid token. Redirecting to login...')
          window.location.href = '/login'
          // Return a response that won't cause errors
          return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Session expired. Please login again.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }

    return response
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    console.error('Network error in fetchWithAuth:', error)
    // Return a response-like object that won't break the calling code
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      json: async () => ({ error: 'Network error', message: 'Backend server may not be running or there is a network issue' }),
      text: async () => 'Network error: Backend server may not be running or there is a network issue'
    }
  }
}

const api = {
  // Authentication
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Register failed (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Register API error:', error)
      // Re-throw to let the calling code handle it
      throw error
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Required for cookies
      })

      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Login API error:', error)
      throw error
    }
  },

  employeeLogin: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Required for cookies
      })

      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Employee login API error:', error)
      throw error
    }
  },

  checkAuth: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check?email=${encodeURIComponent(email)}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        console.error('Check auth API error:', response.status, response.statusText)
        return { authenticated: false }
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking auth:', error)
      return { authenticated: false }
    }
  },

  checkSuperAdminExists: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-superadmin`, {
        credentials: 'include'
      })
      if (!response.ok) {
        console.error('Check super admin API error:', response.status, response.statusText)
        return { exists: false }
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking super admin:', error)
      // Return default value instead of throwing to prevent app crash
      return { exists: false }
    }
  },

  verifyToken: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        credentials: 'include' // Include cookies
      })
      if (!response.ok) {
        return { authenticated: false }
      }
      return await response.json()
    } catch (error) {
      console.error('Error verifying token:', error)
      return { authenticated: false }
    }
  },

  refreshToken: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include' // Cookies are automatically sent
      })
      if (!response.ok) {
        console.error('Refresh token API error:', response.status, response.statusText)
        return { success: false, message: 'Token refresh failed' }
      }
      return await response.json()
    } catch (error) {
      console.error('Error refreshing token:', error)
      return { success: false, message: 'Network error: Backend server may not be running' }
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include' // Cookies are automatically sent
      })
      if (!response.ok) {
        console.error('Logout API error:', response.status, response.statusText)
        return { success: false, message: 'Logout failed' }
      }
      return await response.json()
    } catch (error) {
      console.error('Error logging out:', error)
      // Even if logout fails, clear local storage
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      localStorage.removeItem('userType')
      return { success: false, message: 'Network error during logout' }
    }
  },

  // Forgot Password
  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error sending forgot password request:', error)
      throw error
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        credentials: 'include'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error verifying OTP:', error)
      throw error
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
        credentials: 'include'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  },

  // Users
  getUsers: async (role) => {
    try {
      const url = role ? `${API_BASE_URL}/users?role=${role}` : `${API_BASE_URL}/users`
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Users API error:', response.status, body)
        throw new Error(body?.message || body || `Failed to fetch users (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },
  createUser: (userData, currentUserRole) => fetchWithAuth(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, currentUserRole })
  }).then(async (res) => {
    if (!res.ok) {
      const body = await readResponseBody(res)
      throw new Error(body?.message || body || `Create user failed (${res.status})`)
    }
    return res.json()
  }),
  updateUser: (id, userData, currentUserRole) => fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, currentUserRole })
  }).then(async (res) => {
    if (!res.ok) {
      const body = await readResponseBody(res)
      throw new Error(body?.message || body || `Update user failed (${res.status})`)
    }
    return res.json()
  }),
  deleteUser: (id, currentUserRole) => fetchWithAuth(`${API_BASE_URL}/users/${id}?currentUserRole=${currentUserRole}`, {
    method: 'DELETE'
  }).then(async (res) => {
    if (!res.ok) {
      const body = await readResponseBody(res)
      throw new Error(body?.message || body || `Delete user failed (${res.status})`)
    }
    return true
  }),

  // ========================
  // Employees - CORRECTED
  // ========================
  getEmployees: async (search) => {
    try {
      const url = search ? `${API_BASE_URL}/employees?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/employees`
      const response = await fetchWithAuth(url)

      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Employees API error:', response.status, body)
        throw new Error(body?.message || body || `Failed to fetch employees (${response.status})`)
      }

      const data = await response.json()
      // Support both array and { data: [...] } shapes
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.data)) return data.data
      // if backend returns object with employees property
      if (data && Array.isArray(data.employees)) return data.employees

      // Unexpected shape - return empty array but warn
      console.warn('getEmployees: unexpected response shape, returning empty array', data)
      return []
    } catch (error) {
      console.error('Error fetching employees:', error)
      throw error
    }
  },

  getEmployee: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/employees/${id}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch employee (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching single employee:', error)
      throw error
    }
  },

  createEmployee: async (employee, userRole) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/employees?userRole=${encodeURIComponent(userRole || '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      })

      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Create employee error:', response.status, body)
        throw new Error(body?.message || JSON.stringify(body) || `Failed to create employee (${response.status})`)
      }

      return await response.json()
    } catch (error) {
      console.error('createEmployee error:', error)
      throw error
    }
  },

  updateEmployee: async (id, employee, userRole) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/employees/${id}?userRole=${encodeURIComponent(userRole || '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      })

      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Update employee error:', response.status, body)
        throw new Error(body?.message || JSON.stringify(body) || `Failed to update employee (${response.status})`)
      }

      return await response.json()
    } catch (error) {
      console.error('updateEmployee error:', error)
      throw error
    }
  },

  changeEmployeePassword: (id, currentPassword, newPassword) => fetchWithAuth(`${API_BASE_URL}/employees/${id}/change-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  }).then(async (res) => {
    if (!res.ok) {
      const body = await readResponseBody(res)
      throw new Error(body?.message || body || `Failed to change password (${res.status})`)
    }
    return res.json()
  }),

  deleteEmployee: async (id, userRole) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/employees/${id}?userRole=${encodeURIComponent(userRole || '')}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Delete employee error:', response.status, body)
        throw new Error(body?.message || body || `Failed to delete employee (${response.status})`)
      }
      // Some APIs return 204 No Content, some return JSON - handle both
      if (response.status === 204) return true
      const data = await response.json().catch(() => null)
      // If backend sends success flag
      if (data && (data.success === true || data.deleted === true)) return true
      return true
    } catch (error) {
      console.error('deleteEmployee error:', error)
      throw error
    }
  },

  // Clients
  getClients: async () => {
    // Try dedicated endpoint, then fallback to deriving from employees
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/clients`)
      if (response.ok) {
        const data = await response.json()
        let list = []
        if (Array.isArray(data)) {
          if (data.length === 0) list = []
          else if (typeof data[0] === 'string') list = data
          else list = data.map(c => c?.name || c?.client || c?.title || '').filter(Boolean)
        } else if (data && Array.isArray(data.data)) {
          list = data.data.map(c => (typeof c === 'string' ? c : (c?.name || c?.client || ''))).filter(Boolean)
        }
        list = Array.from(new Set(list.map(v => (typeof v === 'string' ? v.trim() : v)).filter(Boolean))).sort()
        return list
      }
    } catch (err) {
      // Ignore and use fallback
      console.warn('getClients: clients endpoint failed or unavailable, falling back to derive from employees', err)
    }
    // Fallback: derive from employees
    try {
      const employees = await api.getEmployees()
      const list = Array.from(new Set((Array.isArray(employees) ? employees : []).map(e => e?.client).filter(Boolean))).sort()
      return list
    } catch (e) {
      console.error('getClients fallback failed:', e)
      return []
    }
  },

  // ... rest of the file remains unchanged (attendance, leaves, payrolls, docs, etc.)
  // For brevity we keep the rest of the previously working methods but with the
  // same approach (check response.ok, read body for errors and throw where needed).
  // (You can keep the rest of your original implementations below.)

  // Attendance
  getAttendance: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/attendance`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Attendance API error:', response.status, body)
        throw new Error(body?.message || body || `Failed to fetch attendance (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching attendance:', error)
      throw error
    }
  },

  getAttendanceByDate: async (date) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/attendance/date/${date}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch attendance (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching attendance by date:', error)
      throw error
    }
  },

  getAttendanceByEmployee: async (employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/attendance/employee/${employeeId}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch attendance (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching attendance by employee:', error)
      throw error
    }
  },

  checkIn: async (data) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Check-in failed (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking in:', error)
      throw error
    }
  },

  checkOut: async (data) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Check-out failed (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking out:', error)
      throw error
    }
  },

  markAttendance: async (data) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to mark attendance (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  },
  // ... you can bring back the rest of helpers from your original file unchanged,
  // or apply the same response.ok + readResponseBody checks everywhere as above.




  // Leaves
  getLeaves: async (status) => {
    try {
      const url = status ? `${API_BASE_URL}/leaves?status=${status}` : `${API_BASE_URL}/leaves`
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        console.error('Leaves API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching leaves:', error)
      return []
    }
  },
  getPendingLeaves: () => fetchWithAuth(`${API_BASE_URL}/leaves/pending`).then(res => res.json()),
  getLeavesByEmployee: (employeeId) => fetchWithAuth(`${API_BASE_URL}/leaves/employee/${employeeId}`).then(res => res.json()),
  deleteLeave: (id) => fetchWithAuth(`${API_BASE_URL}/leaves/${id}`, { method: 'DELETE' }).then(res => res.json()),
  createLeave: async (leave) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leave)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to create leave (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating leave:', error)
      throw error
    }
  },
  approveLeave: (id, approvedBy) => fetchWithAuth(`${API_BASE_URL}/leaves/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy })
  }).then(res => res.json()),
  rejectLeave: (id, approvedBy, rejectionReason) => fetchWithAuth(`${API_BASE_URL}/leaves/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy, rejectionReason })
  }).then(res => res.json()),
  updateLeaveStatus: (id, status) => fetchWithAuth(`${API_BASE_URL}/leaves/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(res => res.json()),

  // Payrolls
  getPayrolls: () => fetchWithAuth(`${API_BASE_URL}/payrolls`).then(res => res.json()),
  createPayroll: async (payroll) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payroll)
      })
      return await response.json()
    } catch (error) {
      console.error('Error creating payroll:', error)
      return { success: false, message: error.message }
    }
  },

  // Performance
  getPerformance: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch performance (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching performance:', error)
      throw error
    }
  },
  getPerformanceById: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance/${id}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch performance (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching performance by id:', error)
      throw error
    }
  },
  getPerformanceByEmployee: async (employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance/employee/${employeeId}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch employee performance (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching employee performance:', error)
      throw error
    }
  },
  getTopPerformers: async (minRating = 4) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance/top/${minRating}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch top performers (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching top performers:', error)
      throw error
    }
  },
  createPerformance: async (performance) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(performance)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to create performance (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating performance:', error)
      throw error
    }
  },
  updatePerformance: async (id, performance) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(performance)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to update performance (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating performance:', error)
      throw error
    }
  },

  // KPI configuration endpoints
  getKpis: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/kpis`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch KPIs (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching KPIs:', error)
      throw error
    }
  },

  // Review cycle endpoints
  getReviewCycles: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/review-cycles`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch review cycles (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching review cycles:', error)
      throw error
    }
  },
  createReviewCycle: async (cycle) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/review-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycle)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to create review cycle (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating review cycle:', error)
      throw error
    }
  },
  updateReviewCycle: async (id, cycle) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/review-cycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycle)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to update review cycle (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating review cycle:', error)
      throw error
    }
  },
  deleteReviewCycle: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/review-cycles/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to delete review cycle (${response.status})`)
      }
      return true
    } catch (error) {
      console.error('Error deleting review cycle:', error)
      throw error
    }
  },

  createKpi: async (kpi) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/kpis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpi)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to create KPI (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating KPI:', error)
      throw error
    }
  },
  updateKpi: async (id, kpi) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/kpis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpi)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to update KPI (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating KPI:', error)
      throw error
    }
  },
  deleteKpi: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/kpis/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to delete KPI (${response.status})`)
      }
      return true
    } catch (error) {
      console.error('Error deleting KPI:', error)
      throw error
    }
  },

  deletePerformance: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/performance/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to delete performance (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error deleting performance:', error)
      throw error
    }
  },

  // Dashboard
  getDashboardStats: async (date, employeeId) => {
    try {
      let url = `${API_BASE_URL}/dashboard/stats`
      const params = new URLSearchParams()
      if (date) params.append('date', date)
      if (employeeId) params.append('employeeId', employeeId)
      if (params.toString()) url += `?${params.toString()}`
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        // Don't throw error - return empty object to prevent redirect loops
        console.error('Dashboard Stats API error:', response.status, response.statusText)
        return {}
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {} // Return empty object instead of throwing
    }
  },

  getExecutiveDashboard: async (months = 12, selectedMonth = null) => {
    try {
      let url = `${API_BASE_URL}/dashboard/executive?months=${months}`
      if (selectedMonth) {
        url += `&selectedMonth=${selectedMonth}`
      }
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        console.error('Executive Dashboard API error:', response.status, response.statusText)
        return {}
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching executive dashboard:', error)
      return {}
    }
  },

  // Documents
  uploadDocument: (formData) => fetchWithAuth(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData
  }).then(res => res.json()),
  getEmployeeDocuments: (employeeId) => fetchWithAuth(`${API_BASE_URL}/documents/employee/${employeeId}`).then(res => res.json()),
  downloadDocument: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/documents/${id}/download`)
      
      // Check if response is a network error (fake response from fetchWithAuth catch block)
      if (response.status === 0 || !response.ok) {
        // Try to get error message
        let errorMessage = 'Unknown error'
        try {
          if (response.text) {
            const text = await response.text()
            errorMessage = text || `Failed to download document: ${response.status} ${response.statusText}`
          } else {
            errorMessage = `Failed to download document: ${response.status} ${response.statusText}`
          }
        } catch (e) {
          errorMessage = 'Network error: Backend server may not be running or there is a network issue'
        }
        throw new Error(errorMessage)
      }
      
      // Check if response has blob method
      if (typeof response.blob !== 'function') {
        throw new Error('Response does not support blob conversion')
      }
      
      return await response.blob()
    } catch (error) {
      console.error('Download document API error:', error)
      throw error
    }
  },
  viewDocument: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/documents/${id}/view`)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to view document: ${response.status} ${response.statusText}`)
      }
      return await response.blob()
    } catch (error) {
      console.error('View document API error:', error)
      throw error
    }
  },
  verifyDocument: (id, verified) => fetchWithAuth(`${API_BASE_URL}/documents/${id}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified })
  }).then(res => res.json()),
  deleteDocument: (id) => fetchWithAuth(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Shifts
  getShifts: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts`)
      if (!response.ok) {
        console.error('Shifts API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching shifts:', error)
      return []
    }
  },
  getActiveShifts: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts/active`)
      if (!response.ok) {
        console.error('Active shifts API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching active shifts:', error)
      return []
    }
  },
  createShift: (shift) => fetchWithAuth(`${API_BASE_URL}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shift)
  }).then(res => res.json()),
  updateShift: (id, shift) => fetchWithAuth(`${API_BASE_URL}/shifts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shift)
  }).then(res => res.json()),
  deleteShift: (id) => fetchWithAuth(`${API_BASE_URL}/shifts/${id}`, { method: 'DELETE' }).then(res => res.json()),
  getEmployeesByShift: async (shiftId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts/${shiftId}/employees`)
      if (!response.ok) {
        console.error('Get employees by shift API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching employees by shift:', error)
      return []
    }
  },
  assignEmployeeToShift: async (shiftId, assignmentData) => {
    try {
      // Handle both old format (just employeeId) and new format (object with dates)
      const requestBody = typeof assignmentData === 'object' && assignmentData !== null
        ? assignmentData
        : { employeeId: assignmentData }
      
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts/${shiftId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      return await response.json()
    } catch (error) {
      console.error('Error assigning employee to shift:', error)
      throw error
    }
  },
  updateEmployeeAssignment: async (shiftId, assignmentData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts/${shiftId}/assignment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })
      return await response.json()
    } catch (error) {
      console.error('Error updating employee assignment:', error)
      throw error
    }
  },
  unassignEmployeeFromShift: async (shiftId, employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts/${shiftId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      })
      return await response.json()
    } catch (error) {
      console.error('Error unassigning employee from shift:', error)
      throw error
    }
  },
  getShiftByEmployeeId: async (employeeId) => {
    try {
      console.log('Fetching shift for employee:', employeeId)
      const response = await fetchWithAuth(`${API_BASE_URL}/shifts/employee/${employeeId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No shift assigned to employee:', employeeId)
          return null // Employee has no shift assigned
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        console.error('Get shift by employee API error:', response.status, errorData)
        return null
      }
      
      const shift = await response.json()
      console.log('Shift data received:', shift)
      
      // Handle case where response might be wrapped in success object
      if (shift && shift.shift) {
        return shift.shift
      }
      
      return shift
    } catch (error) {
      console.error('Error fetching shift by employee:', error)
      return null
    }
  },

  // Leave Types
  getLeaveTypes: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/leave-types`)
      if (!response.ok) {
        console.error('Leave types API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching leave types:', error)
      return []
    }
  },
  getActiveLeaveTypes: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/leave-types/active`)
      if (!response.ok) {
        console.error('Active leave types API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching active leave types:', error)
      return []
    }
  },
  createLeaveType: (leaveType) => fetchWithAuth(`${API_BASE_URL}/leave-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveType)
  }).then(res => res.json()),
  updateLeaveType: (id, leaveType) => fetchWithAuth(`${API_BASE_URL}/leave-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveType)
  }).then(res => res.json()),
  // Toggle active/inactive for a leave type
  toggleLeaveTypeActive: (id, active) => fetchWithAuth(`${API_BASE_URL}/leave-types/${id}/active`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active })
  }).then(res => res.json()),
  deleteLeaveType: (id) => fetchWithAuth(`${API_BASE_URL}/leave-types/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Holidays
  getHolidays: () => fetchWithAuth(`${API_BASE_URL}/holidays`).then(res => res.json()),
  getHolidaysByYear: (year) => fetchWithAuth(`${API_BASE_URL}/holidays/year/${year}`).then(res => res.json()),
  createHoliday: (holiday) => fetchWithAuth(`${API_BASE_URL}/holidays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holiday)
  }).then(res => res.json()),

  // Leave Balances
  getLeaveBalances: async (employeeId, year) => {
    try {
      if (!employeeId || isNaN(employeeId)) {
        console.warn('Invalid employeeId provided to getLeaveBalances:', employeeId)
        return []
      }
      const url = year ? `${API_BASE_URL}/leave-balances/employee/${employeeId}?year=${year}` : `${API_BASE_URL}/leave-balances/employee/${employeeId}`
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        const body = await readResponseBody(response)
        console.error('Leave balances API error:', response.status, body)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching leave balances:', error)
      return []
    }
  },
  initializeLeaveBalances: async (employeeId, year) => {
    try {
      if (!employeeId || isNaN(employeeId)) {
        throw new Error('Invalid employee ID')
      }
      const url = year 
        ? `${API_BASE_URL}/leave-balances/initialize/${employeeId}?year=${year}`
        : `${API_BASE_URL}/leave-balances/initialize/${employeeId}`
      const response = await fetchWithAuth(url, { method: 'POST' })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to initialize leave balances (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error initializing leave balances:', error)
      throw error
    }
  },
  assignLeaveBalance: async (employeeId, leaveTypeId, totalDays, year) => {
    try {
      if (!employeeId || isNaN(employeeId) || !leaveTypeId || isNaN(leaveTypeId)) {
        throw new Error('Invalid employee ID or leave type ID')
      }
      const url = year 
        ? `${API_BASE_URL}/leave-balances/assign?employeeId=${employeeId}&leaveTypeId=${leaveTypeId}&totalDays=${totalDays}&year=${year}`
        : `${API_BASE_URL}/leave-balances/assign?employeeId=${employeeId}&leaveTypeId=${leaveTypeId}&totalDays=${totalDays}`
      const response = await fetchWithAuth(url, { method: 'POST' })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to assign leave balance (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error assigning leave balance:', error)
      throw error
    }
  },

  // Salary Structures
  getCurrentSalaryStructure: async (employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/salary-structures/employee/${employeeId}`)
      if (!response.ok) {
        // 404 means no salary structure exists for this employee - this is OK
        if (response.status === 404) {
          return null
        }
        console.error('Salary structure API error:', response.status, response.statusText)
        return null
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching salary structure:', error)
      return null
    }
  },
  getSalaryStructures: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/salary-structures`)
      if (!response.ok) {
        console.error('Salary Structure API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching salary structures:', error)
      return []
    }
  },
  getSalaryStructureById: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/salary-structures/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch salary structure: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching salary structure by ID:', error)
      throw error
    }
  },
  createSalaryStructure: async (salaryStructure) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/salary-structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salaryStructure)
      })
      return await response.json()
    } catch (error) {
      console.error('Error creating salary structure:', error)
      return { success: false, message: error.message }
    }
  },
  updateSalaryStructure: async (id, salaryStructure) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/salary-structures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salaryStructure)
      })
      return await response.json()
    } catch (error) {
      console.error('Error updating salary structure:', error)
      return { success: false, message: error.message }
    }
  },
  deleteSalaryStructure: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/salary-structures/${id}`, {
        method: 'DELETE'
      })
      return await response.json()
    } catch (error) {
      console.error('Error deleting salary structure:', error)
      return { success: false, message: error.message }
    }
  },

  // HR Tickets
  getTickets: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch tickets (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching tickets:', error)
      throw error
    }
  },
  getTicketById: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${id}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch ticket (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching ticket:', error)
      throw error
    }
  },
  getEmployeeTickets: async (employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/employee/${employeeId}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch employee tickets (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching employee tickets:', error)
      throw error
    }
  },
  getTicketsByStatus: async (status) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/status/${status}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch tickets (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching tickets by status:', error)
      throw error
    }
  },
  getAssignedTickets: async (assignedTo) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/assigned/${assignedTo}`)
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to fetch assigned tickets (${response.status})`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching assigned tickets:', error)
      throw error
    }
  },
  createTicket: async (ticket) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to create ticket (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw error
    }
  },
  updateTicket: async (id, ticket) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to update ticket (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating ticket:', error)
      throw error
    }
  },
  deleteTicket: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const body = await readResponseBody(response)
        throw new Error(body?.message || body || `Failed to delete ticket (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      throw error
    }
  },

  // Recruitment
  getJobPostings: () => fetchWithAuth(`${API_BASE_URL}/recruitment/jobs`).then(res => res.json()),
  createJobPosting: (jobPosting) => fetchWithAuth(`${API_BASE_URL}/recruitment/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobPosting)
  }).then(res => res.json()),
  getApplicants: (jobPostingId) => fetchWithAuth(`${API_BASE_URL}/recruitment/applicants/job/${jobPostingId}`).then(res => res.json()),
  createApplicant: (applicant) => fetchWithAuth(`${API_BASE_URL}/recruitment/applicants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(applicant)
  }).then(res => res.json()),
  updateApplicantStatus: (id, status, feedback) => fetchWithAuth(`${API_BASE_URL}/recruitment/applicants/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, feedback })
  }).then(res => res.json()),

  // Payroll
  getPayrolls: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll`)
      if (!response.ok) {
        console.error('Payroll API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching payrolls:', error)
      return [] // Return empty array instead of throwing
    }
  },
  getPayrollById: async (payrollId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch payroll: ${response.status}`)
      }
      const data = await response.json()
      return data.payroll || data
    } catch (error) {
      console.error('Error fetching payroll by ID:', error)
      throw error
    }
  },
  getEmployeePayrolls: async (employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/employee/${employeeId}`)
      if (!response.ok) {
        console.error('Employee Payroll API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching employee payrolls:', error)
      return [] // Return empty array instead of throwing
    }
  },
  generatePayroll: (employeeId, month, year) => fetchWithAuth(`${API_BASE_URL}/payroll/generate?employeeId=${employeeId}&month=${month}&year=${year}`, {
    method: 'POST'
  }).then(res => res.json()),
  processPayrollForAll: async (startDate, endDate) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/process?startDate=${startDate}&endDate=${endDate}`, {
        method: 'POST'
      })
      return await response.json()
      
    } catch (error) {
      console.error('Error processing payroll:', error)
      return { success: false, message: error.message }
    }
  },
  approvePayroll: async (payrollId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}/approve`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error approving payroll:', error)
      return { success: false, message: error.message }
    }
  },
  finalizePayroll: async (payrollId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}/finalize`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error finalizing payroll:', error)
      return { success: false, message: error.message }
    }
  },
  finalizeAllPayrolls: async (month, year) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/finalize-all?month=${month}&year=${year}`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error finalizing all payrolls:', error)
      return { success: false, message: error.message }
    }
  },
  markPayrollAsPaid: async (payrollId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}/mark-paid`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error marking payroll as paid:', error)
      return { success: false, message: error.message }
    }
  },
  updatePayroll: async (payrollId, payrollData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payrollData)
      })
      return await response.json()
    } catch (error) {
      console.error('Error updating payroll:', error)
      return { success: false, message: error.message }
    }
  },
  submitPayrollForApproval: async (payrollId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}/submit`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error submitting payroll for approval:', error)
      return { success: false, message: error.message }
    }
  },
  deletePayroll: async (payrollId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${payrollId}`, {
        method: 'DELETE'
      })
      return await response.json()
    } catch (error) {
      console.error('Error deleting payroll:', error)
      return { success: false, message: error.message }
    }
  },
  downloadPayslip: async (id) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/payroll/${id}/payslip`)
      
      // Check content type first
      const contentType = response.headers.get('content-type') || ''
      
      if (!response.ok) {
        // Try to parse as JSON error response
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.error || `Failed to download payslip: ${response.status}`)
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(`Failed to download payslip: ${response.status} ${response.statusText}. ${errorText}`)
        }
      }
      
      // Check if response is PDF
      if (!contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
        // Might be JSON error
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.error || 'Invalid response format')
        } catch (jsonError) {
          console.warn('Response is not a PDF. Content-Type:', contentType)
        }
      }
      
      const blob = await response.blob()
      
      // Check if blob is empty or too small (likely an error)
      if (blob.size < 100) {
        // Try to read as text to see if it's an error message
        const text = await blob.text()
        if (text.includes('error') || text.includes('Error')) {
          throw new Error('Payslip generation failed: ' + text)
        }
      }
      
      return blob
    } catch (error) {
      console.error('Download payslip API error:', error)
      throw error
    }
  },
  downloadForm16: (employeeId, assessmentYear) => fetchWithAuth(`${API_BASE_URL}/payroll/form16?employeeId=${employeeId}&assessmentYear=${assessmentYear}`).then(res => res.blob()),
  
  // Shift Change Requests
  createShiftChangeRequest: async (requestData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shift-change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to create shift change request')
      }
      return data
    } catch (error) {
      console.error('Error creating shift change request:', error)
      throw error
    }
  },
  getShiftChangeRequestsByEmployee: async (employeeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shift-change-requests/employee/${employeeId}`)
      if (!response.ok) {
        console.error('Get shift change requests API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching shift change requests:', error)
      return []
    }
  },
  getAllShiftChangeRequests: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shift-change-requests`)
      if (!response.ok) {
        console.error('Get all shift change requests API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching all shift change requests:', error)
      return []
    }
  },
  getPendingShiftChangeRequests: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shift-change-requests/pending`)
      if (!response.ok) {
        console.error('Get pending shift change requests API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching pending shift change requests:', error)
      return []
    }
  },
  approveShiftChangeRequest: async (requestId, reviewedBy) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shift-change-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy })
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to approve shift change request')
      }
      return data
    } catch (error) {
      console.error('Error approving shift change request:', error)
      throw error
    }
  },
  rejectShiftChangeRequest: async (requestId, reviewedBy, rejectionReason) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/shift-change-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy, rejectionReason })
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to reject shift change request')
      }
      return data
    } catch (error) {
      console.error('Error rejecting shift change request:', error)
      throw error
    }
  },

  // CTC Template APIs for Multi-Client Payroll Management
  getCTCTemplates: async (clientName = null, activeOnly = false) => {
    try {
      let url = `${API_BASE_URL}/ctc-templates`
      const params = new URLSearchParams()
      if (clientName) params.append('clientName', clientName)
      if (activeOnly) params.append('activeOnly', 'true')
      if (params.toString()) url += `?${params.toString()}`
      
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        console.error('CTC Template API error:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching CTC templates:', error)
      return []
    }
  },

  getCTCTemplateById: async (templateId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ctc-templates/${templateId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch CTC template: ${response.status}`)
      }
      const data = await response.json()
      return data.template || data
    } catch (error) {
      console.error('Error fetching CTC template by ID:', error)
      throw error
    }
  },

  createCTCTemplate: async (templateData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ctc-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to create CTC template')
      }
      return data.template || data
    } catch (error) {
      console.error('Error creating CTC template:', error)
      throw error
    }
  },

  updateCTCTemplate: async (templateId, templateData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ctc-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update CTC template')
      }
      return data.template || data
    } catch (error) {
      console.error('Error updating CTC template:', error)
      throw error
    }
  },

  deleteCTCTemplate: async (templateId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ctc-templates/${templateId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to delete CTC template')
      }
      return data
    } catch (error) {
      console.error('Error deleting CTC template:', error)
      throw error
    }
  },

  convertCTCToSalaryStructure: async (annualCtc, templateId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ctc-templates/convert-ctc?annualCtc=${annualCtc}&templateId=${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to convert CTC to salary structure')
      }
      return data.salaryStructure || data
    } catch (error) {
      console.error('Error converting CTC to salary structure:', error)
      throw error
    }
  }
}

export default api

