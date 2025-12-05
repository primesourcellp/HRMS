const API_BASE_URL = 'http://localhost:8080/api'

// Helper function to get JWT token from localStorage
const getToken = () => {
  return localStorage.getItem('token')
}

// Helper function to get headers with authentication
const getAuthHeaders = () => {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// Helper function to handle API requests with auth
const fetchWithAuth = async (url, options = {}) => {
  const token = getToken()
  const headers = {
    ...(options.headers || {}),
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
  
  // Don't override Content-Type if it's FormData (browser sets it automatically)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  // If token is invalid or expired, try to refresh
  if (response.status === 401 && token) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.token) {
            localStorage.setItem('token', refreshData.token)
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${refreshData.token}`
            return fetch(url, {
              ...options,
              headers
            })
          }
        }
      } catch (err) {
        console.error('Token refresh failed:', err)
      }
    }
    
    // If refresh fails, clear tokens and redirect to login
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('isAuthenticated')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
  
  return response
}

const api = {
  // Authentication
  register: (userData) => fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  }).then(res => res.json()),

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
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
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Employee login API error:', error)
      throw error
    }
  },

  checkAuth: (email) => fetch(`${API_BASE_URL}/auth/check?email=${encodeURIComponent(email)}`).then(res => res.json()),

  checkSuperAdminExists: () => fetch(`${API_BASE_URL}/auth/check-superadmin`).then(res => res.json()),

  refreshToken: (refreshToken) => fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  }).then(res => res.json()),

  // Users
  getUsers: (role) => {
    const url = role ? `${API_BASE_URL}/users?role=${role}` : `${API_BASE_URL}/users`
    return fetchWithAuth(url).then(res => res.json())
  },
  createUser: (userData, currentUserRole) => fetchWithAuth(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, currentUserRole })
  }).then(res => res.json()),
  updateUser: (id, userData, currentUserRole) => fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, currentUserRole })
  }).then(res => res.json()),
  deleteUser: (id, currentUserRole) => fetchWithAuth(`${API_BASE_URL}/users/${id}?currentUserRole=${currentUserRole}`, {
    method: 'DELETE'
  }).then(res => res.ok ? res : res.json()),

  // Employees
  getEmployees: (search) => {
    const url = search ? `${API_BASE_URL}/employees?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/employees`
    return fetchWithAuth(url).then(res => res.json())
  },
  getEmployee: (id) => fetchWithAuth(`${API_BASE_URL}/employees/${id}`).then(res => res.json()),
  createEmployee: (employee, userRole) => fetchWithAuth(`${API_BASE_URL}/employees?userRole=${userRole}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  }).then(res => res.json()),
  updateEmployee: (id, employee, userRole) => fetchWithAuth(`${API_BASE_URL}/employees/${id}?userRole=${userRole}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  }).then(res => res.json()),
  deleteEmployee: (id, userRole) => fetchWithAuth(`${API_BASE_URL}/employees/${id}?userRole=${userRole}`, {
    method: 'DELETE'
  }).then(res => res.ok),

  // Attendance
  getAttendance: () => fetchWithAuth(`${API_BASE_URL}/attendance`).then(res => res.json()),
  getAttendanceByDate: (date) => fetchWithAuth(`${API_BASE_URL}/attendance/date/${date}`).then(res => res.json()),
  getAttendanceByEmployee: (employeeId) => fetchWithAuth(`${API_BASE_URL}/attendance/employee/${employeeId}`).then(res => res.json()),
  checkIn: (data) => fetchWithAuth(`${API_BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  checkOut: (data) => fetchWithAuth(`${API_BASE_URL}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  getWeeklyHours: (employeeId, weekStart) => fetchWithAuth(`${API_BASE_URL}/attendance/employee/${employeeId}/weekly?weekStart=${weekStart}`).then(res => res.json()),
  markAttendance: (data) => fetchWithAuth(`${API_BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Leaves
  getLeaves: (status) => {
    const url = status ? `${API_BASE_URL}/leaves?status=${status}` : `${API_BASE_URL}/leaves`
    return fetch(url).then(res => res.json())
  },
  getPendingLeaves: () => fetch(`${API_BASE_URL}/leaves/pending`).then(res => res.json()),
  getLeavesByEmployee: (employeeId) => fetch(`${API_BASE_URL}/leaves/employee/${employeeId}`).then(res => res.json()),
  deleteLeave: (id) => fetch(`${API_BASE_URL}/leaves/${id}`, { method: 'DELETE' }).then(res => res.json()),
  createLeave: (leave) => fetch(`${API_BASE_URL}/leaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leave)
  }).then(res => res.json()),
  approveLeave: (id, approvedBy) => fetch(`${API_BASE_URL}/leaves/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy })
  }).then(res => res.json()),
  rejectLeave: (id, approvedBy, rejectionReason) => fetch(`${API_BASE_URL}/leaves/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy, rejectionReason })
  }).then(res => res.json()),
  updateLeaveStatus: (id, status) => fetch(`${API_BASE_URL}/leaves/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(res => res.json()),

  // Payrolls
  getPayrolls: () => fetch(`${API_BASE_URL}/payrolls`).then(res => res.json()),
  createPayroll: (payroll) => fetch(`${API_BASE_URL}/payrolls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payroll)
  }).then(res => res.json()),

  // Performance
  getPerformance: () => fetch(`${API_BASE_URL}/performance`).then(res => res.json()),
  createPerformance: (performance) => fetch(`${API_BASE_URL}/performance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(performance)
  }).then(res => res.json()),

  // Dashboard
  getDashboardStats: (date, employeeId) => {
    let url = `${API_BASE_URL}/dashboard/stats`
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (employeeId) params.append('employeeId', employeeId)
    if (params.toString()) url += `?${params.toString()}`
    return fetch(url).then(res => res.json())
  },

  // Documents
  uploadDocument: (formData) => fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData
  }).then(res => res.json()),
  getEmployeeDocuments: (employeeId) => fetch(`${API_BASE_URL}/documents/employee/${employeeId}`).then(res => res.json()),
  downloadDocument: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}/download`)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to download document: ${response.status} ${response.statusText}`)
      }
      return await response.blob()
    } catch (error) {
      console.error('Download document API error:', error)
      throw error
    }
  },
  verifyDocument: (id, verified) => fetch(`${API_BASE_URL}/documents/${id}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified })
  }).then(res => res.json()),
  deleteDocument: (id) => fetch(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Shifts
  getShifts: () => fetch(`${API_BASE_URL}/shifts`).then(res => res.json()),
  getActiveShifts: () => fetch(`${API_BASE_URL}/shifts/active`).then(res => res.json()),
  createShift: (shift) => fetch(`${API_BASE_URL}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shift)
  }).then(res => res.json()),
  updateShift: (id, shift) => fetch(`${API_BASE_URL}/shifts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shift)
  }).then(res => res.json()),
  deleteShift: (id) => fetch(`${API_BASE_URL}/shifts/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Leave Types
  getLeaveTypes: () => fetch(`${API_BASE_URL}/leave-types`).then(res => res.json()),
  getActiveLeaveTypes: () => fetch(`${API_BASE_URL}/leave-types/active`).then(res => res.json()),
  createLeaveType: (leaveType) => fetch(`${API_BASE_URL}/leave-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveType)
  }).then(res => res.json()),
  updateLeaveType: (id, leaveType) => fetch(`${API_BASE_URL}/leave-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveType)
  }).then(res => res.json()),
  deleteLeaveType: (id) => fetch(`${API_BASE_URL}/leave-types/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Holidays
  getHolidays: () => fetch(`${API_BASE_URL}/holidays`).then(res => res.json()),
  getHolidaysByYear: (year) => fetch(`${API_BASE_URL}/holidays/year/${year}`).then(res => res.json()),
  createHoliday: (holiday) => fetch(`${API_BASE_URL}/holidays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holiday)
  }).then(res => res.json()),

  // Leave Balances
  getLeaveBalances: (employeeId, year) => {
    const url = year ? `${API_BASE_URL}/leave-balances/employee/${employeeId}?year=${year}` : `${API_BASE_URL}/leave-balances/employee/${employeeId}`
    return fetch(url).then(res => res.json())
  },

  // Salary Structures
  getCurrentSalaryStructure: (employeeId) => fetch(`${API_BASE_URL}/salary-structures/employee/${employeeId}`).then(res => res.json()),
  createSalaryStructure: (salaryStructure) => fetch(`${API_BASE_URL}/salary-structures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(salaryStructure)
  }).then(res => res.json()),

  // HR Tickets
  getTickets: () => fetch(`${API_BASE_URL}/tickets`).then(res => res.json()),
  getEmployeeTickets: (employeeId) => fetch(`${API_BASE_URL}/tickets/employee/${employeeId}`).then(res => res.json()),
  getTicketsByStatus: (status) => fetch(`${API_BASE_URL}/tickets/status/${status}`).then(res => res.json()),
  createTicket: (ticket) => fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket)
  }).then(res => res.json()),
  updateTicket: (id, ticket) => fetch(`${API_BASE_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket)
  }).then(res => res.json()),

  // Recruitment
  getJobPostings: () => fetch(`${API_BASE_URL}/recruitment/jobs`).then(res => res.json()),
  createJobPosting: (jobPosting) => fetch(`${API_BASE_URL}/recruitment/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobPosting)
  }).then(res => res.json()),
  getApplicants: (jobPostingId) => fetch(`${API_BASE_URL}/recruitment/applicants/job/${jobPostingId}`).then(res => res.json()),
  createApplicant: (applicant) => fetch(`${API_BASE_URL}/recruitment/applicants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(applicant)
  }).then(res => res.json()),

  // Payroll
  getPayrolls: () => fetch(`${API_BASE_URL}/payroll`).then(res => res.json()),
  getEmployeePayrolls: (employeeId) => fetch(`${API_BASE_URL}/payroll/employee/${employeeId}`).then(res => res.json()),
  generatePayroll: (employeeId, month, year) => fetch(`${API_BASE_URL}/payroll/generate?employeeId=${employeeId}&month=${month}&year=${year}`, {
    method: 'POST'
  }).then(res => res.json()),
  downloadPayslip: (id) => fetch(`${API_BASE_URL}/payroll/${id}/payslip`).then(res => res.blob()),
  downloadForm16: (employeeId, assessmentYear) => fetch(`${API_BASE_URL}/payroll/form16?employeeId=${employeeId}&assessmentYear=${assessmentYear}`).then(res => res.blob())
}

export default api

