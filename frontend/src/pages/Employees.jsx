import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Upload, 
  FileText, Download, Eye, User, Shield, Filter, ChevronDown, 
  ChevronRight, ChevronUp, ChevronLeft, MoreVertical, Check, X,
  Users, Briefcase, Building, Calendar, Tag, UserPlus, FileUp, Frown, Loader2
} from 'lucide-react';
import api from '../services/api';
import styles from './Employees.module.css';
import Toast from '../components/Toast';


const API_BASE_URL = 'http://localhost:8080/api'; 
import { useRolePermissions } from '../hooks/useRolePermissions'

const Employees = () => { 
const navigate = useNavigate() 
const location = useLocation()
const { canManageEmployees, isEmployee } = useRolePermissions()
const isNewEmployeePage = location.pathname === '/employees/new'
// Redirect if user doesn't have permission
useEffect(() => { 
if (!canManageEmployees || isEmployee) { 
navigate('/dashboard') 
} 
}, [canManageEmployees, isEmployee, navigate]) 

// Open form when on /employees/new route
useEffect(() => {
  if (isNewEmployeePage && !showModal && !editingEmployee) {
    // Check if there's pending user data from User Management page
    const pendingUserData = sessionStorage.getItem('pendingUserData')
    if (pendingUserData) {
      try {
        const userData = JSON.parse(pendingUserData)
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          password: userData.password || '',
          role: 'EMPLOYEE'
        }))
        // Clear the session storage
        sessionStorage.removeItem('pendingUserData')
      } catch (error) {
        console.error('Error parsing pending user data:', error)
      }
    }
    handleOpenModal()
  }
}, [isNewEmployeePage])

if (!canManageEmployees || isEmployee) { 
return null // Will redirect via useEffect 
} 
const [employees, setEmployees] = useState([]) 
const [users, setUsers] = useState([]) 
const [documents, setDocuments] = useState({}) 
const [nameSearchTerm, setNameSearchTerm] = useState('')
const [emailSearchTerm, setEmailSearchTerm] = useState('') 
const [statusFilter, setStatusFilter] = useState('All') 
const [clientFilter, setClientFilter] = useState('All') 
const [roleFilter, setRoleFilter] = useState('All') 
const [clients, setClients] = useState([]) 
const [showModal, setShowModal] = useState(false) 
const [showDocModal, setShowDocModal] = useState(false) 
const [showViewModal, setShowViewModal] = useState(false) 
const [selectedEmployee, setSelectedEmployee] = useState(null) 
const [editingEmployee, setEditingEmployee] = useState(null) 
const [loading, setLoading] = useState(true) 
const [error, setError] = useState(null) 
const [toast, setToast] = useState(null)
const [openMenuId, setOpenMenuId] = useState(null) 
const [formData, setFormData] = useState({ 
employeeId: '', 
name: '',
client: '', 
email: '', 
password: '', 
role: '', 
department: '', 
location: '', 
employmentType: '', 
employeeStatus: 'Active', 
sourceOfHire: '', 
dateOfJoining: '', 
dateOfBirth: '', 
age: '', // Calculated, not directly edited 
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

})
const [workExperiences, setWorkExperiences] = useState([]) 
const [educationDetails, setEducationDetails] = useState([]) 
const [docFormData, setDocFormData] = useState({ 
documentType: 'AADHAAR', 
description: '' 
}) 
const [docFile, setDocFile] = useState(null) 
const [designations, setDesignations] = useState([])
const [roles, setRoles] = useState([])
const [employmentTypes, setEmploymentTypes] = useState([])
const [openDropdownId, setOpenDropdownId] = useState(null)
const userRole = localStorage.getItem('userRole')
const isHrAdmin = userRole === 'HR_ADMIN'
const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null 

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
loadEmployees() 
  // Also load non-employee users so we can show them in the list
  ;(async () => {
    try {
      const list = await api.getUsers()
      // Filter based on role: HR_ADMIN sees only MANAGER, FINANCE, EMPLOYEE (exclude HR_ADMIN and SUPER_ADMIN)
      const filtered = Array.isArray(list) ? list.filter(u => {
        const role = (u.role || '').toUpperCase()
        const userId = u.id || u.userId
        
        // Exclude SUPER_ADMIN for everyone
        if (role === 'SUPER_ADMIN') return false
        
        // For HR_ADMIN: exclude HR_ADMIN role and exclude HR_ADMIN's own record
        if (isHrAdmin) {
          if (role === 'HR_ADMIN') return false
          if (currentUserId && (userId === currentUserId || parseInt(userId) === currentUserId)) return false
          // Only include MANAGER, FINANCE, EMPLOYEE
          return role === 'MANAGER' || role === 'FINANCE' || role === 'EMPLOYEE'
        }
        
        // For other roles, include all except SUPER_ADMIN
        return true
      }) : []
      setUsers(filtered)
    } catch (e) {
      console.error('Error loading users:', e)
      setUsers([])
    }
  })()
}, []) 

// Auto-view employee when navigated from Users page
// Check immediately on mount and show loading state
const [autoViewingId, setAutoViewingId] = useState(null)
const [isAutoViewing, setIsAutoViewing] = useState(false)

useEffect(() => {
  const viewEmployeeId = sessionStorage.getItem('viewEmployeeId')
  if (viewEmployeeId) {
    setAutoViewingId(viewEmployeeId)
    setIsAutoViewing(true)
  }
}, [])

