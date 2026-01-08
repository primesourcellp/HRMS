import { useState, useEffect } from 'react'
import { User, Bell, FileText, Upload, Shield, Eye, Download } from 'lucide-react'
import api from '../services/api'

const API_BASE_URL = 'http://localhost:8080/api'

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

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return ''
  const dob = new Date(dateOfBirth)
  const diffMs = Date.now() - dob.getTime()
  const ageDt = new Date(diffMs)
  return Math.abs(ageDt.getUTCFullYear() - 1970).toString()
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    phone: '',
    personalMobileNumber: '',
    department: '',
    position: '',
    role: localStorage.getItem('userRole') || '',
    // Employee-specific fields
    gender: '',
    dateOfBirth: '',
    age: '',
    maritalStatus: '',
    aboutMe: '',
    sourceOfHire: '',
    pan: '',
    aadhaar: '',
    uanNumber: '',
    bankAccountNumber: ''
  })
  const [documents, setDocuments] = useState([])
  const [docFormData, setDocFormData] = useState({
    documentType: 'AADHAAR',
    description: ''
  })
  const [docFile, setDocFile] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leaveRequests: true,
    payrollAlerts: true,
    performanceReviews: true
  })


  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('hrms_theme') || 'light',
    language: localStorage.getItem('hrms_language') || 'english'
  })

  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isEmployee = userRole === 'EMPLOYEE'

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(isSuperAdmin ? [{ id: 'security', label: 'Security', icon: Shield }] : []),
    ...(isEmployee ? [{ id: 'documents', label: 'Documents', icon: FileText }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  useEffect(() => {
    loadUserProfile()
    loadAppearanceSettings()
    if (isEmployee && userId) {
      loadDocuments()
    }
    
    // Set up system theme change listener for 'auto' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e) => {
      const savedTheme = localStorage.getItem('hrms_theme') || 'light'
      if (savedTheme === 'auto') {
        applyTheme('auto')
      }
    }
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    }
  }, [isAdmin, userId])

  const loadAppearanceSettings = () => {
    const savedTheme = localStorage.getItem('hrms_theme') || 'light'
    const savedLanguage = localStorage.getItem('hrms_language') || 'english'
    
    setAppearance({
      theme: savedTheme,
      language: savedLanguage
    })
    
    applyTheme(savedTheme)
  }

  const applyTheme = (theme) => {
    const root = document.documentElement
    
    // Remove any existing theme classes
    root.classList.remove('dark')
    
    if (theme === 'dark') {
      root.classList.add('dark')
      document.body.style.backgroundColor = '#1a1a1a'
      document.body.style.color = '#e5e5e5'
    } else if (theme === 'light') {
      root.classList.remove('dark')
      document.body.style.backgroundColor = '#f5f7fa'
      document.body.style.color = '#1f2937'
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
        document.body.style.backgroundColor = '#1a1a1a'
        document.body.style.color = '#e5e5e5'
      } else {
        root.classList.remove('dark')
        document.body.style.backgroundColor = '#f5f7fa'
        document.body.style.color = '#1f2937'
      }
    }
  }

  const handleThemeChange = (theme) => {
    const newAppearance = { ...appearance, theme }
    setAppearance(newAppearance)
    localStorage.setItem('hrms_theme', theme)
    applyTheme(theme)
    
    // Show success message without alert (better UX)
    const successMsg = document.createElement('div')
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
    successMsg.textContent = '✓ Theme applied successfully!'
    document.body.appendChild(successMsg)
    
    setTimeout(() => {
      successMsg.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(successMsg)
      }, 300)
    }, 2000)
  }

  const handleLanguageChange = (language) => {
    const newAppearance = { ...appearance, language }
    setAppearance(newAppearance)
    localStorage.setItem('hrms_language', language)
    
    // Show success message
    const successMsg = document.createElement('div')
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
    successMsg.textContent = '✓ Language preference saved!'
    document.body.appendChild(successMsg)
    
    setTimeout(() => {
      successMsg.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(successMsg)
      }, 300)
    }, 2000)
  }

  const loadUserProfile = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      if (isEmployee) {
        // Load employee details
        const employees = await api.getEmployees()
        const employee = Array.isArray(employees) 
          ? employees.find(emp => emp.id.toString() === userId.toString())
          : null
        
        if (employee) {
          const formattedDateOfBirth = formatDateForInput(employee.dateOfBirth)
          setProfileData({
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            personalMobileNumber: employee.personalMobileNumber || '',
            pan: employee.pan || '',
            aadhaar: employee.aadhaar || '',
            uanNumber: employee.uan || '',
            bankAccountNumber: employee.bankAccountNumber || '',
            department: employee.department || '',
            position: employee.designation || '',
            role: 'EMPLOYEE',
            gender: employee.gender || '',
            dateOfBirth: formattedDateOfBirth,
            age: calculateAge(formattedDateOfBirth),
            maritalStatus: employee.maritalStatus || '',
            aboutMe: employee.aboutMe || '',
            sourceOfHire: employee.sourceOfHire || ''
          })
        }
      } else {
        // Load admin user details
        const users = await api.getUsers()
        const user = Array.isArray(users)
          ? users.find(u => u.id.toString() === userId.toString())
          : null
        
        if (user) {
          setProfileData({
            name: user.name || '',
            email: user.email || '',
            phone: '',
            department: isAdmin ? 'Administration' : '',
            position: user.role === 'SUPER_ADMIN' ? 'Super Administrator' : 
                     user.role === 'ADMIN' ? 'Administrator' : '',
            role: user.role || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Fallback to localStorage values
      setProfileData(prev => ({
        ...prev,
        name: localStorage.getItem('userName') || prev.name,
        email: localStorage.getItem('userEmail') || prev.email
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (isEmployee) {
        // Update employee profile
        const employees = await api.getEmployees()
        const employee = Array.isArray(employees)
          ? employees.find(emp => emp.id.toString() === userId.toString())
          : null
        
        if (employee) {
          await api.updateEmployee(employee.id, {
            name: profileData.name || '',
            email: profileData.email,
            phone: profileData.phone || profileData.personalMobileNumber || '',
            personalMobileNumber: profileData.personalMobileNumber || '',
            department: profileData.department,
            designation: profileData.position,
            gender: profileData.gender,
            dateOfBirth: profileData.dateOfBirth,
            maritalStatus: profileData.maritalStatus,
            aboutMe: profileData.aboutMe,
            sourceOfHire: profileData.sourceOfHire,
            pan: profileData.pan || '',
            aadhaar: profileData.aadhaar || '',
            uan: profileData.uanNumber || '',
            bankAccountNumber: profileData.bankAccountNumber || ''
          }, userRole)
        }
      } else {
        // Update admin user profile
        const users = await api.getUsers()
        const user = Array.isArray(users)
          ? users.find(u => u.id.toString() === userId.toString())
          : null
        
        if (user) {
          await api.updateUser(user.id, {
            name: profileData.name,
            email: profileData.email
          }, userRole)
        }
      }
      
      // Update localStorage
    localStorage.setItem('userName', profileData.name)
      localStorage.setItem('userEmail', profileData.email)
      
    alert('Profile updated successfully!')
      await loadUserProfile() // Reload to get latest data
    } catch (error) {
      alert('Error updating profile: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    if (!userId) return
    try {
      const data = await api.getEmployeeDocuments(userId)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    }
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    if (!docFile || !userId) {
      alert('Please select a file')
      return
    }

    try {
      setUploadingDoc(true)
      const formData = new FormData()
      formData.append('file', docFile)
      formData.append('employeeId', userId)
      formData.append('documentType', docFormData.documentType)
      formData.append('description', docFormData.description)
      
      await api.uploadDocument(formData)
      await loadDocuments()
      setDocFile(null)
      setDocFormData({ documentType: 'AADHAAR', description: '' })
      alert('Document uploaded successfully!')
    } catch (error) {
      alert('Error uploading document: ' + (error.message || 'Unknown error'))
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDateOfBirthChange = (e) => {
    const dob = e.target.value
    setProfileData({
      ...profileData,
      dateOfBirth: dob,
      age: calculateAge(dob)
    })
  }

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const handleDownloadDocument = async (docId, fileName) => {
    try {
      console.log('Downloading document:', docId, fileName)
      const downloadUrl = `${API_BASE_URL}/documents/${docId}/download`
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to download: ${response.status} ${errorText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.setAttribute('download', fileName)
      a.style.display = 'none'
      a.style.visibility = 'hidden'
      document.body.appendChild(a)

      setTimeout(() => {
        a.click()
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
        alert('Error downloading document: ' + (error.message || 'Unknown error'))
      }
    }
  }

  const handleViewDocument = async (docId, fileName, event) => {
    try {
      console.log('Viewing document:', docId, fileName)
      let button = null
      if (event) {
        button = event.target?.closest('button')
        if (button?.disabled) return
        if (button) button.disabled = true
      }

      const viewUrl = `${API_BASE_URL}/documents/${docId}/view`
      const newWindow = window.open(viewUrl, '_blank')
      if (!newWindow) {
        alert('Please allow popups for this site to view documents, or use the download button instead.')
      }

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
      if (button) {
        button.disabled = false
      }
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    try {
      setChangingPassword(true)
      await api.changePassword(userId, passwordData.currentPassword, passwordData.newPassword)
      setPasswordSuccess('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => {
        setPasswordSuccess('')
      }, 5000)
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }


  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6 max-w-full overflow-x-hidden">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Settings</h2>
        <p className="text-sm md:text-base text-gray-600 mt-1 font-medium">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 overflow-hidden">
        {/* Mobile: Vertical tabs, Desktop: Horizontal tabs */}
        <div className="md:flex md:overflow-x-auto border-b-2 border-gray-200 bg-gray-50">
          {/* Mobile: Grid layout */}
          <div className="grid grid-cols-2 md:flex md:flex-row">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center md:justify-start gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 md:border-b-2 transition-all duration-300 font-semibold text-xs md:text-base ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                      : 'border-transparent text-gray-600 hover:text-blue-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <Icon size={16} className="md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading profile...</span>
                </div>
              ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4 md:space-y-6">
                  {/* User Avatar and Basic Info */}
                  <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl md:text-2xl font-semibold shadow-lg">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-800">{profileData.name || 'User'}</h3>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">{profileData.position || profileData.role}</p>
                      <p className="text-xs text-gray-500 mt-1">{profileData.department || 'HRMS System'}</p>
                    </div>
                  </div>

                  {/* Login Credentials Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                    <h4 className="text-xs md:text-sm font-semibold text-blue-800 mb-3">Login Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">Email (Login ID)</label>
                        <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700">
                          {profileData.email || 'N/A'}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">This is your login email address</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">Role</label>
                        <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            profileData.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                            profileData.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {profileData.role || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Your system access level</p>
                      </div>
                </div>
              </div>

                  {/* Editable Profile Information */}
                  <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-4">Profile Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                  />
                      <p className="text-xs text-gray-500 mt-1">Changing email will update your login credentials</p>
                </div>
                    {isEmployee && (
                      <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Mobile Number</label>
                  <input
                    type="tel"
                    value={profileData.personalMobileNumber}
                    onChange={(e) => setProfileData({ ...profileData, personalMobileNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your mobile number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your personal mobile number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Card Number</label>
                  <input
                    type="text"
                    value={profileData.pan}
                    onChange={(e) => setProfileData({ ...profileData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter PAN card number"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">10-character PAN card number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Card Number</label>
                  <input
                    type="text"
                    value={profileData.aadhaar}
                    onChange={(e) => setProfileData({ ...profileData, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Aadhaar card number"
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-500 mt-1">12-digit Aadhaar card number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UAN Number</label>
                  <input
                    type="text"
                    value={profileData.uanNumber}
                    onChange={(e) => setProfileData({ ...profileData, uanNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter UAN number"
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-500 mt-1">12-digit UAN (Universal Account Number)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                  <input
                    type="text"
                    value={profileData.bankAccountNumber}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter bank account number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your bank account number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                            readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact HR to change</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                            readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact HR to change</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleDateOfBirthChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="text"
                    value={profileData.age}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Calculated from Date of Birth</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                  <select
                    value={profileData.maritalStatus}
                    onChange={(e) => setProfileData({ ...profileData, maritalStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source of Hire</label>
                  <select
                    value={profileData.sourceOfHire}
                    onChange={(e) => setProfileData({ ...profileData, sourceOfHire: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Referral">Referral</option>
                    <option value="Campus Recruitment">Campus Recruitment</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                  <textarea
                    value={profileData.aboutMe}
                    onChange={(e) => setProfileData({ ...profileData, aboutMe: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <input
                            type="text"
                            value={profileData.department}
                            onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">Administration (Read-only)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                          <input
                            type="text"
                            value={profileData.position}
                            onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">Based on your role (Read-only)</p>
                        </div>
                      </>
                    )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => loadUserProfile()}
                      className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 font-medium touch-manipulation"
                    >
                      Cancel
                    </button>
                <button
                  type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                      {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
              )}
            </div>
          )}

          {/* Security Tab - Only for Super Admin */}
          {activeTab === 'security' && isSuperAdmin && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
              
              <form onSubmit={handlePasswordChange} className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 space-y-4">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {passwordSuccess}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your current password"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your new password (min. 6 characters)"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm your new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      setPasswordError('')
                      setPasswordSuccess('')
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Documents Tab - Only for Employees */}
          {activeTab === 'documents' && isEmployee && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">My Documents</h3>
              
              {/* Upload Form */}
              <form onSubmit={handleUploadDocument} className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 space-y-4">
                <h4 className="text-sm md:text-base font-semibold text-blue-800 mb-3">Upload Document</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                    <select
                      value={docFormData.documentType}
                      onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                    <input
                      type="file"
                      onChange={(e) => setDocFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={docFormData.description}
                    onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a description..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>

              {/* Documents List */}
              <div className="space-y-3">
                <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Uploaded Documents</h4>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="text-blue-600" size={20} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">{doc.documentType}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-400 mt-1">{doc.description}</p>
                          )}
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
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-gray-800 text-sm md:text-base">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">Receive notifications for {key.toLowerCase()}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 touch-manipulation">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleNotificationChange(key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Settings

