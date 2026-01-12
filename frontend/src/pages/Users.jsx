import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Shield, UserCheck, MoreVertical, KeyRound, Crown, Building2, Briefcase, DollarSign, Users as UsersIcon } from 'lucide-react'
import api from '../services/api'
import { useRolePermissions } from '../hooks/useRolePermissions'
import Toast from '../components/Toast'

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
  const [searchId, setSearchId] = useState('')
  const [searchName, setSearchName] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [toast, setToast] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordChangeUser, setPasswordChangeUser] = useState(null)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
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
  const [departments, setDepartments] = useState([])
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
      // Load designations and employment types from all employees
      await loadDesignations(employeesList)
    } catch (err) {
      console.error('Error loading employees:', err)
      setEmployees([])
    }
  }

  const loadDesignations = async (employeesList) => {
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
      
      // Fetch all employees to get all departments (not just currently visible ones)
      try {
        const allEmployees = await api.getEmployees()
        const allEmployeesList = Array.isArray(allEmployees) ? allEmployees : []
        
        // Extract unique departments from all employees
        const departmentList = Array.from(
          new Set(
            allEmployeesList
              .map(e => e?.department)
              .filter(Boolean)
              .sort()
          )
        )
        setDepartments(departmentList)
      } catch (err) {
        console.error('Error loading all employees for departments:', err)
        // Fallback: extract departments from current list
        const departmentList = Array.from(
          new Set(
            employeesList
              .map(e => e?.department)
              .filter(Boolean)
              .sort()
          )
        )
        setDepartments(departmentList)
      }
      
      // Standard employment types that should always be available
      const standardEmploymentTypes = [
        'Full-Time',
        'Part-Time',
        'Contract',
        'Temporary',
        'Intern',
        'Freelance',
        'Consultant',
        'Volunteer',
        'Seasonal',
        'On-Call',
        'Per Diem',
        'Fixed-Term'
      ]
      
      // Fetch all employees to get all employment types (not just currently visible ones)
      try {
        const allEmployees = await api.getEmployees()
        const allEmployeesList = Array.isArray(allEmployees) ? allEmployees : []
        
        // Extract unique employment types from all employees
        const dbEmploymentTypes = Array.from(
          new Set(
            allEmployeesList
              .map(e => e?.employmentType)
              .filter(Boolean)
          )
        )
        
        // Merge standard types with database types, ensuring no duplicates
        const allEmploymentTypes = Array.from(
          new Set([...standardEmploymentTypes, ...dbEmploymentTypes])
        ).sort()
        
        setEmploymentTypes(allEmploymentTypes)
      } catch (err) {
        console.error('Error loading all employees for employment types:', err)
        // Fallback: merge standard types with types from current list
        const currentEmploymentTypes = Array.from(
          new Set(
            employeesList
              .map(e => e?.employmentType)
              .filter(Boolean)
          )
        )
        
        const allEmploymentTypes = Array.from(
          new Set([...standardEmploymentTypes, ...currentEmploymentTypes])
        ).sort()
        
        setEmploymentTypes(allEmploymentTypes)
      }
    } catch (e) {
      console.error('Error loading designations and employment types:', e)
      setDesignations([])
      setDepartments([])
      // Always set standard types even on error
      setEmploymentTypes([
        'Full-Time',
        'Part-Time',
        'Contract',
        'Temporary',
        'Intern',
        'Freelance',
        'Consultant',
        'Volunteer',
        'Seasonal',
        'On-Call',
        'Per Diem',
        'Fixed-Term'
      ])
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

  // Get unique clients and roles for dropdowns
  const uniqueClients = Array.from(new Set(
    allRecords
      .map(r => r.client)
      .filter(Boolean)
      .sort()
  ))
  
  const uniqueRoles = Array.from(new Set(
    allRecords
      .map(r => r.role)
      .filter(Boolean)
      .sort()
  ))

  const filteredRecords = allRecords.filter(record => {
    // Filter by ID
    if (searchId && !String(record.id).toLowerCase().includes(searchId.toLowerCase()) && 
        !(record.employeeId && record.employeeId.toLowerCase().includes(searchId.toLowerCase()))) {
      return false
    }
    
    // Filter by Name
    if (searchName && !record.name.toLowerCase().includes(searchName.toLowerCase())) {
      return false
    }
    
    // Filter by Client
    if (selectedClient && record.client !== selectedClient) {
      return false
    }
    
    // Filter by Role
    if (selectedRole && record.role !== selectedRole) {
      return false
    }
    
    return true
  })

  const handleOpenModal = async (user = null) => {
    if (user) {
      // Editing existing user - show full edit form
      setEditingUser(user)
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'HR_ADMIN',
        active: user.active !== undefined ? user.active : true
      })
      
      // Fetch full employee/user details if it's an employee
      let fullUserData = user
      if (user.type === 'employee' || user.role === 'EMPLOYEE') {
        try {
          const fullData = await api.getEmployee(user.id)
          if (fullData) {
            fullUserData = fullData
          }
        } catch (err) {
          console.error('Error fetching full employee data:', err)
        }
      }
      
      // Pre-fill employee form data from user
      setEmployeeFormData({
        employeeId: fullUserData.employeeId || '',
        name: fullUserData.name || '',
        client: fullUserData.client || '',
        email: fullUserData.email || '',
        password: '',
        role: fullUserData.role || 'HR_ADMIN',
        department: fullUserData.department || '',
        location: fullUserData.location || '',
        employmentType: fullUserData.employmentType || '',
        employeeStatus: fullUserData.employeeStatus || (fullUserData.active ? 'Active' : 'Inactive') || 'Active',
        sourceOfHire: fullUserData.sourceOfHire || '',
        dateOfJoining: formatDateForInput(fullUserData.dateOfJoining),
        dateOfBirth: formatDateForInput(fullUserData.dateOfBirth),
        age: fullUserData.age || calculateAge(formatDateForInput(fullUserData.dateOfBirth)),
        gender: fullUserData.gender || '',
        maritalStatus: fullUserData.maritalStatus || '',
        aboutMe: fullUserData.aboutMe || '',
        expertise: fullUserData.expertise || '',
        pan: fullUserData.pan || '',
        aadhaar: fullUserData.aadhaar || '',
        workPhoneNumber: fullUserData.workPhoneNumber || '',
        personalMobileNumber: fullUserData.personalMobileNumber || '',
        extension: fullUserData.extension || '',
        personalEmailAddress: fullUserData.personalEmailAddress || '',
        seatingLocation: fullUserData.seatingLocation || '',
        tags: fullUserData.tags || '',
        presentAddressLine1: fullUserData.presentAddressLine1 || '',
        presentAddressLine2: fullUserData.presentAddressLine2 || '',
        presentCity: fullUserData.presentCity || '',
        presentCountry: fullUserData.presentCountry || '',
        presentState: fullUserData.presentState || '',
        presentPostalCode: fullUserData.presentPostalCode || '',
        sameAsPresentAddress: fullUserData.sameAsPresentAddress || false,
        permanentAddressLine1: fullUserData.permanentAddressLine1 || '',
        permanentAddressLine2: fullUserData.permanentAddressLine2 || '',
        permanentCity: fullUserData.permanentCity || '',
        permanentCountry: fullUserData.permanentCountry || '',
        permanentState: fullUserData.permanentState || '',
        permanentPostalCode: fullUserData.permanentPostalCode || '',
        dateOfExit: formatDateForInput(fullUserData.dateOfExit),
        salary: fullUserData.salary || '',
      })
      setWorkExperiences(fullUserData.workExperiences || [])
      setEducationDetails(fullUserData.educationDetails || [])
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return 'N/A'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // If Employee role is selected, create/update employee instead of user
      if (formData.role === 'EMPLOYEE' || employeeFormData.role === 'EMPLOYEE') {
        // Build employee data from employeeFormData
        const employeeData = {
          ...employeeFormData,
          employeeId: employeeFormData.employeeId || '', // Explicitly include employee ID
          workExperiences: workExperiences,
          educationDetails: educationDetails,
          client: employeeFormData.client,
        }

        // Handle phone number - Personal Mobile Number should be filled in employee settings/profile, not here
        let fallbackPhone = (employeeFormData.workPhoneNumber && employeeFormData.workPhoneNumber.trim()) || ''
        
        if (!fallbackPhone) {
          setLoading(false)
          setError('Please enter a phone number in Work Phone Number')
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
        if (editingUser && editingUser.type === 'employee') {
          await api.updateEmployee(editingUser.id, employeeData, currentUserRole)
          // Optimistically update local state immediately
          setEmployees(prev => prev.map(emp => 
            emp.id === editingUser.id ? { ...emp, ...employeeData } : emp
          ))
          setToast({ message: 'Employee updated successfully!', type: 'success' })
        } else {
          const newEmployee = await api.createEmployee(employeeData, currentUserRole)
          // Optimistically add to local state immediately
          if (newEmployee && newEmployee.id) {
            setEmployees(prev => [...prev, newEmployee])
          }
          setToast({ message: 'Employee created successfully!', type: 'success' })
        }
        // Reload from server to ensure consistency
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
          role: formData.role || employeeFormData.role,
          active: employeeFormData.employeeStatus ? employeeFormData.employeeStatus === 'Active' : formData.active,
          employeeId: employeeFormData.employeeId || '', // Include employee ID
          department: employeeFormData.department,
          location: employeeFormData.location,
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
        
        // Only include password if it's provided (required for new users, optional for updates)
        if (employeeFormData.password && employeeFormData.password.trim() !== '') {
          userData.password = employeeFormData.password
        } else if (!editingUser) {
          // Password required for new users
          setLoading(false)
          setError('Password is required for new users')
          return
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
          // Optimistically update local state immediately
          setUsers(prev => prev.map(user => 
            user.id === editingUser.id ? { ...user, ...userData } : user
          ))
          setEmployees(prev => prev.map(emp => 
            emp.id === editingUser.id ? { ...emp, ...userData } : emp
          ))
          setToast({ message: 'User updated successfully!', type: 'success' })
        } else {
          const response = await api.createUser(userData, currentUserRole)
          if (response?.error) {
            setError(response.error)
            setLoading(false)
            return
          }
          // Optimistically add to local state immediately
          if (response && response.id) {
            setUsers(prev => [...prev, response])
          }
          setToast({ message: 'User created successfully!', type: 'success' })
        }
        // Reload from server to ensure consistency
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
          // Optimistically remove from local state immediately
          setEmployees(prev => prev.filter(emp => emp.id !== id))
          setUsers(prev => prev.filter(user => user.id !== id))
          // Delete employee
          await api.deleteEmployee(id, currentUserRole)
          setToast({ message: 'Employee deleted successfully!', type: 'success' })
          // Reload from server to ensure consistency
          await loadEmployees()
        } else {
          // Optimistically remove from local state immediately
          setUsers(prev => prev.filter(user => user.id !== id))
          setEmployees(prev => prev.filter(emp => emp.id !== id))
          // Delete user
          const result = await api.deleteUser(id, currentUserRole)
          if (result && result.error) {
            // Revert optimistic update on error
            await loadUsers()
            await loadEmployees()
            setToast({ message: result.error, type: 'error' })
            return
          }
          setToast({ message: 'User deleted successfully!', type: 'success' })
          // Reload from server to ensure consistency
          await loadUsers()
        }
      } catch (err) {
        // Revert optimistic update on error
        await loadUsers()
        await loadEmployees()
        setToast({ message: err.error || `Failed to delete ${type}`, type: 'error' })
      }
    }
  }

  const canDelete = currentUserRole === 'SUPER_ADMIN'
  
  
  // Open password change modal
  const handleOpenPasswordModal = (user) => {
    setPasswordChangeUser(user)
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setShowPasswordModal(true)
  }

  // Close password change modal
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setPasswordChangeUser(null)
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
  }

  // Password change handler (for password-only modal)
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!passwordData.newPassword || passwordData.newPassword.trim() === '') {
        setError('New password is required')
        setLoading(false)
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      if (passwordChangeUser) {
        // Use appropriate API based on record type
        if (passwordChangeUser.type === 'employee') {
          // For employees, use changeEmployeePassword
          await api.changeEmployeePassword(passwordChangeUser.id, '', passwordData.newPassword)
        } else {
          // For users, use changePassword (signature: id, currentPassword, newPassword)
          await api.changePassword(passwordChangeUser.id, '', passwordData.newPassword)
        }
        setToast({ message: 'Password changed successfully!', type: 'success' })
        handleClosePasswordModal()
        await loadUsers()
        await loadEmployees()
      }
    } catch (err) {
      setError(err.error || err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // Detailed inline form for adding/editing users (HR_ADMIN, MANAGER, FINANCE, EMPLOYEE)
  if (showModal) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
        <div className="w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                {editingUser ? (
                  <>
                    <Edit size={28} className="text-blue-600" />
                    Edit {employeeFormData.role === 'HR_ADMIN' ? 'HR Admin' : employeeFormData.role === 'MANAGER' ? 'Manager' : employeeFormData.role === 'FINANCE' ? 'Finance' : employeeFormData.role === 'EMPLOYEE' ? 'Employee' : 'User'} - {employeeFormData.name || editingUser.name}
                  </>
                ) : (
                  <>
                    <Plus size={28} className="text-blue-600" />
                    Add New {formData.role === 'HR_ADMIN' ? 'HR Admin' : formData.role === 'MANAGER' ? 'Manager' : formData.role === 'FINANCE' ? 'Finance' : formData.role === 'EMPLOYEE' ? 'Employee' : 'User'}
                  </>
                )}
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                        <input
                          type="password"
                          value={employeeFormData.password || ''}
                          onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                          placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoComplete="new-password"
                          data-lpignore="true"
                          required={!editingUser}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Work Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                      <select
                        value={employeeFormData.department}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))
                        ) : (
                          <option value="" disabled>No departments found</option>
                        )}
                      </select>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Client *</label>
                      <select
                        value={employeeFormData.client}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, client: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">Select Client</option>
                        {clients.length > 0 ? (
                          clients.map((client) => (
                            <option key={client} value={client}>{client}</option>
                          ))
                        ) : (
                          <option value="" disabled>No clients found</option>
                        )}
                      </select>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                      <select
                        value={employeeFormData.employeeStatus || 'Active'}
                        onChange={(e) => {
                          const status = e.target.value
                          setEmployeeFormData({ ...employeeFormData, employeeStatus: status })
                          setFormData((prev) => ({ ...prev, active: status === 'Active' }))
                        }}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Work Phone Number *</label>
                      <input
                        type="tel"
                        value={employeeFormData.workPhoneNumber}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, workPhoneNumber: e.target.value })}
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
                  {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </>
    )
  }

  // User Management page - full edit form modal (reuse same form structure as add)
  // The form below will handle both add and edit modes

  // Password change modal (password-only)
  if (showPasswordModal && passwordChangeUser) {
    return (
      <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl px-6 pt-6 pb-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <KeyRound size={28} className="text-blue-600" />
                Change Password - {passwordChangeUser.name}
              </h3>
              <button
                onClick={handleClosePasswordModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
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
      </div>
    )
  }

  // Main content
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            {/* Search by ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search by ID</label>
              <input
                type="text"
                placeholder="Enter ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Search by Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search by Name</label>
              <input
                type="text"
                placeholder="Enter name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Client Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Clients</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Role Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role === 'SUPER_ADMIN' ? 'Super Admin' 
                      : role === 'HR_ADMIN' ? 'HR Admin'
                      : role === 'MANAGER' ? 'Manager'
                      : role === 'FINANCE' ? 'Finance'
                      : role === 'EMPLOYEE' ? 'Employee'
                      : role}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setSearchId('')
                  setSearchName('')
                  setSelectedClient('')
                  setSelectedRole('')
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
            
            {/* Add User Button */}
            {canCreateAdmin && (
              <div>
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  <Plus size={18} />
                  Add User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr 
                    key={`${record.type}-${record.id}`} 
                    className={`hover:bg-gray-50 ${
                      record.role === 'SUPER_ADMIN' 
                        ? 'bg-purple-50 border-l-4 border-purple-500' 
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {record.id || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Role-specific icon instead of avatar */}
                        <div className="mr-3 flex items-center justify-center">
                          {record.role === 'SUPER_ADMIN' ? (
                            <Shield size={24} className="text-purple-600" />
                          ) : record.role === 'HR_ADMIN' ? (
                            <Building2 size={24} className="text-blue-600" />
                          ) : record.role === 'MANAGER' ? (
                            <Briefcase size={24} className="text-green-600" />
                          ) : record.role === 'FINANCE' ? (
                            <DollarSign size={24} className="text-yellow-600" />
                          ) : (
                            <UsersIcon size={24} className="text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div
                            className={`text-sm font-medium underline cursor-pointer hover:text-blue-600 transition-colors ${
                              record.role === 'SUPER_ADMIN' 
                                ? 'text-purple-700 font-bold' 
                                : 'text-blue-700'
                            }`}
                            onClick={() => {
                              // Navigate to employees page and pass the ID for auto-viewing
                              if (record.id) {
                                sessionStorage.setItem('viewEmployeeId', record.id.toString())
                                navigate('/employees')
                              }
                            }}
                          >
                            {record.name}
                          </div>
                          <div className="text-sm text-gray-500">{record.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {record.employeeId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {record.client || 'N/A'}
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
                                    handleOpenPasswordModal(record)
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
    </>
  )
}

export default Users
