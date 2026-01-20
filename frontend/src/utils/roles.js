// Role definitions and permissions
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  FINANCE: 'FINANCE'
}

// Role-based permissions
export const PERMISSIONS = {
  // Super Admin - Full system access
  SUPER_ADMIN: {
    dashboard: true,
    employees: true,
    attendance: true,
    leave: true,
    payroll: true,
    performance: true,
    shifts: true,
    tickets: true,
    analytics: true,
    users: true,
    settings: true,
    recruitment: true,
    systemConfig: true,
    security: true,
    integrations: true,
    masterData: true,
    teamManagement: true,
    compliance: true
  },
  
  // HR Admin - Employee lifecycle, payroll, compliance, reporting
  HR_ADMIN: {
    dashboard: true,
    employees: true,
    attendance: true,
    myAttendance: true,
    leave: true,
    payroll: true,
    performance: true,
    shifts: true,
    tickets: true,
    analytics: true,
    users: false,
    settings: true,
    recruitment: true,
    systemConfig: false,
    security: false,
    integrations: false,
    masterData: true,
    myTeams: true,
    compliance: true
  },
  
  // Manager - Team attendance, leave approvals, performance tracking
  MANAGER: {
    dashboard: true,
    employees: false, // Only view team members
    attendance: true, // Team attendance
    leave: true, // Approve team leaves
    payroll: true, // My Payroll access
    performance: true, // Team performance
    shifts: true, // View team shifts
    tickets: true, // Team tickets
    analytics: true, // Team analytics
    users: false,
    settings: true,
    recruitment: false,
    systemConfig: false,
    security: false,
    integrations: false,
    masterData: false,
    myTeams: true
  },
  
  // Employee - Self-service access
  EMPLOYEE: {
    dashboard: true,
    employees: false,
    attendance: true, // Own attendance
    leave: true, // Own leaves
    payroll: true, // Own payroll
    performance: true, // Own performance
    shifts: true, // Own shift
    tickets: true, // Own tickets
    analytics: false,
    users: false,
    settings: true,
    recruitment: false,
    systemConfig: false,
    security: false,
    integrations: false,
    masterData: false,
    myTeams: true
  },
  
  // Finance - Payroll validation, cost analytics, statutory reports
  FINANCE: {
    dashboard: true,
    employees: false,
    attendance: true, // My attendance access
    myAttendance: true, // My attendance access
    leave: true, // Apply leave access
    payroll: true, // Payroll validation
    performance: false,
    shifts: false,
    tickets: true, // HR Tickets access
    analytics: true, // Cost analytics
    users: false,
    settings: true,
    recruitment: false,
    systemConfig: false,
    security: false,
    integrations: false,
    masterData: false,
    compliance: true
  }
}

// Check if user has permission
export const hasPermission = (role, permission) => {
  if (!role || !PERMISSIONS[role]) return false
  return PERMISSIONS[role][permission] === true
}

// Check if user is admin (Super Admin or HR Admin)
export const isAdmin = (role) => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN
}

// Check if user can manage employees
export const canManageEmployees = (role) => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN
}

// Check if user can manage payroll
export const canManagePayroll = (role) => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN || role === ROLES.FINANCE
}

// Check if user can approve leaves
export const canApproveLeaves = (role) => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN || role === ROLES.MANAGER
}

// Get user role from localStorage
export const getUserRole = () => {
  return localStorage.getItem('userRole') || ROLES.EMPLOYEE
}

// Get user type (admin or employee)
export const getUserType = () => {
  const role = getUserRole()
  if (role === ROLES.EMPLOYEE) return 'employee'
  return 'admin'
}

