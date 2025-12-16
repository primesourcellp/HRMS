import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { Clock, Plus, Edit, Trash2 } from 'lucide-react'
=======
import { Clock, Plus, Edit, Trash2, Users, Search, UserPlus, X, Eye } from 'lucide-react'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
import api from '../services/api'

const Shifts = () => {
  const [shifts, setShifts] = useState([])
<<<<<<< HEAD
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [loading, setLoading] = useState(false)
=======
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [selectedShift, setSelectedShift] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [assignFormData, setAssignFormData] = useState({
    employeeId: '',
    shiftId: ''
  })
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    breakDuration: '',
    description: '',
    active: true
  })

<<<<<<< HEAD
  useEffect(() => {
    loadShifts()
=======
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    // Check if user is an employee
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    const isEmp = userType === 'employee'
    setIsEmployee(isEmp)
    setEmployeeId(userId ? parseInt(userId) : null)
    
    if (isEmp) {
      loadEmployeeShift(userId ? parseInt(userId) : null)
    } else {
      loadShifts()
      loadEmployees()
    }
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  }, [])

  const loadShifts = async () => {
    try {
      const data = await api.getShifts()
      setShifts(data)
    } catch (error) {
      console.error('Error loading shifts:', error)
    }
  }

<<<<<<< HEAD
=======
  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees()
      const employeesArray = Array.isArray(data) ? data : []
      setEmployees(employeesArray)
      return employeesArray
    } catch (error) {
      console.error('Error loading employees:', error)
      setEmployees([])
      return []
    }
  }

  const loadEmployeeShift = async (empId) => {
    try {
      if (!empId) return
      
      // Load employee data
      const employeesData = await api.getEmployees()
      const employeesArray = Array.isArray(employeesData) ? employeesData : []
      const employee = employeesArray.find(emp => emp.id === empId)
      
      if (employee) {
        setCurrentEmployee(employee)
        
        // If employee has a shift assigned, load that shift
        if (employee.shiftId) {
          const shiftsData = await api.getShifts()
          const shiftsArray = Array.isArray(shiftsData) ? shiftsData : []
          const assignedShift = shiftsArray.find(s => s.id === employee.shiftId)
          
          if (assignedShift) {
            setShifts([assignedShift])
          } else {
            setShifts([])
          }
        } else {
          setShifts([])
        }
      }
    } catch (error) {
      console.error('Error loading employee shift:', error)
      setShifts([])
    }
  }

  const getShiftType = (startTime) => {
    if (!startTime) return 'Unknown'
    const hour = parseInt(startTime.split(':')[0])
    if (hour >= 6 && hour < 14) return 'Morning'
    if (hour >= 14 && hour < 22) return 'Evening'
    return 'Night'
  }

  const getShiftTypeColor = (shiftType) => {
    switch (shiftType) {
      case 'Morning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Evening': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Night': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEmployeesInShift = (shiftId) => {
    if (!shiftId) {
      return []
    }
    
    if (!employees || employees.length === 0) {
      return []
    }
    
    // Handle type conversion - shiftId might be number or string
    const shiftIdNum = typeof shiftId === 'string' ? parseInt(shiftId, 10) : Number(shiftId)
    
    if (isNaN(shiftIdNum)) {
      return []
    }
    
    const filtered = employees.filter(emp => {
      if (!emp) {
        return false
      }
      
      // Check if shiftId exists (not null, undefined, or empty)
      if (emp.shiftId === null || emp.shiftId === undefined || emp.shiftId === '') {
        return false
      }
      
      // Convert employee shiftId to number for comparison
      const empShiftId = typeof emp.shiftId === 'string' ? parseInt(emp.shiftId, 10) : Number(emp.shiftId)
      
      if (isNaN(empShiftId)) {
        return false
      }
      
      const matches = empShiftId === shiftIdNum
      return matches
    })
    
    return filtered
  }

  const handleAssignEmployee = async (e) => {
    e.preventDefault()
    if (!assignFormData.employeeId || !assignFormData.shiftId) {
      alert('Please select both employee and shift')
      return
    }

    setLoading(true)
    try {
      const employee = employees.find(emp => emp.id === parseInt(assignFormData.employeeId))
      if (!employee) {
        alert('Employee not found')
        setLoading(false)
        return
      }

      const shiftIdNum = parseInt(assignFormData.shiftId)
      const employeeIdNum = parseInt(assignFormData.employeeId)
      const selectedShift = shifts.find(s => s.id === shiftIdNum)
      
      // Update employee with new shift assignment
      await api.updateEmployee(
        employeeIdNum,
        { ...employee, shiftId: shiftIdNum },
        localStorage.getItem('userRole')
      )
      
      // Send notification to employee
      if (selectedShift) {
        const notification = {
          employeeId: employeeIdNum,
          type: 'SHIFT_ASSIGNMENT',
          title: 'Shift Assignment',
          message: `You have been assigned to ${selectedShift.name} shift (${selectedShift.startTime} - ${selectedShift.endTime}). Please check your schedule.`,
          read: false,
          createdAt: new Date().toISOString()
        }
        
        // Store notification in localStorage (can be upgraded to backend API later)
        try {
          const existingNotifications = JSON.parse(localStorage.getItem(`notifications_${employeeIdNum}`) || '[]')
          existingNotifications.unshift(notification)
          // Keep only last 50 notifications
          const recentNotifications = existingNotifications.slice(0, 50)
          localStorage.setItem(`notifications_${employeeIdNum}`, JSON.stringify(recentNotifications))
        } catch (error) {
          console.error('Error saving notification:', error)
        }
      }
      
      // Close modal first
      setShowAssignModal(false)
      setAssignFormData({ employeeId: '', shiftId: '' })
      
      // Reload employees immediately to get fresh data from server
      await loadEmployees()
      
      // Optimistically update local state for instant UI feedback (backup)
      setEmployees(prevEmployees => {
        const updated = prevEmployees.map(emp => 
          emp.id === employeeIdNum 
            ? { ...emp, shiftId: shiftIdNum }
            : emp
        )
        return updated
      })
      
      // Show success message
      alert(`Employee assigned to shift successfully. ${employee.name} has been notified.`)
    } catch (error) {
      alert('Error assigning employee: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingShift) {
        await api.updateShift(editingShift.id, formData)
      } else {
        await api.createShift(formData)
      }
      await loadShifts()
      setShowModal(false)
      resetForm()
    } catch (error) {
      alert('Error saving shift: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
<<<<<<< HEAD
=======
    const employeesInShift = getEmployeesInShift(id)
    if (employeesInShift.length > 0) {
      alert(`Cannot delete shift. ${employeesInShift.length} employee(s) are assigned to this shift. Please reassign them first.`)
      return
    }
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    if (!window.confirm('Are you sure you want to delete this shift?')) return
    try {
      await api.deleteShift(id)
      await loadShifts()
    } catch (error) {
      alert('Error deleting shift: ' + error.message)
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

<<<<<<< HEAD
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Shift Management</h2>
          <p className="text-gray-600 mt-1">Manage work shifts and schedules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{shift.name}</h3>
                  <p className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</p>
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
              {shift.description && (
                <p className="text-sm text-gray-600">{shift.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openModal(shift)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(shift.id)}
                className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">{editingShift ? 'Edit' : 'Add'} Shift</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
=======
  const openAssignModal = (shift = null) => {
    setSelectedShift(shift)
    setAssignFormData({
      employeeId: '',
      shiftId: shift ? shift.id.toString() : ''
    })
    setShowAssignModal(true)
  }

  const openEmployeesModal = async (shift) => {
    setSelectedShift(shift)
    // Reload employees to ensure we have the latest shift assignments
    await loadEmployees()
    setShowEmployeesModal(true)
  }

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Active' && shift.active) ||
                         (statusFilter === 'Inactive' && !shift.active)
    return matchesSearch && matchesStatus
  })

  // Employee view - show only their assigned shift
  if (isEmployee) {
    const assignedShift = shifts.length > 0 ? shifts[0] : null
    
    return (
      <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600">My Shift</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              View your assigned work shift schedule and timing details.
            </p>
          </div>
        </div>

        {/* Employee Shift Card */}
        {assignedShift ? (
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{assignedShift.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{assignedShift.startTime} - {assignedShift.endTime}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getShiftTypeColor(getShiftType(assignedShift.startTime))}`}>
                  {getShiftType(assignedShift.startTime)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  assignedShift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {assignedShift.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Working Hours:</span>
                <span className="font-bold text-gray-800">{assignedShift.workingHours?.toFixed(2) || '0'} hours</span>
              </div>
              {assignedShift.breakDuration && (
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Break Duration:</span>
                  <span className="font-bold text-gray-800">{assignedShift.breakDuration} minutes</span>
                </div>
              )}
              {assignedShift.description && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Description: </span>
                    {assignedShift.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Shift Assigned</h3>
            <p className="text-gray-500">
              You haven't been assigned to any shift yet. Please contact your administrator.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Admin view - full shift management
  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Shift Management</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Organize and manage employee working hours efficiently. Plan multiple work shifts, assign employees, and ensure smooth operations.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openAssignModal()}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm md:text-base shadow-md hover:shadow-lg transition-all"
            >
              <UserPlus size={20} />
              Assign Employee
            </button>
            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Add Shift
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search shifts by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors text-sm md:text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 md:px-5 py-2 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium text-sm md:text-base"
          >
            <option value="All">All Shifts</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShifts.map((shift) => {
          const employeesInShift = getEmployeesInShift(shift.id)
          const employeeCount = employeesInShift ? employeesInShift.length : 0
          const shiftType = getShiftType(shift.startTime)
          
          return (
            <div key={shift.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{shift.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{shift.startTime} - {shift.endTime}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getShiftTypeColor(shiftType)}`}>
                    {shiftType}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shift.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Employees Assigned:</span>
                  </div>
                  <span className="font-bold text-blue-600">{employeeCount}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Working Hours:</span>
                  <span className="font-bold text-gray-800">{shift.workingHours?.toFixed(2) || '0'} hours</span>
                </div>
                {shift.breakDuration && (
                  <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Break Duration:</span>
                    <span className="font-bold text-gray-800">{shift.breakDuration} minutes</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEmployeesModal(shift)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  title="View Employees"
                >
                  <Eye size={16} />
                  View ({employeeCount})
                </button>
                <button
                  onClick={() => openAssignModal(shift)}
                  className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  title="Assign Employee"
                >
                  <UserPlus size={16} />
                
                </button>
                <button
                  onClick={() => openModal(shift)}
                  className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  title="Edit Shift"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(shift.id)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  title="Delete Shift"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredShifts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Clock className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg font-medium">
            {searchTerm || statusFilter !== 'All' ? 'No shifts match your search criteria' : 'No shifts found'}
          </p>
          {!searchTerm && statusFilter === 'All' && (
            <button
              onClick={() => openModal()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Shift
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Clock size={24} className="text-blue-600" />
                {editingShift ? 'Edit' : 'Add'} Shift
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shift Name *</label>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
<<<<<<< HEAD
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
=======
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Morning Shift, Night Shift"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                    required
                  />
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
=======
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
=======
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
<<<<<<< HEAD
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
=======
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                    required
                  />
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
=======
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
<<<<<<< HEAD
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
=======
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                    required
                  />
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Duration (minutes)</label>
=======
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Break Duration (minutes)</label>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  <input
                    type="number"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: e.target.value })}
<<<<<<< HEAD
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
=======
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 60"
                    min="0"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  />
                </div>
              </div>
              <div>
<<<<<<< HEAD
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
=======
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add shift description or special notes..."
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
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
<<<<<<< HEAD
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
=======
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Saving...' : 'Save Shift'}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======

      {/* Assign Employee to Shift Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-green-600 flex items-center gap-3">
                <UserPlus size={24} className="text-green-600" />
                Assign Employee to Shift
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setAssignFormData({ employeeId: '', shiftId: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shift *</label>
                <select
                  value={assignFormData.shiftId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, shiftId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select Shift</option>
                  {shifts.filter(s => s.active).map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                <select
                  value={assignFormData.employeeId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  <strong>ℹ️ Note:</strong> Assigning an employee to a new shift will automatically remove them from their current shift assignment.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false)
                    setAssignFormData({ employeeId: '', shiftId: '' })
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Assigning...' : 'Assign Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employees in Shift Modal */}
      {showEmployeesModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Users size={24} className="text-blue-600" />
                Employees in {selectedShift.name}
              </h3>
              <button
                onClick={() => {
                  setShowEmployeesModal(false)
                  setSelectedShift(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Shift Time:</span>
                  <span className="ml-2 font-bold text-gray-800">{selectedShift.startTime} - {selectedShift.endTime}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Total Employees:</span>
                  <span className="ml-2 font-bold text-blue-600">{getEmployeesInShift(selectedShift.id).length}</span>
                </div>
              </div>
            </div>

            {(() => {
              const employeesInShift = getEmployeesInShift(selectedShift.id)
              
              return employeesInShift.length > 0 ? (
                <div className="space-y-2">
                  {employeesInShift.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {emp.name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{emp.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">
                            {emp.department || 'N/A'} - {emp.position || 'N/A'}
                          </p>
                          {emp.email && (
                            <p className="text-xs text-gray-500 mt-1">{emp.email}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {emp.status || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 text-lg font-medium">No employees assigned to this shift</p>
                <button
                  onClick={() => {
                    setShowEmployeesModal(false)
                    openAssignModal(selectedShift)
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Assign Employee
                </button>
              </div>
            )
            })()}
          </div>
        </div>
      )}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    </div>
  )
}

export default Shifts

