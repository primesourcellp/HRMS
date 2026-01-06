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
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
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
const [documents, setDocuments] = useState({}) 
const [searchTerm, setSearchTerm] = useState('') 
const [statusFilter, setStatusFilter] = useState('All') 
const [clientFilter, setClientFilter] = useState('All') 
const [clients, setClients] = useState([]) 
const [showModal, setShowModal] = useState(false) 
const [showDocModal, setShowDocModal] = useState(false) 
const [showViewModal, setShowViewModal] = useState(false) 
const [selectedEmployee, setSelectedEmployee] = useState(null) 
const [editingEmployee, setEditingEmployee] = useState(null)
const [isEditingInView, setIsEditingInView] = useState(false)
const [viewFormData, setViewFormData] = useState({}) 
const [loading, setLoading] = useState(true) 
const [error, setError] = useState(null)
const [openMenuId, setOpenMenuId] = useState(null) 
const [formData, setFormData] = useState({ 
employeeId: '', 
firstName: '', 
lastName: '',
client: '', 
email: '', 
password: '', 
role: '', 
department: '', 
location: '', 
designation: '', 
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
}, [])

const loadDesignations = (employeesList) => {
  try {
    // Extract unique designations from employees
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
    
    // Extract unique employment types from employees
    const employmentTypeList = Array.from(
      new Set(
        employeesList
          .map(emp => emp.employmentType)
          .filter(type => type && type.trim() !== '')
      )
    ).sort()
    setEmploymentTypes(employmentTypeList)
  } catch (error) {
    console.error('Error loading designations:', error)
    setDesignations([])
    setRoles([])
    setEmploymentTypes([])
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
firstName: editingEmployee.firstName || '', 
lastName: editingEmployee.lastName || '',
client: editingEmployee.client || '', 
email: editingEmployee.email || '', 
password: '',  // Never show password when editing
role: editingEmployee.role || '', 
department: editingEmployee.department || '', 
location: editingEmployee.location || '', 
designation: editingEmployee.designation || '', 
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
salary: editingEmployee.salary || '', 
}) 
setWorkExperiences(editingEmployee.workExperiences || []) 
setEducationDetails(editingEmployee.educationDetails || []) 
} else if (showModal && !editingEmployee) { 
// Ensure form is completely empty when adding new employee - DO NOT show admin email/password
setFormData({ 
employeeId: '', 
firstName: '', 
lastName: '',
client: '', 
email: '',  // MUST be empty - never show admin email
password: '',  // MUST be empty - never show admin password
role: '', 
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
				loadDesignations(data)
				if (data.length === 0) {
					// Clear any previous error - empty list is a valid state
					setError(null)
				} 
			} else { 
				console.error('Invalid data format:', data) 
				setEmployees([]) 
				const message = data && data.error ? data.error : 'Failed to load employees. Invalid data format received.'
				setError(message) 
			} 
} catch (error) { 
console.error('Error loading employees:', error) 
setError('Failed to load employees: ' + (error.message || 'Unknown error')) 
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
const filteredEmployees = (Array.isArray(employees) ? employees : []).filter(emp => { 
  const matchesSearch = 
    emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = statusFilter === 'All' || emp.employeeStatus === statusFilter;
  const matchesClient = clientFilter === 'All' || (clientFilter === 'Unassigned' ? !emp.client : emp.client === clientFilter);
  return matchesSearch && matchesStatus && matchesClient;
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
if (employee) { 
// Fetch full employee details to ensure we have all fields 
try { 
const fullEmployee = await api.getEmployee(employee.id) 
if (fullEmployee) { 
setEditingEmployee(fullEmployee) 
const formattedJoinDate = formatDateForInput(fullEmployee.dateOfJoining) 
const formattedDateOfBirth = formatDateForInput(fullEmployee.dateOfBirth) 
setFormData({ 
employeeId: fullEmployee.employeeId || '', 
firstName: fullEmployee.firstName || '', 
lastName: fullEmployee.lastName || '', 
 
email: fullEmployee.email || '', 
role: fullEmployee.role || '', 
department: fullEmployee.department || '', 
location: fullEmployee.location || '', 
designation: fullEmployee.designation || '', 
employmentType: fullEmployee.employmentType || '', 
employeeStatus: fullEmployee.employeeStatus || 'Active', 
sourceOfHire: fullEmployee.sourceOfHire || '', 
dateOfJoining: formattedJoinDate, 
dateOfBirth: formattedDateOfBirth, 
age: calculateAge(formattedDateOfBirth), 
gender: fullEmployee.gender || '', 
maritalStatus: fullEmployee.maritalStatus || '', 
aboutMe: fullEmployee.aboutMe || '', 
expertise: fullEmployee.expertise || '', 

pan: fullEmployee.pan || '', 
aadhaar: fullEmployee.aadhaar || '', 
workPhoneNumber: fullEmployee.workPhoneNumber || '', 
personalMobileNumber: fullEmployee.personalMobileNumber || '', 
extension: fullEmployee.extension || '', 
personalEmailAddress: fullEmployee.personalEmailAddress || '', 
seatingLocation: fullEmployee.seatingLocation || '', 
tags: fullEmployee.tags || '', 
presentAddressLine1: fullEmployee.presentAddressLine1 || '', 
presentAddressLine2: fullEmployee.presentAddressLine2 || '', 
presentCity: fullEmployee.presentCity || '', 
presentCountry: fullEmployee.presentCountry || '', 
presentState: fullEmployee.presentState || '', 
presentPostalCode: fullEmployee.presentPostalCode || '', 
sameAsPresentAddress: fullEmployee.sameAsPresentAddress || false, 
permanentAddressLine1: fullEmployee.permanentAddressLine1 || '', 
permanentAddressLine2: fullEmployee.permanentAddressLine2 || '', 
permanentCity: fullEmployee.permanentCity || '', 
permanentCountry: fullEmployee.permanentCountry || '', 
permanentState: fullEmployee.permanentState || '', 
permanentPostalCode: fullEmployee.permanentPostalCode || '', 
dateOfExit: formatDateForInput(fullEmployee.dateOfExit), 
salary: fullEmployee.salary || '', 

}) 
setWorkExperiences(fullEmployee.workExperiences || []) 
setEducationDetails(fullEmployee.educationDetails || []) 
} else { 
// Fallback to the employee object passed 
setEditingEmployee(employee) 
const formattedJoinDate = formatDateForInput(employee.dateOfJoining) 
const formattedDateOfBirth = formatDateForInput(employee.dateOfBirth) 
setFormData({ 
employeeId: employee.employeeId || '', 
firstName: employee.firstName || '', 
lastName: employee.lastName || '', 

email: employee.email || '', 
role: employee.role || '', 
department: employee.department || '', 
location: employee.location || '', 
designation: employee.designation || '', 
employmentType: employee.employmentType || '', 
employeeStatus: employee.employeeStatus || 'Active', 
sourceOfHire: employee.sourceOfHire || '', 
dateOfJoining: formattedJoinDate, 
dateOfBirth: formattedDateOfBirth, 
age: calculateAge(formattedDateOfBirth), 
gender: employee.gender || '', 
maritalStatus: employee.maritalStatus || '', 
aboutMe: employee.aboutMe || '', 
expertise: employee.expertise || '', 

pan: employee.pan || '', 
aadhaar: employee.aadhaar || '', 
workPhoneNumber: employee.workPhoneNumber || '', 
personalMobileNumber: employee.personalMobileNumber || '', 
extension: employee.extension || '', 
personalEmailAddress: employee.personalEmailAddress || '', 
seatingLocation: employee.seatingLocation || '', 
tags: employee.tags || '', 
presentAddressLine1: employee.presentAddressLine1 || '', 
presentAddressLine2: employee.presentAddressLine2 || '', 
presentCity: employee.presentCity || '', 
presentCountry: employee.presentCountry || '', 
presentState: employee.presentState || '', 
presentPostalCode: employee.presentPostalCode || '', 
sameAsPresentAddress: employee.sameAsPresentAddress || false, 
permanentAddressLine1: employee.permanentAddressLine1 || '', 
permanentAddressLine2: employee.permanentAddressLine2 || '', 
permanentCity: employee.permanentCity || '', 
permanentCountry: employee.permanentCountry || '', 
permanentState: employee.permanentState || '', 
permanentPostalCode: employee.permanentPostalCode || '', 
dateOfExit: formatDateForInput(employee.dateOfExit), 
salary: employee.salary || '', 

}) 
setWorkExperiences(employee.workExperiences || [])
setEducationDetails(employee.educationDetails || [])

	}
} catch (error) {
console.error('Error fetching employee details:', error) 
// Fallback to the employee object passed 
setEditingEmployee(employee) 
const formattedJoinDate = formatDateForInput(employee.dateOfJoining) 
const formattedDateOfBirth = formatDateForInput(employee.dateOfBirth) 
setFormData({ 
employeeId: employee.employeeId || '', 
firstName: employee.firstName || '', 
lastName: employee.lastName || '', 
 
email: employee.email || '', 
role: employee.role || '', 
department: employee.department || '', 
location: employee.location || '', 
designation: employee.designation || '', 
employmentType: employee.employmentType || '', 
employeeStatus: employee.employeeStatus || 'Active', 
sourceOfHire: employee.sourceOfHire || '', 
dateOfJoining: formattedJoinDate, 
dateOfBirth: formattedDateOfBirth, 
age: calculateAge(formattedDateOfBirth), 
gender: employee.gender || '', 
maritalStatus: employee.maritalStatus || '', 
aboutMe: employee.aboutMe || '', 
expertise: employee.expertise || '', 

pan: employee.pan || '', 
aadhaar: employee.aadhaar || '', 
workPhoneNumber: employee.workPhoneNumber || '', 
personalMobileNumber: employee.personalMobileNumber || '', 
extension: employee.extension || '', 
personalEmailAddress: employee.personalEmailAddress || '', 
seatingLocation: employee.seatingLocation || '', 
tags: employee.tags || '', 
presentAddressLine1: employee.presentAddressLine1 || '', 
presentAddressLine2: employee.presentAddressLine2 || '', 
presentCity: employee.presentCity || '', 
presentCountry: employee.presentCountry || '', 
presentState: employee.presentState || '', 
presentPostalCode: employee.presentPostalCode || '', 
sameAsPresentAddress: employee.sameAsPresentAddress || false, 
permanentAddressLine1: employee.permanentAddressLine1 || '', 
permanentAddressLine2: employee.permanentAddressLine2 || '', 
permanentCity: employee.permanentCity || '', 
permanentCountry: employee.permanentCountry || '', 
permanentState: employee.permanentState || '', 
permanentPostalCode: employee.permanentPostalCode || '', 
dateOfExit: formatDateForInput(employee.dateOfExit), 
salary: employee.salary || '', 

}) 
setWorkExperiences(employee.workExperiences || [])
setEducationDetails(employee.educationDetails || [])

} 
} else { 
// Adding new employee - ensure all fields are empty, especially email and password
// NEVER populate from localStorage - always start fresh
setEditingEmployee(null) 
// Explicitly reset formData to ensure no values persist
setFormData({ 
employeeId: '', 
firstName: '', 
lastName: '',
client: '', 
email: '',  // MUST be empty - never use admin email from localStorage
password: '',  // MUST be empty - never use admin password
role: '', 
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
setShowModal(true)
} 
// Fetch and show full employee details in view modal (module-level)
const handleViewEmployee = async (employee) => {
	try {
		const full = await api.getEmployee(employee.id)
		setSelectedEmployee(full || employee)
		// Load documents for the employee
		await loadDocuments(employee.id)
		// Initialize view form data
		const formattedJoinDate = formatDateForInput(full?.dateOfJoining || employee.dateOfJoining)
		const formattedDateOfBirth = formatDateForInput(full?.dateOfBirth || employee.dateOfBirth)
		setViewFormData({
			employeeId: (full || employee).employeeId || '',
			firstName: (full || employee).firstName || '',
			lastName: (full || employee).lastName || '',
			client: (full || employee).client || '',
			email: (full || employee).email || '',
			password: '',
			role: (full || employee).role || '',
			department: (full || employee).department || '',
			location: (full || employee).location || '',
			designation: (full || employee).designation || '',
			employmentType: (full || employee).employmentType || '',
			employeeStatus: (full || employee).employeeStatus || 'Active',
			sourceOfHire: (full || employee).sourceOfHire || '',
			dateOfJoining: formattedJoinDate,
			dateOfBirth: formattedDateOfBirth,
			age: calculateAge(formattedDateOfBirth),
			gender: (full || employee).gender || '',
			maritalStatus: (full || employee).maritalStatus || '',
			aboutMe: (full || employee).aboutMe || '',
			workPhoneNumber: (full || employee).workPhoneNumber || '',
			personalMobileNumber: (full || employee).personalMobileNumber || '',
			salary: (full || employee).salary || ''
		})
	} catch (err) {
		console.error('Error fetching full employee for view:', err)
		setSelectedEmployee(employee)
		// Still try to load documents even if employee fetch fails
		await loadDocuments(employee.id)
		// Initialize view form data with employee data
		const formattedJoinDate = formatDateForInput(employee.dateOfJoining)
		const formattedDateOfBirth = formatDateForInput(employee.dateOfBirth)
		setViewFormData({
			employeeId: employee.employeeId || '',
			firstName: employee.firstName || '',
			lastName: employee.lastName || '',
			client: employee.client || '',
			email: employee.email || '',
			password: '',
			role: employee.role || '',
			department: employee.department || '',
			location: employee.location || '',
			designation: employee.designation || '',
			employmentType: employee.employmentType || '',
			employeeStatus: employee.employeeStatus || 'Active',
			sourceOfHire: employee.sourceOfHire || '',
			dateOfJoining: formattedJoinDate,
			dateOfBirth: formattedDateOfBirth,
			age: calculateAge(formattedDateOfBirth),
			gender: employee.gender || '',
			maritalStatus: employee.maritalStatus || '',
			aboutMe: employee.aboutMe || '',
			workPhoneNumber: employee.workPhoneNumber || '',
			personalMobileNumber: employee.personalMobileNumber || '',
			salary: employee.salary || ''
		})
	} finally {
		setShowViewModal(true)
		setIsEditingInView(false)
	}
}

const handleSaveViewEmployee = async () => {
	if (!selectedEmployee) return
	
	try {
		setLoading(true)
		const employeeData = {
			firstName: viewFormData.firstName,
			lastName: viewFormData.lastName,
			email: viewFormData.email,
			phone: viewFormData.personalMobileNumber || viewFormData.workPhoneNumber,
			personalMobileNumber: viewFormData.personalMobileNumber,
			workPhoneNumber: viewFormData.workPhoneNumber,
			department: viewFormData.department,
			designation: viewFormData.designation,
			client: viewFormData.client,
			location: viewFormData.location,
			employmentType: viewFormData.employmentType,
			employeeStatus: viewFormData.employeeStatus,
			sourceOfHire: viewFormData.sourceOfHire,
			dateOfJoining: viewFormData.dateOfJoining,
			dateOfBirth: viewFormData.dateOfBirth,
			gender: viewFormData.gender,
			maritalStatus: viewFormData.maritalStatus,
			aboutMe: viewFormData.aboutMe,
			salary: viewFormData.salary,
			role: viewFormData.role
		}
		
		if (viewFormData.password) {
			employeeData.password = viewFormData.password
		}
		
		await api.updateEmployee(selectedEmployee.id, employeeData, userRole)
		await handleViewEmployee(selectedEmployee) // Reload employee data
		setIsEditingInView(false)
		alert('Employee updated successfully!')
	} catch (error) {
		alert('Error updating employee: ' + error.message)
	} finally {
		setLoading(false)
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

// The backend expects a top-level `phone` field. If the form doesn't
// include a dedicated `phone`, fall back to `personalMobileNumber` or
// `workPhoneNumber` before saving. If editing and employee already has a phone, use it.
// If neither is provided, ask the user for a phone number to avoid a DB NOT NULL violation.
let fallbackPhone = (formData.personalMobileNumber && formData.personalMobileNumber.trim()) || 
                   (formData.workPhoneNumber && formData.workPhoneNumber.trim()) || ''

// If editing and no phone in form but employee has one, use existing phone
if (editingEmployee && !fallbackPhone && editingEmployee.phone) {
	fallbackPhone = editingEmployee.phone
}

if (!fallbackPhone) {
	setLoading(false)
	alert('Please enter a phone number in Personal Mobile Number or Work Phone Number')
	return
}
// Use fallbackPhone for the required `phone` property
employeeData.phone = fallbackPhone

// Build name field from firstName and lastName if not explicitly set
if (!employeeData.name || employeeData.name.trim() === '') {
	if (employeeData.firstName && employeeData.firstName.trim() && 
		employeeData.lastName && employeeData.lastName.trim()) {
		employeeData.name = employeeData.firstName.trim() + ' ' + employeeData.lastName.trim()
	} else if (employeeData.firstName && employeeData.firstName.trim()) {
		employeeData.name = employeeData.firstName.trim()
	} else if (employeeData.lastName && employeeData.lastName.trim()) {
		employeeData.name = employeeData.lastName.trim()
	} else {
		employeeData.name = '' // Ensure it's not null
	}
}

// Set status field from employeeStatus if not explicitly set
if (!employeeData.status || employeeData.status.trim() === '') {
	if (employeeData.employeeStatus && employeeData.employeeStatus.trim()) {
		employeeData.status = employeeData.employeeStatus
	} else {
		employeeData.status = 'Active' // Default to Active
	}
}

// Password field has been removed

try { 
if (editingEmployee) { 
  await api.updateEmployee(editingEmployee.id, employeeData, userRole) 
} else { 
  await api.createEmployee(employeeData, userRole) 
  // Refresh client list after adding new employee
  await loadClients()
} 
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
firstName: '', 
lastName: '',
client: '', 

email: '', 
password: '', 
role: '', 
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
} catch (error) { 
alert('Error saving employee: ' + error.message) 
} finally { 
setLoading(false) 
} 
} 
const handleDelete = async (id) => { 
if (!window.confirm('Are you sure you want to delete this employee?')) return 
try { 
await api.deleteEmployee(id, userRole) 
await loadEmployees() 
} catch (error) { 
alert('Error deleting employee: ' + error.message) 
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
if (loading) { 
return ( 
<div className={styles.loadingWrap}> 
  <div className={styles.loadingCard}> 
    <span className={styles.spinner}></span> 
    <p className={styles.loadingText}>Loading employees...</p> 
  </div> 
</div> 
); 
} 
    
// If viewing employee details, show inline detail view (full page)
if (showViewModal && selectedEmployee) {
  return (
    <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
              <Eye size={28} className="text-blue-600" />
              Employee Details
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
                  setIsEditingInView(false)
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">S.No</label>
                  <input
                    type="text"
                    value={selectedEmployee.id || selectedEmployee.employeeId || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={selectedEmployee.firstName || 'N/A'}
                    readOnly
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={selectedEmployee.lastName || 'N/A'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                  <input
                    type="text"
                    value={selectedEmployee.designation || 'N/A'}
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
            {/* Contact Details */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  setIsEditingInView(false)
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
  )
}

// If on new employee page, editing, or adding from list page, show only the form (full page)
if ((isNewEmployeePage && showModal) || (showModal && editingEmployee) || (showModal && !isNewEmployeePage && !editingEmployee)) {
  // Import the form content from modal section - we'll render it inline
  const FormContent = () => {
    // This will be the same form as in the modal - we'll reference it below
    return null // Placeholder
  }
  
  return (
    <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
              <Plus size={28} className="text-blue-600" />
              {editingEmployee ? 'Edit' : 'Add'} Employee
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
                  firstName: '',
                  lastName: '',
                  client: '',
                  email: '',
                  password: '',
                  role: '',
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
                {editingEmployee && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">S.No</label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      readOnly={true}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter First Name"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter Last Name"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Designation *</label>
                  <input
                    list="designation-list-full"
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Enter designation"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <datalist id="designation-list-full">
                    {designations.map((designation) => (
                      <option key={designation} value={designation} />
                    ))}
                  </datalist>
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.personalMobileNumber}
                    onChange={(e) => setFormData({ ...formData, personalMobileNumber: e.target.value })}
                    placeholder="Enter Phone Number"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
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
                    firstName: '',
                    lastName: '',
                    client: '',
                    email: '',
                    password: '',
                    role: '',
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
                {loading ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

return ( 
<div className="space-y-6 bg-gray-50 p-6 max-w-full overflow-x-hidden">
{/* Search and Filters - Redesigned */} 
<div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200"> 
<div className="flex gap-2"> 
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
</div> 
</div> 
{/* Employees Table - Modern Design */}
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
			{employee.firstName?.charAt(0) || 'E'} 
		</div>  */}
		<div> 
			<div className="text-sm font-bold text-gray-900 underline  cursor-pointer" 	onClick={() => handleViewEmployee(employee)} >{employee.firstName} {employee.lastName}</div> 
			<div className="text-xs text-gray-500">ID: {employee.id}</div> 
		</div> 
	</div> 
</td> 
<td className="px-6 py-4 whitespace-nowrap"> 
	<span className="text-sm text-gray-700">{employee.dateOfJoining ? formatDate(employee.dateOfJoining) : 'N/A'}</span> 
</td> 
<td className="px-6 py-4 whitespace-nowrap"> 
	<span className="text-sm text-gray-700">{employee.designation || 'N/A'}</span> 
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
<<<<<<< HEAD
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative"> 
<div className="flex items-center justify-end">
	<button 
		data-menu-button
		onClick={(e) => {
			e.stopPropagation()
			setOpenMenuId(openMenuId === employee.id ? null : employee.id)
=======
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium"> 
<div className="relative dropdown-menu-container"> 
	<button 
		onClick={(e) => {
			e.stopPropagation()
			setOpenDropdownId(openDropdownId === employee.id ? null : employee.id)
>>>>>>> master
		}}
		className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors" 
		title="Actions" 
	> 
		<MoreVertical size={18} /> 
<<<<<<< HEAD
	</button>
	{openMenuId === employee.id && (
		<div data-menu-dropdown className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
=======
	</button> 
	
	{openDropdownId === employee.id && (
		<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
>>>>>>> master
			<button
				onClick={(e) => {
					e.stopPropagation()
					handleViewEmployee(employee)
<<<<<<< HEAD
					setOpenMenuId(null)
				}}
				className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<Eye size={16} />
=======
					setOpenDropdownId(null)
				}}
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<Eye size={16} className="text-green-600" />
>>>>>>> master
				View Details
			</button>
			<button
				onClick={(e) => {
					e.stopPropagation()
					handleOpenModal(employee)
<<<<<<< HEAD
					setOpenMenuId(null)
				}}
				className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<Edit size={16} />
=======
					setOpenDropdownId(null)
				}}
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<Edit size={16} className="text-blue-600" />
>>>>>>> master
				Edit
			</button>
			<button
				onClick={(e) => {
					e.stopPropagation()
					openDocModal(employee)
<<<<<<< HEAD
					setOpenMenuId(null)
				}}
				className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<FileText size={16} />
=======
					setOpenDropdownId(null)
				}}
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
			>
				<FileText size={16} className="text-blue-600" />
>>>>>>> master
				View Documents
			</button>
			<button
				onClick={(e) => {
					e.stopPropagation()
					handleDelete(employee.id)
<<<<<<< HEAD
					setOpenMenuId(null)
				}}
				className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
=======
					setOpenDropdownId(null)
				}}
				className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
>>>>>>> master
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
) : searchTerm || statusFilter !== 'All' ? ( 
<p className="text-gray-500">No employees match your search criteria</p> 
) : ( 
<div> 
<p className="text-gray-500 mb-4">No employees found</p> 
<button 
onClick={() => handleOpenModal()} 
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
> 
Add First Employee 
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
Documents - {(selectedEmployee.firstName || '') + ' ' + (selectedEmployee.lastName || '')} 
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
)
}

export default Employees 




