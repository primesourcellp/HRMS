import { useState, useEffect } from 'react'
import { Clock, Plus, Edit, Trash2, Users, Search, Filter, Grid, List, X, Check, UserPlus, UserMinus, Eye, Calendar, Timer, Pencil, Send, ArrowLeftRight, FileText } from 'lucide-react'
import api from '../services/api'

const Shifts = () => {
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [employeeShift, setEmployeeShift] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
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
    employeeId: '',
    startDate: '',
    endDate: ''
  })
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
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeView, setActiveView] = useState('shifts') // 'shifts' or 'requests'
  // Check if user is employee or admin
  const userRole = localStorage.getItem('userRole')
  const userType = localStorage.getItem('userType')
  const isEmployee = userType === 'employee'
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const currentUserId = localStorage.getItem('userId')

  useEffect(() => {
    if (isEmployee) {
      loadEmployeeShift()
      loadAllShiftsForEmployee() // Load all shifts for shift change request dropdown
      loadShiftChangeRequests()
    } else {
      loadData()
      loadShiftChangeRequests()
    }
  }, [isEmployee])

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
      setShifts(Array.isArray(shiftsData) ? shiftsData : [])
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
      setShifts(shiftsArray)
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
      
      // Load employee counts for each shift
      const counts = {}
      await Promise.all(
        shiftsArray.map(async (shift) => {
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

  const loadShiftEmployees = async (shiftId) => {
    try {
      const data = await api.getEmployeesByShift(shiftId)
      setShiftEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading shift employees:', error)
      setShiftEmployees([])
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
      
      const response = await api.assignEmployeeToShift(selectedShift.id, assignmentData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to assign employee')
      }

      await loadShiftEmployees(selectedShift.id)
      await loadData() // Reload employees to refresh shift assignments
      setShowAssignModal(false)
      setAssignFormData({ employeeId: '', startDate: '', endDate: '' })
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

  const openAssignModal = (shift) => {
    setSelectedShift(shift)
    setAssignFormData({ employeeId: '' })
    setShowAssignModal(true)
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
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: Check },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: X }
    }
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} className="mr-1" />
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
    if (!selectedShift) return employees
    return employees.filter(emp => {
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
    totalEmployees: employees.length
  }

  // Employee View - Show only their assigned shift
  if (isEmployee) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600">My Shift</h2>
            <p className="text-gray-600 mt-1">View your assigned work shift details</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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
                  {employeeShift.workingHours ? employeeShift.workingHours.toFixed(2) : '0'} hours
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
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Shifts</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Active Shifts</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Inactive Shifts</div>
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Employees</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</div>
        </div>
      </div>

      {/* Toggle Buttons for Shifts and Requests */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('shifts')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeView === 'shifts'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock size={20} />
            All Shifts
          </button>
          <button
            onClick={() => setActiveView('requests')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeView === 'requests'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeftRight size={20} />
            Shift Change Requests
          </button>
        </div>
      </div>

      {/* Filters and View Toggle - Only show for Shifts view */}
      {activeView === 'shifts' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search shifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => openModal()}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <Plus size={20} />
                Add Shift
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Grid View"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div key={shift.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    shift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shift.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Working Hours:</span>
                    <span className="font-medium">{shift.workingHours?.toFixed(2) || '0'} hours</span>
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
                    onClick={() => openEmployeeModal(shift)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm"
                  >
                    <Users size={16} />
                    Employees
                  </button>
                  <button
                    onClick={() => openModal(shift)}
                    className="bg-gray-50 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(shift.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View - Only show when activeView is 'shifts' */}
      {activeView === 'shifts' && viewMode === 'table' && !loading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600">
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
                        <div className="text-sm text-gray-900">{shift.workingHours?.toFixed(2) || '0'} hrs</div>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          shift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {shift.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEmployeeModal(shift)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                            title="View Employees"
                          >
                            <Users size={18} />
                          </button>
                          <button
                            onClick={() => openModal(shift)}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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
      )}

      {/* Shift Change Requests Section - Only show when activeView is 'requests' */}
      {activeView === 'requests' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowLeftRight className="text-blue-600" size={20} />
              Shift Change Requests
            </h3>
            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        {shiftChangeRequests.filter(req => requestStatusFilter === 'all' || req.status === requestStatusFilter.toUpperCase()).length === 0 ? (
          <p className="text-gray-500 text-sm">No shift change requests found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Current Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requested Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requested Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shiftChangeRequests
                  .filter(req => requestStatusFilter === 'all' || req.status === requestStatusFilter.toUpperCase())
                  .map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getEmployeeName(request.employeeId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getShiftName(request.currentShiftId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getShiftName(request.requestedShiftId)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {request.reason || 'No reason provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRequestStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRequestDate(request.requestedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'PENDING' ? (
                          <button
                            onClick={() => openReviewModal(request)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-400">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {/* Add/Edit Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingShift ? 'Edit' : 'Add'} Shift</h3>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
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
      {showAssignModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Assign Employee to {selectedShift.name}</h3>
              <button
                onClick={() => { setShowAssignModal(false); setAssignFormData({ employeeId: '', startDate: '', endDate: '' }) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={assignFormData.startDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={assignFormData.endDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, endDate: e.target.value })}
                    min={assignFormData.startDate || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for permanent assignment</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setAssignFormData({ employeeId: '', startDate: '', endDate: '' }) }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign'}
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
