import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette, Calendar, Edit, Trash2 } from 'lucide-react'
import api from '../services/api'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || 'Admin User',
    email: 'admin@hrms.com',
    phone: '+1 234-567-8900',
    department: 'Administration',
    position: 'System Administrator'
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
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    ...(isAdmin ? [{ id: 'leaveTypes', label: 'Leave Types', icon: Calendar }] : [])
  ]

  useEffect(() => {
    if (isAdmin) {
      loadLeaveTypes()
    }
  }, [isAdmin])

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

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem('userName', profileData.name)
    alert('Profile updated successfully!')
  }

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const handleSecurityChange = (key, value) => {
    setSecurity({ ...security, [key]: value })
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
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                  {profileData.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{profileData.name}</h3>
                  <p className="text-sm text-gray-600">{profileData.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
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

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
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
                                className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingLeaveType ? 'Update' : 'Create'}
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

