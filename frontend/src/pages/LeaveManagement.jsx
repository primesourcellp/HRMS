import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Search, Edit, Trash2, Eye, X, Plus, Settings as SettingsIcon, MoreVertical } from 'lucide-react'
import api from '../services/api'
import { format, differenceInDays, parseISO, isAfter, isBefore, startOfToday } from 'date-fns'

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [employees, setEmployees] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false)
  const [showLeaveTypeList, setShowLeaveTypeList] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState(null)
  const [balanceFormData, setBalanceFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    totalDays: '',
    year: new Date().getFullYear()
  })
  const [leaveTypeFormData, setLeaveTypeFormData] = useState({
    name: '',
    code: '',
    maxDays: '',
    carryForward: false,
    maxCarryForward: '',
    monthlyLeave: false,
    description: '',
    active: true
  })
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [filter, setFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [calculatedDays, setCalculatedDays] = useState(0)
  // View toggle: 'applications' or 'types' (only for admin)
  const [activeView, setActiveView] = useState('applications')
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    halfDayType: 'FIRST_HALF'
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [validationError, setValidationError] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({})
  const userRole = localStorage.getItem('userRole')
  const userType = localStorage.getItem('userType')
  const currentUserId = localStorage.getItem('userId')
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'
  const isHrAdmin = userRole === 'HR_ADMIN'
  const isManager = userRole === 'MANAGER'
  const isFinance = userRole === 'FINANCE'
  const canApplyLeave = isEmployee || isManager || isFinance // HR_ADMIN removed - they apply leave from My Attendance page

  useEffect(() => {
    // Validate that currentUserId exists for employees who can apply leave
    if (canApplyLeave && !currentUserId) {
      setError('Employee ID not found. Please log in again.')
      return
    }
    loadData()
  }, [filter, canApplyLeave, currentUserId])

  useEffect(() => {
    // Auto-set employeeId for employees, managers, and finance (HR_ADMIN applies leave from My Attendance page)
    if (canApplyLeave && currentUserId && !formData.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: currentUserId.toString() }))
    }
  }, [canApplyLeave, currentUserId, formData.employeeId])

  useEffect(() => {
    // Calculate days when dates change
    if (formData.startDate && formData.endDate) {
      calculateDays()
    } else {
      setCalculatedDays(0)
    }
  }, [formData.startDate, formData.endDate, formData.halfDay])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenDropdownId(null)
      }
    }
    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let leavesData
      if (isEmployee && currentUserId && !isHrAdmin) {
        // Employees (but not HR_ADMIN) see only their own leaves
        leavesData = await api.getLeavesByEmployee(parseInt(currentUserId))
        if (filter !== 'All') {
          leavesData = leavesData.filter(l => l.status === filter)
        }
      } else if (isAdmin || isHrAdmin) {
        // Admins and HR_ADMIN see all leaves for management
        leavesData = filter === 'All' ? await api.getLeaves() : await api.getLeaves(filter)
        // For HR_ADMIN, filter to only show MANAGER, EMPLOYEE, and FINANCE leaves (exclude HR_ADMIN's own leaves)
        if (isHrAdmin && currentUserId) {
          const allEmployees = await api.getEmployees()
          const allEmployeesList = Array.isArray(allEmployees) ? allEmployees : []
          const currentId = parseInt(currentUserId)
          
          leavesData = leavesData.filter(leave => {
            const empId = leave.employeeId ? parseInt(leave.employeeId) : null
            if (!empId) return false
            
            // Find the employee to check their role
            const employee = allEmployeesList.find(emp => {
              const id = emp.id ? parseInt(emp.id) : null
              return id === empId
            })
            
            if (!employee) return false
            
            const empRole = (employee.role || '').toUpperCase()
            
            // Exclude HR_ADMIN's own leaves
            if (empId === currentId || parseInt(empId) === currentId || empId.toString() === currentUserId) {
              return false
            }
            
            // Only include MANAGER, EMPLOYEE, and FINANCE roles
            return empRole === 'MANAGER' || empRole === 'EMPLOYEE' || empRole === 'FINANCE'
          })
        }
      } else if (canApplyLeave && currentUserId) {
        // Other roles that can apply leave see only their own
        leavesData = await api.getLeavesByEmployee(parseInt(currentUserId))
        if (filter !== 'All') {
          leavesData = leavesData.filter(l => l.status === filter)
        }
      } else {
        leavesData = []
      }

      const [typesData, allTypesData, employeesData, usersData] = await Promise.all([
        api.getActiveLeaveTypes(),
        // Always fetch all leave types for admins and HR_ADMIN (we control visibility via the switch)
        (isAdmin || isHrAdmin) ? api.getLeaveTypes() : Promise.resolve([]),
        // Load employees for admins and HR_ADMIN, or load current employee's data for employees
        (isAdmin || isHrAdmin) ? api.getEmployees() : (canApplyLeave && currentUserId ?
          api.getEmployees().then(emps => {
            // Filter to include only current employee for employees
            const currentEmp = emps.find(emp => {
              const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
              return empId === parseInt(currentUserId)
            })
            return currentEmp ? [currentEmp] : []
          }).catch(() => []) : Promise.resolve([])),
        // Load users (admins and HR_ADMIN) to get approver names
        (isAdmin || isHrAdmin) ? api.getUsers() : Promise.resolve([])
      ])
      
      setLeaves(Array.isArray(leavesData) ? leavesData : [])
      // For admin and HR_ADMIN, show all types (management view). For employees, show only active leave types.
      if (isAdmin || isHrAdmin) {
        setLeaveTypes(Array.isArray(allTypesData) ? allTypesData : [])
      } else {
        setLeaveTypes(Array.isArray(typesData) ? typesData : [])
      }
      
      // Set employees and ensure we have all employees referenced in leaves
      const employeesList = Array.isArray(employeesData) ? employeesData : []
      
      // For admins and HR_ADMIN, if we have leaves but missing employees, ensure all employees are loaded
      if ((isAdmin || isHrAdmin) && leavesData && Array.isArray(leavesData) && leavesData.length > 0 && employeesList.length > 0) {
        const leaveEmployeeIds = [...new Set(leavesData.map(l => l.employeeId).filter(id => id != null && id !== undefined))]
        const loadedEmployeeIds = new Set(employeesList.map(e => {
          const id = typeof e.id === 'string' ? parseInt(e.id) : e.id
          return id
        }))
        
        const missingEmployeeIds = leaveEmployeeIds.filter(id => {
          const numId = typeof id === 'string' ? parseInt(id) : id
          return !isNaN(numId) && !loadedEmployeeIds.has(numId)
        })
        
        // If we have missing employees, reload all employees to ensure we have them
        if (missingEmployeeIds.length > 0) {
          try {
            const allEmployees = await api.getEmployees()
            const allEmployeesList = Array.isArray(allEmployees) ? allEmployees : []
            // Merge with existing employees, avoiding duplicates
            const mergedEmployees = [...employeesList]
            allEmployeesList.forEach(emp => {
              if (!emp || !emp.id) return
              const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
              if (!mergedEmployees.find(e => {
                if (!e || !e.id) return false
                const eId = typeof e.id === 'string' ? parseInt(e.id) : e.id
                return eId === empId
              })) {
                mergedEmployees.push(emp)
              }
            })
            setEmployees(mergedEmployees)
          } catch (err) {
            console.error('Error fetching missing employees:', err)
            setEmployees(employeesList)
          }
        } else {
          setEmployees(employeesList)
        }
      } else {
        setEmployees(employeesList)
      }
      
      setUsers(Array.isArray(usersData) ? usersData : [])

      // Load leave balances for current user and auto-initialize if needed
      if (currentUserId) {
        try {
          let balances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
          let balancesArray = Array.isArray(balances) ? balances : []
          
          // Check if we need to initialize balances
          const needsInitialization = balancesArray.length === 0 || 
            balancesArray.every(b => !b.totalDays || b.totalDays === 0)
          
          // Auto-initialize balances if none exist or all have 0 totalDays, but leave types are configured
          if (needsInitialization && typesData.length > 0) {
            try {
              console.log('Initializing leave balances for employee:', currentUserId)
              balances = await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
              balancesArray = Array.isArray(balances) ? balances : []
              console.log('Leave balances initialized:', balancesArray)
            } catch (initError) {
              console.error('Error initializing leave balances:', initError)
            }
          }
          
          setLeaveBalances(balancesArray)
        } catch (balanceError) {
          console.error('Error loading leave balances:', balanceError)
          // Try to initialize even on error if we have leave types
          if (typesData.length > 0) {
            try {
              const balances = await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
              setLeaveBalances(Array.isArray(balances) ? balances : [])
            } catch (initError) {
              console.error('Error initializing leave balances on error recovery:', initError)
          setLeaveBalances([])
            }
          } else {
            setLeaveBalances([])
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.message || 'Failed to load leave data')
      setLeaves([])
      setLeaveTypes([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) {
      setCalculatedDays(0)
      return
    }

    const start = parseISO(formData.startDate)
    const end = parseISO(formData.endDate)

    if (isAfter(start, end)) {
      setCalculatedDays(0)
      return
    }

    if (formData.halfDay) {
      setCalculatedDays(0.5)
    } else {
      const days = differenceInDays(end, start) + 1
      setCalculatedDays(days)
    }
  }

  const validateForm = () => {
    setValidationError('')

    if (!formData.leaveTypeId) {
      setValidationError('Please select a leave type')
      return false
    }

    if (!formData.startDate || !formData.endDate) {
      setValidationError('Please select both start and end dates')
      return false
    }

    const start = parseISO(formData.startDate)
    const end = parseISO(formData.endDate)
    const today = startOfToday()

    if (isBefore(start, today)) {
      setValidationError('Start date cannot be in the past')
      return false
    }

    if (isAfter(start, end)) {
      setValidationError('End date must be after start date')
      return false
    }

    // Check leave balance
    const balance = getLeaveBalance(parseInt(formData.leaveTypeId))
    const requiredDays = formData.halfDay ? 0.5 : calculatedDays

    if (balance < requiredDays) {
      const selectedType = leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId))
      const maxDays = selectedType?.maxDays || 0
      
      if (balance === 0) {
        if (maxDays > 0) {
          setValidationError(`Leave balance not assigned. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days. This leave type allows up to ${maxDays} days. Please contact your administrator to assign leave balance.`)
        } else {
          setValidationError(`Leave balance not assigned. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days. Please contact your administrator to assign leave balance for this leave type.`)
        }
      } else {
        setValidationError(`Insufficient leave balance. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days. Please contact HR for additional leave.`)
      }
      return false
    }

    // Check max days for leave type
    const selectedType = leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId))
    if (selectedType && selectedType.maxDays && requiredDays > selectedType.maxDays) {
      setValidationError(`Leave duration exceeds maximum allowed days (${selectedType.maxDays} days)`)
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setValidationError('')
    
    try {
      // Check if balance is 0 and try to auto-assign based on leave type maxDays
      const balance = getLeaveBalance(parseInt(formData.leaveTypeId))
      const requiredDays = formData.halfDay ? 0.5 : calculatedDays
      const selectedType = leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId))
      
      if (balance === 0 && selectedType?.maxDays && selectedType.maxDays > 0 && canApplyLeave && currentUserId) {
        try {
          // Try to auto-assign leave balance using maxDays
          const employeeId = parseInt(currentUserId)
          const leaveTypeId = parseInt(formData.leaveTypeId)
          const currentYear = new Date().getFullYear()
          
          await api.assignLeaveBalance(employeeId, leaveTypeId, selectedType.maxDays, currentYear)
          
          // Reload balances
          const updatedBalances = await api.getLeaveBalances(employeeId, currentYear)
          setLeaveBalances(Array.isArray(updatedBalances) ? updatedBalances : [])
          
          // Re-check balance
          const newBalance = getLeaveBalance(leaveTypeId)
          if (newBalance < requiredDays) {
            throw new Error(`Insufficient leave balance. Available: ${newBalance.toFixed(1)} days, Required: ${requiredDays} days. Please contact HR for additional leave.`)
          }
        } catch (assignError) {
          console.error('Error auto-assigning leave balance:', assignError)
          throw new Error(`Leave balance not assigned. Please contact your administrator to assign leave balance for this leave type.`)
        }
      }
      
      // Prepare submit data with all required fields
      const selectedLeaveType = leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId))
      
      // Validate employeeId
      let employeeIdValue
      
      // If user has a currentUserId and is not an admin, treat them as an employee
      // This handles cases where userType might not be set correctly
      const shouldUseOwnId = canApplyLeave || (currentUserId && !isAdmin && !isHrAdmin)
      
      // Debug logging
      console.log('Validation check:', { 
        canApplyLeave, 
        currentUserId, 
        userType, 
        userRole, 
        isAdmin,
        isHrAdmin,
        shouldUseOwnId,
        formDataEmployeeId: formData.employeeId 
      })
      
      if (shouldUseOwnId) {
        // For employees, managers, and finance - use their own ID
        if (!currentUserId) {
          console.error('currentUserId is missing:', { currentUserId, userType, userRole })
          throw new Error('Employee ID not found. Please log in again.')
        }
        employeeIdValue = parseInt(currentUserId)
        if (isNaN(employeeIdValue) || employeeIdValue <= 0) {
          console.error('Invalid currentUserId:', currentUserId)
          throw new Error('Invalid employee ID. Please log in again.')
        }
      } else {
        // For admins - they need to select an employee
        if (!formData.employeeId) {
          throw new Error('Please select an employee')
        }
        employeeIdValue = parseInt(formData.employeeId)
        if (isNaN(employeeIdValue) || employeeIdValue <= 0) {
          throw new Error('Invalid employee selected')
        }
      }
      
      // Validate leaveTypeId
      const leaveTypeIdValue = parseInt(formData.leaveTypeId)
      if (isNaN(leaveTypeIdValue)) {
        throw new Error('Please select a valid leave type')
      }
      
      const submitData = {
        employeeId: employeeIdValue,
        leaveTypeId: leaveTypeIdValue,
        type: selectedLeaveType?.name || 'Leave',
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || '',
        halfDay: formData.halfDay || false,
        halfDayType: formData.halfDay ? (formData.halfDayType || 'FIRST_HALF') : null,
        status: 'PENDING'
      }

      // Log the data being sent for debugging
      console.log('Submitting leave data:', submitData)

      const response = await api.createLeave(submitData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to submit leave application')
      }

      await loadData()
      setShowModal(false)
      resetForm()
      alert('Leave application submitted successfully')
    } catch (error) {
      // Ensure we always display a string, not an object
      let errorMessage = 'Error submitting leave application'
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error.message) {
          errorMessage = typeof error.message === 'string' ? error.message : String(error.message)
        } else if (error.response?.data?.message) {
          errorMessage = typeof error.response.data.message === 'string' ? error.response.data.message : String(error.response.data.message)
        } else {
          errorMessage = String(error)
        }
      }
      setValidationError(errorMessage)
      console.error('Error submitting leave:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
      setFormData({
      employeeId: canApplyLeave ? currentUserId : '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        halfDay: false,
        halfDayType: 'FIRST_HALF'
      })
    setCalculatedDays(0)
    setValidationError('')
  }

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) {
      return
    }

    setLoading(true)
    try {
      await api.updateLeaveStatus(leaveId, 'CANCELLED')
      await loadData()
    } catch (error) {
      alert('Error cancelling leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave application? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      // Note: You may need to add a delete endpoint in the API
      await api.updateLeaveStatus(leaveId, 'CANCELLED')
      await loadData()
      alert('Leave application deleted successfully')
    } catch (error) {
      alert('Error deleting leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (leave) => {
    if (leave.status !== 'PENDING') {
      alert('Only pending leaves can be edited')
      return
    }
    setSelectedLeave(leave)
    setFormData({
      employeeId: leave.employeeId.toString(),
      leaveTypeId: leave.leaveTypeId.toString(),
      startDate: format(new Date(leave.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(leave.endDate), 'yyyy-MM-dd'),
      reason: leave.reason,
      halfDay: leave.halfDay || false,
      halfDayType: leave.halfDayType || 'FIRST_HALF'
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        employeeId: parseInt(formData.employeeId),
        leaveTypeId: parseInt(formData.leaveTypeId),
        type: leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId))?.name || 'Leave'
      }

      // For editing, we need to create a new leave and cancel the old one
      // Or you can add an update endpoint in the backend
      await api.createLeave(submitData)
      await handleCancelLeave(selectedLeave.id)
      await loadData()
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      // Ensure we always display a string, not an object
      let errorMessage = 'Error updating leave application'
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error.message) {
          errorMessage = typeof error.message === 'string' ? error.message : String(error.message)
        } else if (error.response?.data?.message) {
          errorMessage = typeof error.response.data.message === 'string' ? error.response.data.message : String(error.response.data.message)
        } else {
          errorMessage = String(error)
        }
      }
      setValidationError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (leaveId) => {
    setLoading(true)
    try {
      await api.approveLeave(leaveId, parseInt(currentUserId))
      await loadData()
      setShowApprovalModal(false)
      alert('Leave approved successfully')
    } catch (error) {
      alert('Error approving leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (leaveId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    setLoading(true)
    try {
      await api.rejectLeave(leaveId, parseInt(currentUserId), rejectionReason)
      await loadData()
      setShowApprovalModal(false)
      setRejectionReason('')
      alert('Leave rejected')
    } catch (error) {
      alert('Error rejecting leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId) => {
    if (employeeId === null || employeeId === undefined) return 'Unknown'
    
    // Handle type conversion for comparison
    const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId
    if (isNaN(empId)) return 'Unknown'
    
    const currentUserIdNum = currentUserId ? parseInt(currentUserId) : null
    
    // If this is the current employee or HR_ADMIN viewing their own leaves, use localStorage
    if (canApplyLeave && currentUserIdNum && empId === currentUserIdNum) {
      const userName = localStorage.getItem('userName')
      if (userName) return userName
    }
    
    // Otherwise, try to find in employees array - check both id and employeeId fields
    const employee = employees.find(emp => {
      if (!emp) return false
      // Check id field
      if (emp.id !== null && emp.id !== undefined) {
        const empIdNum = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
        if (!isNaN(empIdNum) && empIdNum === empId) return true
      }
      // Check employeeId field as fallback
      if (emp.employeeId !== null && emp.employeeId !== undefined) {
        const empIdStr = String(emp.employeeId)
        const empIdNum = parseInt(empIdStr)
        if (!isNaN(empIdNum) && empIdNum === empId) return true
      }
      return false
    })
    
    if (!employee) {
      // Employee not found in the list - this can happen if employees array is not fully loaded
      // Return a placeholder that includes the ID for debugging
      console.warn(`Employee with ID ${empId} not found in employees list. Total employees loaded: ${employees.length}`)
      return `Employee #${empId}`
    }
    
    // Use name field
    if (employee.name && employee.name.trim() && employee.name.trim() !== '') {
      return employee.name.trim()
    }
    
    // Additional fallbacks
    if (employee.email) {
      return employee.email.split('@')[0] // Use email username as fallback
    } else if (employee.employeeId) {
      return `Employee ${employee.employeeId}` // Use employeeId as fallback
    }
    
    return `Employee #${empId}`
  }

  const getApproverName = (approverId) => {
    if (!approverId) return 'Unknown'
    
    const approverIdNum = typeof approverId === 'string' ? parseInt(approverId) : approverId
    
    // First check in users (admins) - approvers are usually admins
    const user = users.find(u => {
      const userId = typeof u.id === 'string' ? parseInt(u.id) : u.id
      return userId === approverIdNum
    })
    if (user) return user.name
    
    // Then check in employees (in case an employee approved)
    const employee = employees.find(emp => {
      const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
      return empId === approverIdNum
    })
    if (employee) return employee.name
    
    // If it's the current user, use localStorage
    if (currentUserId && approverIdNum === parseInt(currentUserId)) {
      return localStorage.getItem('userName') || 'You'
    }
    
    return 'Unknown'
  }

  const getLeaveTypeName = (leaveTypeId) => {
    const type = leaveTypes.find(t => t.id === leaveTypeId)
    return type?.name || 'Unknown'
  }

  const getLeaveBalance = (leaveTypeId) => {
    if (!leaveTypeId) return 0
    const balance = leaveBalances.find(b => {
      const balanceTypeId = typeof b.leaveTypeId === 'string' ? parseInt(b.leaveTypeId) : b.leaveTypeId
      const typeId = typeof leaveTypeId === 'string' ? parseInt(leaveTypeId) : leaveTypeId
      return balanceTypeId === typeId
    })
    return balance?.balance || 0
  }

  const handleAssignBalance = async (e) => {
    e.preventDefault()
    if (!balanceFormData.employeeId || !balanceFormData.leaveTypeId || !balanceFormData.totalDays) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await api.assignLeaveBalance(
        parseInt(balanceFormData.employeeId),
        parseInt(balanceFormData.leaveTypeId),
        parseFloat(balanceFormData.totalDays),
        balanceFormData.year
      )
      setShowBalanceModal(false)
      setBalanceFormData({
        employeeId: '',
        leaveTypeId: '',
        totalDays: '',
        year: new Date().getFullYear()
      })
      // Reload data if viewing that employee's balances
      if (balanceFormData.employeeId === currentUserId) {
        await loadData()
      } else {
        alert('Leave balance assigned successfully')
      }
    } catch (error) {
      alert('Error assigning leave balance: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenLeaveTypeModal = (leaveType = null) => {
    if (leaveType) {
      setEditingLeaveType(leaveType)
      setLeaveTypeFormData({
        name: leaveType.name || '',
        code: leaveType.code || '',
        maxDays: leaveType.maxDays || '',
        carryForward: leaveType.carryForward || false,
        maxCarryForward: leaveType.maxCarryForward || '',
        monthlyLeave: leaveType.monthlyLeave || false,
        description: leaveType.description || '',
        active: leaveType.active !== undefined ? leaveType.active : true
      })
    } else {
      setEditingLeaveType(null)
      setLeaveTypeFormData({
        name: '',
        code: '',
        maxDays: '',
        carryForward: false,
        maxCarryForward: '',
        monthlyLeave: false,
        description: '',
        active: true
      })
    }
    setShowLeaveTypeModal(true)
  }

  const handleLeaveTypeSubmit = async (e) => {
    e.preventDefault()
    if (!leaveTypeFormData.name || !leaveTypeFormData.code) {
      alert('Please fill in name and code')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...leaveTypeFormData,
        maxDays: leaveTypeFormData.maxDays ? parseInt(leaveTypeFormData.maxDays) : null,
        maxCarryForward: leaveTypeFormData.maxCarryForward ? parseInt(leaveTypeFormData.maxCarryForward) : null
      }

      if (editingLeaveType) {
        await api.updateLeaveType(editingLeaveType.id, submitData)
        alert('Leave type updated successfully')
      } else {
        await api.createLeaveType(submitData)
        alert('Leave type created successfully')
      }
      
      setShowLeaveTypeModal(false)
      setEditingLeaveType(null)
      await loadData()
    } catch (error) {
      alert('Error saving leave type: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLeaveType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      await api.deleteLeaveType(id)
      alert('Leave type deleted successfully')
      await loadData()
    } catch (error) {
      alert('Error deleting leave type: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLeaveTypeActive = async (type) => {
    const newActive = !type.active
    setLoading(true)
    try {
      const res = await api.toggleLeaveTypeActive(type.id, newActive)
      if (res && res.success) {
        // Update the local row to reflect new active state
        setLeaveTypes(prev => prev.map(t => (t.id === type.id ? (res.leaveType || { ...t, active: newActive }) : t)))
        // Ensure server state is reflected
        await loadData()
      } else {
        throw new Error(res?.message || 'Failed to update status')
      }
    } catch (error) {
      alert('Error toggling leave type status: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const filteredLeaves = leaves.filter(leave => {
    // Search functionality
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = searchTerm === '' || 
      getEmployeeName(leave.employeeId).toLowerCase().includes(searchLower) ||
      getLeaveTypeName(leave.leaveTypeId).toLowerCase().includes(searchLower) ||
      leave.reason?.toLowerCase().includes(searchLower) ||
      leave.status?.toLowerCase().includes(searchLower) ||
      (leave.startDate && format(new Date(leave.startDate), 'MMM dd, yyyy').toLowerCase().includes(searchLower)) ||
      (leave.endDate && format(new Date(leave.endDate), 'MMM dd, yyyy').toLowerCase().includes(searchLower)) ||
      (leave.startDate && format(new Date(leave.startDate), 'dd/MM/yyyy').toLowerCase().includes(searchLower)) ||
      (leave.endDate && format(new Date(leave.endDate), 'dd/MM/yyyy').toLowerCase().includes(searchLower)) ||
      (leave.totalDays && leave.totalDays.toString().includes(searchLower))
    
    // Employee filter (for admin)
    const matchesEmployee = employeeFilter === 'All' || 
      leave.employeeId.toString() === employeeFilter

    // Status filter
    const matchesStatus = filter === 'All' || 
      leave.status?.toUpperCase() === filter.toUpperCase() ||
      (filter === 'PENDING' && (leave.status === 'Pending' || leave.status === 'PENDING'))

    return matchesSearch && matchesEmployee && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'PENDING' || l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'APPROVED' || l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'REJECTED' || l.status === 'Rejected').length,
    totalLeaveTypes: leaveTypes.length,
    activeLeaveTypes: leaveTypes.filter(lt => lt.active).length
  }

  if (loading && leaves.length === 0 && leaveTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leave data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Page Header with Apply Leave Button for Employees */}
      {((isEmployee || userRole === 'EMPLOYEE') || isManager || isFinance) && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-2 border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">My Leaves</h1>
              <p className="text-sm text-gray-600">View and manage your leave applications</p>
            </div>
            <button
              onClick={async () => {
                resetForm()
                // Refresh balances before opening modal to ensure they're up to date
                if (currentUserId) {
                  try {
                    const balances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                    setLeaveBalances(Array.isArray(balances) ? balances : [])
                    // If balances are empty or all 0, try to initialize
                    const balancesArray = Array.isArray(balances) ? balances : []
                    if (balancesArray.length === 0 || balancesArray.every(b => !b.totalDays || b.totalDays === 0)) {
                      if (leaveTypes.length > 0) {
                        await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                        const updatedBalances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                        setLeaveBalances(Array.isArray(updatedBalances) ? updatedBalances : [])
                      }
                    }
                  } catch (error) {
                    console.error('Error refreshing balances:', error)
                  }
                }
                setShowModal(true)
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
            >
              <Calendar size={20} />
              Apply Leave
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Leaves</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
        </div>
      </div>

      {/* Toggle Buttons for Leave Applications and Leave Types - Admin and HR_ADMIN */}
      {(isAdmin || isHrAdmin) && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('applications')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeView === 'applications'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={20} />
              Leave Applications
            </button>
            <button
              onClick={() => setActiveView('types')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeView === 'types'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SettingsIcon size={20} />
              Leave Types
            </button>
          </div>
        </div>
      )}

      {/* Filters and Actions - Only show for Leave Applications view */}
      {activeView === 'applications' && (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by employee, leave type, reason, date, status, or days..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                  <X size={18} />
              </button>
            )}
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Leaves</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {(isAdmin || isHrAdmin) && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Employees</option>
              {employees
                .filter(emp => {
                  const empRole = (emp.role || emp.designation || '').toUpperCase()
                  const empId = emp.id || emp.employeeId
                  
                  // For SUPER_ADMIN, exclude their own record from the dropdown
                  if (isSuperAdmin && currentUserId) {
                    const currentId = parseInt(currentUserId)
                    return empId !== currentId && parseInt(empId) !== currentId && empId.toString() !== currentUserId
                  }
                  
                  // For HR_ADMIN, only show MANAGER and FINANCE roles, exclude SUPER_ADMIN and HR_ADMIN
                  if (isHrAdmin) {
                    // Exclude SUPER_ADMIN and HR_ADMIN roles
                    if (empRole === 'SUPER_ADMIN' || empRole === 'HR_ADMIN') {
                      return false
                    }
                    // Exclude HR_ADMIN's own record
                    if (currentUserId) {
                      const currentId = parseInt(currentUserId)
                      if (empId === currentId || parseInt(empId) === currentId || empId.toString() === currentUserId) {
                        return false
                      }
                    }
                    // Only include MANAGER and FINANCE roles
                    return empRole === 'MANAGER' || empRole === 'FINANCE'
                  }
                  
                  return true
                })
                .map(emp => {
                  const employeeName = emp.name || `Employee ${emp.id}`
                  return (
                    <option key={emp.id} value={emp.id.toString()}>{employeeName}</option>
                  )
                })}
            </select>
          )}
          {isAdmin && (
            <button
              onClick={() => handleOpenLeaveTypeModal()}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
            >
                <Plus size={20} />
              Add Leave Type
            </button>
          )}
          {canApplyLeave && (
            <button
              onClick={async () => {
                resetForm()
                // Refresh balances before opening modal to ensure they're up to date
                if (currentUserId) {
                  try {
                    const balances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                    setLeaveBalances(Array.isArray(balances) ? balances : [])
                    // If balances are empty or all 0, try to initialize
                    const balancesArray = Array.isArray(balances) ? balances : []
                    if (balancesArray.length === 0 || balancesArray.every(b => !b.totalDays || b.totalDays === 0)) {
                      if (leaveTypes.length > 0) {
                        await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                        const updatedBalances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                        setLeaveBalances(Array.isArray(updatedBalances) ? updatedBalances : [])
                      }
                    }
                  } catch (error) {
                    console.error('Error refreshing balances:', error)
                  }
                }
                setShowModal(true)
              }}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
            >
                <Calendar size={20} />
              Apply Leave
            </button>
          )}
        </div>
      </div>
        </div>
      )}

      {/* Loading State - Only for Applications view */}
      {activeView === 'applications' && loading && !leaves.length && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading leave applications...</p>
        </div>
      )}

      {/* Leave Balances - Only visible to employees and HR_ADMIN (in Applications view) */}
      {activeView === 'applications' && canApplyLeave && (() => {
        // Remove duplicates by grouping by leaveTypeId (keep the one with highest totalDays or most recent)
        const uniqueBalances = leaveBalances.reduce((acc, balance) => {
          const typeId = balance.leaveTypeId
          const existing = acc.find(b => b.leaveTypeId === typeId)
          if (!existing) {
            acc.push(balance)
          } else {
            // Keep the one with higher totalDays, or if equal, keep the one with higher balance
            if (balance.totalDays > existing.totalDays || 
                (balance.totalDays === existing.totalDays && balance.balance > existing.balance)) {
              const index = acc.indexOf(existing)
              acc[index] = balance
            }
          }
          return acc
        }, [])

        if (uniqueBalances.length === 0) return null

              return (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Your Leave Balance</h3>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Year {new Date().getFullYear()}</p>
              </div>
              <button
                onClick={async () => {
                  if (currentUserId) {
                    try {
                      setLoading(true)
                      // Initialize leave balances
                      await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                      // Reload balances after initialization
                      const updatedBalances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                      setLeaveBalances(Array.isArray(updatedBalances) ? updatedBalances : [])
                      
                      // Show success message with proper styling
                      const successMsg = document.createElement('div')
                      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
                      successMsg.style.opacity = '1'
                      successMsg.style.transform = 'translateY(0)'
                      successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Leave balances refreshed successfully!</span>'
                      document.body.appendChild(successMsg)
                      
                      setTimeout(() => {
                        successMsg.style.opacity = '0'
                        successMsg.style.transform = 'translateY(-20px)'
                        setTimeout(() => {
                          if (document.body.contains(successMsg)) {
                            document.body.removeChild(successMsg)
                          }
                        }, 300)
                      }, 3000)
                    } catch (error) {
                      // Show error message with proper styling
                      const errorMsg = document.createElement('div')
                      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
                      errorMsg.style.opacity = '1'
                      errorMsg.style.transform = 'translateY(0)'
                      const errorText = error?.message || error?.error || 'Unknown error'
                      errorMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span>Error refreshing balances: ' + errorText + '</span>'
                      document.body.appendChild(errorMsg)
                      
                      setTimeout(() => {
                        errorMsg.style.opacity = '0'
                        errorMsg.style.transform = 'translateY(-20px)'
                        setTimeout(() => {
                          if (document.body.contains(errorMsg)) {
                            document.body.removeChild(errorMsg)
                          }
                        }, 300)
                      }, 4000)
                    } finally {
                      setLoading(false)
                    }
                  }
                }}
                className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Refresh Leave Balances"
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {uniqueBalances.map((balance) => {
                const type = leaveTypes.find(t => {
                  const typeId = typeof t.id === 'string' ? parseInt(t.id) : t.id
                  const balanceTypeId = typeof balance.leaveTypeId === 'string' ? parseInt(balance.leaveTypeId) : balance.leaveTypeId
                  return typeId === balanceTypeId
                })
                const hasZeroBalance = balance.balance === 0 && balance.totalDays === 0
                const usagePercentage = balance.totalDays > 0 ? (balance.usedDays / balance.totalDays) * 100 : 0
                const isLowBalance = balance.balance <= balance.totalDays * 0.2 && balance.totalDays > 0
                
                return (
                  <div 
                    key={`${balance.leaveTypeId}-${balance.id}`} 
                    className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 transform hover:scale-105 ${
                      hasZeroBalance 
                        ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' 
                        : isLowBalance
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                        : 'bg-gradient-to-br from-blue-50 to-white border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className={`text-base font-bold mb-1 ${
                          hasZeroBalance ? 'text-yellow-800' : 
                          isLowBalance ? 'text-orange-800' : 
                          'text-blue-800'
                        }`}>
                          {type?.name || 'Unknown Leave Type'}
                        </p>
                        {type?.code && (
                          <p className={`text-xs font-medium ${
                            hasZeroBalance ? 'text-yellow-600' : 
                            isLowBalance ? 'text-orange-600' : 
                            'text-blue-600'
                          }`}>{type.code}</p>
                        )}
                      </div>
                      {hasZeroBalance && type && type.maxDays && (
                        <span className={`text-xs font-bold ${
                          hasZeroBalance ? 'bg-yellow-200 text-yellow-800' : 
                          isLowBalance ? 'bg-orange-200 text-orange-800' : 
                          'bg-blue-200 text-blue-800'
                        } px-3 py-1.5 rounded-full`}>
                          Max: {type.maxDays}
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <p className={`text-5xl font-bold mb-2 ${
                        hasZeroBalance ? 'text-yellow-700' : 
                        isLowBalance ? 'text-orange-700' : 
                        'text-blue-700'
                      }`}>
                        {balance.balance.toFixed(1)}
                        <span className="text-xl font-normal ml-2 text-gray-600">days</span>
                      </p>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        Available Balance
                      </p>
                    </div>

                    {/* Progress Bar */}
                    {balance.totalDays > 0 && (
                      <div className="mb-4">
                        <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${
                          hasZeroBalance ? 'text-yellow-700' : 
                          isLowBalance ? 'text-orange-700' : 
                          'text-blue-700'
                        }`}>
                          <span>Used: {balance.usedDays.toFixed(1)} / {balance.totalDays.toFixed(1)} days</span>
                          <span className="font-bold">{usagePercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 shadow-md ${
                              usagePercentage >= 80 ? 'bg-red-500' : 
                              usagePercentage >= 50 ? 'bg-orange-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    {balance.carriedForward > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        ↳ Carried forward: {balance.carriedForward.toFixed(1)} days
                      </p>
                    )}
                </div>
              )
            })}
            </div>
            {uniqueBalances.some(b => b.balance === 0 && b.totalDays === 0) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                      Some balances are not initialized
                    </p>
                    <p className="text-xs text-yellow-700">
                      Click "Refresh" above to initialize balances from leave type settings, or contact your admin to assign leave balances.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Leaves List - Redesigned */}
      {activeView === 'applications' && (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">S.No</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Days</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Search className="text-gray-400 mb-3" size={48} />
                      <p className="text-gray-500 font-medium mb-1">
                        {searchTerm || employeeFilter !== 'All' || filter !== 'All' 
                          ? 'No leaves match your search criteria' 
                          : 'No leaves found'}
                      </p>
                      {(searchTerm || employeeFilter !== 'All' || filter !== 'All') && (
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setEmployeeFilter('All')
                            setFilter('All')
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave, index) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                        {getEmployeeName(leave.employeeId)?.charAt(0) || 'E'}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{getEmployeeName(leave.employeeId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getLeaveTypeName(leave.leaveTypeId)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </div>
                    {leave.halfDay && (
                      <div className="text-xs text-gray-500">Half Day ({leave.halfDayType})</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{leave.totalDays} days</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{leave.reason}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                      leave.status === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' :
                      leave.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {leave.rejectionReason && (
                        <div className="text-xs text-red-600" title={leave.rejectionReason}>
                          <AlertCircle size={16} />
                        </div>
                      )}
                      <div className="relative inline-block dropdown-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const button = e.currentTarget
                            const rect = button.getBoundingClientRect()
                            const spaceBelow = window.innerHeight - rect.bottom
                            const spaceAbove = rect.top
                            const dropdownHeight = 200
                            
                            // Determine position: show below if enough space, otherwise above
                            const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                            
                            setDropdownPosition(prev => ({
                              ...prev,
                              [leave.id]: {
                                showAbove,
                                top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                right: window.innerWidth - rect.right
                              }
                            }))
                            setOpenDropdownId(openDropdownId === leave.id ? null : leave.id)
                          }}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDropdownId === leave.id && dropdownPosition[leave.id] && (
                          <div 
                            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                            style={{ 
                              zIndex: 9999,
                              top: `${dropdownPosition[leave.id].top}px`,
                              right: `${dropdownPosition[leave.id].right}px`
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeave(leave)
                                setShowDetailsModal(true)
                                setOpenDropdownId(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye size={16} className="text-blue-600" />
                              View Details
                            </button>
                            {(isAdmin || isHrAdmin) && leave.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLeave(leave)
                                    setShowApprovalModal(true)
                                    setOpenDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <CheckCircle size={16} className="text-green-600" />
                                  Review
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditModal(leave)
                                    setOpenDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Edit size={16} className="text-blue-600" />
                                  Edit
                                </button>
                              </>
                            )}
                            {(isAdmin || (canApplyLeave && leave.employeeId.toString() === currentUserId)) && 
                             leave.status === 'PENDING' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelLeave(leave.id)
                                  setOpenDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <X size={16} className="text-gray-600" />
                                Cancel
                              </button>
                            )}
                            {(isAdmin || (canApplyLeave && leave.employeeId.toString() === currentUserId)) && leave.status !== 'APPROVED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLeave(leave.id)
                                  setOpenDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Leave Types View - Admin and HR_ADMIN */}
      {activeView === 'types' && (isAdmin || isHrAdmin) && (
        <>
          {/* Filters and Actions for Leave Types */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => handleOpenLeaveTypeModal()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add Leave Type
                </button>
              </div>
            </div>
          </div>

          {/* Warning if no leave types */}
          {leaveTypes.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>No leave types found.</strong> Click "Add Leave Type" button above to create leave types.
              </p>
            </div>
          )}

          {/* Leave Types Table */}
          {leaveTypes.length > 0 && (
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Leave Types</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  List of all configured leave types. Use the &quot;Add Leave Type&quot; button above to create new types.
                </p>
              </div>
              <div className="p-4 md:p-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Max Days</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Carry Forward</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{type.name}</div>
                            {type.description && (
                              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {type.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {type.maxDays ? `${type.maxDays} days` : 'Unlimited'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {type.carryForward ? (
                              <span className="text-green-600 font-semibold">
                                Yes {type.maxCarryForward ? `(Max: ${type.maxCarryForward})` : ''}
                              </span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              type.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {type.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* Toggle active/inactive */}
                            <label className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={!!type.active}
                                onChange={() => handleToggleLeaveTypeActive(type)}
                                className="form-checkbox h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                title={type.active ? 'Turn off' : 'Turn on'}
                              />
                              <span className="text-xs text-gray-600">{type.active ? 'On' : 'Off'}</span>
                            </label>
                            <div className="relative inline-block dropdown-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const button = e.currentTarget
                                  const rect = button.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const spaceAbove = rect.top
                                  const dropdownHeight = 120
                                  
                                  // Determine position: show below if enough space, otherwise above
                                  const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                  
                                  setDropdownPosition(prev => ({
                                    ...prev,
                                    [`type-${type.id}`]: {
                                      showAbove,
                                      top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                      right: window.innerWidth - rect.right
                                    }
                                  }))
                                  setOpenDropdownId(openDropdownId === `type-${type.id}` ? null : `type-${type.id}`)
                                }}
                                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {openDropdownId === `type-${type.id}` && dropdownPosition[`type-${type.id}`] && (
                                <div 
                                  className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                  style={{ 
                                    zIndex: 9999,
                                    top: `${dropdownPosition[`type-${type.id}`].top}px`,
                                    right: `${dropdownPosition[`type-${type.id}`].right}px`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenLeaveTypeModal(type)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Edit size={16} className="text-blue-600" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteLeaveType(type.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Calendar size={24} className="text-blue-600" />
                Apply for Leave
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {validationError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  {typeof validationError === 'string' ? validationError : String(validationError)}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => {
                        const employeeName = emp.name || `Employee ${emp.id}`
                        return (
                          <option key={emp.id} value={emp.id.toString()}>{employeeName}</option>
                        )
                      })}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type *</label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={async (e) => {
                      setFormData({ ...formData, leaveTypeId: e.target.value })
                      // If balance is 0 and leave type has maxDays, try to initialize balance
                      if (e.target.value && currentUserId) {
                        const selectedType = leaveTypes.find(t => t.id === parseInt(e.target.value))
                        const currentBalance = getLeaveBalance(parseInt(e.target.value))
                        if (currentBalance === 0 && selectedType && selectedType.maxDays && selectedType.maxDays > 0) {
                          try {
                            // Force initialization by calling getOrCreateLeaveBalance through a dummy API call
                            // This will trigger the backend to update the balance if it's 0
                            await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                            // Reload balances to get updated values
                            const balances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                            setLeaveBalances(Array.isArray(balances) ? balances : [])
                            // Clear validation error if balance was successfully initialized
                            if (validationError && validationError.includes('Insufficient leave balance')) {
                              setValidationError('')
                            }
                          } catch (error) {
                            console.error('Error initializing balance for leave type:', error)
                          }
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                    disabled={leaveTypes.length === 0}
                  >
                    <option value="">
                      {leaveTypes.length === 0 ? 'No leave types available' : 'Select Leave Type'}
                    </option>
                    {leaveTypes.map(type => {
                      const balance = getLeaveBalance(type.id)
                      return (
                      <option key={type.id} value={type.id}>
                          {type.name} {type.maxDays ? `(Max: ${type.maxDays} days)` : ''} (Balance: {balance.toFixed(1)})
                      </option>
                      )
                    })}
                  </select>
                  {leaveTypes.length === 0 && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Please create leave types in Settings page first
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Half Day</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.halfDay}
                        onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                        className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Half Day</span>
                    </label>
                    {formData.halfDay && (
                      <select
                        value={formData.halfDayType}
                        onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                        className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FIRST_HALF">First Half</option>
                        <option value="SECOND_HALF">Second Half</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min={formData.startDate || undefined}
                  />
                </div>
              </div>
              {calculatedDays > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-blue-600" />
                    <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Leave Summary</p>
                  </div>
                  <p className="text-base text-blue-900 font-semibold">
                    <strong>Total Days:</strong> {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                    {formData.leaveTypeId && (
                      <span className="ml-3 text-sm">
                        (Available Balance: <span className="font-bold">{getLeaveBalance(parseInt(formData.leaveTypeId)).toFixed(1)} days</span>)
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  required
                  placeholder="Please provide a reason for your leave application..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal - Redesigned */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <CheckCircle size={24} className="text-blue-600" />
                Review Leave Application
              </h3>
            </div>
            <div className="space-y-3 mb-4">
              <p><strong>Employee:</strong> {getEmployeeName(selectedLeave.employeeId)}</p>
              <p><strong>Leave Type:</strong> {getLeaveTypeName(selectedLeave.leaveTypeId)}</p>
              <p><strong>Dates:</strong> {format(new Date(selectedLeave.startDate), 'MMM dd')} - {format(new Date(selectedLeave.endDate), 'MMM dd, yyyy')}</p>
              <p><strong>Days:</strong> {selectedLeave.totalDays}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleReject(selectedLeave.id)}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedLeave.id)}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Approve
              </button>
            </div>
            <button
              onClick={() => {
                setShowApprovalModal(false)
                setSelectedLeave(null)
                setRejectionReason('')
              }}
              className="w-full mt-3 px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Leave Modal - Redesigned */}
      {showEditModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Edit size={24} className="text-blue-600" />
                Edit Leave Application
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {validationError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  {typeof validationError === 'string' ? validationError : String(validationError)}
                </p>
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      {employees.map(emp => {
                        const employeeName = emp.name || `Employee ${emp.id}`
                        return (
                          <option key={emp.id} value={emp.id.toString()}>{employeeName}</option>
                        )
                      })}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} (Balance: {getLeaveBalance(type.id).toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                    min={formData.startDate || undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Half Day</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.halfDay}
                        onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Half Day</span>
                    </label>
                    {formData.halfDay && (
                      <select
                        value={formData.halfDayType}
                        onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="FIRST_HALF">First Half</option>
                        <option value="SECOND_HALF">Second Half</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              {calculatedDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Total Days:</strong> {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  {loading ? 'Updating...' : 'Update Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal - Redesigned */}
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Eye size={24} className="text-blue-600" />
                Leave Application Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedLeave(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-semibold text-gray-900">{getEmployeeName(selectedLeave.employeeId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <p className="font-semibold text-gray-900">{getLeaveTypeName(selectedLeave.leaveTypeId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-semibold text-gray-900">{format(new Date(selectedLeave.startDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-semibold text-gray-900">{format(new Date(selectedLeave.endDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="font-semibold text-gray-900">{selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'day' : 'days'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedLeave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    selectedLeave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    selectedLeave.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
                {selectedLeave.halfDay && (
                  <div>
                    <p className="text-sm text-gray-600">Half Day Type</p>
                    <p className="font-semibold text-gray-900">{selectedLeave.halfDayType}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Applied Date</p>
                  <p className="font-semibold text-gray-900">
                    {selectedLeave.appliedDate ? format(new Date(selectedLeave.appliedDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                {selectedLeave.approvedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Approved Date</p>
                    <p className="font-semibold text-gray-900">{format(new Date(selectedLeave.approvedDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                {selectedLeave.approvedBy && (
                    <div>
                      <p className="text-sm text-gray-600">Approved By</p>
                      <p className="font-semibold text-gray-900">{getApproverName(selectedLeave.approvedBy)}</p>
                    </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Reason</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLeave.reason}</p>
              </div>
              {selectedLeave.rejectionReason && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rejection Reason</p>
                  <p className="text-red-900 bg-red-50 p-3 rounded-lg">{selectedLeave.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedLeave(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Leave Balance Modal (Admin Only) - Redesigned */}
      {showBalanceModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <User size={24} className="text-blue-600" />
                Assign Leave Balance
              </h3>
              <button
                onClick={() => {
                  setShowBalanceModal(false)
                  setBalanceFormData({
                    employeeId: '',
                    leaveTypeId: '',
                    totalDays: '',
                    year: new Date().getFullYear()
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignBalance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={balanceFormData.employeeId}
                    onChange={(e) => setBalanceFormData({ ...balanceFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => {
                      const employeeName = emp.name || `Employee ${emp.id}`
                      return (
                        <option key={emp.id} value={emp.id.toString()}>{employeeName} {emp.department ? `(${emp.department})` : ''}</option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                  <select
                    value={balanceFormData.leaveTypeId}
                    onChange={(e) => setBalanceFormData({ ...balanceFormData, leaveTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.code}) {type.maxDays ? `- Max: ${type.maxDays} days` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Available Days *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceFormData.totalDays}
                    onChange={(e) => setBalanceFormData({ ...balanceFormData, totalDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter total available days (e.g., 12)"
                    required
                  />
                  {balanceFormData.leaveTypeId && (() => {
                    const selectedType = leaveTypes.find(t => t.id === parseInt(balanceFormData.leaveTypeId))
                    if (selectedType && selectedType.maxDays) {
                      return (
                        <p className="text-xs text-gray-500 mt-1">
                          Leave type maximum: {selectedType.maxDays} days per year
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={balanceFormData.year}
                    onChange={(e) => setBalanceFormData({ ...balanceFormData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="2020"
                    max="2100"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>📋 How it works:</strong>
                </p>
                <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>This assigns the total available days for the selected leave type to the employee</li>
                  <li>The balance is stored in the system and displayed to the employee</li>
                  <li>Employee can apply for leave within their assigned limits</li>
                  <li>Days are automatically deducted from balance only when leave is <strong>approved</strong></li>
                  <li>Rejected or pending leaves do not affect the balance</li>
                </ol>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowBalanceModal(false)
                    setBalanceFormData({
                      employeeId: '',
                      leaveTypeId: '',
                      totalDays: '',
                      year: new Date().getFullYear()
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  {loading ? 'Assigning...' : 'Assign Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Type Create/Edit Modal */}
      {showLeaveTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                {editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
              </h3>
              <button
                onClick={() => {
                  setShowLeaveTypeModal(false)
                  setEditingLeaveType(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleLeaveTypeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={leaveTypeFormData.name}
                    onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Casual Leave"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={leaveTypeFormData.code}
                    onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., CL"
                    required
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {leaveTypeFormData.monthlyLeave ? 'Max Days Per Month' : 'Max Days Per Year'}
                  </label>
                  <input
                    type="number"
                    value={leaveTypeFormData.maxDays}
                    onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, maxDays: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {leaveTypeFormData.monthlyLeave 
                      ? 'Maximum days allowed per month (optional)' 
                      : 'Maximum days allowed per year (optional)'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Carry Forward Days
                  </label>
                  <input
                    type="number"
                    value={leaveTypeFormData.maxCarryForward}
                    onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, maxCarryForward: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Only if carry forward enabled"
                    min="0"
                    disabled={!leaveTypeFormData.carryForward}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveTypeFormData.carryForward}
                      onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, carryForward: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Allow Carry Forward</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveTypeFormData.monthlyLeave}
                      onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, monthlyLeave: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Monthly Leave</span>
                  </label>
                  <span className="text-xs text-gray-500">(Per month - Resets every month)</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveTypeFormData.active}
                      onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, active: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={leaveTypeFormData.description}
                  onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows={3}
                  placeholder="Enter description for this leave type..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveTypeModal(false)
                    setEditingLeaveType(null)
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Saving...' : editingLeaveType ? 'Update Leave Type' : 'Create Leave Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveManagement
