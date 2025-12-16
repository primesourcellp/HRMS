import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Database, Calendar, Edit, Trash2, X } from 'lucide-react'
import api from '../services/api'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    phone: '',
    department: '',
    position: '',
    role: localStorage.getItem('userRole') || ''
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leaveRequests: true,
    payrollAlerts: true,
    performanceReviews: true
  })

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90'
  })

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')

  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('hrms_theme') || 'light',
    language: localStorage.getItem('hrms_language') || 'english'
  })

  const [leaveTypes, setLeaveTypes] = useState([])
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState(null)
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: '',
    code: '',
    maxDays: '',
    carryForward: false,
    maxCarryForward: '',
    description: '',
    active: true
  })
  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userRole === 'EMPLOYEE'

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    ...(isAdmin ? [{ id: 'leaveTypes', label: 'Leave Types', icon: Calendar }] : [])
  ]

  useEffect(() => {
    loadUserProfile()
    if (isAdmin) {
      loadLeaveTypes()
    }
    loadAppearanceSettings()
    
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
          setProfileData({
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            department: employee.department || '',
            position: employee.position || '',
            role: 'EMPLOYEE'
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

  const loadLeaveTypes = async () => {
    try {
      const data = await api.getLeaveTypes()
      setLeaveTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading leave types:', error)
    }
  }

  const handleLeaveTypeSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = {
        ...leaveTypeForm,
        maxDays: leaveTypeForm.maxDays ? parseInt(leaveTypeForm.maxDays) : null,
        maxCarryForward: leaveTypeForm.maxCarryForward ? parseInt(leaveTypeForm.maxCarryForward) : null
      }
      if (editingLeaveType) {
        await api.updateLeaveType(editingLeaveType.id, formData)
      } else {
        await api.createLeaveType(formData)
      }
      await loadLeaveTypes()
      setShowLeaveTypeModal(false)
      setEditingLeaveType(null)
      setLeaveTypeForm({
        name: '',
        code: '',
        maxDays: '',
        carryForward: false,
        maxCarryForward: '',
        description: '',
        active: true
      })
      alert('Leave type saved successfully')
    } catch (error) {
      alert('Error saving leave type: ' + error.message)
    }
  }

  const handleEditLeaveType = (leaveType) => {
    setEditingLeaveType(leaveType)
    setLeaveTypeForm({
      name: leaveType.name || '',
      code: leaveType.code || '',
      maxDays: leaveType.maxDays || '',
      carryForward: leaveType.carryForward || false,
      maxCarryForward: leaveType.maxCarryForward || '',
      description: leaveType.description || '',
      active: leaveType.active !== undefined ? leaveType.active : true
    })
    setShowLeaveTypeModal(true)
  }

  const handleDeleteLeaveType = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave type?')) {
      try {
        await api.deleteLeaveType(id)
        await loadLeaveTypes()
        alert('Leave type deleted successfully')
      } catch (error) {
        alert('Error deleting leave type: ' + error.message)
      }
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
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            department: profileData.department,
            position: profileData.position
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

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const handleSecurityChange = (key, value) => {
    setSecurity({ ...security, [key]: value })
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    
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

    setLoading(true)
    try {
      // Verify current password first by attempting login
      const email = profileData.email
      let loginResponse
      
      if (isEmployee) {
        loginResponse = await api.employeeLogin(email, passwordData.currentPassword)
      } else {
        loginResponse = await api.login(email, passwordData.currentPassword)
      }
      
      if (!loginResponse.success) {
        setPasswordError('Current password is incorrect')
        setLoading(false)
        return
      }
      
      // Update password
      if (isEmployee) {
        // Use dedicated change password endpoint for employees
        const response = await api.changeEmployeePassword(
          parseInt(userId),
          passwordData.currentPassword,
          passwordData.newPassword
        )
        if (response.error) {
          throw new Error(response.error)
        }
      } else {
        // Update admin user password
        const response = await api.updateUser(parseInt(userId), {
          password: passwordData.newPassword
        }, userRole)
        if (response.error) {
          throw new Error(response.error)
        }
      }
      
      alert('Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordError('')
    } catch (error) {
      setPasswordError(error.message || 'Error changing password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    alert('Data export functionality would be implemented here')
  }

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cached data?')) {
      localStorage.removeItem('hrms_employees')
      localStorage.removeItem('hrms_attendance')
      localStorage.removeItem('hrms_leaves')
      localStorage.removeItem('hrms_payrolls')
      localStorage.removeItem('hrms_performance')
      alert('Cache cleared successfully!')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div>
        <h2 className="text-3xl font-bold text-blue-600">Settings</h2>
        <p className="text-gray-600 mt-1 font-medium">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 overflow-hidden">
        <div className="flex border-b-2 border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 font-semibold ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                    : 'border-transparent text-gray-600 hover:text-blue-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-6 bg-white">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading profile...</span>
                </div>
              ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* User Avatar and Basic Info */}
                  <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{profileData.name || 'User'}</h3>
                      <p className="text-sm text-gray-600 mt-1">{profileData.position || profileData.role}</p>
                      <p className="text-xs text-gray-500 mt-1">{profileData.department || 'HRMS System'}</p>
                    </div>
                  </div>

                  {/* Login Credentials Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Login Credentials</h4>
                    <div className="grid grid-cols-2 gap-4">
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
                  <h4 className="text-sm font-semibold text-gray-800 mb-4">Profile Information</h4>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+1 234-567-8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => loadUserProfile()}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      Cancel
                    </button>
                <button
                  type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                      {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">Receive notifications for {key.toLowerCase()}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
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

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.twoFactorAuth}
                    onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                <select
                  value={security.passwordExpiry}
                  onChange={(e) => handleSecurityChange('passwordExpiry', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => {
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                    setShowPasswordModal(true)
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All data is stored locally in your browser. Export your data regularly to prevent data loss.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">Export Data</p>
                    <p className="text-sm text-gray-600">Download all HRMS data as JSON</p>
                  </div>
                  <Database className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={handleClearCache}
                  className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-red-800">Clear All Data</p>
                    <p className="text-sm text-red-600">Permanently delete all stored data</p>
                  </div>
                  <Database className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          )}

          {/* Leave Types Tab (Admin Only) */}
          {activeTab === 'leaveTypes' && isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Leave Types Management</h3>
                <button
                  onClick={() => {
                    setEditingLeaveType(null)
                    setLeaveTypeForm({
                      name: '',
                      code: '',
                      maxDays: '',
                      carryForward: false,
                      maxCarryForward: '',
                      description: '',
                      active: true
                    })
                    setShowLeaveTypeModal(true)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <Calendar size={18} />
                  Add Leave Type
                </button>
              </div>

              {leaveTypes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-gray-200">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 mb-4">No leave types found</p>
                  <button
                    onClick={() => setShowLeaveTypeModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    Create First Leave Type
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Max Days</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Carry Forward</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {leaveTypes.map((type) => (
                        <tr key={type.id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{type.code}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{type.maxDays || 'Unlimited'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {type.carryForward ? `Yes (Max: ${type.maxCarryForward || 'N/A'})` : 'No'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              type.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {type.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleEditLeaveType(type)}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Leave Type"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteLeaveType(type.id)}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Leave Type"
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Leave Type Modal */}
      {showLeaveTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
            </h3>
            <form onSubmit={handleLeaveTypeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={leaveTypeForm.name}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Casual Leave"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={leaveTypeForm.code}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., CL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Days (per year)</label>
                  <input
                    type="number"
                    value={leaveTypeForm.maxDays}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Carry Forward Days</label>
                  <input
                    type="number"
                    value={leaveTypeForm.maxCarryForward}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxCarryForward: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Only if carry forward enabled"
                    min="0"
                    disabled={!leaveTypeForm.carryForward}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={leaveTypeForm.description}
                  onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Leave type description..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={leaveTypeForm.carryForward}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, carryForward: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Allow Carry Forward</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={leaveTypeForm.active}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveTypeModal(false)
                    setEditingLeaveType(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingLeaveType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-600">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setPasswordError('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{passwordError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Security Tips:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 list-disc list-inside space-y-1">
                  <li>Use a strong password with at least 6 characters</li>
                  <li>Include a mix of letters, numbers, and special characters</li>
                  <li>Don't reuse passwords from other accounts</li>
                </ul>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings

