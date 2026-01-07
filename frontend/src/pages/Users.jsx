import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Shield, UserCheck, Eye, MoreVertical, KeyRound } from 'lucide-react'
import api from '../services/api'
import { useRolePermissions } from '../hooks/useRolePermissions'

// Helper functions for employee form
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return ''
  const dob = new Date(dateOfBirth)
  const diffMs = Date.now() - dob.getTime()
  const ageDt = new Date(diffMs)
  return Math.abs(ageDt.getUTCFullYear() - 1970).toString()
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.split('T')[0]
  }
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    console.error('Error formatting date:', e)
    return ''
  }
}

const Users = () => {
  const navigate = useNavigate()
  const { isSuperAdmin, hasPermission } = useRolePermissions()
  
  // Only Super Admin can access this page
  useEffect(() => {
    if (!isSuperAdmin || !hasPermission('users')) {
      navigate('/dashboard')
    }
  }, [isSuperAdmin, hasPermission, navigate])
  
  if (!isSuperAdmin || !hasPermission('users')) {
    return null // Will redirect via useEffect
  }
  
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditingInView, setIsEditingInView] = useState(false)
  const [viewFormData, setViewFormData] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'HR_ADMIN',
    active: true
  })
  
  // Employee form state (only used when role is EMPLOYEE)
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeId: '',
    name: '',
    client: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    location: '',
    designation: '',
    employmentType: '',
    employeeStatus: 'Active',
    sourceOfHire: '',
    dateOfJoining: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    maritalStatus: '',
    aboutMe: '',
    expertise: '',
    pan: '',
    aadhaar: '',
    workPhoneNumber: '',
    personalMobileNumber: '',
    extension: '',
    personalEmailAddress: '',
    seatingLocation: '',
    tags: '',
    presentAddressLine1: '',
    presentAddressLine2: '',
    presentCity: '',
    presentCountry: '',
    presentState: '',
    presentPostalCode: '',
    sameAsPresentAddress: false,
    permanentAddressLine1: '',
    permanentAddressLine2: '',
    permanentCity: '',
    permanentCountry: '',
    permanentState: '',
    permanentPostalCode: '',
    dateOfExit: '',
    salary: '',
  })
  const [workExperiences, setWorkExperiences] = useState([])
  const [educationDetails, setEducationDetails] = useState([])
  const [clients, setClients] = useState([])
  const [designations, setDesignations] = useState([])
  const [roles, setRoles] = useState([])
  const [employmentTypes, setEmploymentTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const currentUserRole = localStorage.getItem('userRole')
  const canCreateAdmin = currentUserRole === 'SUPER_ADMIN'
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  useEffect(() => {
    loadUsers()
    loadEmployees()
    loadClients()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      // Include all users including SUPER_ADMIN (they will be sorted to top in display)
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees()
      const employeesList = Array.isArray(data) ? data : []
      setEmployees(employeesList)
      // Load designations from employees
      loadDesignations(employeesList)
    } catch (err) {
      console.error('Error loading employees:', err)
      setEmployees([])
    }
  }

  const loadDesignations = (employeesList) => {
    try {
      // Extract unique designations from employees
      const designationList = Array.from(
        new Set(
          employeesList
            .map(e => e?.designation)
            .filter(Boolean)
            .sort()
        )
      )
      setDesignations(designationList)
    } catch (e) {
      console.error('Error loading designations:', e)
      setDesignations([])
    }
  }

  const loadClients = async () => {
    try {
      const list = await api.getClients()
      setClients(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Error loading clients:', e)
      setClients([])
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch (e) {
      return 'N/A'
    }
  }

  // Combine users and employees for display, removing duplicates by ID
  // Create a map to track records by ID and avoid duplicates
  const recordsMap = new Map()
  
  // First, add all users
  users.forEach(u => {
    if (u.id) {
      recordsMap.set(u.id, { ...u, type: 'user' })
    }
  })
  
  // Then, add employees (this will overwrite users with same ID, prioritizing employee data)
  employees.forEach(e => {
    if (e.id) {
      recordsMap.set(e.id, {
        id: e.id,
        name: e.name || 'N/A',
        email: e.email || '',
        role: e.role || 'EMPLOYEE',
        active: e.employeeStatus === 'Active' || e.status === 'Active',
        type: 'employee',
        employeeId: e.employeeId,
        department: e.department,
        designation: e.designation,
        client: e.client,
        location: e.location,
        dateOfJoining: e.dateOfJoining
      })
    }
  })
  
  // Convert map to array and sort: SUPER_ADMIN first, then others
  const allRecords = Array.from(recordsMap.values()).sort((a, b) => {
    // Super Admin goes to top
    if (a.role === 'SUPER_ADMIN' && b.role !== 'SUPER_ADMIN') return -1
    if (a.role !== 'SUPER_ADMIN' && b.role === 'SUPER_ADMIN') return 1
    // For same role or both non-Super Admin, maintain original order
    return 0
  })

  const filteredRecords = allRecords.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.role && record.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (record.employeeId && record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenModal = (user = null) => {
    if (user) {
      // Editing existing user - password change only
      setEditingUser(user)
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'HR_ADMIN',
        active: user.active !== undefined ? user.active : true
      })
    } else {
      // Adding new user - show detailed form
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'HR_ADMIN',
        active: true
      })
      // Initialize detailed form data
      setEmployeeFormData({
        employeeId: '',
        name: '',
        client: '',
        email: '',
        password: '',
        role: 'HR_ADMIN',
        department: '',
        location: '',
        designation: '',
        employmentType: '',
        employeeStatus: 'Active',
        sourceOfHire: '',
        dateOfJoining: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        maritalStatus: '',
        aboutMe: '',
        expertise: '',
        pan: '',
        aadhaar: '',
        workPhoneNumber: '',
        personalMobileNumber: '',
        extension: '',
        personalEmailAddress: '',
        seatingLocation: '',
        tags: '',
        presentAddressLine1: '',
        presentAddressLine2: '',
        presentCity: '',
        presentCountry: '',
        presentState: '',
        presentPostalCode: '',
        sameAsPresentAddress: false,
        permanentAddressLine1: '',
        permanentAddressLine2: '',
        permanentCity: '',
        permanentCountry: '',
        permanentState: '',
        permanentPostalCode: '',
        dateOfExit: '',
        salary: '',
      })
      setWorkExperiences([])
      setEducationDetails([])
    }
    setError('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setError('')
  }

  const handleViewUser = async (record) => {
    try {
      setSelectedUser(record)
      setViewFormData({
        name: record.name || '',
        email: record.email || '',
        role: record.role || '',
        active: record.active !== undefined ? record.active : true,
        department: record.department || '',
        designation: record.designation || '',
        location: record.location || '',
        dateOfJoining: formatDateForInput(record.dateOfJoining)
      })
    } finally {
      setShowViewModal(true)
      setIsEditingInView(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // If Employee role is selected, create employee instead of user
      if (formData.role === 'EMPLOYEE') {
        // Build employee data from employeeFormData
        const employeeData = {
          ...employeeFormData,
          workExperiences: workExperiences,
          educationDetails: educationDetails,
          client: employeeFormData.client,
        }

        // Handle phone number
        let fallbackPhone = (employeeFormData.personalMobileNumber && employeeFormData.personalMobileNumber.trim()) || 
                           (employeeFormData.workPhoneNumber && employeeFormData.workPhoneNumber.trim()) || ''
        
        if (!fallbackPhone) {
          setLoading(false)
          setError('Please enter a phone number in Personal Mobile Number or Work Phone Number')
          return
        }
        employeeData.phone = fallbackPhone

        // Ensure name field is set
        if (!employeeData.name || employeeData.name.trim() === '') {
          employeeData.name = employeeFormData.name || ''
        }

        // Set status
        if (!employeeData.status || employeeData.status.trim() === '') {
          if (employeeData.employeeStatus && employeeData.employeeStatus.trim()) {
            employeeData.status = employeeData.employeeStatus
          } else {
            employeeData.status = 'Active'
          }
        }

        // Create/update employee
        await api.createEmployee(employeeData, currentUserRole)
        await loadUsers()
        const employeesData = await api.getEmployees()
        const employeesList = Array.isArray(employeesData) ? employeesData : []
        setEmployees(employeesList)
        loadDesignations(employeesList)
        handleCloseModal()
      } else {
        // Build user data from detailed fields (employeeFormData) for HR_ADMIN, MANAGER, FINANCE
        const userData = {
          name: employeeFormData.name || formData.name || '',
          email: employeeFormData.email || formData.email,
          password: employeeFormData.password || formData.password || '',
          role: formData.role,
          active: employeeFormData.employeeStatus ? employeeFormData.employeeStatus === 'Active' : formData.active,
          department: employeeFormData.department,
          location: employeeFormData.location,
          designation: employeeFormData.designation,
          employmentType: employeeFormData.employmentType,
          client: employeeFormData.client, // CRITICAL: Include client field
          dateOfJoining: employeeFormData.dateOfJoining,
          dateOfBirth: employeeFormData.dateOfBirth,
          gender: employeeFormData.gender,
          maritalStatus: employeeFormData.maritalStatus,
          aboutMe: employeeFormData.aboutMe,
          expertise: employeeFormData.expertise,
          pan: employeeFormData.pan,
          aadhaar: employeeFormData.aadhaar,
          workPhoneNumber: employeeFormData.workPhoneNumber,
          personalMobileNumber: employeeFormData.personalMobileNumber,
          extension: employeeFormData.extension,
          personalEmailAddress: employeeFormData.personalEmailAddress,
          seatingLocation: employeeFormData.seatingLocation,
          tags: employeeFormData.tags,
          presentAddressLine1: employeeFormData.presentAddressLine1,
          presentAddressLine2: employeeFormData.presentAddressLine2,
          presentCity: employeeFormData.presentCity,
          presentCountry: employeeFormData.presentCountry,
          presentState: employeeFormData.presentState,
          presentPostalCode: employeeFormData.presentPostalCode,
          sameAsPresentAddress: employeeFormData.sameAsPresentAddress,
          permanentAddressLine1: employeeFormData.permanentAddressLine1,
          permanentAddressLine2: employeeFormData.permanentAddressLine2,
          permanentCity: employeeFormData.permanentCity,
          permanentCountry: employeeFormData.permanentCountry,
          permanentState: employeeFormData.permanentState,
          permanentPostalCode: employeeFormData.permanentPostalCode,
          dateOfExit: employeeFormData.dateOfExit,
          salary: employeeFormData.salary,
          workExperiences,
          educationDetails
        }
        
        // Debug: Log the userData to verify client is included
        console.log('DEBUG Users.jsx: Sending userData with client:', userData.client, 'Full userData:', userData)

        if (editingUser) {
          const response = await api.updateUser(editingUser.id, userData, currentUserRole)
          if (response?.error) {
            setError(response.error)
            setLoading(false)
            return
          }
        } else {
          const response = await api.createUser(userData, currentUserRole)
          if (response?.error) {
            setError(response.error)
            setLoading(false)
            return
          }
        }
        await loadUsers()
        await loadEmployees()
        handleCloseModal()
      }
    } catch (err) {
      setError(err.error || err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, type) => {
    const confirmMessage = type === 'employee' 
      ? 'Are you sure you want to delete this employee?' 
      : 'Are you sure you want to delete this user?'
    
    if (window.confirm(confirmMessage)) {
      try {
        if (type === 'employee') {
          // Delete employee
          await api.deleteEmployee(id, currentUserRole)
          await loadEmployees()
        } else {
          // Delete user
          const result = await api.deleteUser(id, currentUserRole)
          if (result && result.error) {
            alert(result.error)
            return
          }
          await loadUsers()
        }
      } catch (err) {
        alert(err.error || `Failed to delete ${type}`)
      }
    }
  }

  const canDelete = currentUserRole === 'SUPER_ADMIN'
  
  
  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.password || formData.password.trim() === '') {
        setError('Password is required')
        setLoading(false)
        return
      }

      if (editingUser) {
        // Use appropriate API based on record type
        if (editingUser.type === 'employee') {
          // For employees, use changeEmployeePassword
          await api.changeEmployeePassword(editingUser.id, '', formData.password)
        } else {
          // For users, use changePassword (signature: id, currentPassword, newPassword)
          await api.changePassword(editingUser.id, '', formData.password)
        }
        alert('Password changed successfully!')
        handleCloseModal()
        await loadUsers()
      }
    } catch (err) {
      setError(err.error || err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // Detailed inline form for adding new users (HR_ADMIN, MANAGER, FINANCE, EMPLOYEE)
  if (showModal && !editingUser) {
    return (
      <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
        <div className="w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                <Plus size={28} className="text-blue-600" />
                Add New {formData.role === 'HR_ADMIN' ? 'HR Admin' : formData.role === 'MANAGER' ? 'Manager' : formData.role === 'FINANCE' ? 'Finance' : formData.role === 'EMPLOYEE' ? 'Employee' : 'User'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {/* Detailed User Form */}
              <div className="space-y-5">
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                      <input
                        type="text"
                        value={employeeFormData.employeeId}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeId: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={employeeFormData.name}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                        placeholder="Enter Full Name"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="text"
                        value={employeeFormData.email || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                        placeholder="Enter Email Address"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                        data-lpignore="true"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                      <input
                        type="password"
                        value={employeeFormData.password || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="new-password"
                        data-lpignore="true"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Work Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                      <input
                        type="text"
                        value={employeeFormData.department}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                        placeholder="Enter Department"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                      <select
                        value={employeeFormData.role}
                        onChange={(e) => {
                          setEmployeeFormData({ ...employeeFormData, role: e.target.value })
                          setFormData((prev) => ({ ...prev, role: e.target.value }))
                        }}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="HR_ADMIN">HR Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="FINANCE">Finance</option>
                        <option value="EMPLOYEE">Employee</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type *</label>
                      <select
                        value={employeeFormData.employmentType}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, employmentType: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Employment Type</option>
                        {employmentTypes.length > 0 ? (
                          employmentTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))
                        ) : (
                          <>
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Temporary">Temporary</option>
                            <option value="Intern">Intern</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Designation *</label>
                      <input
                        list="designation-list"
                        type="text"
                        value={employeeFormData.designation}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                        placeholder="Enter designation"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <datalist id="designation-list">
                        {designations.map((designation) => (
                          <option key={designation} value={designation} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Client *</label>
                      <input
                        list="client-list"
                        type="text"
                        value={employeeFormData.client}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, client: e.target.value })}
                        placeholder="Enter client name"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <datalist id="client-list">
                        {clients.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                      <input
                        type="text"
                        value={employeeFormData.location}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, location: e.target.value })}
                        placeholder="Enter location"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Offered Date *</label>
                      <input
                        type="date"
                        value={employeeFormData.dateOfJoining}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, dateOfJoining: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={employeeFormData.salary || ''}
                          onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: e.target.value })}
                          className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Work Phone Number</label>
                      <input
                        type="tel"
                        value={employeeFormData.workPhoneNumber}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, workPhoneNumber: e.target.value })}
                        placeholder="Enter Phone Number"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Mobile Number *</label>
                      <input
                        type="tel"
                        value={employeeFormData.personalMobileNumber}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, personalMobileNumber: e.target.value })}
                        placeholder="Enter Phone Number"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Saving...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // User Management page - password change modal
  if (showModal && editingUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                Change Password - {editingUser.name || editingUser.email}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>User: {editingUser.name || editingUser.email}</p>
                  <p>Role: {editingUser.role || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
          </form>
        </div>
      </div>
    )
  }

  // Inline detailed view for any non-superadmin record
  if (showViewModal && selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
        <div className="w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                <Eye size={28} className="text-blue-600" />
                User Details
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenModal(selectedUser)
                    setShowViewModal(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedUser(null)
                    setIsEditingInView(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={selectedUser.name || 'N/A'}
                      readOnly
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="text"
                      value={selectedUser.email || 'N/A'}
                      readOnly
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={
                        selectedUser.role === 'HR_ADMIN' ? 'HR Admin' :
                        selectedUser.role === 'MANAGER' ? 'Manager' :
                        selectedUser.role === 'FINANCE' ? 'Finance' :
                        selectedUser.role === 'EMPLOYEE' ? 'Employee' :
                        selectedUser.role || 'N/A'
                      }
                      readOnly
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <input
                      type="text"
                      value={selectedUser.active ? 'Active' : 'Inactive'}
                      readOnly
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                    />
                  </div>
                  {selectedUser.department && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={selectedUser.department || 'N/A'}
                        readOnly
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                  )}
                  {selectedUser.designation && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={selectedUser.designation || 'N/A'}
                        readOnly
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                  )}
                  {selectedUser.dateOfJoining && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Offered Date</label>
                      <input
                        type="text"
                        value={formatDate(selectedUser.dateOfJoining)}
                        readOnly
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                  )}
                  {selectedUser.location && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={selectedUser.location || 'N/A'}
                        readOnly
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search users by name, email, role, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {canCreateAdmin && (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Plus size={18} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={`${record.type}-${record.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                        {record.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          className="text-sm font-medium text-blue-700 underline cursor-pointer"
                          onClick={() => handleViewUser(record)}
                        >
                          {record.name}
                        </div>
                        <div className="text-sm text-gray-500">{record.email}</div>
                        {record.employeeId && (
                          <div className="text-xs text-gray-400">ID: {record.employeeId}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      record.type === 'employee' 
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.type === 'employee' ? 'Employee' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${
                      record.role === 'SUPER_ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : record.role === 'HR_ADMIN'
                        ? 'bg-blue-100 text-blue-800'
                        : record.role === 'MANAGER'
                        ? 'bg-green-100 text-green-800'
                        : record.role === 'FINANCE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.role === 'SUPER_ADMIN' ? <Shield size={14} /> : <UserCheck size={14} />}
                      {record.role === 'SUPER_ADMIN' ? 'Super Admin' 
                        : record.role === 'HR_ADMIN' ? 'HR Admin'
                        : record.role === 'MANAGER' ? 'Manager'
                        : record.role === 'FINANCE' ? 'Finance'
                        : record.role === 'EMPLOYEE' ? 'Employee'
                        : record.role || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      record.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <div className="relative dropdown-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdownId(openDropdownId === record.id ? null : record.id)
                          }}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openDropdownId === record.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                            {/* Change Password option for all users */}
                            {(record.type === 'user' || record.type === 'employee') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenModal(record)
                                  setOpenDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <KeyRound size={16} className="text-blue-600" />
                                Change Password
                              </button>
                            )}
                            {/* Delete option for users */}
                            {record.type === 'user' && canDelete && record.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(record.id, 'user')
                                  setOpenDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                            {/* Delete option for employees */}
                            {record.type === 'employee' && canDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(record.id, 'employee')
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

    </div>
  )
}

export default Users
