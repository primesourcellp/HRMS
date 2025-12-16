
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Upload, FileText, Download, Eye, User } from 'lucide-react'
import api from '../services/api'

const API_BASE_URL = 'http://localhost:8080/api'

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
  const [showModal, setShowModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    joinDate: '',
    status: 'Active',
    shiftId: null,
    password: ''
  })
  const [docFormData, setDocFormData] = useState({
    documentType: 'AADHAAR',
    description: ''
  })
  const [docFile, setDocFile] = useState(null)
  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    loadEmployees()
  }, [])

  // Update form data when editingEmployee changes
  useEffect(() => {
    if (showModal && editingEmployee) {
      const formattedJoinDate = formatDateForInput(editingEmployee.joinDate)
      setFormData(prev => ({
        ...prev,
        name: editingEmployee.name || '',
        email: editingEmployee.email || '', // Show employee's email when editing
        phone: editingEmployee.phone || '',
        department: editingEmployee.department || '',
        position: editingEmployee.position || '',
        salary: editingEmployee.salary ? String(editingEmployee.salary) : '',
        joinDate: formattedJoinDate,
        status: editingEmployee.status || 'Active',
        shiftId: editingEmployee.shiftId || null,
        password: '' // Always empty for security - never show existing password
      }))
    } else if (showModal && !editingEmployee) {
      // Ensure form is empty when adding new employee
      setFormData({
        name: '',
        email: '', // Always empty for new employee
        phone: '',
        department: '',
        position: '',
        salary: '',
        joinDate: '',
        status: 'Active',
        shiftId: null,
        password: '' // Always empty
      })
    }
  }, [editingEmployee, showModal])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated before making API call
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      if (!isAuthenticated) {
        setError('Please login to view employees')
        setEmployees([])
        setLoading(false)
        return
      }
      
      const data = await api.getEmployees()
      console.log('Employees loaded:', data, 'Type:', typeof data, 'IsArray:', Array.isArray(data))
      
      if (Array.isArray(data)) {
        setEmployees(data)
        if (data.length === 0) {
          // Only show "no employees" message if we successfully loaded (not an auth error)
          setError(null) // Clear error - empty list is valid
        }
      } else {
        console.error('Invalid data format:', data)
        setEmployees([])
        setError('Failed to load employees. Invalid data format received.')
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
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    // If already in YYYY-MM-DD format, return as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return dateString.split('T')[0] // Remove time part if present
    }
    // Try to parse and format the date
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

  const handleOpenModal = async (employee = null) => {
    if (employee) {
      // Fetch full employee details to ensure we have all fields
      try {
        const fullEmployee = await api.getEmployee(employee.id)
        if (fullEmployee) {
          setEditingEmployee(fullEmployee)
          // Format the date properly for the date input
          const formattedJoinDate = formatDateForInput(fullEmployee.joinDate)
          
          setFormData({
            name: fullEmployee.name || '',
            email: fullEmployee.email || '',
            phone: fullEmployee.phone || '',
            department: fullEmployee.department || '',
            position: fullEmployee.position || '',
            salary: fullEmployee.salary ? String(fullEmployee.salary) : '',
            joinDate: formattedJoinDate,
            status: fullEmployee.status || 'Active',
            shiftId: fullEmployee.shiftId || null,
            password: '' // Don't show existing password
          })
        } else {
          // Fallback to the employee object passed
          setEditingEmployee(employee)
          const formattedJoinDate = formatDateForInput(employee.joinDate)
          setFormData({
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            department: employee.department || '',
            position: employee.position || '',
            salary: employee.salary ? String(employee.salary) : '',
            joinDate: formattedJoinDate,
            status: employee.status || 'Active',
            shiftId: employee.shiftId || null,
            password: ''
          })
        }
      } catch (error) {
        console.error('Error fetching employee details:', error)
        // Fallback to the employee object passed
        setEditingEmployee(employee)
        const formattedJoinDate = formatDateForInput(employee.joinDate)
        setFormData({
          name: employee.name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          department: employee.department || '',
          position: employee.position || '',
          salary: employee.salary ? String(employee.salary) : '',
          joinDate: formattedJoinDate,
          status: employee.status || 'Active',
          shiftId: employee.shiftId || null,
          password: '' // Always empty for security
        })
      }
    } else {
      // Adding new employee - ensure all fields are empty
      setEditingEmployee(null)
      setFormData({
        name: '',
        email: '', // Always empty for new employee
        phone: '',
        department: '',
        position: '',
        salary: '',
        joinDate: '',
        status: 'Active',
        shiftId: null,
        password: '' // Always empty
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, formData, userRole)
      } else {
        await api.createEmployee(formData, userRole)
      }
      await loadEmployees()
      setShowModal(false)
      // Reset form after successful save
      setEditingEmployee(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        salary: '',
        joinDate: '',
        status: 'Active',
        shiftId: null,
        password: ''
      })
    } catch (error) {
      alert('Error saving employee: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return
    try {
      const result = await api.deleteEmployee(id, userRole)
      if (result && result.success) {
        alert('Employee deleted successfully')
        await loadEmployees()
      } else {
        alert('Error: Failed to delete employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Error deleting employee: ' + (error.message || 'Unknown error. Please check if you have permission to delete employees.'))
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
      <div className="space-y-6 bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">Employee Management</h2>
            <p className="text-sm md:text-base text-gray-600 font-medium">Manage employee information and documents</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-sm md:text-base"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search and Filters - Redesigned */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
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
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Employees Table - Redesigned */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4 p-4">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                    {employee.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-900">{employee.name}</div>
                    <div className="text-xs text-gray-500">ID: {employee.id}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  employee.status === 'Active' ? 'bg-green-100 text-green-800' :
                  employee.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                  employee.status === 'On Leave' ? 'bg-blue-100 text-blue-800' :
                  employee.status === 'Resigned' ? 'bg-yellow-100 text-yellow-800' :
                  employee.status === 'Suspended' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-700">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-700">{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-gray-700">{employee.department} - {employee.position}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={async () => {
                    setSelectedEmployee(employee)
                    setShowViewModal(true)
                    await loadDocuments(employee.id)
                  }}
                  className="flex-1 text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors text-center text-xs font-medium"
                  title="View"
                >
                  <Eye size={16} className="mx-auto mb-1" />
                  View
                </button>
                <button
                  onClick={() => openDocModal(employee)}
                  className="flex-1 text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors text-center text-xs font-medium"
                  title="Documents"
                >
                  <FileText size={16} className="mx-auto mb-1" />
                  Docs
                </button>
                <button
                  onClick={() => handleOpenModal(employee)}
                  className="flex-1 text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors text-center text-xs font-medium"
                  title="Edit"
                >
                  <Edit size={16} className="mx-auto mb-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="flex-1 text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors text-center text-xs font-medium"
                  title="Delete"
                >
                  <Trash2 size={16} className="mx-auto mb-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                        {employee.name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500">ID: {employee.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{employee.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{employee.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{employee.department}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{employee.position}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                      employee.status === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' :
                      employee.status === 'Inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      employee.status === 'On Leave' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      employee.status === 'Resigned' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      employee.status === 'Suspended' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setSelectedEmployee(employee)
                          setShowViewModal(true)
                          await loadDocuments(employee.id)
                        }}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                        title="View Employee Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openDocModal(employee)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Documents"
                      >
                        <FileText size={18} />
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
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
                    name: '',
                    email: '',
                    phone: '',
                    department: '',
                    position: '',
                    salary: '',
                    joinDate: '',
                    status: 'Active',
                    shiftId: null,
                    password: ''
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Enter employee email"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password {editingEmployee && '(leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={!editingEmployee}
                    placeholder={editingEmployee ? "Enter new password to change" : "Enter password"}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Position *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Salary *</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date *</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    // Reset form when canceling
                    setEditingEmployee(null)
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      department: '',
                      position: '',
                      salary: '',
                      joinDate: '',
                      status: 'Active',
                      shiftId: null,
                      password: ''
                    })
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <FileText size={24} className="text-blue-600" />
                Documents - {selectedEmployee.name}
              </h3>
              <button onClick={() => setShowDocModal(false)} className="text-gray-500 hover:text-gray-700">
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Upload Form - Redesigned */}
            <form onSubmit={handleUploadDocument} className="mb-4 md:mb-6 p-4 md:p-5 bg-gradient-to-r from-blue-50 to-white rounded-lg md:rounded-xl border-2 border-blue-200 space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                  <div className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-100 rounded p-2 -m-2" onClick={(e) => handleViewDocument(doc.id, doc.fileName, e)}>
                    <FileText className="text-blue-600" size={20} />
                    <div>
                      <p className="font-medium text-blue-600 hover:text-blue-800">{doc.fileName}</p>
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                    <p className="text-base font-semibold text-gray-900">{selectedEmployee.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedEmployee.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <p className="text-base font-semibold text-gray-900">{selectedEmployee.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <p className="text-base font-semibold text-gray-900">{selectedEmployee.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Employment Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <p className="text-base font-semibold text-gray-900">{selectedEmployee.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Position</p>
                    <p className="text-base font-semibold text-gray-900">{selectedEmployee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Join Date</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedEmployee.joinDate ? new Date(selectedEmployee.joinDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Salary</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedEmployee.salary ? `₹${parseFloat(selectedEmployee.salary).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm inline-block ${
                      selectedEmployee.status === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' :
                      selectedEmployee.status === 'Inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      selectedEmployee.status === 'On Leave' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      selectedEmployee.status === 'Resigned' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      selectedEmployee.status === 'Suspended' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {selectedEmployee.status || 'N/A'}
                    </span>
                  </div>
                  {selectedEmployee.shiftId && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Shift ID</p>
                      <p className="text-base font-semibold text-gray-900">{selectedEmployee.shiftId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Documents
                </h4>
                <div className="space-y-2">
                  {documents[selectedEmployee.id]?.length > 0 ? (
                    documents[selectedEmployee.id].map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={(e) => handleViewDocument(doc.id, doc.fileName, e)}
                        >
                          <FileText className="text-blue-600" size={20} />
                          <div>
                            <p className="font-medium text-blue-600 hover:text-blue-800">{doc.fileName}</p>
                            <p className="text-sm text-gray-500">{doc.documentType}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                          doc.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No documents uploaded</p>
                  )}
                </div>
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
      )}
    </div>
  )
}

export default Employees
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
