import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Search, Edit, Trash2, Eye, X } from 'lucide-react'
import api from '../services/api'
import { format, differenceInDays, parseISO, isAfter, isBefore, startOfToday } from 'date-fns'

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [filter, setFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [calculatedDays, setCalculatedDays] = useState(0)
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
  const userRole = localStorage.getItem('userRole')
  const userType = localStorage.getItem('userType')
  const currentUserId = localStorage.getItem('userId')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

  useEffect(() => {
    loadData()
  }, [filter])

  useEffect(() => {
    // Auto-set employeeId for employees
    if (isEmployee && currentUserId && !formData.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: currentUserId.toString() }))
    }
  }, [isEmployee, currentUserId, formData.employeeId])

  useEffect(() => {
    // Calculate days when dates change
    if (formData.startDate && formData.endDate) {
      calculateDays()
    } else {
      setCalculatedDays(0)
    }
  }, [formData.startDate, formData.endDate, formData.halfDay])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let leavesData
      if (isEmployee && currentUserId) {
        // Employees see only their own leaves
        leavesData = await api.getLeavesByEmployee(parseInt(currentUserId))
        if (filter !== 'All') {
          leavesData = leavesData.filter(l => l.status === filter)
        }
      } else {
        // Admins see all leaves
        leavesData = filter === 'All' ? await api.getLeaves() : await api.getLeaves(filter)
      }

      const [typesData, employeesData] = await Promise.all([
        api.getActiveLeaveTypes(),
        isAdmin ? api.getEmployees() : Promise.resolve([])
      ])
      
      setLeaves(Array.isArray(leavesData) ? leavesData : [])
      setLeaveTypes(Array.isArray(typesData) ? typesData : [])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])

      // Load leave balances for current user
      if (currentUserId) {
        try {
          const balances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
          setLeaveBalances(Array.isArray(balances) ? balances : [])
        } catch (balanceError) {
          console.error('Error loading leave balances:', balanceError)
          setLeaveBalances([])
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
      setValidationError(`Insufficient leave balance. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days`)
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
      const submitData = {
        ...formData,
        employeeId: isEmployee ? parseInt(currentUserId) : parseInt(formData.employeeId),
        leaveTypeId: parseInt(formData.leaveTypeId),
        type: leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId))?.name || 'Leave'
      }

      const response = await api.createLeave(submitData)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to submit leave application')
      }

      await loadData()
      setShowModal(false)
      resetForm()
      alert('Leave application submitted successfully')
    } catch (error) {
      setValidationError(error.message || 'Error submitting leave application')
      console.error('Error submitting leave:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: isEmployee ? currentUserId : '',
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
      alert('Leave application cancelled successfully')
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
      alert('Leave application updated successfully')
    } catch (error) {
      setValidationError(error.message || 'Error updating leave application')
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
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.name || 'Unknown'
  }

  const getLeaveTypeName = (leaveTypeId) => {
    const type = leaveTypes.find(t => t.id === leaveTypeId)
    return type?.name || 'Unknown'
  }

  const getLeaveBalance = (leaveTypeId) => {
    const balance = leaveBalances.find(b => b.leaveTypeId === leaveTypeId)
    return balance?.balance || 0
  }

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = searchTerm === '' || 
      getEmployeeName(leave.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLeaveTypeName(leave.leaveTypeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEmployee = employeeFilter === 'All' || 
      leave.employeeId.toString() === employeeFilter

    return matchesSearch && matchesEmployee
  })

  if (loading) {
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
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-600">Leave Management</h2>
          <p className="text-gray-600 mt-1 font-medium">
            {isEmployee ? 'View and manage your leave applications' : 'Manage leave applications and approvals'}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Leaves</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            <Calendar size={20} />
            Apply Leave
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by employee, leave type, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {isAdmin && (
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Warning if no leave types */}
      {leaveTypes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>No leave types found.</strong> Please create leave types in the Settings page first.
          </p>
        </div>
      )}

      {/* Leave Balances */}
      {leaveBalances.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-blue-600 mb-4">Your Leave Balance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {leaveBalances.map((balance, index) => {
              const type = leaveTypes.find(t => t.id === balance.leaveTypeId)
              return (
                <div key={balance.id} className="bg-blue-600 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-2 border-white">
                  <p className="text-sm font-semibold text-white mb-2">{type?.name || 'Unknown'}</p>
                  <p className="text-3xl font-bold text-white mb-1">{balance.balance.toFixed(1)}</p>
                  <p className="text-xs text-white opacity-90">Used: {balance.usedDays.toFixed(1)} / {balance.totalDays.toFixed(1)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leaves List */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No leaves found
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="text-gray-400 mr-2" size={18} />
                      <span className="text-sm font-medium text-gray-900">{getEmployeeName(leave.employeeId)}</span>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLeave(leave)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {isAdmin && leave.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLeave(leave)
                              setShowApprovalModal(true)
                            }}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Review"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(leave)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        </>
                      )}
                      {(isAdmin || (isEmployee && leave.employeeId.toString() === currentUserId)) && 
                       leave.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelLeave(leave.id)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      )}
                      {isAdmin && leave.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleDeleteLeave(leave.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {leave.rejectionReason && (
                        <div className="text-xs text-red-600" title={leave.rejectionReason}>
                          <AlertCircle size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-blue-600">Apply for Leave</h3>
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
                <p className="text-red-800 text-sm">{validationError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
                      ))}
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
                    disabled={leaveTypes.length === 0}
                  >
                    <option value="">
                      {leaveTypes.length === 0 ? 'No leave types available' : 'Select Leave Type'}
                    </option>
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} {type.maxDays ? `(Max: ${type.maxDays} days)` : ''} (Balance: {getLeaveBalance(type.id).toFixed(1)})
                      </option>
                    ))}
                  </select>
                  {leaveTypes.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Please create leave types in Settings page first
                    </p>
                  )}
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
              </div>
              {calculatedDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Total Days:</strong> {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                    {formData.leaveTypeId && (
                      <span className="ml-2">
                        (Available Balance: {getLeaveBalance(parseInt(formData.leaveTypeId)).toFixed(1)} days)
                      </span>
                    )}
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
                  placeholder="Please provide a reason for your leave application..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
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
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4">Review Leave Application</h3>
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
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedLeave.id)}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedLeave.id)}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
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
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Leave Modal */}
      {showEditModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-blue-600">Edit Leave Application</h3>
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
                <p className="text-red-800 text-sm">{validationError}</p>
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
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
                      ))}
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

      {/* View Details Modal */}
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-600">Leave Application Details</h3>
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
                    <p className="font-semibold text-gray-900">{getEmployeeName(selectedLeave.approvedBy)}</p>
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
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveManagement
