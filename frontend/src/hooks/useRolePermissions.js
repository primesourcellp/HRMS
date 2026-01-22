import { useState, useEffect, useMemo } from 'react'
import { getUserRole, hasPermission, ROLES, canManageEmployees, canManagePayroll, canApproveLeaves } from '../utils/roles'

export const useRolePermissions = () => {
  // Initialize with current role from localStorage
  const [userRole, setUserRole] = useState(() => {
    try {
      return getUserRole()
    } catch (error) {
      console.error('Error getting user role:', error)
      return ROLES.EMPLOYEE
    }
  })
  
  useEffect(() => {
    // Get initial role
    const currentRole = getUserRole()
    if (currentRole && currentRole !== userRole) {
      setUserRole(currentRole)
    }
    
    // Update role when localStorage changes (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'userRole') {
        setUserRole(e.newValue || ROLES.EMPLOYEE)
      }
    }
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [userRole])
  
  return useMemo(() => {
    // Ensure we always have a valid role
    const role = userRole || getUserRole() || ROLES.EMPLOYEE
    
    return {
      userRole: role,
      isSuperAdmin: role === ROLES.SUPER_ADMIN,
      isHRAdmin: role === ROLES.HR_ADMIN,
      isManager: role === ROLES.MANAGER,
      isEmployee: role === ROLES.EMPLOYEE,
      isFinance: role === ROLES.FINANCE,
      isAdmin: role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN,
      hasPermission: (permission) => hasPermission(role, permission),
      canManageEmployees: canManageEmployees(role),
      canManagePayroll: canManagePayroll(role),
      canApproveLeaves: canApproveLeaves(role)
    }
  }, [userRole])
}

