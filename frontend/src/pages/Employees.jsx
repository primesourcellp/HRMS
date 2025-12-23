import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Upload, 
  FileText, Download, Eye, User, Shield, Filter, ChevronDown, 
  ChevronRight, ChevronUp, ChevronLeft, MoreVertical, Check, X,
  Users, Briefcase, Building, Calendar, Tag, UserPlus, FileUp, Frown, Loader2
} from 'lucide-react';
import api from '../services/api';
import styles from './Employees.module.css';


const API_BASE_URL = 'http://localhost:8080/api'; 
const Employees = () => { 
const navigate = useNavigate() 
const userType = localStorage.getItem('userType') 
// Redirect employees - they shouldn't access employee management 
useEffect(() => { 
if (userType === 'employee') { 
navigate('/dashboard') 
} 
}, [userType, navigate]) 
if (userType === 'employee') { 
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
const [loading, setLoading] = useState(true) 
const [error, setError] = useState(null) 
const [formData, setFormData] = useState({ 
employeeId: '', 
firstName: '', 
lastName: '',
client: '', 
email: '', 
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
const userRole = localStorage.getItem('userRole') 
useEffect(() => { 
loadEmployees() 
}, []) 
useEffect(() => { 
  let isMounted = true 
  ;(async () => { 
    try { 
      const list = await api.getClients() 
      if (isMounted) setClients(Array.isArray(list) ? list : []) 
    } catch (e) { 
      if (isMounted) setClients([]) 
    } 
  })() 
  return () => { isMounted = false } 
}, []) 
// Update form data when editingEmployee changes 
useEffect(() => { 
if (showModal && editingEmployee) { 
const formattedJoinDate = formatDateForInput(editingEmployee.dateOfJoining) 
const formattedDateOfBirth = formatDateForInput(editingEmployee.dateOfBirth) 
setFormData(prev => ({ 
...prev, 
employeeId: editingEmployee.employeeId || '', 
firstName: editingEmployee.firstName || '', 
lastName: editingEmployee.lastName || '',
client: editingEmployee.client || '', 

email: editingEmployee.email || '', 
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
})) 
setWorkExperiences(editingEmployee.workExperiences || []) 
setEducationDetails(editingEmployee.educationDetails || []) 
} else if (showModal && !editingEmployee) { 
// Ensure form is empty when adding new employee 
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
// Adding new employee - ensure all fields are empty 
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
} 
setShowModal(true)
} 
// Fetch and show full employee details in view modal (module-level)
const handleViewEmployee = async (employee) => {
	try {
		const full = await api.getEmployee(employee.id)
		setSelectedEmployee(full || employee)
	} catch (err) {
		console.error('Error fetching full employee for view:', err)
		setSelectedEmployee(employee)
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
} 
await loadEmployees() 
setShowModal(false) 
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
console.log('Downloading document:', docId) 
// Use the API service method for consistency 
const blob = await api.downloadDocument(docId) 
const url = window.URL.createObjectURL(blob) 
const a = document.createElement('a') 
a.href = url 
a.download = fileName || 'document' 
document.body.appendChild(a) 
a.click() 
window.URL.revokeObjectURL(url) 
document.body.removeChild(a) 
} catch (error) { 
console.error('Download error:', error) 
if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) { 
alert('Cannot connect to server. Please ensure:\n1. Backend is running on http://localhost:8080\n2. Check browser console (F12) for CORS errors') 
} else { 
alert('Error downloading document: ' + (error.message || 'Unknown error')) 
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
// Determine file type from filename 
const fileExtension = fileName?.split('.').pop()?.toLowerCase() 
const isPdf = fileExtension === 'pdf' 
const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '') 
// Use direct backend URL for viewing - simpler and more reliable 
const viewUrl = `${API_BASE_URL}/documents/${docId}/download` 
if (isPdf || isImage) { 
// Open directly from backend URL - browser will handle the content type 
const newWindow = window.open(viewUrl, '_blank') 
if (!newWindow) { 
// Popup blocked - fall back to blob approach 
console.log('Popup blocked, using blob approach') 
const blob = await api.downloadDocument(docId) 
let mimeType = 'application/octet-stream' 
if (isPdf) { 
mimeType = 'application/pdf' 
} else if (fileExtension === 'jpg' || fileExtension === 'jpeg') { 
mimeType = 'image/jpeg' 
} else if (fileExtension === 'png') { 
mimeType = 'image/png' 
} else if (fileExtension === 'gif') { 
mimeType = 'image/gif' 
} else if (fileExtension === 'webp') { 
mimeType = 'image/webp' 
} 
const typedBlob = new Blob([blob], { type: mimeType }) 
const blobUrl = window.URL.createObjectURL(typedBlob) 
// Create iframe in new window for PDFs 
if (isPdf) { 
const fallbackWindow = window.open('', '_blank') 
if (fallbackWindow) { 
fallbackWindow.document.write(` 
<!DOCTYPE html> 
<html> 
<head> 
<title>${fileName}</title> 
<style> 
body { margin: 0; padding: 0; overflow: hidden; } 
iframe { width: 100%; height: 100vh; border: none; } 
</style> 
</head> 
<body> 
<iframe src="${blobUrl}"></iframe> 
</body> 
</html> 
`) 
fallbackWindow.document.close() 
// Clean up when window closes 
const checkClosed = setInterval(() => { 
if (fallbackWindow.closed) { 
window.URL.revokeObjectURL(blobUrl) 
clearInterval(checkClosed) 
} 
}, 1000) 
setTimeout(() => { 
window.URL.revokeObjectURL(blobUrl) 
clearInterval(checkClosed) 
}, 600000) 
} else { 
// Last resort - download 
const a = document.createElement('a') 
a.href = blobUrl 
a.download = fileName || 'document' 
document.body.appendChild(a) 
a.click() 
document.body.removeChild(a) 
setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000) 
} 
} else { 
// For images, open blob URL 
const imgWindow = window.open(blobUrl, '_blank') 
if (imgWindow) { 
const checkClosed = setInterval(() => { 
if (imgWindow.closed) { 
window.URL.revokeObjectURL(blobUrl) 
clearInterval(checkClosed) 
} 
}, 1000) 
setTimeout(() => { 
window.URL.revokeObjectURL(blobUrl) 
clearInterval(checkClosed) 
}, 600000) 
} else { 
const a = document.createElement('a') 
a.href = blobUrl 
a.download = fileName || 'document' 
document.body.appendChild(a) 
a.click() 
document.body.removeChild(a) 
setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000) 
} 
} 
} 
} else { 
// For other file types, download 
const blob = await api.downloadDocument(docId) 
const blobUrl = window.URL.createObjectURL(blob) 
const a = document.createElement('a') 
a.href = blobUrl 
a.download = fileName || 'document' 
document.body.appendChild(a) 
a.click() 
document.body.removeChild(a) 
setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000) 
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
    
// Calculate employee counts by client
const getEmployeeCountsByClient = () => {
  const counts = { 'Total': employees.length };
  
  employees.forEach(emp => {
    const client = emp.client || 'Unassigned';
    counts[client] = (counts[client] || 0) + 1;
  });
  
  return counts;
};

const employeeCounts = getEmployeeCountsByClient();
const activeClients = Object.keys(employeeCounts).filter(key => key !== 'Total');

return ( 
<div className="space-y-6 bg-gray-50 p-6 max-w-full overflow-x-hidden">
{/* Client Cards Section */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total Employees Card */}
  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">Total Employees</p>
        <p className="text-2xl font-bold text-gray-900">{employeeCounts['Total'] || 0}</p>
      </div>
      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
        <User size={24} />
      </div>
    </div>
  </div>

  {/* Client Cards */}
  {activeClients.map(client => (
    <div key={client} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{client}</p>
          <p className="text-2xl font-bold text-gray-900">{employeeCounts[client] || 0}</p>
        </div>
        <div className="p-3 rounded-full bg-green-100 text-green-600">
          <Shield size={24} />
        </div>
      </div>
    </div>
  ))}
</div>

{/* Search and Filters - Redesigned */} 
<div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200"> 
<div className="flex gap-4"> 
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
<select 
value={statusFilter} 
onChange={(e) => setStatusFilter(e.target.value)} 
className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium" 
> 
<option value="All">All Status</option> 
<option value="Active">Active</option> 
<option value="Inactive">Inactive</option> 
</select> 
<select 
  value={clientFilter} 
  onChange={(e) => setClientFilter(e.target.value)} 
  className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
> 
  <option value="All">All Clients</option>
  
  {clients.map((c) => (
    <option key={c} value={c}>{c}</option>
  ))}
</select>
<button 
  onClick={() => handleOpenModal()} 
  className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold" 
> 
  <Plus size={20} /> 
  Add Employee 
</button> 
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
          <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Joining Date</th>
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
		<div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md"> 
			{employee.firstName?.charAt(0) || 'E'} 
		</div> 
		<div> 
			<div className="text-sm font-bold text-gray-900">{employee.firstName} {employee.lastName}</div> 
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
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium"> 
<div className="flex items-center gap-2"> 
	<button 
		onClick={() => handleViewEmployee(employee)} 
		className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors" 
		title="View Employee Details" 
	> 
		<Eye size={18} /> 
	</button> 
	<button 
		onClick={() => handleOpenModal(employee)} 
		className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
		title="Edit Employee" 
	> 
		<Edit size={18} /> 
	</button> 
	<button 
		onClick={() => handleDelete(employee.id)} 
		className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors" 
		title="Delete Employee" 
	> 
		<Trash2 size={18} /> 
	</button> 
	<button 
		onClick={() => openDocModal(employee)} 
		className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
		title="View Documents" 
	> 
		<FileText size={18} /> 
	</button> 
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
{/* Add/Edit Employee Modal - Redesigned */} 
{showModal && ( 
<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"> 
<div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto"> 
<div className="flex items-center justify-between mb-6"> 
<h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3"> 
<Plus size={24} className="text-blue-600" /> 
{editingEmployee ? 'Edit' : 'Add'} Employee 
</h3> 
<button 
onClick={() => { 
setShowModal(false) 
// Reset form when closing 
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
 
}) 

}} 
className="text-gray-500 hover:text-gray-700" 
> 
<span className="text-2xl">×</span> 
</button> 
</div> 
<form onSubmit={handleSubmit} className="space-y-5"> 
{/* Basic Information */} 
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
<h4 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h4> 
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID *</label> 
<input 
type="text" 
value={formData.employeeId} 
onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" 
 placeholder="Enter Employee ID "
required 
readOnly={editingEmployee ? true : false} // Employee ID read-only when editing 
/> 
</div> 
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
<input 
type="email" 
value={formData.email} 
onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
placeholder="Enter Email Address"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
required 
/> 
</div>
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
  {editingEmployee ? 'New Password (leave blank to keep current)' : 'Password *'}
</label>
<input 
  type="password" 
  value={formData.password || ''}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  placeholder={editingEmployee ? 'Enter new password (optional)' : 'Enter password'}
  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  <label className="block text-sm font-semibold text-gray-700 mb-2"> Department * </label>
  <input
    type="text"
    value={formData.department}
    onChange={(e) =>setFormData({ ...formData, department: e.target.value })}
    placeholder="Enter Department"
    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    required
  />
</div>


<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Role</label> 
<select 
value={formData.role} 
onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
> 
<option value="">Select</option> 
<option value="ADMIN">Admin</option> 
<option value="HR">HR</option> 
<option value="EMPLOYEE">Employee</option> 
<option value="SUPER_ADMIN">Super Admin</option> 
</select> 
</div> 

<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type</label> 
<select 
value={formData.employmentType} 
onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
> 
<option value="">Select</option> 
<option value="FULL_TIME">Full-Time</option> 
<option value="PART_TIME">Part-Time</option> 
<option value="INTERN">Intern</option> 
</select> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Designation *</label> 
<select 
type="text" 
value={formData.designation} 
onChange={(e) => setFormData({ ...formData, designation: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
required 
>
<option value="">Select</option> 
<option value="TL">Team Leader</option> 
<option value="Software Developer">Software Developer</option> 
<option value="Senior Software Engineer">Senior Software Engineer</option> 
<option value="Tester">Tester</option> 
<option value="Supporter">Supporter</option> 
</select> 
</div> 
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">Client *</label>
  <input
    list="client-list"
    type="text"
    value={formData.client}
    onChange={(e) =>setFormData({ ...formData, client: e.target.value })}
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
<label className="block text-sm font-semibold text-gray-700 mb-2">Employee Status</label> 
<select 
value={formData.employeeStatus} 
onChange={(e) => setFormData({ ...formData, employeeStatus: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
> 
<option value="Active">Active</option> 
<option value="Inactive">Inactive</option> 

</select> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Source of Hire</label> 
<select
type="text" 
value={formData.sourceOfHire} 
onChange={(e) => setFormData({ ...formData, sourceOfHire: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
>
<option value="">Select</option> 
<option value="LinkedIn">LinkedIn</option> 
<option value="Indeed">Indeed</option> 
<option value="Referral">Referral</option> 
<option value="Campus Recruitment">Campus Recruitment</option> 
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
    value={formData.salary || ''}
    onChange={(e) => setFormData({ ...formData, salary: e.target.value })} 
    className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="0.00"
  />
</div>
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Date of Joining *</label> 
<input 
type="date" 
value={formData.dateOfJoining} 
onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
required 
/> 
</div> 
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2"> Location *</label>
  <input
    type="text"
    value={formData.location}
    onChange={(e) =>
      setFormData({ ...formData, location: e.target.value })}
    placeholder="Enter location"
    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    required
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
type="date" 
value={formData.dateOfBirth} 
onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Age</label> 
<input 
type="text" 
value={formData.age} 
onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
placeholder="Enter Age"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label> 
<select 
value={formData.gender} 
onChange={(e) => setFormData({ ...formData, gender: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
> 
<option value="">Select</option> 
<option value="MALE">Male</option> 
<option value="FEMALE">Female</option> 
<option value="OTHER">Other</option> 
</select> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label> 
<select 
value={formData.maritalStatus} 
onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
> 
<option value="">Select</option> 
<option value="SINGLE">Single</option> 
<option value="MARRIED">Married</option> 
<option value="DIVORCED">Divorced</option> 
<option value="WIDOWED">Widowed</option> 
</select> 
</div> 
<div className="col-span-2"> 
<label className="block text-sm font-semibold text-gray-700 mb-2">About Me</label> 
<textarea 
value={formData.aboutMe} 
onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })} 
rows="3" 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
type="tel" 
value={formData.workPhoneNumber} 
onChange={(e) => setFormData({ ...formData, workPhoneNumber: e.target.value })} 
placeholder="Enter Phone Number"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Personal Mobile Number</label> 
<input 
type="tel" 
value={formData.personalMobileNumber} 
onChange={(e) => setFormData({ ...formData, personalMobileNumber: e.target.value })} 
placeholder="Enter Phone Number"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 

<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Personal Email Address</label> 
<input 
type="email" 
value={formData.personalEmailAddress} 
onChange={(e) => setFormData({ ...formData, personalEmailAddress: e.target.value })} 
placeholder="Enter Personal Email Address"
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 

</div> 
</div> 
{/* Present Address */} 
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
<h4 className="text-xl font-bold text-gray-800 mb-4">Present Address</h4> 
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
<div className="col-span-2"> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label> 
<input 
type="text" 
value={formData.presentAddressLine1} 
onChange={(e) => setFormData({ ...formData, presentAddressLine1: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div className="col-span-2"> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label> 
<input 
type="text" 
value={formData.presentAddressLine2} 
onChange={(e) => setFormData({ ...formData, presentAddressLine2: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">City</label> 
<input 
type="text" 
value={formData.presentCity} 
onChange={(e) => setFormData({ ...formData, presentCity: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Country</label> 
<input 
type="text" 
value={formData.presentCountry} 
onChange={(e) => setFormData({ ...formData, presentCountry: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">State</label> 
<input 
type="text" 
value={formData.presentState} 
onChange={(e) => setFormData({ ...formData, presentState: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label> 
<input 
type="text" 
value={formData.presentPostalCode} 
onChange={(e) => setFormData({ ...formData, presentPostalCode: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
/> 
</div> 
</div> 
</div> 
{/* Permanent Address */} 
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"> 
<h4 className="text-xl font-bold text-gray-800 mb-4">Permanent Address</h4> 
<div className="mb-4 flex items-center"> 
<input 
type="checkbox" 
id="sameAsPresentAddress" 
checked={formData.sameAsPresentAddress} 
onChange={(e) => { 
setFormData({ ...formData, sameAsPresentAddress: e.target.checked }) 
if (e.target.checked) { 
setFormData(prev => ({ 
...prev, 
permanentAddressLine1: prev.presentAddressLine1, 
permanentAddressLine2: prev.presentAddressLine2, 
permanentCity: prev.presentCity, 
permanentCountry: prev.presentCountry, 
permanentState: prev.presentState, 
permanentPostalCode: prev.presentPostalCode, 
})) 
} else { 
setFormData(prev => ({ 
...prev, 
permanentAddressLine1: '', 
permanentAddressLine2: '', 
permanentCity: '', 
permanentCountry: '', 
permanentState: '', 
permanentPostalCode: '', 
})) 
} 
}} 
className="mr-2" 
/> 
<label htmlFor="sameAsPresentAddress" className="text-sm font-semibold text-gray-700">Same as Present Address</label> 
</div> 
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
<div className="col-span-2"> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label> 
<input 
type="text" 
value={formData.permanentAddressLine1} 
onChange={(e) => setFormData({ ...formData, permanentAddressLine1: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
disabled={formData.sameAsPresentAddress} 
/> 
</div> 
<div className="col-span-2"> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label> 
<input 
type="text" 
value={formData.permanentAddressLine2} 
onChange={(e) => setFormData({ ...formData, permanentAddressLine2: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
disabled={formData.sameAsPresentAddress} 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">City</label> 
<input 
type="text" 
value={formData.permanentCity} 
onChange={(e) => setFormData({ ...formData, permanentCity: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
disabled={formData.sameAsPresentAddress} 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Country</label> 
<input 
type="text" 
value={formData.permanentCountry} 
onChange={(e) => setFormData({ ...formData, permanentCountry: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
disabled={formData.sameAsPresentAddress} 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">State</label> 
<input 
type="text" 
value={formData.permanentState} 
onChange={(e) => setFormData({ ...formData, permanentState: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
disabled={formData.sameAsPresentAddress} 
/> 
</div> 
<div> 
<label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label> 
<input 
type="text" 
value={formData.permanentPostalCode} 
onChange={(e) => setFormData({ ...formData, permanentPostalCode: e.target.value })} 
className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
disabled={formData.sameAsPresentAddress} 
/> 
</div> 
</div> 
</div> 

{/* Work Experience */}
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
<h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
  Work Experience
  <button
    type="button"
    onClick={() => setWorkExperiences([...workExperiences, { companyName: '', jobTitle: '', fromDate: '', toDate: '', jobDescription: '', relevant: false }])}
    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
  >
    + Add Experience
  </button>
</h4>
{workExperiences.map((exp, index) => (
  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
    <div className="flex justify-between items-center mb-3">
      <span className="font-semibold text-gray-700">Experience #{index + 1}</span>
      <button
        type="button"
        onClick={() => setWorkExperiences(workExperiences.filter((_, i) => i !== index))}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        Remove
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
        <input
          type="text"
          value={exp.companyName || ''}
          onChange={(e) => {
            const updated = [...workExperiences]
            updated[index].companyName = e.target.value
            setWorkExperiences(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
        <input
          type="text"
          value={exp.jobTitle || ''}
          onChange={(e) => {
            const updated = [...workExperiences]
            updated[index].jobTitle = e.target.value
            setWorkExperiences(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
        <input
          type="date"
          value={exp.fromDate || ''}
          onChange={(e) => {
            const updated = [...workExperiences]
            updated[index].fromDate = e.target.value
            setWorkExperiences(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
        <input
          type="date"
          value={exp.toDate || ''}
          onChange={(e) => {
            const updated = [...workExperiences]
            updated[index].toDate = e.target.value
            setWorkExperiences(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
        <textarea
          value={exp.jobDescription || ''}
          onChange={(e) => {
            const updated = [...workExperiences]
            updated[index].jobDescription = e.target.value
            setWorkExperiences(updated)
          }}
          rows="2"
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`relevant-${index}`}
          checked={exp.relevant || false}
          onChange={(e) => {
            const updated = [...workExperiences]
            updated[index].relevant = e.target.checked
            setWorkExperiences(updated)
          }}
          className="mr-2"
        />
        <label htmlFor={`relevant-${index}`} className="text-sm font-semibold text-gray-700">Relevant Experience</label>
      </div>
    </div>
  </div>
))}
{workExperiences.length === 0 && (
  <p className="text-gray-500 text-sm">No work experience added. Click "Add Experience" to add.</p>
)}
</div>

{/* Education Details */}
<div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
<h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
  Education Details
  <button
    type="button"
    onClick={() => setEducationDetails([...educationDetails, { institutionName: '', degree: '', fromDate: '', toDate: '' }])}
    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
  >
    + Add Education
  </button>
</h4>
{educationDetails.map((edu, index) => (
  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
    <div className="flex justify-between items-center mb-3">
      <span className="font-semibold text-gray-700">Education #{index + 1}</span>
      <button
        type="button"
        onClick={() => setEducationDetails(educationDetails.filter((_, i) => i !== index))}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        Remove
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Name</label>
        <input
          type="text"
          value={edu.institutionName || ''}
          onChange={(e) => {
            const updated = [...educationDetails]
            updated[index].institutionName = e.target.value
            setEducationDetails(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Degree / Qualification</label>
        <input
          type="text"
          value={edu.degree || ''}
          onChange={(e) => {
            const updated = [...educationDetails]
            updated[index].degree = e.target.value
            setEducationDetails(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
        <input
          type="date"
          value={edu.fromDate || ''}
          onChange={(e) => {
            const updated = [...educationDetails]
            updated[index].fromDate = e.target.value
            setEducationDetails(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
        <input
          type="date"
          value={edu.toDate || ''}
          onChange={(e) => {
            const updated = [...educationDetails]
            updated[index].toDate = e.target.value
            setEducationDetails(updated)
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
))}
{educationDetails.length === 0 && (
  <p className="text-gray-500 text-sm">No education details added. Click "Add Education" to add.</p>
)}
</div>

<div className="flex gap-3 justify-end pt-4 border-t border-gray-200"> 
<button 
type="button" 
onClick={() => { 
setShowModal(false) 
// Reset form when canceling 
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
)} 
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
<option value="AADHAAR">Aadhaar</option> 
<option value="PAN">PAN</option> 
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
<span className={`px-2 py-1 rounded text-xs ${ 
doc.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' 
}`}> 
{doc.verified ? 'Verified' : 'Pending'} 
</span> 
{!doc.verified && userRole && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && ( 
<button 
onClick={async () => { 
try { 
await api.verifyDocument(doc.id, true) 
await loadDocuments(selectedEmployee.id) 
alert('Document verified successfully') 
} catch (error) { 
alert('Error verifying document: ' + error.message) 
} 
}} 
className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" 
title="Verify Document" 
> 
Verify 
</button> 
)} 
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
{/* View Employee Details Modal */} 
{showViewModal && selectedEmployee && ( 
<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"> 
<div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto"> 
<div className="flex items-center justify-between mb-6"> 
<h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3"> 
<Eye size={24} className="text-blue-600" /> 
Employee Details 
</h3> 
<button 
onClick={() => { 
setShowViewModal(false) 
setSelectedEmployee(null) 
}} 
className="text-gray-500 hover:text-gray-700" 
> 
<span className="text-2xl">×</span> 
</button> 
</div> 
<div className="space-y-6"> 
	{/* Personal Information */} 
	<div className="bg-gray-50 rounded-xl p-6 border border-gray-200"> 
		<h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"> 
			<User size={20} className="text-blue-600" /> 
			Personal Information 
		</h4> 
		<div className="grid grid-cols-2 gap-4"> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Employee ID</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.employeeId || selectedEmployee.id}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Name</p> 
				<p className="text-base font-semibold text-gray-900">{(selectedEmployee.firstName || '') + ' ' + (selectedEmployee.lastName || '')}</p> 
			</div> 
			
			<div> 
				<p className="text-sm text-gray-600 mb-1">Email</p> 
				<div className="flex items-center gap-2"> 
					<Mail size={16} className="text-gray-400" /> 
					<p className="text-base font-semibold text-gray-900">{selectedEmployee.email || 'N/A'}</p> 
				</div> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Phone (Personal)</p> 
				<div className="flex items-center gap-2"> 
					<Phone size={16} className="text-gray-400" /> 
					<p className="text-base font-semibold text-gray-900">{selectedEmployee.personalMobileNumber || 'N/A'}</p> 
				</div> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Phone (Work)</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.workPhoneNumber || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Date of Birth</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.dateOfBirth ? formatDate(selectedEmployee.dateOfBirth) : 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Age</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.age || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Gender</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.gender || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Marital Status</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.maritalStatus || 'N/A'}</p> 
			</div> 
			<div className="col-span-2"> 
				<p className="text-sm text-gray-600 mb-1">About</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.aboutMe || 'N/A'}</p> 
			</div> 
		</div> 
	</div> 
	{/* Employment Information */} 
	<div className="bg-gray-50 rounded-xl p-6 border border-gray-200"> 
		<h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"> 
			<FileText size={20} className="text-blue-600" /> 
			Employment Information 
		</h4> 
		<div className="grid grid-cols-2 gap-4"> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Department</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.department || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Designation</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.designation || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Role</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.role || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Client</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.client || 'N/A'}</p> 
			</div>
			<div> 
				<p className="text-sm text-gray-600 mb-1">Location</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.location || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Employment Type</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.employmentType || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Source of Hire</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.sourceOfHire || 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Date of Joining</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.dateOfJoining ? formatDate(selectedEmployee.dateOfJoining) : 'N/A'}</p> 
			</div> 
			
			<div> 
				<p className="text-sm text-gray-600 mb-1">Salary</p> 
				<p className="text-base font-semibold text-gray-900">{selectedEmployee.salary ? `₹${parseFloat(selectedEmployee.salary).toLocaleString()}` : 'N/A'}</p> 
			</div> 
			<div> 
				<p className="text-sm text-gray-600 mb-1">Status</p> 
				<span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm inline-block ${ 
					selectedEmployee.employeeStatus === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' : 
					selectedEmployee.employeeStatus === 'Inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' : 
					selectedEmployee.employeeStatus === 'On Leave' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
					selectedEmployee.employeeStatus === 'Resigned' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
					selectedEmployee.employeeStatus === 'Suspended' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 
					'bg-red-100 text-red-800 border border-red-200' 
				}`}> 
					{selectedEmployee.employeeStatus || 'N/A'} 
				</span> 
			</div> 
			
			 
		</div> 
	</div>
	{/* Work Experience */}
	{selectedEmployee.workExperiences && selectedEmployee.workExperiences.length > 0 && (
	<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
		<h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
			<FileText size={20} className="text-blue-600" />
			Work Experience
		</h4>
		<div className="space-y-4">
			{selectedEmployee.workExperiences.map((exp, index) => (
				<div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
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
	<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
		<h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
			<FileText size={20} className="text-blue-600" />
			Education Details
		</h4>
		<div className="space-y-4">
			{selectedEmployee.educationDetails.map((edu, index) => (
				<div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
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
)} 
</div> 
) 
} 
export default Employees 