const loadDesignations = async (employeesList) => {
  try {
    // Extract unique designations from employees (kept for other uses but not shown in form)
    const designationList = Array.from(
      new Set(
        employeesList
          .map(emp => emp.designation)
          .filter(des => des && des.trim() !== '')
      )
    ).sort()
    setDesignations(designationList)
    
    // Extract unique roles from employees
    const roleList = Array.from(
      new Set(
        employeesList
          .map(emp => emp.role)
          .filter(role => role && role.trim() !== '')
      )
    ).sort()
    setRoles(roleList)
    
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
            .map(emp => emp.employmentType)
            .filter(type => type && type.trim() !== '')
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
            .map(emp => emp.employmentType)
            .filter(type => type && type.trim() !== '')
        )
      )
      
      const allEmploymentTypes = Array.from(
        new Set([...standardEmploymentTypes, ...currentEmploymentTypes])
      ).sort()
      
      setEmploymentTypes(allEmploymentTypes)
    }
  } catch (error) {
    console.error('Error loading designations and employment types:', error)
    setDesignations([])
    setRoles([])
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

useEffect(() => {
  loadClients()
}, [])

// Handle click outside to close menu
useEffect(() => { 
  const handleClickOutside = (event) => {
    // Check if click is outside any menu dropdown
    const isMenuButton = event.target.closest('[data-menu-button]')
    const isMenuDropdown = event.target.closest('[data-menu-dropdown]')
    
    if (!isMenuButton && !isMenuDropdown) {
      setOpenMenuId(null)
    }
  }

  if (openMenuId !== null) {
    document.addEventListener('mousedown', handleClickOutside)
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [openMenuId])
// Update form data when editingEmployee changes 
useEffect(() => { 
if (showModal && editingEmployee) { 
const formattedJoinDate = formatDateForInput(editingEmployee.dateOfJoining) 
const formattedDateOfBirth = formatDateForInput(editingEmployee.dateOfBirth) 
setFormData({ 
employeeId: editingEmployee.employeeId || '', 
name: editingEmployee.name || '',
client: editingEmployee.client || '', 
email: editingEmployee.email || '', 
password: '',  // Never show password when editing
role: editingEmployee.role || '', 
department: editingEmployee.department || '', 
location: editingEmployee.location || '', 
employmentType: editingEmployee.employmentType || '', 
employeeStatus: editingEmployee.employeeStatus || 'Active', 
sourceOfHire: editingEmployee.sourceOfHire || '', 
dateOfJoining: formattedJoinDate, 
dateOfBirth: formattedDateOfBirth, 
age: calculateAge(formattedDateOfBirth), 
gender: editingEmployee.gender || '', 
maritalStatus: editingEmployee.maritalStatus || '', 
aboutMe: editingEmployee.aboutMe || '', 
expertise: editingEmployee.expertise || '', 

pan: editingEmployee.pan || '', 
aadhaar: editingEmployee.aadhaar || '', 
workPhoneNumber: editingEmployee.workPhoneNumber || '', 
personalMobileNumber: editingEmployee.personalMobileNumber || '', 
extension: editingEmployee.extension || '', 
personalEmailAddress: editingEmployee.personalEmailAddress || '', 
seatingLocation: editingEmployee.seatingLocation || '', 
tags: editingEmployee.tags || '', 
presentAddressLine1: editingEmployee.presentAddressLine1 || '', 
presentAddressLine2: editingEmployee.presentAddressLine2 || '', 
presentCity: editingEmployee.presentCity || '', 
presentCountry: editingEmployee.presentCountry || '', 
presentState: editingEmployee.presentState || '', 
presentPostalCode: editingEmployee.presentPostalCode || '', 
sameAsPresentAddress: editingEmployee.sameAsPresentAddress || false, 
permanentAddressLine1: editingEmployee.permanentAddressLine1 || '', 
permanentAddressLine2: editingEmployee.permanentAddressLine2 || '', 
permanentCity: editingEmployee.permanentCity || '', 
permanentCountry: editingEmployee.permanentCountry || '', 
permanentState: editingEmployee.permanentState || '', 
permanentPostalCode: editingEmployee.permanentPostalCode || '', 
dateOfExit: formatDateForInput(editingEmployee.dateOfExit), 
salary: editingEmployee.salary ? (typeof editingEmployee.salary === 'number' ? editingEmployee.salary.toString() : String(editingEmployee.salary).replace(/[₹,\s]/g, '')) : '', 
}) 
setWorkExperiences(editingEmployee.workExperiences || []) 
setEducationDetails(editingEmployee.educationDetails || []) 
} else if (showModal && !editingEmployee) { 
// Ensure form is completely empty when adding new employee - DO NOT show admin email/password
setFormData({ 
employeeId: '', 
name: '',
client: '', 
email: '',  // MUST be empty - never show admin email
password: '',  // MUST be empty - never show admin password
role: '', 
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
}, [editingEmployee, showModal]) 
const calculateAge = (dateOfBirth) => { 
if (!dateOfBirth) return '' 
const dob = new Date(dateOfBirth) 
const diffMs = Date.now() - dob.getTime() 
const ageDt = new Date(diffMs) 
return Math.abs(ageDt.getUTCFullYear() - 1970).toString() 
} 
const loadEmployees = async () => { 
		try { 
			setLoading(true) 
			setError(null) 
			const data = await api.getEmployees() 
			console.log('Employees loaded:', data, 'Type:', typeof data, 'IsArray:', Array.isArray(data)) 
			if (Array.isArray(data)) { 
				setEmployees(data) 
				// Load designations from employees
				await loadDesignations(data)
				if (data.length === 0) { 
					// Clear any previous error - empty list is a valid state
					setError(null) 
				} 
			} else { 
				console.error('Invalid data format:', data) 
				setEmployees([]) 
				const message = data && data.error ? data.error : 'Failed to load users. Invalid data format received.'
				setError(message) 
			} 
} catch (error) { 
console.error('Error loading users:', error) 
setError('Failed to load users: ' + (error.message || 'Unknown error')) 
setEmployees([]) 
} finally { 
setLoading(false) 
} 
} 
const loadDocuments = async (employeeId) => { 
try { 
console.log('Loading documents for employee:', employeeId) 
const data = await api.getEmployeeDocuments(employeeId) 
console.log('Documents loaded:', data) 
setDocuments(prev => ({ ...prev, [employeeId]: data })) 
} catch (error) { 
console.error('Error loading documents:', error) 
alert('Error loading documents: ' + (error.message || 'Unknown error')) 
// Set empty array on error to prevent undefined issues 
setDocuments(prev => ({ ...prev, [employeeId]: [] })) 
} 
} 

// Auto-view employee when navigated from Users page - directly fetch and show
useEffect(() => {
  const viewEmployeeId = sessionStorage.getItem('viewEmployeeId')
  if (!viewEmployeeId || !isAutoViewing) return
  
  // Directly fetch the employee data without waiting for the list
  ;(async () => {
    try {
      const employeeData = await api.getEmployee(parseInt(viewEmployeeId))
      if (employeeData) {
        setSelectedEmployee(employeeData)
        await loadDocuments(parseInt(viewEmployeeId))
        setShowViewModal(true)
        setIsAutoViewing(false)
        sessionStorage.removeItem('viewEmployeeId')
        setAutoViewingId(null)
      }
    } catch (error) {
      console.error('Error fetching employee for auto-view:', error)
      // Fallback to waiting for list to load
      setIsAutoViewing(false)
    }
  })()
}, [isAutoViewing])

// Fallback: Auto-view employee when navigated from Users page
// This effect runs after employees/users are loaded if direct fetch didn't work
useEffect(() => {
  const viewEmployeeId = sessionStorage.getItem('viewEmployeeId')
  if (!viewEmployeeId || isAutoViewing) return
  
  // Wait for employees/users to be loaded
  if (employees.length > 0 || users.length > 0) {
    // Find the employee/user by ID
    const employee = employees.find(emp => emp.id && emp.id.toString() === viewEmployeeId)
    const user = !employee ? users.find(u => u.id && u.id.toString() === viewEmployeeId) : null
    
    if (employee || user) {
      // Use setTimeout to ensure handleViewEmployee is accessible (defined later in component)
      const timer = setTimeout(() => {
        try {
          if (employee) {
            handleViewEmployee(employee)
          } else if (user) {
            handleViewEmployee({ ...user, type: 'user' })
          }
          sessionStorage.removeItem('viewEmployeeId')
          setAutoViewingId(null)
        } catch (error) {
          console.error('Error viewing employee:', error)
          sessionStorage.removeItem('viewEmployeeId')
          setAutoViewingId(null)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }
}, [employees, users, navigate, isAutoViewing]) 
// Combine employees and (non-superadmin) users into a single list
// Filter employees based on role: HR_ADMIN sees only MANAGER, FINANCE, EMPLOYEE (exclude HR_ADMIN and SUPER_ADMIN)
const employeeRecords = Array.isArray(employees) ? employees
  .filter(e => {
    const role = (e.role || e.designation || '').toUpperCase()
    const empId = e.id || e.employeeId
    
    // Exclude SUPER_ADMIN for everyone
    if (role === 'SUPER_ADMIN') return false
    
    // For HR_ADMIN: exclude HR_ADMIN role and exclude HR_ADMIN's own record
    if (isHrAdmin) {
      if (role === 'HR_ADMIN') return false
      if (currentUserId && (empId === currentUserId || parseInt(empId) === currentUserId)) return false
      // Only include MANAGER, FINANCE, EMPLOYEE
      return role === 'MANAGER' || role === 'FINANCE' || role === 'EMPLOYEE'
    }
    
    // For other roles, include all except SUPER_ADMIN
    return true
  })
  .map(e => ({ ...e, type: 'employee' })) : []

// Filter users based on role: HR_ADMIN sees only MANAGER, FINANCE, EMPLOYEE (exclude HR_ADMIN and SUPER_ADMIN)
const userRecords = Array.isArray(users) ? users
  .filter(u => {
    const role = (u.role || '').toUpperCase()
    const userId = u.id || u.userId
    
    // Exclude SUPER_ADMIN for everyone
    if (role === 'SUPER_ADMIN') return false
    
    // For HR_ADMIN: exclude HR_ADMIN role and exclude HR_ADMIN's own record
    if (isHrAdmin) {
      if (role === 'HR_ADMIN') return false
      if (currentUserId && (userId === currentUserId || parseInt(userId) === currentUserId)) return false
      // Only include MANAGER, FINANCE, EMPLOYEE
      return role === 'MANAGER' || role === 'FINANCE' || role === 'EMPLOYEE'
    }
    
    // For other roles, include all except SUPER_ADMIN
    return true
  })
  .map(u => {
    return {
      id: u.id,
      type: 'user',
      employeeId: u.employeeId || String(u.id),
      name: u.name || '',
      email: u.email || '',
      role: u.role || '',
      designation: u.role || '',
      department: u.department || '',
      client: u.client || '',
      dateOfJoining: u.dateOfJoining || '',
      employeeStatus: u.active ? 'Active' : 'Inactive',
      location: u.location || ''
    }
  }) : []

// Combine both lists and remove duplicates by ID
// Prioritize user records (especially MANAGER, FINANCE, HR_ADMIN) over employee records when IDs match

// First, create a map of user records by ID (they take priority)
const userRecordsMap = new Map()
userRecords.forEach(record => {
  if (record.id) {
    userRecordsMap.set(record.id, record)
  }
})

// Then process employee records, but skip if a user record with the same ID exists
const combinedRecords = [
  ...employeeRecords.filter(emp => {
    // Skip employee if there's a user record with the same ID
    if (emp.id && userRecordsMap.has(emp.id)) {
      return false
    }
    return true
  }),
  ...userRecords // Add all user records
]

// Extract unique roles from combinedRecords (excluding SUPER_ADMIN)
const uniqueRoles = [...new Set(
  combinedRecords
    .map(emp => emp.role || emp.designation)
    .filter(role => role && role.trim() !== '' && role.toUpperCase() !== 'SUPER_ADMIN')
    .map(role => role.toUpperCase())
)].sort()

const filteredEmployees = combinedRecords.filter(emp => {
  // Exclude SUPER_ADMIN from the filtered list
  const role = (emp.role || emp.designation || '').toUpperCase()
  if (role === 'SUPER_ADMIN') {
    return false
  }
  
  const matchesName = 
    !nameSearchTerm || 
    (emp.name && emp.name.toLowerCase().includes(nameSearchTerm.toLowerCase()));
  const matchesEmail = 
    !emailSearchTerm || 
    (emp.email && emp.email.toLowerCase().includes(emailSearchTerm.toLowerCase()));
  const matchesStatus = statusFilter === 'All' || emp.employeeStatus === statusFilter;
  const matchesClient = clientFilter === 'All' || (clientFilter === 'Unassigned' ? !emp.client : emp.client === clientFilter);
  const matchesRole = roleFilter === 'All' || role === roleFilter.toUpperCase();
  return matchesName && matchesEmail && matchesStatus && matchesClient && matchesRole;
})
// Format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'N/A';
  }
};

// Format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => { 
  if (!dateString) return '';
  // If already in YYYY-MM-DD format, return as is 
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) { 
    return dateString.split('T')[0]; // Remove time part if present 
  } 
  // Try to parse and format the date 
  try { 
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) { 
    console.error('Error formatting date:', e);
    return '';
} 
} 
const handleOpenModal = async (employee = null) => { 
  setError('')
  setShowModal(true)
  
if (employee) { 
    // Unified handling for both users and employees - always fetch full data
    let fullEmployeeData = employee
    
    // Try to fetch full employee data regardless of type (user or employee)
    if (employee.id) {
      try {
        console.log('Fetching full employee/user details for ID:', employee.id)
        const fullData = await api.getEmployee(employee.id)
        if (fullData) {
          fullEmployeeData = fullData
          console.log('Fetched full employee data:', fullData)
        }
      } catch (err) {
        console.error('Error fetching full employee data:', err)
        // Continue with partial data if fetch fails
      }
    }
    
    // Set editing employee with full data
    setEditingEmployee(fullEmployeeData)
    
    // Format dates
    const formattedJoinDate = formatDateForInput(fullEmployeeData.dateOfJoining)
    const formattedDateOfBirth = formatDateForInput(fullEmployeeData.dateOfBirth)
    
    // Set form data with full employee data (same for both users and employees)
setFormData({ 
      employeeId: fullEmployeeData.employeeId || '',
      name: fullEmployeeData.name || '',
      client: fullEmployeeData.client || '',
      email: fullEmployeeData.email || '',
      password: '', // Password is not pre-filled for security
      role: fullEmployeeData.role || '',
      department: fullEmployeeData.department || '',
      location: fullEmployeeData.location || '',
      employmentType: fullEmployeeData.employmentType || '',
      employeeStatus: fullEmployeeData.employeeStatus || (fullEmployeeData.active !== undefined ? (fullEmployeeData.active ? 'Active' : 'Inactive') : 'Active'),
      sourceOfHire: fullEmployeeData.sourceOfHire || '',
dateOfJoining: formattedJoinDate, 
dateOfBirth: formattedDateOfBirth, 
age: calculateAge(formattedDateOfBirth), 
      gender: fullEmployeeData.gender || '',
      maritalStatus: fullEmployeeData.maritalStatus || '',
      aboutMe: fullEmployeeData.aboutMe || '',
      expertise: fullEmployeeData.expertise || '',
      pan: fullEmployeeData.pan || '',
      aadhaar: fullEmployeeData.aadhaar || '',
      workPhoneNumber: fullEmployeeData.workPhoneNumber || '',
      personalMobileNumber: fullEmployeeData.personalMobileNumber || '',
      extension: fullEmployeeData.extension || '',
      personalEmailAddress: fullEmployeeData.personalEmailAddress || '',
      seatingLocation: fullEmployeeData.seatingLocation || '',
      tags: fullEmployeeData.tags || '',
      presentAddressLine1: fullEmployeeData.presentAddressLine1 || '',
      presentAddressLine2: fullEmployeeData.presentAddressLine2 || '',
      presentCity: fullEmployeeData.presentCity || '',
      presentCountry: fullEmployeeData.presentCountry || '',
      presentState: fullEmployeeData.presentState || '',
      presentPostalCode: fullEmployeeData.presentPostalCode || '',
      sameAsPresentAddress: fullEmployeeData.sameAsPresentAddress || false,
      permanentAddressLine1: fullEmployeeData.permanentAddressLine1 || '',
      permanentAddressLine2: fullEmployeeData.permanentAddressLine2 || '',
      permanentCity: fullEmployeeData.permanentCity || '',
      permanentCountry: fullEmployeeData.permanentCountry || '',
      permanentState: fullEmployeeData.permanentState || '',
      permanentPostalCode: fullEmployeeData.permanentPostalCode || '',
      dateOfExit: formatDateForInput(fullEmployeeData.dateOfExit),
      salary: fullEmployeeData.salary ? (typeof fullEmployeeData.salary === 'number' ? fullEmployeeData.salary.toString() : String(fullEmployeeData.salary).replace(/[₹,\s]/g, '')) : '',
    })
    
    setWorkExperiences(Array.isArray(fullEmployeeData.workExperiences) ? fullEmployeeData.workExperiences : [])
    setEducationDetails(Array.isArray(fullEmployeeData.educationDetails) ? fullEmployeeData.educationDetails : [])
} else { 
// Adding new employee - ensure all fields are empty, especially email and password
// NEVER populate from localStorage - always start fresh
setEditingEmployee(null) 
// Explicitly reset formData to ensure no values persist
setFormData({ 
employeeId: '', 
name: '',
client: '', 
email: '',  // MUST be empty - never use admin email from localStorage
password: '',  // MUST be empty - never use admin password
role: '', 
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
setShowModal(true)
} 
// Fetch and show full employee details in view modal (module-level)
const handleViewEmployee = async (employee) => {
	try {
		// Always fetch full employee data regardless of type (user or employee)
		// This ensures we get all details including work experiences, education, dependent details, etc.
		const full = await api.getEmployee(employee.id)
		if (full) {
			setSelectedEmployee(full)
		// Load documents for the employee
		await loadDocuments(employee.id)
		} else {
			// Fallback to partial data if fetch fails
			setSelectedEmployee(employee)
			await loadDocuments(employee.id)
		}
	} catch (err) {
		console.error('Error fetching full employee for view:', err)
		// Fallback to partial data if fetch fails
		setSelectedEmployee(employee)
		// Still try to load documents even if employee fetch fails
		try {
		await loadDocuments(employee.id)
		} catch (docErr) {
			console.error('Error loading documents:', docErr)
		}
	} finally {
		setShowViewModal(true)
	}
}


const handleSubmit = async (e) => { 
e.preventDefault() 
setLoading(true) 
// Create a complete employee object to send to the backend 
const employeeData = { 
	...formData, 
	workExperiences: workExperiences, 
	educationDetails: educationDetails,
	client: formData.client,
}

// The backend expects a top-level `phone` field. Use workPhoneNumber or existing phone.
// Personal Mobile Number should be filled in employee settings/profile, not here.
let fallbackPhone = (formData.workPhoneNumber && formData.workPhoneNumber.trim()) || ''

// If editing and no phone in form but employee has one, use existing phone
if (editingEmployee && !fallbackPhone && editingEmployee.phone) {
	fallbackPhone = editingEmployee.phone
}

if (!fallbackPhone) {
	setLoading(false)
	alert('Please enter a phone number in Work Phone Number')
	return
}
// Use fallbackPhone for the required `phone` property
employeeData.phone = fallbackPhone

// Ensure name field is set
if (!employeeData.name || employeeData.name.trim() === '') {
	employeeData.name = formData.name || ''
}

// Set status field from employeeStatus if not explicitly set
if (!employeeData.status || employeeData.status.trim() === '') {
	if (employeeData.employeeStatus && employeeData.employeeStatus.trim()) {
		employeeData.status = employeeData.employeeStatus
	} else {
		employeeData.status = 'Active' // Default to Active
	}
}

// Handle password - optional when editing, required when creating
if (formData.password && formData.password.trim() !== '') {
  employeeData.password = formData.password
} else if (!editingEmployee) {
  // Password required for new employees
  setLoading(false)
  alert('Password is required for new employees')
  return
}

// Debug: Log the employeeData to see if client is included
console.log('DEBUG: Sending employeeData with client:', employeeData.client)
console.log('DEBUG: Full formData.client value:', formData.client)
console.log('DEBUG: Full employeeData object:', JSON.stringify(employeeData, null, 2))

try { 
if (editingEmployee) { 
  await api.updateEmployee(editingEmployee.id, employeeData, userRole) 
  // Optimistically update local state immediately
  setEmployees(prev => prev.map(emp => 
    emp.id === editingEmployee.id ? { ...emp, ...employeeData } : emp
  ))
  setToast({ message: 'Employee updated successfully!', type: 'success' })
} else { 
  const newEmployee = await api.createEmployee(employeeData, userRole)
  // Optimistically add to local state immediately
  if (newEmployee && newEmployee.id) {
    setEmployees(prev => [...prev, newEmployee])
  }
  setToast({ message: 'Employee created successfully!', type: 'success' })
  // Refresh client list after adding new employee
  await loadClients()
} 
// Reload from server to ensure consistency
await loadEmployees() 
setShowModal(false) 
// Navigate back to employees list if on new page
if (isNewEmployeePage) {
  navigate('/employees')
}
// Reset form after successful save 
setEditingEmployee(null) 
setFormData({ 
employeeId: '', 
name: '',
client: '', 

email: '', 
password: '', 
role: '', 
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
} catch (error) { 
alert('Error saving user: ' + error.message) 
} finally { 
setLoading(false) 
} 
} 
const handleDelete = async (record) => { 
  const isUser = record?.type === 'user'
  if (!window.confirm(`Are you sure you want to delete this ${isUser ? 'user' : 'employee'}?`)) return 
  try { 
    if (isUser) {
      // Optimistically remove from local state immediately
      setUsers(prev => prev.filter(user => user.id !== record.id))
      await api.deleteUser(record.id, userRole)
      setToast({ message: 'User deleted successfully!', type: 'success' })
      // Reload from server to ensure consistency
      const list = await api.getUsers()
      setUsers(Array.isArray(list) ? list.filter(u => {
        const role = (u.role || '').toUpperCase()
        return role !== 'SUPER_ADMIN'
      }) : [])
    } else {
      // Optimistically remove from local state immediately - filter from both employees and combined records
      setEmployees(prev => prev.filter(emp => emp.id !== record.id))
      await api.deleteEmployee(record.id, userRole)
      setToast({ message: 'Employee deleted successfully!', type: 'success' })
      // Reload from server to ensure consistency
await loadEmployees() 
    }
} catch (error) { 
    // Revert optimistic update on error
    await loadEmployees()
    const list = await api.getUsers()
    setUsers(Array.isArray(list) ? list.filter(u => {
      const role = (u.role || '').toUpperCase()
      return role !== 'SUPER_ADMIN'
    }) : [])
    setToast({ message: 'Error deleting record: ' + (error.message || 'Unknown error'), type: 'error' })
} 
} 
const handleUploadDocument = async (e) => { 
e.preventDefault() 
if (!docFile || !selectedEmployee) return 
setLoading(true) 
try { 
const formData = new FormData() 
formData.append('file', docFile) 
formData.append('employeeId', selectedEmployee.id) 
formData.append('documentType', docFormData.documentType) 
formData.append('description', docFormData.description) 
await api.uploadDocument(formData) 
await loadDocuments(selectedEmployee.id) 
// Keep modal open so user can view the uploaded document 
setDocFile(null) 
setDocFormData({ documentType: 'AADHAAR', description: '' }) 
alert('Document uploaded successfully! You can now view it below.') 
} catch (error) { 
alert('Error uploading document: ' + error.message) 
} finally { 
setLoading(false) 
} 
} 
const handleDownloadDocument = async (docId, fileName) => {
try { 
console.log('Downloading document:', docId, fileName) 
const downloadUrl = `${API_BASE_URL}/documents/${docId}/download`

// Use direct fetch with proper error handling
const response = await fetch(downloadUrl, {
  method: 'GET',
  credentials: 'include', // Include cookies for authentication
  headers: {
    'Accept': 'application/octet-stream, application/pdf, */*'
  }
})

// Handle IDM interception (204 status) or other non-ok responses
if (response.status === 204 || !response.ok) {
  if (response.status === 204) {
    alert('Download was intercepted by IDM (Internet Download Manager).\n\nPlease:\n1. Disable IDM browser integration temporarily\n2. Or add localhost to IDM exclusion list\n3. Or use incognito/private window')
    return
  }
  const errorText = await response.text().catch(() => 'Unknown error')
  throw new Error(`Failed to download document: ${response.status} ${response.statusText}`)
}

// Check if response has content
const contentType = response.headers.get('content-type') || ''
const contentLength = response.headers.get('content-length')

// Get blob from response
let blob
try {
  blob = await response.blob()
} catch (blobError) {
  console.error('Error creating blob:', blobError)
  throw new Error('Failed to process document data')
}

if (!blob || blob.size === 0) {
  alert('Document is empty or could not be downloaded.\n\nIf IDM is installed, it may be intercepting the download.\nTry disabling IDM browser integration.')
  return
}

// Ensure filename has proper extension
let finalFileName = fileName || 'document'
if (!finalFileName.includes('.')) {
  // Try to determine extension from content type
  if (contentType.includes('pdf')) {
    finalFileName += '.pdf'
  } else if (contentType.includes('image')) {
    finalFileName += '.jpg'
  }
}

// Create blob URL and trigger download
const url = window.URL.createObjectURL(blob) 
const a = document.createElement('a') 
a.href = url 
a.download = finalFileName
a.setAttribute('download', finalFileName)
a.style.display = 'none'
a.style.visibility = 'hidden'
document.body.appendChild(a) 

// Trigger download with a small delay to ensure element is ready
setTimeout(() => {
  a.click()
  
  // Cleanup after a delay to ensure Chrome processes the download
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a)
    }
    window.URL.revokeObjectURL(url)
  }, 500)
}, 10)
} catch (error) { 
console.error('Download error:', error) 
if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) { 
alert('Cannot connect to server. Please ensure:\n1. Backend is running on http://localhost:8080\n2. Check browser console (F12) for CORS errors\n3. Try refreshing the page') 
} else { 
alert('Error downloading document: ' + (error.message || 'Unknown error') + '\n\nIf IDM is installed, try disabling it temporarily.') 
} 
} 
}
const handleViewDocument = async (docId, fileName, event) => { 
try { 
console.log('Viewing document:', docId, fileName) 
// Prevent double-clicks 
let button = null 
if (event) { 
button = event.target?.closest('button') 
if (button?.disabled) return 
if (button) button.disabled = true 
} 
// Use the view endpoint which returns inline disposition for viewing in browser
const viewUrl = `${API_BASE_URL}/documents/${docId}/view`
// Open directly from backend URL - browser will display it inline (PDFs/images will show in browser)
const newWindow = window.open(viewUrl, '_blank')
if (!newWindow) { 
// Popup blocked - show message
alert('Please allow popups for this site to view documents, or use the download button instead.')
} 
// Re-enable button after a delay 
if (button) { 
setTimeout(() => { 
button.disabled = false 
}, 2000) 
} 
} catch (error) { 
console.error('View error:', error) 
if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) { 
alert('Cannot connect to server. Please ensure:\n1. Backend is running on http://localhost:8080\n2. Check browser console (F12) for CORS errors\n3. Verify the document exists in the database') 
} else { 
alert('Error opening document: ' + (error.message || 'Unknown error')) 
} 
// Re-enable button on error 
if (button) { 
button.disabled = false 
} 
} 
} 
const openDocModal = async (employee) => { 
try { 
setSelectedEmployee(employee) 
setShowDocModal(true) 
await loadDocuments(employee.id) 
} catch (error) { 
console.error('Error opening document modal:', error) 
alert('Error loading documents: ' + (error.message || 'Unknown error')) 
} 
} 
if (loading || isAutoViewing) { 
return ( 
  <>
    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
<div className={styles.loadingWrap}> 
  <div className={styles.loadingCard}> 
    <span className={styles.spinner}></span> 
    <p className={styles.loadingText}>{isAutoViewing ? 'Loading employee details...' : 'Loading users...'}</p> 
  </div> 
</div> 
  </>
); 
} 
    
// If viewing employee details, show inline detail view (full page)
if (showViewModal && selectedEmployee) {
return ( 
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
              <Eye size={28} className="text-blue-600" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span>{selectedEmployee.name || 'N/A'}</span>
                  <span className="text-lg font-normal text-gray-600">
                    - {selectedEmployee.role === 'HR_ADMIN' ? 'HR Admin' 
                      : selectedEmployee.role === 'MANAGER' ? 'Manager'
                      : selectedEmployee.role === 'FINANCE' ? 'Finance'
                      : selectedEmployee.role === 'EMPLOYEE' ? 'Employee'
                      : selectedEmployee.role === 'SUPER_ADMIN' ? 'Super Admin'
                      : selectedEmployee.role || 'User'}
                  </span>
          </div>
                <span className="text-sm font-normal text-gray-500">ID: {selectedEmployee.id || selectedEmployee.employeeId || 'N/A'}</span>
</div> 
            </h3>
	<div className="flex items-center gap-2"> 
	<button 
                onClick={() => {
                  handleOpenModal(selectedEmployee)
                  setShowViewModal(false)
                  setSelectedEmployee(null)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
	> 
		<Edit size={18} /> 
                Edit
	</button> 
<button 
onClick={() => { 
                  setShowViewModal(false)
                  setSelectedEmployee(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
</button> 
</div> 
          </div>
          <div className="space-y-5">
{/* Basic Information */} 
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
<h4 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h4> 
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
<input 
type="text" 
                    value={selectedEmployee.employeeId || selectedEmployee.id || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
<input 
type="text" 
                    value={selectedEmployee.name || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
<input 
type="text" 
                    value={selectedEmployee.email || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
<input 
                    type="password"
                    value="••••••••"
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Password is hidden for security</p>
</div>
<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Work Phone Number</label>
<input 
                    type="text"
                    value={selectedEmployee.workPhoneNumber || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div> 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Mobile Number</label>
                  <input
                    type="text"
                    value={selectedEmployee.personalMobileNumber || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
</div> 
</div> 
{/* Work Information */} 
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
<h4 className="text-xl font-bold text-gray-800 mb-4">Work Information</h4> 
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
  <input
    type="text"
                    value={selectedEmployee.department || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
  />
</div>
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Role</label> 
                  <input
                    type="text"
                    value={selectedEmployee.role || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type</label> 
                  <input
type="text" 
                    value={selectedEmployee.employmentType || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div> 
<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
  <input
    type="text"
                    value={selectedEmployee.client || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div>
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Employee Status</label> 
                  <input
                    type="text"
                    value={selectedEmployee.employeeStatus || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Source of Hire</label> 
                  <input
type="text" 
                    value={selectedEmployee.sourceOfHire || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div>
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
<div className="relative">
  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
  <input 
                      type="text"
                      value={selectedEmployee.salary ? parseFloat(selectedEmployee.salary).toLocaleString() : 'N/A'}
                      readOnly
                      className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
  />
</div>
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Offered Date</label>
<input 
                    type="text"
                    value={selectedEmployee.dateOfJoining ? formatDate(selectedEmployee.dateOfJoining) : 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
  <input
    type="text"
                    value={selectedEmployee.location || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
  />
</div>
</div> 
</div> 
{/* Personal Details */} 
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
<h4 className="text-xl font-bold text-gray-800 mb-4">Personal Details</h4> 
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label> 
<input 
                    type="text"
                    value={selectedEmployee.dateOfBirth ? formatDate(selectedEmployee.dateOfBirth) : 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Age</label> 
<input 
type="text" 
                    value={selectedEmployee.dateOfBirth ? calculateAge(selectedEmployee.dateOfBirth) || 'N/A' : 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label> 
                  <input
                    type="text"
                    value={selectedEmployee.gender || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label> 
                  <input
                    type="text"
                    value={selectedEmployee.maritalStatus || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source of Hire</label>
                  <input
                    type="text"
                    value={selectedEmployee.sourceOfHire || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
</div> 
<div className="col-span-2"> 
<label className="block text-sm font-semibold text-gray-700 mb-2">About Me</label> 
<textarea 
                    value={selectedEmployee.aboutMe || 'N/A'}
                    readOnly
rows="3" 
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
></textarea> 
</div> 
</div> 
</div> 
            {/* Work Experience */}
            {selectedEmployee.workExperiences && selectedEmployee.workExperiences.length > 0 && (
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
                <h4 className="text-xl font-bold text-gray-800 mb-4">Work Experience</h4>
                <div className="space-y-4">
                  {selectedEmployee.workExperiences.map((exp, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
<div> 
                          <p className="text-base font-semibold text-gray-900">{exp.jobTitle || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{exp.companyName || 'N/A'}</p>
</div> 
                        {exp.relevant && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Relevant</span>
                        )}
</div> 
                      <p className="text-sm text-gray-500">
                        {exp.fromDate ? formatDate(exp.fromDate) : 'N/A'} - {exp.toDate ? formatDate(exp.toDate) : 'Present'}
                      </p>
                      {exp.jobDescription && (
                        <p className="text-sm text-gray-600 mt-2">{exp.jobDescription}</p>
                      )}
</div> 
                  ))}
</div> 
</div> 
            )}
            {/* Education Details */}
            {selectedEmployee.educationDetails && selectedEmployee.educationDetails.length > 0 && (
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
                <h4 className="text-xl font-bold text-gray-800 mb-4">Education Details</h4>
                <div className="space-y-4">
                  {selectedEmployee.educationDetails.map((edu, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-base font-semibold text-gray-900">{edu.degree || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{edu.institutionName || 'N/A'}</p>
                      <p className="text-sm text-gray-500">
                        {edu.fromDate ? formatDate(edu.fromDate) : 'N/A'} - {edu.toDate ? formatDate(edu.toDate) : 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Dependent Details */}
            {selectedEmployee.dependentDetails && selectedEmployee.dependentDetails.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Dependent Details</h4>
                <div className="space-y-4">
                  {selectedEmployee.dependentDetails.map((dep, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-base font-semibold text-gray-900">{dep.dependentName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Relationship: {dep.relationship || 'N/A'}</p>
                      {dep.dateOfBirth && (
                        <p className="text-sm text-gray-500">
                          Date of Birth: {formatDate(dep.dateOfBirth)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Additional Information */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Additional Information</h4>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Card Number</label>
<input 
type="text" 
                    value={selectedEmployee.pan || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhaar Card Number</label>
<input 
type="text" 
                    value={selectedEmployee.aadhaar || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">UAN Number</label>
<input 
type="text" 
                    value={selectedEmployee.uan || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account Number</label>
<input 
type="text" 
                    value={selectedEmployee.bankAccountNumber || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
/> 
</div> 
              </div>
            </div>
            {/* Address Information */}
            {(selectedEmployee.presentAddressLine1 || selectedEmployee.permanentAddressLine1) && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEmployee.presentAddressLine1 && (
<div> 
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Present Address</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-900">{selectedEmployee.presentAddressLine1}</p>
                        {selectedEmployee.presentAddressLine2 && (
                          <p className="text-sm text-gray-900">{selectedEmployee.presentAddressLine2}</p>
                        )}
                        <p className="text-sm text-gray-700">
                          {[selectedEmployee.presentCity, selectedEmployee.presentState, selectedEmployee.presentPostalCode, selectedEmployee.presentCountry]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
</div> 
                    </div>
                  )}
                  {selectedEmployee.permanentAddressLine1 && (
<div> 
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Permanent Address</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-900">{selectedEmployee.permanentAddressLine1}</p>
                        {selectedEmployee.permanentAddressLine2 && (
                          <p className="text-sm text-gray-900">{selectedEmployee.permanentAddressLine2}</p>
                        )}
                        <p className="text-sm text-gray-700">
                          {[selectedEmployee.permanentCity, selectedEmployee.permanentState, selectedEmployee.permanentPostalCode, selectedEmployee.permanentCountry]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
</div> 
</div> 
                  )}
</div> 
              </div>
            )}
            {/* Documents Section */}
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
              <h4 className="text-xl font-bold text-gray-800 mb-4">Documents</h4>
              {documents[selectedEmployee.id] && documents[selectedEmployee.id].length > 0 ? (
                <div className="space-y-3">
                  {documents[selectedEmployee.id].map((doc) => (
                    <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="text-blue-600" size={20} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600">{doc.documentType}</p>
                            {doc.description && (
                              <span className="text-sm text-gray-500">• {doc.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleViewDocument(doc.id, doc.fileName, e)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No documents uploaded</p>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedEmployee(null)
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// If on new employee page, editing, or adding from list page, show only the form (full page)
if ((isNewEmployeePage && showModal) || (showModal && editingEmployee) || (showModal && !isNewEmployeePage && !editingEmployee)) {
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
              {editingEmployee ? (
                <>
                  <Edit size={28} className="text-blue-600" />
                  Edit {editingEmployee.role === 'HR_ADMIN' ? 'HR Admin' : editingEmployee.role === 'MANAGER' ? 'Manager' : editingEmployee.role === 'FINANCE' ? 'Finance' : editingEmployee.role === 'EMPLOYEE' ? 'Employee' : 'User'} - {formData.name || editingEmployee.name}
                </>
              ) : (
                <>
                  <Plus size={28} className="text-blue-600" />
                  Add New User
                </>
              )}
            </h3>
            <button
              onClick={() => {
                setShowModal(false)
                if (isNewEmployeePage) {
                  navigate('/employees')
                }
                setEditingEmployee(null)
                setFormData({
                  employeeId: '',
                  name: '',
                  client: '',
                  email: '',
                  password: '',
                  role: '',
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
              }}
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
            >
              ×
            </button>
</div> 
          {/* Form content - simplified to match Users.jsx structure */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h4>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
<input 
type="text" 
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
/> 
</div> 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
<input 
type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter Full Name"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  {!editingEmployee && (
<input 
                      type="email"
                      name="fake-email"
                      autoComplete="off"
                      tabIndex={-1}
                      style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                      readOnly
                    />
                  )}
<input 
type="text" 
                    name={`employee-email-full-${editingEmployee ? editingEmployee.id : 'new'}`}
                    id={`employee-email-full-${editingEmployee ? editingEmployee.id : 'new'}`}
                    key={`email-full-${showModal}-${editingEmployee ? editingEmployee.id : 'new'}`}
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter Email Address"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    required
/> 
</div> 
<div> 
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {editingEmployee ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  {!editingEmployee && (
<input 
                      type="password"
                      name="fake-password"
                      autoComplete="off"
                      tabIndex={-1}
                      style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                      readOnly
                    />
                  )}
<input 
                    type="password"
                    name={`employee-password-full-${editingEmployee ? editingEmployee.id : 'new'}`}
                    id={`employee-password-full-${editingEmployee ? editingEmployee.id : 'new'}`}
                    key={`password-full-${showModal}-${editingEmployee ? editingEmployee.id : 'new'}`}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingEmployee ? 'Enter new password (optional)' : 'Enter password'}
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    required={!editingEmployee}
/> 
                  {editingEmployee && (
                    <p className="mt-1 text-xs text-gray-500">
                      Only enter a new password if you want to change it
                    </p>
                  )}
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
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Enter Department"
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
        />
      </div>
      <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))
                    ) : (
                      <option value="EMPLOYEE">EMPLOYEE</option>
                    )}
                  </select>
      </div>
      <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type *</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
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
        <input
                    list="client-list-full"
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="Enter client name"
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <datalist id="client-list-full">
                    {clients.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
</div>
      <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
        <input
          type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
        />
      </div>
      <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Offered Date *</label>
        <input
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
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
                      value={formData.salary || ''}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
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
                    value={formData.workPhoneNumber}
                    onChange={(e) => setFormData({ ...formData, workPhoneNumber: e.target.value })}
                    placeholder="Enter Phone Number"
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
<div className="flex gap-3 justify-end pt-4 border-t border-gray-200"> 
<button 
type="button" 
onClick={() => { 
setShowModal(false) 
                  if (isNewEmployeePage) {
                    navigate('/employees')
                  }
setEditingEmployee(null) 
setFormData({ 
employeeId: '', 
                    name: '',
client: '', 
email: '', 
password: '', 
role: '', 
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
                {loading ? 'Saving...' : editingEmployee ? 'Update User' : 'Create User'}
</button> 
</div> 
</form> 
</div> 
      </div>
    </div>
    </>
  )
}

return (
  <>
    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    <div className="space-y-6 bg-gray-50 p-6 max-w-full overflow-x-hidden">
{/* Search and Filters - Redesigned */} 
<div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200"> 
<div className="flex gap-2"> 
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name..."
              value={nameSearchTerm}
              onChange={(e) => setNameSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by email..."
              value={emailSearchTerm}
              onChange={(e) => setEmailSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
<select 
value={statusFilter} 
onChange={(e) => setStatusFilter(e.target.value)} 
className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium" 
> 
<option value="All">All Status</option> 
<option value="Active">Active</option> 
<option value="Inactive">Inactive</option> 
</select> 
<select 
  value={clientFilter} 
  onChange={(e) => setClientFilter(e.target.value)} 
  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
> 
  <option value="All">All Clients</option>
  
  {clients.map((c) => (
    <option key={c} value={c}>{c}</option>
  ))}
</select>
<select 
  value={roleFilter} 
  onChange={(e) => setRoleFilter(e.target.value)} 
  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
> 
  <option value="All">All Roles</option>
  
  {uniqueRoles.map((role) => (
    <option key={role} value={role}>{role}</option>
  ))}
</select> 
</div> 
</div> 
{/* Users Table - Modern Design */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gradient-to-r from-blue-600 to-indigo-700">
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">S.No</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Employee</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Offered Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Role</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Client</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Email</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Status</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-white/90 uppercase tracking-wider pr-8">Actions</th>
        </tr>
      </thead> 
<tbody className="bg-white divide-y divide-gray-100"> 
{filteredEmployees.map((employee, index) => ( 
<tr key={employee.id} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100"> 
<td className="px-6 py-4 whitespace-nowrap"> 
	<div className="text-sm font-medium text-gray-900">{index + 1}</div> 
</td> 
<td className="px-6 py-4 whitespace-nowrap"> 
		<div className="flex items-center"> 
		{/* <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md"> 
			{employee.name?.charAt(0) || 'E'} 
		</div>  */}
		<div> 
			<div className="text-sm font-bold text-gray-900 underline cursor-pointer" onClick={() => {
				// Directly open the detail view (same as View Details button)
				handleViewEmployee(employee)
			}}>{employee.name || 'N/A'}</div> 
			<div className="text-xs text-gray-500">ID: {employee.id}</div> 
		</div> 
	</div>
</td> 
<td className="px-6 py-4 whitespace-nowrap"> 
	<span className="text-sm text-gray-700">{employee.dateOfJoining ? formatDate(employee.dateOfJoining) : 'N/A'}</span> 
</td> 
<td className="px-6 py-4 whitespace-nowrap">
	<span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
		(employee.role || employee.designation || '').toUpperCase() === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
		(employee.role || employee.designation || '').toUpperCase() === 'MANAGER' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
		(employee.role || employee.designation || '').toUpperCase() === 'HR_ADMIN' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
		(employee.role || employee.designation || '').toUpperCase() === 'FINANCE' ? 'bg-green-100 text-green-800 border border-green-200' :
		(employee.role || employee.designation || '').toUpperCase() === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 border border-red-200' :
		'bg-gray-100 text-gray-800 border border-gray-200'
	}`}>
		{employee.role || employee.designation || 'N/A'}
	</span>
</td>
<td className="px-6 py-4 whitespace-nowrap"> 
	<span className="text-sm text-gray-700">{employee.client || 'N/A'}</span> 
</td>
<td className="px-6 py-4 whitespace-nowrap"> 
	<div className="flex items-center gap-2"> 
		<Mail size={16} className="text-gray-400" /> 
		<span className="text-sm text-gray-700">{employee.email || 'N/A'}</span> 
	</div> 
</td> 
<td className="px-6 py-4 whitespace-nowrap"> 
	<span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${ 
		employee.employeeStatus === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' : 
		employee.employeeStatus === 'Inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' : 
		employee.employeeStatus === 'On Leave' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
		employee.employeeStatus === 'Resigned' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
		employee.employeeStatus === 'Suspended' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 
		'bg-red-100 text-red-800 border border-red-200' 
	}`}> 
		{employee.employeeStatus || 'N/A'} 
	</span> 
</td> 
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium"> 
<div className="relative dropdown-menu-container"> 
	<button 
		onClick={(e) => {
			e.stopPropagation()
			setOpenDropdownId(openDropdownId === employee.id ? null : employee.id)
		}}
		className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors" 
		title="Actions" 
	> 
		<MoreVertical size={18} /> 
	</button> 
	
	{openDropdownId === employee.id && (
		<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
			<button
				onClick={(e) => {
					e.stopPropagation()
					// Directly open the detail view
					handleViewEmployee(employee)
					setOpenDropdownId(null)
				}}
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<Eye size={16} className="text-green-600" />
				View Details
			</button>
			<button
				onClick={(e) => {
					e.stopPropagation()
					handleOpenModal(employee)
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
					openDocModal(employee)
					setOpenDropdownId(null)
				}}
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<FileText size={16} className="text-blue-600" />
				View Documents
			</button>
			<button
				onClick={(e) => {
					e.stopPropagation()
					handleDelete(employee)
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
</td> 
</tr> 
))} 
</tbody> 
</table> 
</div>
{filteredEmployees.length === 0 && ( 
<div className="text-center py-12"> 
{error ? ( 
<div className="bg-red-50 border border-red-200 rounded-lg p-4"> 
<p className="text-red-800 font-semibold">{error}</p> 
<button 
onClick={loadEmployees} 
className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
> 
Retry 
</button> 
</div> 
) : nameSearchTerm || emailSearchTerm || statusFilter !== 'All' || clientFilter !== 'All' || roleFilter !== 'All' ? ( 
<p className="text-gray-500">No users match your search criteria</p> 
) : ( 
<div> 
<p className="text-gray-500 mb-4">No users found</p> 
<button 
onClick={() => handleOpenModal()} 
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
> 
Add First User 
</button> 
</div> 
)} 
</div> 
)} 
</div>
{/* Document Modal - Redesigned */} 
{showDocModal && selectedEmployee && ( 
<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"> 
<div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto"> 
<div className="flex items-center justify-between mb-6"> 
<h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3"> 
<FileText size={24} className="text-blue-600" /> 
Documents - {selectedEmployee.name || 'N/A'} 
</h3> 
<button onClick={() => setShowDocModal(false)} className="text-gray-500 hover:text-gray-700"> 
<span className="text-2xl">×</span> 
</button> 
</div> 
{/* Upload Form - Redesigned */} 
<form onSubmit={handleUploadDocument} className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-white rounded-xl border-2 border-blue-200 space-y-4"> 
<div className="grid grid-cols-2 gap-4"> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label> 
<select 
value={docFormData.documentType} 
onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
> 
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="RELIEVING">Relieving Certificate</option>
                    <option value="OFFER">Offer Letter</option>
                    <option value="NDA">NDA</option>
                    <option value="ID_PROOF">ID Proof</option>
<option value="CERTIFICATE">Certificate</option> 
<option value="RESUME">Resume</option> 
<option value="PASSPORT">Passport</option> 
</select> 
</div> 
<div> 
<label className="block text-sm font-medium text-gray-700 mb-1">File</label> 
<input 
type="file" 
onChange={(e) => setDocFile(e.target.files[0])} 
className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
required 
/> 
</div> 
</div> 
<div> 
<label className="block text-sm font-medium text-gray-700 mb-1">Description</label> 
<input 
type="text" 
value={docFormData.description} 
onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })} 
className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
/> 
</div> 
<button 
type="submit" 
disabled={loading} 
className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50" 
> 
{loading ? 'Uploading...' : 'Upload Document'} 
</button> 
</form> 
{/* Documents List */} 
<div className="space-y-2"> 
{documents[selectedEmployee.id]?.map((doc) => ( 
<div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"> 
<div className="flex items-center gap-3"> 
<FileText className="text-blue-600" size={20} /> 
<div> 
<p className="font-medium">{doc.fileName}</p> 
<p className="text-sm text-gray-500">{doc.documentType}</p> 
</div> 
</div> 
<div className="flex items-center gap-2"> 
<button 
onClick={(e) => handleViewDocument(doc.id, doc.fileName, e)} 
className="p-2 text-green-600 hover:bg-green-50 rounded" 
title="View Document" 
> 
<Eye size={18} /> 
</button> 
<button 
onClick={() => handleDownloadDocument(doc.id, doc.fileName)} 
className="p-2 text-blue-600 hover:bg-blue-50 rounded" 
title="Download Document" 
> 
<Download size={18} /> 
</button> 
{userRole && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && ( 
<button 
onClick={async () => { 
if (window.confirm(`Are you sure you want to delete "${doc.fileName}"? This action cannot be undone.`)) { 
try { 
await api.deleteDocument(doc.id) 
await loadDocuments(selectedEmployee.id) 
alert('Document deleted successfully') 
} catch (error) { 
alert('Error deleting document: ' + (error.message || 'Unknown error')) 
} 
} 
}} 
className="p-2 text-red-600 hover:bg-red-50 rounded" 
title="Delete Document" 
> 
<Trash2 size={18} /> 
</button> 
)} 
</div> 
</div> 
))} 
{(!documents[selectedEmployee.id] || documents[selectedEmployee.id].length === 0) && ( 
<p className="text-center text-gray-500 py-4">No documents uploaded</p> 
)} 
</div> 
</div> 
</div> 
)} 
</div> 
    </>
  )
}

export default Employees 




