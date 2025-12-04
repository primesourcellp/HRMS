import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Upload, FileText, Download, Eye } from 'lucide-react'
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
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [loading, setLoading] = useState(false)
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

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
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

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        position: employee.position || '',
        salary: employee.salary || '',
        joinDate: employee.joinDate || '',
        status: employee.status || 'Active',
        shiftId: employee.shiftId || null,
        password: '' // Don't show existing password
      })
    } else {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
          <p className="text-gray-600 mt-1">Manage employee information and documents</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Resigned">Resigned</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg">
                  {employee.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{employee.name}</h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                employee.status === 'Active' ? 'bg-green-100 text-green-800' :
                employee.status === 'Resigned' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {employee.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={16} />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} />
                <span>{employee.department}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openDocModal(employee)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm"
              >
                <FileText size={16} />
                Documents
              </button>
              <button
                onClick={() => handleOpenModal(employee)}
                className="flex-1 bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 flex items-center justify-center gap-2 text-sm"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(employee.id)}
                className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingEmployee ? 'Edit' : 'Add'} Employee</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingEmployee && '(leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required={!editingEmployee}
                    placeholder={editingEmployee ? "Enter new password to change" : "Enter password"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Documents - {selectedEmployee.name}</h3>
              <button onClick={() => setShowDocModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUploadDocument} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    value={docFormData.documentType}
                    onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>

            {/* Documents List */}
            <div className="space-y-2">
              {documents[selectedEmployee.id]?.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-500" size={20} />
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
    </div>
  )
}

export default Employees
