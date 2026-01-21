import { useState, useEffect } from 'react'
import { Clock, Plus, Edit, Trash2, Users, Search, Filter, Grid, List, X, Check, UserPlus, UserMinus, Eye, Calendar, Timer, Pencil, Send, ArrowLeftRight, FileText, MoreVertical, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'

const Shifts = () => {
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [employeeShift, setEmployeeShift] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showTeamAssignModal, setShowTeamAssignModal] = useState(false)
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [selectedShift, setSelectedShift] = useState(null)
  const [shiftEmployees, setShiftEmployees] = useState([])
  const [shiftEmployeeCounts, setShiftEmployeeCounts] = useState({}) // Store employee counts per shift
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    breakDuration: '',
    description: '',
    active: true
  })
  const [assignFormData, setAssignFormData] = useState({
    shiftId: '',
    employeeId: '',
    startDate: '',
    endDate: ''
  })
  const [teamAssignFormData, setTeamAssignFormData] = useState({
    shiftId: '',
    teamId: '',
    startDate: '',
    endDate: ''
  })
  const [teams, setTeams] = useState([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([])
  const [editAssignmentFormData, setEditAssignmentFormData] = useState({
    startDate: '',
    endDate: ''
  })
  const [shiftChangeRequests, setShiftChangeRequests] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestFormData, setRequestFormData] = useState({
    requestedShiftId: '',
    reason: ''
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeView, setActiveView] = useState('shifts') // 'shifts', 'requests', or 'assignments'
  const [allAssignments, setAllAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({})
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('')
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all')
  const [assignmentDepartmentFilter, setAssignmentDepartmentFilter] = useState('all')
  const [assignmentShiftFilter, setAssignmentShiftFilter] = useState('all')
  const [assignmentStartDateFilter, setAssignmentStartDateFilter] = useState('')
  const [assignmentEndDateFilter, setAssignmentEndDateFilter] = useState('')
  // Check if user is employee or admin
  const userRole = localStorage.getItem('userRole')
  const userType = localStorage.getItem('userType')
  // Employee detection: userType === 'employee' OR userRole === 'EMPLOYEE' OR not admin
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'MANAGER' || userRole === 'FINANCE'
  const isEmployee = userType === 'employee' || userRole === 'EMPLOYEE' || (!isAdmin && userType !== 'admin')
  const currentUserId = localStorage.getItem('userId')

  useEffect(() => {
    if (isEmployee) {
      loadEmployeeShift()
      loadAllShiftsForEmployee() // Load all shifts for shift change request dropdown
      loadShiftChangeRequests()
    } else {
      loadData()
      loadShiftChangeRequests()
      loadTeams() // Load teams for team assignment
    }
  }, [isEmployee])

  useEffect(() => {
    if (!isEmployee && activeView === 'assignments' && shifts.length > 0) {
      loadAllAssignments()
    }
  }, [activeView, isEmployee, shifts])

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

  const loadEmployeeShift = async () => {
    try {
      setLoading(true)
      setError(null)
      const empId = currentUserId ? parseInt(currentUserId) : null
      if (!empId) {
        setError('Employee ID not found')
        return
      }
      const shift = await api.getShiftByEmployeeId(empId)
      // The API now returns shift with assignment dates
      console.log('Shift data received:', shift)
      console.log('Assignment dates:', {
        startDate: shift?.assignmentStartDate,
        endDate: shift?.assignmentEndDate
      })
      
      // Calculate working hours for employee shift
      if (shift) {
        shift.workingHours = calculateWorkingHours(shift.startTime, shift.endTime, shift.breakDuration)
      }
      
      setEmployeeShift(shift)
    } catch (error) {
      console.error('Error loading employee shift:', error)
      setError('Failed to load shift information')
    } finally {
      setLoading(false)
    }
  }

  const loadAllShiftsForEmployee = async () => {
    try {
      const shiftsData = await api.getShifts()
      const shiftsArray = Array.isArray(shiftsData) ? shiftsData : []
      
      // Calculate working hours for each shift
      const shiftsWithWorkingHours = shiftsArray.map(shift => ({
        ...shift,
        workingHours: calculateWorkingHours(shift.startTime, shift.endTime, shift.breakDuration)
      }))
      
      setShifts(shiftsWithWorkingHours)
    } catch (error) {
      console.error('Error loading shifts:', error)
      // Don't set error here, just log it - this is for dropdown only
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [shiftsData, employeesData] = await Promise.all([
        api.getShifts(),
        api.getEmployees()
      ])
      const shiftsArray = Array.isArray(shiftsData) ? shiftsData : []
      
      // Calculate working hours for each shift
      const shiftsWithWorkingHours = shiftsArray.map(shift => ({
        ...shift,
        workingHours: calculateWorkingHours(shift.startTime, shift.endTime, shift.breakDuration)
      }))
      
      setShifts(shiftsWithWorkingHours)
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
      
      // Load employee counts for each shift
      const counts = {}
      await Promise.all(
        shiftsWithWorkingHours.map(async (shift) => {
          try {
            const employees = await api.getEmployeesByShift(shift.id)
            counts[shift.id] = Array.isArray(employees) ? employees.length : 0
          } catch (error) {
            console.error(`Error loading employees for shift ${shift.id}:`, error)
            counts[shift.id] = 0
          }
        })
      )
      setShiftEmployeeCounts(counts)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load shifts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadTeams = async () => {
    try {
      const teamsData = await api.getTeams()
      setTeams(Array.isArray(teamsData) ? teamsData : [])
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }

  const loadShiftEmployees = async (shiftId) => {
    try {
      const [employeesData, teamsData] = await Promise.all([
        api.getEmployeesByShift(shiftId),
        api.getTeams()
      ])
      const employees = Array.isArray(employeesData) ? employeesData : []
      
      // Create a map of employee ID to team names
      const employeeTeamMap = new Map()
      teamsData.forEach(team => {
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach(member => {
            const empId = member.employeeId
            if (!employeeTeamMap.has(empId)) {
              employeeTeamMap.set(empId, [])
            }
            employeeTeamMap.get(empId).push(team.name)
          })
        }
      })
      
      // Add team names to each employee
      const employeesWithTeams = employees.map(emp => ({
        ...emp,
        teamNames: employeeTeamMap.get(emp.id) || []
      }))
      
      setShiftEmployees(employeesWithTeams)
    } catch (error) {
      console.error('Error loading shift employees:', error)
      setShiftEmployees([])
    }
  }

  const loadAllAssignments = async () => {
    setLoadingAssignments(true)
    try {
      const allEmployees = await api.getEmployees()
      const allTeams = await api.getTeams()
      const assignments = []
      
      // Create a map of employee ID to team names
      const employeeTeamMap = new Map()
      allTeams.forEach(team => {
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach(member => {
            const empId = member.employeeId
            if (!employeeTeamMap.has(empId)) {
              employeeTeamMap.set(empId, [])
            }
            employeeTeamMap.get(empId).push(team.name)
          })
        }
      })
      
      for (const employee of allEmployees) {
        if (employee.shiftId) {
          const shift = shifts.find(s => s.id === employee.shiftId)
          if (shift) {
            const teamNames = employeeTeamMap.get(employee.id) || []
            assignments.push({
              employeeId: employee.id,
              employeeName: employee.name || 'N/A',
              employeeEmail: employee.email || 'N/A',
              employeeIdCode: employee.employeeId || `ID: ${employee.id}`,
              department: employee.department || 'N/A',
              teamNames: teamNames,
              shiftId: shift.id,
              shiftName: shift.name,
              shiftTime: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
              workingHours: calculateWorkingHours(shift.startTime, shift.endTime, shift.breakDuration), // Store as number for formatting
              startDate: employee.shiftAssignmentStartDate || null,
              endDate: employee.shiftAssignmentEndDate || null,
              status: employee.shiftAssignmentEndDate ? 'Temporary' : 'Permanent'
            })
          }
        }
      }
      
      setAllAssignments(assignments)
    } catch (error) {
      console.error('Error loading shift assignments:', error)
      setError('Failed to load shift assignments')
      setAllAssignments([])
    } finally {
      setLoadingAssignments(false)
    }
  }

  const loadShiftChangeRequests = async () => {
    try {
      const empId = currentUserId ? parseInt(currentUserId) : null
      if (isEmployee && empId) {
        const data = await api.getShiftChangeRequestsByEmployee(empId)
        setShiftChangeRequests(Array.isArray(data) ? data : [])
      } else if (isAdmin) {
        const data = await api.getAllShiftChangeRequests()
        setShiftChangeRequests(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading shift change requests:', error)
      setShiftChangeRequests([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Validate time format
      if (!formData.startTime || !formData.endTime) {
        throw new Error('Start time and end time are required')
      }

      const shiftData = {
        ...formData,
        breakDuration: formData.breakDuration ? parseInt(formData.breakDuration) : null
      }

      const response = editingShift
        ? await api.updateShift(editingShift.id, shiftData)
        : await api.createShift(shiftData)

      if (response.success === false) {
        throw new Error(response.message || 'Failed to save shift')
      }

      await loadData()
      setShowModal(false)
      resetForm()
      setSuccessMessage(editingShift ? 'Shift updated successfully!' : 'Shift created successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error saving shift')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift? This will unassign all employees from this shift.')) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await api.deleteShift(id)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to delete shift')
      }

      await loadData()
      setSuccessMessage('Shift deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error deleting shift')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignEmployee = async (e) => {
    e.preventDefault()
    if (!assignFormData.employeeId) {
      setError('Please select an employee')
      return
    }

    if (!assignFormData.startDate) {
      setError('Please select a start date')
      return
    }

    // Validate date range if end date is provided
    if (assignFormData.endDate && assignFormData.startDate > assignFormData.endDate) {
      setError('End date must be after start date')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Prepare assignment data with dates
      const assignmentData = {
        employeeId: parseInt(assignFormData.employeeId),
        startDate: assignFormData.startDate,
        endDate: assignFormData.endDate || null
      }
      
      // Determine which shift to use
      const shiftId = selectedShift ? selectedShift.id : (assignFormData.shiftId ? parseInt(assignFormData.shiftId) : null)
      
      if (!shiftId) {
        setError('Please select a shift')
        setLoading(false)
        return
      }
      
      const response = await api.assignEmployeeToShift(shiftId, assignmentData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to assign employee')
      }

      if (selectedShift) {
        await loadShiftEmployees(selectedShift.id)
      }
      await loadData() // Reload employees to refresh shift assignments
      if (activeView === 'assignments') {
        await loadAllAssignments() // Reload assignments table if on assignments view
      }
      setShowAssignModal(false)
      setAssignFormData({ shiftId: '', employeeId: '', startDate: '', endDate: '' })
      setSelectedShift(null)
      setSuccessMessage('Employee assigned successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error assigning employee')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAssignment = (employee) => {
    setEditingEmployee(employee)
    // Get current assignment dates from employee object
    const startDate = employee.shiftAssignmentStartDate || ''
    const endDate = employee.shiftAssignmentEndDate || ''
    setEditAssignmentFormData({
      startDate: startDate ? (startDate.includes('T') ? startDate.split('T')[0] : startDate) : '',
      endDate: endDate ? (endDate.includes('T') ? endDate.split('T')[0] : endDate) : ''
    })
    setShowEditAssignmentModal(true)
  }

  const handleUpdateAssignment = async (e) => {
    e.preventDefault()
    if (!editingEmployee || !selectedShift) return

    if (!editAssignmentFormData.startDate) {
      setError('Please select a start date')
      return
    }

    // Validate date range if end date is provided
    if (editAssignmentFormData.endDate && editAssignmentFormData.startDate > editAssignmentFormData.endDate) {
      setError('End date must be after start date')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const assignmentData = {
        employeeId: editingEmployee.id,
        startDate: editAssignmentFormData.startDate,
        endDate: editAssignmentFormData.endDate || null
      }
      
      const response = await api.updateEmployeeAssignment(selectedShift.id, assignmentData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update assignment')
      }

      await loadShiftEmployees(selectedShift.id)
      await loadData() // Reload employees to refresh shift assignments and counts
      if (activeView === 'assignments') {
        await loadAllAssignments() // Reload assignments table if on assignments view
      }
      setShowEditAssignmentModal(false)
      setEditingEmployee(null)
      setEditAssignmentFormData({ startDate: '', endDate: '' })
      setSuccessMessage('Assignment updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error updating assignment')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to unassign this employee from the shift?')) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.unassignEmployeeFromShift(selectedShift.id, employeeId)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to unassign employee')
      }

      await loadShiftEmployees(selectedShift.id)
      await loadData() // Reload employees to refresh shift assignments and counts
      setSuccessMessage('Employee unassigned successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error unassigning employee')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAssignmentFromTable = (assignment) => {
    // Find the shift from the assignment
    const shift = shifts.find(s => s.id === assignment.shiftId)
    if (!shift) {
      setError('Shift not found')
      return
    }
    
    // Find the employee from the assignment
    const employee = employees.find(e => e.id === assignment.employeeId)
    if (!employee) {
      setError('Employee not found')
      return
    }
    
    setSelectedShift(shift)
    setEditingEmployee({
      ...employee,
      shiftAssignmentStartDate: assignment.startDate,
      shiftAssignmentEndDate: assignment.endDate
    })
    
    const startDate = assignment.startDate || ''
    const endDate = assignment.endDate || ''
    setEditAssignmentFormData({
      startDate: startDate ? (startDate.includes('T') ? startDate.split('T')[0] : startDate) : '',
      endDate: endDate ? (endDate.includes('T') ? endDate.split('T')[0] : endDate) : ''
    })
    setShowEditAssignmentModal(true)
  }

  const handleDeleteAssignmentFromTable = async (assignment) => {
    if (!window.confirm(`Are you sure you want to unassign ${assignment.employeeName} from ${assignment.shiftName}?`)) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.unassignEmployeeFromShift(assignment.shiftId, assignment.employeeId)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to unassign employee')
      }

      await loadAllAssignments()
      await loadData()
      setSuccessMessage('Employee unassigned successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error unassigning employee')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      breakDuration: '',
      description: '',
      active: true
    })
  }

  const openModal = (shift = null) => {
    if (shift) {
      setEditingShift(shift)
      setFormData({
        name: shift.name || '',
        startTime: shift.startTime || '',
        endTime: shift.endTime || '',
        breakDuration: shift.breakDuration?.toString() || '',
        description: shift.description || '',
        active: shift.active !== false
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const openEmployeeModal = async (shift) => {
    setSelectedShift(shift)
    await loadShiftEmployees(shift.id)
    setShowEmployeeModal(true)
  }

  const openAssignModal = (shift = null) => {
    setSelectedShift(shift)
    setAssignFormData({ 
      shiftId: shift ? shift.id.toString() : '',
      employeeId: '', 
      startDate: '',
      endDate: ''
    })
    setShowAssignModal(true)
  }

  const openTeamAssignModal = async (shift = null) => {
    setSelectedShift(shift)
    setTeamAssignFormData({ 
      shiftId: shift ? shift.id.toString() : '',
      teamId: '',
      startDate: '',
      endDate: ''
    })
    setSelectedTeamMembers([])
    setShowTeamAssignModal(true)
  }

  const handleTeamSelection = async (teamId) => {
    if (!teamId) {
      setSelectedTeamMembers([])
      return
    }
    
    try {
      const team = await api.getTeamById(teamId)
      if (team && team.members) {
        const memberIds = team.members.map(member => member.employeeId)
        setSelectedTeamMembers(memberIds)
      } else {
        setSelectedTeamMembers([])
      }
    } catch (error) {
      console.error('Error loading team members:', error)
      setError('Failed to load team members')
      setSelectedTeamMembers([])
    }
  }

  const handleAssignTeam = async (e) => {
    e.preventDefault()
    if (!teamAssignFormData.teamId) {
      setError('Please select a team')
      return
    }

    if (selectedTeamMembers.length === 0) {
      setError('Selected team has no members')
      return
    }

    if (!teamAssignFormData.startDate) {
      setError('Please select a start date')
      return
    }

    // Validate date range if end date is provided
    if (teamAssignFormData.endDate && teamAssignFormData.startDate > teamAssignFormData.endDate) {
      setError('End date must be after start date')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Prepare assignment data with dates
      const assignmentData = {
        employeeIds: selectedTeamMembers.map(id => parseInt(id)),
        startDate: teamAssignFormData.startDate,
        endDate: teamAssignFormData.endDate || null
      }
      
      // Determine which shift to use
      const shiftId = selectedShift ? selectedShift.id : (teamAssignFormData.shiftId ? parseInt(teamAssignFormData.shiftId) : null)
      
      if (!shiftId) {
        setError('Please select a shift')
        setLoading(false)
        return
      }

      const response = await api.assignTeamToShift(shiftId, assignmentData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to assign team')
      }

      if (selectedShift) {
        await loadShiftEmployees(selectedShift.id)
      }
      await loadData() // Reload employees to refresh shift assignments
      if (activeView === 'assignments') {
        await loadAllAssignments() // Reload assignments table if on assignments view
      }
      
      setShowTeamAssignModal(false)
      setTeamAssignFormData({ shiftId: '', teamId: '', startDate: '', endDate: '' })
      setSelectedTeamMembers([])
      setSelectedShift(null)
      
      const successMsg = response.successCount > 0 
        ? `Successfully assigned ${response.successCount} employee(s) from team${response.failureCount > 0 ? `. ${response.failureCount} failed.` : ''}`
        : 'Failed to assign employees'
      setSuccessMessage(successMsg)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setError(error.message || 'Error assigning team')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const getTeamMemberNames = () => {
    if (selectedTeamMembers.length === 0) return []
    return selectedTeamMembers.map(empId => {
      const emp = employees.find(e => e.id === parseInt(empId))
      return emp ? getEmployeeName(emp) : `Employee #${empId}`
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const parts = timeString.split(':')
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
    }
    return timeString
  }

  const formatWorkingHours = (hours) => {
    if (!hours || hours === 0) return '0 hr'
    
    // Convert to hours.minutes format (e.g., 7.5 becomes 7.30)
    const wholeHours = Math.floor(hours)
    const decimalPart = hours - wholeHours
    const minutes = Math.round(decimalPart * 60)
    
    // Format as "7.30 hr" where minutes are shown as two digits
    const minutesStr = String(minutes).padStart(2, '0')
    return `${wholeHours}.${minutesStr} hr`
  }

  const calculateWorkingHours = (startTime, endTime, breakDuration = 0) => {
    if (!startTime || !endTime) return 0
    
    // Parse time strings to hours and minutes
    const parseTime = (timeStr) => {
      if (!timeStr) return 0
      const parts = String(timeStr).split(':')
      const hours = parseInt(parts[0]) || 0
      const minutes = parseInt(parts[1] || 0) || 0
      return hours * 60 + minutes
    }
    
    let startMinutes = parseTime(startTime)
    let endMinutes = parseTime(endTime)
    
    // Handle overnight shifts (end time is earlier than start time)
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60 // Add 24 hours
    }
    
    const totalMinutes = endMinutes - startMinutes
    
    // Parse break duration - handle both number and string formats
    let breakMinutes = 0
    if (breakDuration) {
      if (typeof breakDuration === 'number') {
        breakMinutes = breakDuration
      } else if (typeof breakDuration === 'string') {
        // Try to extract number from string (e.g., "30", "30 minutes", "30 mins")
        const match = String(breakDuration).match(/(\d+)/)
        breakMinutes = match ? parseInt(match[1]) : 0
      }
    }
    
    const workingMinutes = totalMinutes - breakMinutes
    const workingHours = workingMinutes / 60.0
    
    return Math.max(0, workingHours) // Ensure non-negative
  }

  const getEmployeeName = (employee) => {
    // Handle both employee object and employee ID
    if (typeof employee === 'object' && employee !== null) {
      if (employee.name) return employee.name
      if (employee.email) return employee.email.split('@')[0]
      return `Employee #${employee.id}`
    }
    // If employee is just an ID, find it in the employees array
    const emp = employees.find(e => e.id === employee)
    if (emp) {
      if (emp.name) return emp.name
      if (emp.email) return emp.email.split('@')[0]
    }
    return `Employee #${employee}`
  }

  const handleSubmitShiftChangeRequest = async (e) => {
    e.preventDefault()
    if (!requestFormData.requestedShiftId) {
      setError('Please select a shift')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const empId = currentUserId ? parseInt(currentUserId) : null
      if (!empId) {
        throw new Error('Employee ID not found')
      }

      const requestData = {
        employeeId: empId,
        requestedShiftId: parseInt(requestFormData.requestedShiftId),
        reason: requestFormData.reason || null
      }

      const response = await api.createShiftChangeRequest(requestData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to submit request')
      }

      await loadShiftChangeRequests()
      await loadEmployeeShift()
      await loadAllShiftsForEmployee() // Refresh shifts list
      setShowRequestModal(false)
      setRequestFormData({ requestedShiftId: '', reason: '' })
      setSuccessMessage('Shift change request submitted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error submitting request')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (request) => {
    if (!window.confirm('Are you sure you want to approve this shift change request?')) return

    try {
      setLoading(true)
      setError(null)
      const reviewerId = currentUserId ? parseInt(currentUserId) : null
      if (!reviewerId) {
        throw new Error('Reviewer ID not found')
      }

      const response = await api.approveShiftChangeRequest(request.id, reviewerId)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to approve request')
      }

      await loadShiftChangeRequests()
      await loadData()
      // If admin is viewing employee view, reload employee shift too
      if (isEmployee) {
        await loadEmployeeShift()
        await loadAllShiftsForEmployee()
      }
      setShowReviewModal(false)
      setSelectedRequest(null)
      setSuccessMessage('Shift change request approved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error approving request')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest) return
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const reviewerId = currentUserId ? parseInt(currentUserId) : null
      if (!reviewerId) {
        throw new Error('Reviewer ID not found')
      }

      const response = await api.rejectShiftChangeRequest(selectedRequest.id, reviewerId, rejectionReason)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to reject request')
      }

      await loadShiftChangeRequests()
      setShowReviewModal(false)
      setSelectedRequest(null)
      setRejectionReason('')
      setSuccessMessage('Shift change request rejected')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error rejecting request')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (request) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setShowReviewModal(true)
  }

  const getShiftName = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId)
    return shift ? shift.name : `Shift #${shiftId}`
  }

  const formatRequestDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateString
    }
  }

  const getRequestStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      APPROVED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    }
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon size={14} className="mr-1.5" />
        {status}
      </span>
    )
  }

  // Filter shifts
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = !searchTerm || 
      shift.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && shift.active) ||
      (statusFilter === 'inactive' && !shift.active)
    
    return matchesSearch && matchesStatus
  })

  // Get available employees (not assigned to any shift or assigned to different shift)
  const getAvailableEmployees = () => {
    // Filter out SUPER_ADMIN users
    const filteredEmployees = employees.filter(emp => {
      const role = (emp.role || '').toUpperCase()
      return role !== 'SUPER_ADMIN'
    })
    
    if (!selectedShift) return filteredEmployees
    return filteredEmployees.filter(emp => {
      // Employee is available if they don't have a shift or have a different shift
      // We'll check this by comparing shift_id if available
      return true // For now, show all employees (backend will handle assignment)
    })
  }

  // Statistics
  const stats = {
    total: shifts.length,
    active: shifts.filter(s => s.active).length,
    inactive: shifts.filter(s => !s.active).length,
    totalEmployees: employees.filter(emp => {
      const role = (emp.role || '').toUpperCase()
      return role !== 'SUPER_ADMIN'
    }).length
  }

  // Employee View - Show only their assigned shift
  if (isEmployee) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Toast Notifications (Top Right) */}
        {(successMessage || error) && (
          <div className="fixed top-4 right-4 z-50 space-y-3">
            {successMessage && (
              <div className="flex items-start gap-3 bg-green-50 text-green-800 border border-green-200 rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[420px]">
                <CheckCircle size={20} className="mt-0.5 text-green-600 shrink-0" />
                <div className="flex-1 text-base font-semibold">{successMessage}</div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-700/70 hover:text-green-800"
                  aria-label="Close success message"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 text-red-800 border border-red-200 rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[420px]">
                <XCircle size={18} className="mt-0.5 text-red-600 shrink-0" />
                <div className="flex-1 text-base font-semibold">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-700/70 hover:text-red-800"
                  aria-label="Close error message"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600">My Shift</h2>
            <p className="text-gray-600 mt-1">View your assigned work shift details</p>
          </div>
        </div>

        {/* Shift Change Request Section - Prominent Position */}
        {!loading && employeeShift && (
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ArrowLeftRight className="text-blue-600" size={20} />
                Shift Change Requests
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Button clicked!', { loading, showRequestModal, shiftsLength: shifts.length })
                  try {
                    // Ensure shifts are loaded before opening modal
                    if (shifts.length === 0) {
                      loadAllShiftsForEmployee().then(() => {
                        console.log('Shifts loaded, opening modal')
                        setShowRequestModal(true)
                      }).catch((error) => {
                        console.error('Error loading shifts:', error)
                        setError('Failed to load shifts. Please try again.')
                        setTimeout(() => setError(null), 5000)
                      })
                    } else {
                      console.log('Opening modal directly')
                      setShowRequestModal(true)
                    }
                  } catch (error) {
                    console.error('Error in button click:', error)
                    setError('Failed to open form. Please try again.')
                    setTimeout(() => setError(null), 5000)
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={loading}
              >
                <Send size={16} />
                Apply Change Shift
              </button>
            </div>
            {shiftChangeRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No shift change requests yet</p>
            ) : (
              <div className="space-y-3">
                {shiftChangeRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">Requested Shift:</span>
                          <span>{getShiftName(request.requestedShiftId)}</span>
                          {getRequestStatusBadge(request.status)}
                        </div>
                        {request.reason && (
                          <p className="text-sm text-gray-600 mb-2">Reason: {request.reason}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Requested: {formatRequestDate(request.requestedDate)}
                          {request.reviewedDate && ` • Reviewed: ${formatRequestDate(request.reviewedDate)}`}
                        </p>
                        {request.status === 'REJECTED' && request.rejectionReason && (
                          <p className="text-xs text-red-600 mt-2">Rejection Reason: {request.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading shift information...</p>
          </div>
        )}

        {/* Employee Shift Card */}
        {!loading && employeeShift && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 md:p-8 border-2 border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{employeeShift.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {employeeShift.active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="text-blue-600" size={20} />
                  <p className="text-sm font-semibold text-blue-800">Shift Timing</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {formatTime(employeeShift.startTime)} - {formatTime(employeeShift.endTime)}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-green-600" size={20} />
                  <p className="text-sm font-semibold text-green-800">Working Hours</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {employeeShift.workingHours ? formatWorkingHours(employeeShift.workingHours) : '0 hrs'}
                </p>
              </div>

              {employeeShift.breakDuration && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-purple-600" size={20} />
                    <p className="text-sm font-semibold text-purple-800">Break Duration</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{employeeShift.breakDuration} minutes</p>
                </div>
              )}
            </div>

            {employeeShift.description && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                <p className="text-gray-600">{employeeShift.description}</p>
              </div>
            )}

            {/* Assignment Dates - Always show if shift exists */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-orange-600" size={20} />
                <p className="text-sm font-semibold text-orange-800">Assignment Period</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Start Date:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {employeeShift.assignmentStartDate 
                      ? (() => {
                          try {
                            // Handle both string and date formats
                            const dateStr = employeeShift.assignmentStartDate
                            const date = dateStr.includes('T') 
                              ? new Date(dateStr) 
                              : new Date(dateStr + 'T00:00:00')
                            if (isNaN(date.getTime())) {
                              return dateStr
                            }
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          } catch (e) {
                            console.error('Date parsing error:', e, employeeShift.assignmentStartDate)
                            return employeeShift.assignmentStartDate || 'Not specified'
                          }
                        })()
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">End Date:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {employeeShift.assignmentEndDate 
                      ? (() => {
                          try {
                            // Handle both string and date formats
                            const dateStr = employeeShift.assignmentEndDate
                            const date = dateStr.includes('T') 
                              ? new Date(dateStr) 
                              : new Date(dateStr + 'T00:00:00')
                            if (isNaN(date.getTime())) {
                              return dateStr
                            }
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          } catch (e) {
                            console.error('Date parsing error:', e, employeeShift.assignmentEndDate)
                            return employeeShift.assignmentEndDate || 'Not specified'
                          }
                        })()
                      : <span className="text-green-600">Permanent Assignment</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* No Shift Assigned */}
        {!loading && !employeeShift && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="text-gray-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Shift Assigned</h3>
            <p className="text-gray-600 mb-4">
              You don't have a shift assigned yet. Please contact your administrator to assign a shift.
            </p>
          </div>
        )}

        {/* Request Shift Change Modal */}
        {showRequestModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRequestModal(false)
                setRequestFormData({ requestedShiftId: '', reason: '' })
              }
            }}
          >
            <div 
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Apply Change Shift</h3>
              <form onSubmit={handleSubmitShiftChangeRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select New Shift *</label>
                  <select
                    value={requestFormData.requestedShiftId}
                    onChange={(e) => setRequestFormData({ ...requestFormData, requestedShiftId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a shift</option>
                    {!employeeShift ? (
                      <option value="" disabled>Loading your shift information...</option>
                    ) : shifts.length === 0 ? (
                      <option value="" disabled>Loading shifts...</option>
                    ) : shifts.filter(shift => shift.active && Number(shift.id) !== Number(employeeShift.id)).length === 0 ? (
                      <option value="" disabled>No other active shifts available</option>
                    ) : (
                      shifts.filter(shift => shift.active && Number(shift.id) !== Number(employeeShift.id)).map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                  <textarea
                    value={requestFormData.reason}
                    onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Explain why you want to change your shift..."
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestModal(false)
                      setRequestFormData({ requestedShiftId: '', reason: '' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Admin View - Full shift management
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Toast Notifications (Top Right) */}
      {(successMessage || error) && (
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {successMessage && (
            <div className="flex items-start gap-3 bg-green-50 text-green-800 border border-green-200 rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[420px]">
              <CheckCircle size={18} className="mt-0.5 text-green-600 shrink-0" />
              <div className="flex-1 text-sm font-medium">{successMessage}</div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-700/70 hover:text-green-800"
                aria-label="Close success message"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 text-red-800 border border-red-200 rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[420px]">
              <XCircle size={18} className="mt-0.5 text-red-600 shrink-0" />
              <div className="flex-1 text-sm font-medium">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-700/70 hover:text-red-800"
                aria-label="Close error message"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Shifts</div>
            <Clock className="text-blue-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Active Shifts</div>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Inactive Shifts</div>
            <XCircle className="text-gray-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Employees</div>
            <Users className="text-blue-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</div>
        </div>
      </div>

      {/* Toggle Buttons for Shifts, Assignments, and Requests */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 flex-wrap">
          <button
            onClick={() => setActiveView('shifts')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'shifts'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock size={18} />
            All Shifts
          </button>
          <button
            onClick={() => setActiveView('assignments')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'assignments'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} />
            Shift Assignments
          </button>
          <button
            onClick={() => setActiveView('requests')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'requests'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeftRight size={18} />
            Shift Change Requests
          </button>
        </div>
      </div>

      {/* Filters and View Toggle - Only show for Shifts view */}
      {activeView === 'shifts' && (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search shifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {isAdmin && (
                <button
                  onClick={() => openModal()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add Shift
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Grid View"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === 'table' ? 'bg-blue-100 text-blue-600 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Table View"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State - Only for Shifts view */}
      {activeView === 'shifts' && loading && !shifts.length && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading shifts...</p>
        </div>
      )}

      {/* Grid View - Only show when activeView is 'shifts' */}
      {activeView === 'shifts' && viewMode === 'grid' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShifts.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Clock className="mx-auto text-gray-400" size={48} />
              <p className="mt-2 text-gray-600">No shifts found</p>
            </div>
          ) : (
            filteredShifts.map((shift) => (
              <div key={shift.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{shift.name}</h3>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Clock size={14} className="text-gray-500" />
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    shift.active 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}>
                    {shift.active ? (
                      <>
                        <CheckCircle size={12} className="inline mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle size={12} className="inline mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Working Hours:</span>
                    <span className="font-medium">{shift.workingHours ? formatWorkingHours(shift.workingHours) : '0 hrs'}</span>
                  </div>
                  {shift.breakDuration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Break Duration:</span>
                      <span className="font-medium">{shift.breakDuration} minutes</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employees:</span>
                    <span className="font-medium text-blue-600">{shiftEmployeeCounts[shift.id] || 0} assigned</span>
                  </div>
                  {shift.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{shift.description}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => openAssignModal(shift)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <UserPlus size={16} />
                    Assign Employee
                  </button>
                  <button
                    onClick={() => openTeamAssignModal(shift)}
                    className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-xl hover:bg-green-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Users size={16} />
                    Assign Team
                  </button>
                  <div className="relative inline-block dropdown-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const button = e.currentTarget
                        const rect = button.getBoundingClientRect()
                        const spaceBelow = window.innerHeight - rect.bottom
                        const spaceAbove = rect.top
                        const dropdownHeight = 120
                        
                        const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                        
                        setDropdownPosition(prev => ({
                          ...prev,
                          [`shift-${shift.id}`]: {
                            showAbove,
                            top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                            right: window.innerWidth - rect.right
                          }
                        }))
                        setOpenDropdownId(openDropdownId === `shift-${shift.id}` ? null : `shift-${shift.id}`)
                      }}
                      className="bg-gray-50 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2 text-sm transition-colors"
                      title="Actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {openDropdownId === `shift-${shift.id}` && dropdownPosition[`shift-${shift.id}`] && (
                      <div 
                        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                        style={{ 
                          zIndex: 9999,
                          top: `${dropdownPosition[`shift-${shift.id}`].top}px`,
                          right: `${dropdownPosition[`shift-${shift.id}`].right}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal(shift)
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
                            handleDelete(shift.id)
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View - Only show when activeView is 'shifts' */}
      {activeView === 'shifts' && viewMode === 'table' && !loading && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Shift Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Working Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Break</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No shifts found
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{shift.name}</div>
                        {shift.description && (
                          <div className="text-sm text-gray-500">{shift.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shift.workingHours ? formatWorkingHours(shift.workingHours) : '0 hrs'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shift.breakDuration || '0'} min</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="text-blue-600" size={16} />
                          <span className="text-sm font-medium text-blue-600">{shiftEmployeeCounts[shift.id] || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          shift.active 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}>
                          {shift.active ? (
                            <>
                              <CheckCircle size={12} className="mr-1.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle size={12} className="mr-1.5" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAssignModal(shift)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Assign Employee"
                          >
                            <UserPlus size={18} />
                          </button>
                          <button
                            onClick={() => openTeamAssignModal(shift)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Assign Team"
                          >
                            <Users size={18} />
                          </button>
                          <div className="relative inline-block dropdown-menu-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const button = e.currentTarget
                                const rect = button.getBoundingClientRect()
                                const spaceBelow = window.innerHeight - rect.bottom
                                const spaceAbove = rect.top
                                const dropdownHeight = 120
                                
                                const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                
                                setDropdownPosition(prev => ({
                                  ...prev,
                                  [`shift-table-${shift.id}`]: {
                                    showAbove,
                                    top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                    right: window.innerWidth - rect.right
                                  }
                                }))
                                setOpenDropdownId(openDropdownId === `shift-table-${shift.id}` ? null : `shift-table-${shift.id}`)
                              }}
                              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Actions"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {openDropdownId === `shift-table-${shift.id}` && dropdownPosition[`shift-table-${shift.id}`] && (
                              <div 
                                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                style={{ 
                                  zIndex: 9999,
                                  top: `${dropdownPosition[`shift-table-${shift.id}`].top}px`,
                                  right: `${dropdownPosition[`shift-table-${shift.id}`].right}px`
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openModal(shift)
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
                                    handleDelete(shift.id)
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shift Assignments Section - Only show when activeView is 'assignments' */}
      {activeView === 'assignments' && (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              Assigned Employees
            </h3>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    setSelectedShift(null)
                    setAssignFormData({ employeeId: '', startDate: '', endDate: '' })
                    setShowAssignModal(true)
                  }}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <UserPlus size={18} />
                  Assign Employee
                </button>
              )}
              <button
                onClick={loadAllAssignments}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingAssignments}
                title="Refresh"
              >
                <RefreshCw size={18} className={loadingAssignments ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={assignmentSearchTerm}
                  onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={assignmentStatusFilter}
                onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="Permanent">Permanent</option>
                <option value="Temporary">Temporary</option>
              </select>
              <select
                value={assignmentDepartmentFilter}
                onChange={(e) => setAssignmentDepartmentFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="all">All Departments</option>
                {[...new Set(allAssignments.map(a => a.department).filter(Boolean))].sort().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={assignmentShiftFilter}
                onChange={(e) => setAssignmentShiftFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="all">All Shifts</option>
                {[...new Set(allAssignments.map(a => a.shiftName).filter(Boolean))].sort().map(shiftName => (
                  <option key={shiftName} value={shiftName}>{shiftName}</option>
                ))}
              </select>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  placeholder="Start Date"
                  value={assignmentStartDateFilter}
                  onChange={(e) => setAssignmentStartDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  placeholder="End Date"
                  value={assignmentEndDateFilter}
                  onChange={(e) => setAssignmentEndDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {(assignmentSearchTerm || assignmentStatusFilter !== 'all' || assignmentDepartmentFilter !== 'all' || assignmentShiftFilter !== 'all' || assignmentStartDateFilter || assignmentEndDateFilter) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setAssignmentSearchTerm('')
                    setAssignmentStatusFilter('all')
                    setAssignmentDepartmentFilter('all')
                    setAssignmentShiftFilter('all')
                    setAssignmentStartDateFilter('')
                    setAssignmentEndDateFilter('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {loadingAssignments ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading assignments...</p>
            </div>
          ) : allAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-lg font-medium">No shift assignments found</p>
              <p className="text-sm text-gray-400 mt-2">Assign employees to shifts to see them here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Shift Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Shift Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Working Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const filteredAssignments = allAssignments.filter((assignment) => {
                      // Search filter
                      const matchesSearch = !assignmentSearchTerm || 
                        assignment.employeeName?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                        assignment.employeeEmail?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                        assignment.employeeIdCode?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                        assignment.department?.toLowerCase().includes(assignmentSearchTerm.toLowerCase())
                      
                      // Status filter
                      const matchesStatus = assignmentStatusFilter === 'all' || assignment.status === assignmentStatusFilter
                      
                      // Department filter
                      const matchesDepartment = assignmentDepartmentFilter === 'all' || assignment.department === assignmentDepartmentFilter
                      
                      // Shift filter
                      const matchesShift = assignmentShiftFilter === 'all' || assignment.shiftName === assignmentShiftFilter
                      
                      // Date range filter
                      let matchesDateRange = true
                      if (assignmentStartDateFilter || assignmentEndDateFilter) {
                        // Helper function to parse and normalize dates
                        const parseAndNormalizeDate = (dateStr) => {
                          if (!dateStr) return null
                          try {
                            const date = new Date(dateStr)
                            if (isNaN(date.getTime())) return null
                            date.setHours(0, 0, 0, 0)
                            return date
                          } catch (e) {
                            return null
                          }
                        }
                        
                        const normAssignmentStart = parseAndNormalizeDate(assignment.startDate)
                        const normAssignmentEnd = parseAndNormalizeDate(assignment.endDate)
                        const normFilterStart = parseAndNormalizeDate(assignmentStartDateFilter)
                        const normFilterEnd = parseAndNormalizeDate(assignmentEndDateFilter)
                        
                        if (normFilterStart && normFilterEnd) {
                          // show assignments that overlap with the date range
                          matchesDateRange = (
                            (!normAssignmentStart || normAssignmentStart <= normFilterEnd) &&
                            (!normAssignmentEnd || normAssignmentEnd >= normFilterStart)
                          )
                        } else if (normFilterStart) {
                          // only start date selected
                          matchesDateRange = !normAssignmentStart || normAssignmentStart >= normFilterStart || !normAssignmentEnd
                        } else if (normFilterEnd) {
                          // only end date selected
                          matchesDateRange = !normAssignmentEnd || normAssignmentEnd <= normFilterEnd || (!normAssignmentStart || normAssignmentStart <= normFilterEnd)
                        }
                      }
                      
                      return matchesSearch && matchesStatus && matchesDepartment && matchesShift && matchesDateRange
                    })

                    if (filteredAssignments.length === 0) {
                      return (
                        <tr>
                          <td colSpan={11} className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Filter size={28} className="text-gray-400" />
                              <div className="text-base font-semibold">No data available</div>
                              <div className="text-sm text-gray-400">
                                No assignments match the selected filters / date range.
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return filteredAssignments.map((assignment) => (
                    <tr key={`${assignment.employeeId}-${assignment.shiftId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.employeeName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {assignment.employeeIdCode?.startsWith('ID:') 
                            ? assignment.employeeIdCode 
                            : `ID: ${assignment.employeeIdCode || assignment.employeeId}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.employeeEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.teamNames && assignment.teamNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignment.teamNames.map((teamName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                              >
                                <Users size={12} className="mr-1" />
                                {teamName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No team</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {assignment.shiftName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.shiftTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {typeof assignment.workingHours === 'number' ? formatWorkingHours(assignment.workingHours) : assignment.workingHours || '0 hrs'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.startDate 
                          ? (() => {
                              try {
                                const date = assignment.startDate instanceof Date 
                                  ? assignment.startDate 
                                  : new Date(assignment.startDate)
                                return isNaN(date.getTime()) 
                                  ? 'Invalid Date' 
                                  : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              } catch (e) {
                                return String(assignment.startDate)
                              }
                            })()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.endDate 
                          ? (() => {
                              try {
                                const date = assignment.endDate instanceof Date 
                                  ? assignment.endDate 
                                  : new Date(assignment.endDate)
                                return isNaN(date.getTime()) 
                                  ? 'Invalid Date' 
                                  : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              } catch (e) {
                                return String(assignment.endDate)
                              }
                            })()
                          : <span className="text-green-600 font-semibold">Permanent</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          assignment.status === 'Permanent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                        <div className="relative inline-block dropdown-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const button = e.currentTarget
                              const rect = button.getBoundingClientRect()
                              const spaceBelow = window.innerHeight - rect.bottom
                              const spaceAbove = rect.top
                              const dropdownHeight = 120
                              
                              const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                              
                              setDropdownPosition(prev => ({
                                ...prev,
                                [`assignment-${assignment.employeeId}-${assignment.shiftId}`]: {
                                  showAbove,
                                  top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                  right: window.innerWidth - rect.right
                                }
                              }))
                              setOpenDropdownId(openDropdownId === `assignment-${assignment.employeeId}-${assignment.shiftId}` ? null : `assignment-${assignment.employeeId}-${assignment.shiftId}`)
                            }}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {openDropdownId === `assignment-${assignment.employeeId}-${assignment.shiftId}` && dropdownPosition[`assignment-${assignment.employeeId}-${assignment.shiftId}`] && (
                            <div 
                              className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                              style={{ 
                                zIndex: 9999,
                                top: `${dropdownPosition[`assignment-${assignment.employeeId}-${assignment.shiftId}`].top}px`,
                                right: `${dropdownPosition[`assignment-${assignment.employeeId}-${assignment.shiftId}`].right}px`
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditAssignmentFromTable(assignment)
                                  setOpenDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit size={16} className="text-blue-600" />
                                Edit Assignment
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAssignmentFromTable(assignment)
                                  setOpenDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <UserMinus size={16} />
                                Unassign
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Shift Change Requests Section - Only show when activeView is 'requests' */}
      {activeView === 'requests' && (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowLeftRight className="text-blue-600" size={20} />
              Shift Change Requests
            </h3>
            {isEmployee && (
              <button
                onClick={() => {
                  setRequestFormData({ requestedShiftId: '', reason: '' })
                  setShowRequestModal(true)
                }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <Plus size={18} />
                Request Shift Change
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by employee name or reason..."
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {shiftChangeRequests
            .filter(req => {
              const matchesStatus = requestStatusFilter === 'all' || req.status === requestStatusFilter.toUpperCase()
              const matchesSearch = !requestSearchTerm || 
                getEmployeeName(req.employeeId)?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                getShiftName(req.currentShiftId)?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                getShiftName(req.requestedShiftId)?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                req.reason?.toLowerCase().includes(requestSearchTerm.toLowerCase())
              return matchesStatus && matchesSearch
            })
            .length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ArrowLeftRight className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-lg font-medium">No shift change requests found</p>
              <p className="text-sm text-gray-400 mt-2">
                {isEmployee 
                  ? 'Click "Request Shift Change" to submit a new request'
                  : 'No requests match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Current Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Requested Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Requested Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shiftChangeRequests
                    .filter(req => {
                      const matchesStatus = requestStatusFilter === 'all' || req.status === requestStatusFilter.toUpperCase()
                      const matchesSearch = !requestSearchTerm || 
                        getEmployeeName(req.employeeId)?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                        getShiftName(req.currentShiftId)?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                        getShiftName(req.requestedShiftId)?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                        req.reason?.toLowerCase().includes(requestSearchTerm.toLowerCase())
                      return matchesStatus && matchesSearch
                    })
                    .map((request) => {
                      const currentShift = shifts.find(s => s.id === request.currentShiftId)
                      const requestedShift = shifts.find(s => s.id === request.requestedShiftId)
                      return (
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getEmployeeName(request.employeeId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getShiftName(request.currentShiftId)}
                            </div>
                            {currentShift && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTime(currentShift.startTime)} - {formatTime(currentShift.endTime)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              {getShiftName(request.requestedShiftId)}
                            </div>
                            {requestedShift && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTime(requestedShift.startTime)} - {formatTime(requestedShift.endTime)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs">
                              {request.reason ? (
                                <span title={request.reason} className="line-clamp-2">
                                  {request.reason}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No reason provided</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRequestStatusBadge(request.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatRequestDate(request.requestedDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                            {request.status === 'PENDING' && isAdmin ? (
                              <div className="relative inline-block dropdown-menu-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const button = e.currentTarget
                                    const rect = button.getBoundingClientRect()
                                    const spaceBelow = window.innerHeight - rect.bottom
                                    const spaceAbove = rect.top
                                    const dropdownHeight = 120
                                    
                                    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                    
                                    setDropdownPosition(prev => ({
                                      ...prev,
                                      [`request-${request.id}`]: {
                                        showAbove,
                                        top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                        right: window.innerWidth - rect.right
                                      }
                                    }))
                                    setOpenDropdownId(openDropdownId === `request-${request.id}` ? null : `request-${request.id}`)
                                  }}
                                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                  title="Actions"
                                >
                                  <MoreVertical size={18} />
                                </button>
                                
                                {openDropdownId === `request-${request.id}` && dropdownPosition[`request-${request.id}`] && (
                                  <div 
                                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                    style={{ 
                                      zIndex: 9999,
                                      top: `${dropdownPosition[`request-${request.id}`].top}px`,
                                      right: `${dropdownPosition[`request-${request.id}`].right}px`
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openReviewModal(request)
                                        setOpenDropdownId(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Eye size={16} className="text-blue-600" />
                                      Review
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : request.status === 'PENDING' ? (
                              <button
                                onClick={() => openReviewModal(request)}
                                className="text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Clock size={24} className="text-blue-600" />
                {editingShift ? 'Edit Shift' : 'Add Shift'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employees Modal */}
      {showEmployeeModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Employees - {selectedShift.name}</h3>
                <p className="text-sm text-gray-600">{formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAssignModal(selectedShift)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <UserPlus size={16} />
                  Assign Employee
                </button>
                <button
                  onClick={() => { setShowEmployeeModal(false); setSelectedShift(null) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shiftEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No employees assigned to this shift
                      </td>
                    </tr>
                  ) : (
                    shiftEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                              {getEmployeeName(employee).charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{getEmployeeName(employee)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.department || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.teamNames && employee.teamNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {employee.teamNames.map((teamName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                >
                                  <Users size={12} className="mr-1" />
                                  {teamName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No team</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditAssignment(employee)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                              title="Edit Assignment Dates"
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleUnassignEmployee(employee.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 flex items-center gap-1"
                              title="Unassign Employee"
                            >
                              <UserMinus size={16} />
                              Unassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {showTeamAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-green-600 flex items-center gap-3">
                <Users size={24} className="text-green-600" />
                {selectedShift ? `Assign Team to ${selectedShift.name}` : 'Assign Team to Shift'}
              </h3>
              <button
                onClick={() => { 
                  setShowTeamAssignModal(false)
                  setTeamAssignFormData({ shiftId: '', teamId: '', startDate: '', endDate: '' })
                  setSelectedTeamMembers([])
                  setSelectedShift(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignTeam} className="space-y-4">
              {!selectedShift && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Shift *</label>
                  <select
                    value={teamAssignFormData.shiftId}
                    onChange={(e) => {
                      const shiftId = e.target.value
                      const shift = shifts.find(s => s.id === parseInt(shiftId))
                      setSelectedShift(shift || null)
                      setTeamAssignFormData({ ...teamAssignFormData, shiftId: shiftId })
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a shift</option>
                    {shifts.filter(s => s.active).map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Team *</label>
                <select
                  value={teamAssignFormData.teamId}
                  onChange={(e) => {
                    const teamId = e.target.value
                    setTeamAssignFormData({ ...teamAssignFormData, teamId: teamId })
                    handleTeamSelection(teamId)
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.members ? `(${team.members.length} members)` : ''}
                    </option>
                  ))}
                </select>
                {teams.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No teams available. Create teams in Team Management first.</p>
                )}
              </div>

              {selectedTeamMembers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Team Members</label>
                    <span className="text-xs text-gray-500 font-medium">
                      {selectedTeamMembers.length} {selectedTeamMembers.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <div className="border-2 border-gray-300 rounded-xl p-4 max-h-64 overflow-y-auto bg-gray-50">
                    <div className="space-y-2">
                      {getTeamMemberNames().map((name, index) => (
                        <div
                          key={selectedTeamMembers[index]}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white border-2 border-gray-200"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{name}</div>
                            {employees.find(e => e.id === parseInt(selectedTeamMembers[index]))?.email && (
                              <div className="text-sm text-gray-500">
                                {employees.find(e => e.id === parseInt(selectedTeamMembers[index]))?.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {teamAssignFormData.teamId && selectedTeamMembers.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    Selected team has no members. Please select a different team or add members to this team first.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={teamAssignFormData.startDate}
                    onChange={(e) => setTeamAssignFormData({ ...teamAssignFormData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={teamAssignFormData.endDate}
                    onChange={(e) => setTeamAssignFormData({ ...teamAssignFormData, endDate: e.target.value })}
                    min={teamAssignFormData.startDate || undefined}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for permanent assignment</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { 
                    setShowTeamAssignModal(false)
                    setTeamAssignFormData({ shiftId: '', teamId: '', startDate: '', endDate: '' })
                    setSelectedTeamMembers([])
                    setSelectedShift(null)
                  }}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamAssignFormData.teamId || selectedTeamMembers.length === 0}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      Assign Team ({selectedTeamMembers.length})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignmentModal && selectedShift && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Assignment - {getEmployeeName(editingEmployee)}</h3>
              <button
                onClick={() => { 
                  setShowEditAssignmentModal(false)
                  setEditingEmployee(null)
                  setEditAssignmentFormData({ startDate: '', endDate: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Shift:</span> {selectedShift.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Timing:</span> {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={editAssignmentFormData.startDate}
                    onChange={(e) => setEditAssignmentFormData({ ...editAssignmentFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={editAssignmentFormData.endDate}
                    onChange={(e) => setEditAssignmentFormData({ ...editAssignmentFormData, endDate: e.target.value })}
                    min={editAssignmentFormData.startDate || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for permanent assignment</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { 
                    setShowEditAssignmentModal(false)
                    setEditingEmployee(null)
                    setEditAssignmentFormData({ startDate: '', endDate: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <UserPlus size={24} className="text-blue-600" />
                {selectedShift ? `Assign Employee to ${selectedShift.name}` : 'Assign Employee to Shift'}
              </h3>
              <button
                onClick={() => { 
                  setShowAssignModal(false)
                  setAssignFormData({ shiftId: '', employeeId: '', startDate: '', endDate: '' })
                  setSelectedShift(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignEmployee} className="space-y-4">
              {!selectedShift && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Shift *</label>
                  <select
                    value={assignFormData.shiftId}
                    onChange={(e) => {
                      const shiftId = e.target.value
                      const shift = shifts.find(s => s.id === parseInt(shiftId))
                      setSelectedShift(shift || null)
                      setAssignFormData({ ...assignFormData, shiftId: shiftId })
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a shift</option>
                    {shifts.filter(s => s.active).map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select Employee *</label>
                  <span className="text-xs text-gray-500 font-medium">
                    Total: {getAvailableEmployees().length} {getAvailableEmployees().length === 1 ? 'employee' : 'employees'}
                  </span>
                </div>
                <select
                  value={assignFormData.employeeId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an employee</option>
                  {getAvailableEmployees().map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {getEmployeeName(employee)} {employee.email ? `(${employee.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={assignFormData.startDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={assignFormData.endDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, endDate: e.target.value })}
                    min={assignFormData.startDate || undefined}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for permanent assignment</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => { 
                    setShowAssignModal(false)
                    setAssignFormData({ shiftId: '', employeeId: '', startDate: '', endDate: '' })
                    setSelectedShift(null)
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? 'Assigning...' : 'Assign Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Shift Change Modal */}
      {showRequestModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRequestModal(false)
              setRequestFormData({ requestedShiftId: '', reason: '' })
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Apply Change Shift</h3>
            <form onSubmit={handleSubmitShiftChangeRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select New Shift *</label>
                <select
                  value={requestFormData.requestedShiftId}
                  onChange={(e) => setRequestFormData({ ...requestFormData, requestedShiftId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a shift</option>
                  {!employeeShift ? (
                    <option value="" disabled>Loading your shift information...</option>
                  ) : shifts.length === 0 ? (
                    <option value="" disabled>Loading shifts...</option>
                  ) : shifts.filter(shift => shift.active && Number(shift.id) !== Number(employeeShift.id)).length === 0 ? (
                    <option value="" disabled>No other active shifts available</option>
                  ) : (
                    shifts.filter(shift => shift.active && Number(shift.id) !== Number(employeeShift.id)).map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea
                  value={requestFormData.reason}
                  onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Explain why you want to change your shift..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false)
                    setRequestFormData({ requestedShiftId: '', reason: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal for Admin */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Review Shift Change Request</h3>
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Employee:</p>
                <p className="font-medium">{getEmployeeName(selectedRequest.employeeId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Shift:</p>
                <p className="font-medium">{getShiftName(selectedRequest.currentShiftId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Requested Shift:</p>
                <p className="font-medium">{getShiftName(selectedRequest.requestedShiftId)}</p>
              </div>
              {selectedRequest.reason && (
                <div>
                  <p className="text-sm text-gray-600">Reason:</p>
                  <p className="text-gray-800">{selectedRequest.reason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Requested Date:</p>
                <p className="text-gray-800">{formatRequestDate(selectedRequest.requestedDate)}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason (Required for rejection)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedRequest(null)
                  setRejectionReason('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectRequest()}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => handleApproveRequest(selectedRequest)}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Shifts
