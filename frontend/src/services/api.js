const API_BASE_URL = 'http://localhost:8080/api'

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
  
  // Include credentials (cookies) in all requests
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Required for HttpOnly cookies
  })
  
  // If token is invalid or expired, try to refresh
  if (response.status === 401) {
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
    
    // If refresh fails, clear auth data and redirect to login
    // Note: Cookies are cleared by backend logout endpoint
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
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
    body: JSON.stringify(userData),
    credentials: 'include'
  }).then(res => res.json()),

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Required for cookies
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
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Required for cookies
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

  checkAuth: (email) => fetch(`${API_BASE_URL}/auth/check?email=${encodeURIComponent(email)}`, {
    credentials: 'include'
  }).then(res => res.json()),

  checkSuperAdminExists: () => fetch(`${API_BASE_URL}/auth/check-superadmin`, {
    credentials: 'include'
  }).then(res => res.json()),

  refreshToken: () => fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include' // Cookies are automatically sent
  }).then(res => res.json()),

  logout: () => fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include' // Cookies are automatically sent
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
  changeEmployeePassword: (id, currentPassword, newPassword) => fetchWithAuth(`${API_BASE_URL}/employees/${id}/change-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
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
    return fetchWithAuth(url).then(res => res.json())
  },
  getPendingLeaves: () => fetchWithAuth(`${API_BASE_URL}/leaves/pending`).then(res => res.json()),
  getLeavesByEmployee: (employeeId) => fetchWithAuth(`${API_BASE_URL}/leaves/employee/${employeeId}`).then(res => res.json()),
  deleteLeave: (id) => fetchWithAuth(`${API_BASE_URL}/leaves/${id}`, { method: 'DELETE' }).then(res => res.json()),
  createLeave: (leave) => fetchWithAuth(`${API_BASE_URL}/leaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leave)
  }).then(res => res.json()),
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
  createPayroll: (payroll) => fetchWithAuth(`${API_BASE_URL}/payrolls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payroll)
  }).then(res => res.json()),

  // Performance
  getPerformance: () => fetchWithAuth(`${API_BASE_URL}/performance`).then(res => res.json()),
  createPerformance: (performance) => fetchWithAuth(`${API_BASE_URL}/performance`, {
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
    return fetchWithAuth(url).then(res => res.json())
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
  verifyDocument: (id, verified) => fetchWithAuth(`${API_BASE_URL}/documents/${id}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified })
  }).then(res => res.json()),
  deleteDocument: (id) => fetchWithAuth(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Shifts
  getShifts: () => fetchWithAuth(`${API_BASE_URL}/shifts`).then(res => res.json()),
  getActiveShifts: () => fetchWithAuth(`${API_BASE_URL}/shifts/active`).then(res => res.json()),
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

  // Leave Types
  getLeaveTypes: () => fetchWithAuth(`${API_BASE_URL}/leave-types`).then(res => res.json()),
  getActiveLeaveTypes: () => fetchWithAuth(`${API_BASE_URL}/leave-types/active`).then(res => res.json()),
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
  getLeaveBalances: (employeeId, year) => {
    const url = year ? `${API_BASE_URL}/leave-balances/employee/${employeeId}?year=${year}` : `${API_BASE_URL}/leave-balances/employee/${employeeId}`
    return fetchWithAuth(url).then(res => res.json())
  },
  initializeLeaveBalances: (employeeId, year) => {
    const url = year 
      ? `${API_BASE_URL}/leave-balances/initialize/${employeeId}?year=${year}`
      : `${API_BASE_URL}/leave-balances/initialize/${employeeId}`
    return fetchWithAuth(url, { method: 'POST' }).then(res => res.json())
  },
  assignLeaveBalance: (employeeId, leaveTypeId, totalDays, year) => {
    const url = year 
      ? `${API_BASE_URL}/leave-balances/assign?employeeId=${employeeId}&leaveTypeId=${leaveTypeId}&totalDays=${totalDays}&year=${year}`
      : `${API_BASE_URL}/leave-balances/assign?employeeId=${employeeId}&leaveTypeId=${leaveTypeId}&totalDays=${totalDays}`
    return fetchWithAuth(url, { method: 'POST' }).then(res => res.json())
  },

  // Salary Structures
  getCurrentSalaryStructure: (employeeId) => fetchWithAuth(`${API_BASE_URL}/salary-structures/employee/${employeeId}`).then(res => res.json()),
  createSalaryStructure: (salaryStructure) => fetchWithAuth(`${API_BASE_URL}/salary-structures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(salaryStructure)
  }).then(res => res.json()),

  // HR Tickets
  getTickets: () => fetchWithAuth(`${API_BASE_URL}/tickets`).then(res => res.json()),
  getEmployeeTickets: (employeeId) => fetchWithAuth(`${API_BASE_URL}/tickets/employee/${employeeId}`).then(res => res.json()),
  getTicketsByStatus: (status) => fetchWithAuth(`${API_BASE_URL}/tickets/status/${status}`).then(res => res.json()),
  createTicket: (ticket) => fetchWithAuth(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket)
  }).then(res => res.json()),
  updateTicket: (id, ticket) => fetchWithAuth(`${API_BASE_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket)
  }).then(res => res.json()),

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

  // Payroll
  getPayrolls: () => fetchWithAuth(`${API_BASE_URL}/payroll`).then(res => res.json()),
  getEmployeePayrolls: (employeeId) => fetchWithAuth(`${API_BASE_URL}/payroll/employee/${employeeId}`).then(res => res.json()),
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
  downloadPayslip: (id) => fetchWithAuth(`${API_BASE_URL}/payroll/${id}/payslip`).then(res => res.blob()),
  downloadForm16: (employeeId, assessmentYear) => fetchWithAuth(`${API_BASE_URL}/payroll/form16?employeeId=${employeeId}&assessmentYear=${assessmentYear}`).then(res => res.blob())
}

export default api

