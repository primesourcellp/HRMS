import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { 
  LayoutDashboard, 
  Users, 
  Clock,
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  Briefcase,
  Ticket,
  FileText,
<<<<<<< HEAD
  BarChart3
} from 'lucide-react'
import { useState } from 'react'
=======
  BarChart3,
  Bell
} from 'lucide-react'
import { useState, useEffect } from 'react'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
<<<<<<< HEAD
  const [sidebarOpen, setSidebarOpen] = useState(true)
=======
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  const userRole = localStorage.getItem('userRole')
  const userType = localStorage.getItem('userType') // 'admin' or 'employee'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

<<<<<<< HEAD
=======
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-close sidebar on mobile when resizing to mobile
      if (mobile) {
        setSidebarOpen(false)
      } else {
        // Auto-open sidebar on desktop
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Load notifications for employees
  useEffect(() => {
    if (isEmployee) {
      const userId = localStorage.getItem('userId')
      if (userId) {
        const empId = parseInt(userId)
        setEmployeeId(empId)
        loadNotifications(empId)
      }
    }
  }, [isEmployee, location.pathname])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const loadNotifications = (empId) => {
    try {
      const stored = localStorage.getItem(`notifications_${empId}`)
      const notifs = stored ? JSON.parse(stored) : []
      // Sort by date, newest first
      const sorted = notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setNotifications(sorted)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    }
  }

  const markNotificationAsRead = (index) => {
    setNotifications(prev => {
      const updated = [...prev]
      updated[index].read = true
      if (employeeId) {
        localStorage.setItem(`notifications_${employeeId}`, JSON.stringify(updated))
      }
      return updated
    })
  }

  const deleteNotification = (index) => {
    setNotifications(prev => {
      const updated = prev.filter((_, i) => i !== index)
      if (employeeId) {
        localStorage.setItem(`notifications_${employeeId}`, JSON.stringify(updated))
      }
      return updated
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  // Admin menu items (Super Admin and Admin)
  const adminMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employees', icon: Users, label: 'Employees' },
    { path: '/attendance', icon: Clock, label: 'Attendance' },
    { path: '/leave', icon: Calendar, label: 'Leave Management' },
    { path: '/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/performance', icon: TrendingUp, label: 'Performance' },
    { path: '/shifts', icon: Clock, label: 'Shifts' },
    { path: '/tickets', icon: Ticket, label: 'HR Tickets' },
<<<<<<< HEAD
    { path: '/recruitment', icon: Briefcase, label: 'Recruitment' },
=======
    // { path: '/recruitment', icon: Briefcase, label: 'Recruitment' },
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    ...(isSuperAdmin ? [{ path: '/users', icon: Shield, label: 'User Management' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  // Employee menu items (limited access)
  const employeeMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/attendance', icon: Clock, label: 'My Attendance' },
    { path: '/leave', icon: Calendar, label: 'My Leaves' },
    { path: '/payroll', icon: DollarSign, label: 'My Payroll' },
    { path: '/performance', icon: TrendingUp, label: 'My Performance' },
<<<<<<< HEAD
=======
    { path: '/shifts', icon: Clock, label: 'My Shift' },
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    { path: '/tickets', icon: Ticket, label: 'My Tickets' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const menuItems = isEmployee ? employeeMenuItems : adminMenuItems

  const handleLogout = async () => {
    try {
      // Call backend logout to clear HttpOnly cookies
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear localStorage
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      localStorage.removeItem('userType')
      localStorage.removeItem('employeeDepartment')
      localStorage.removeItem('employeePosition')
      // Force navigation to login page
      window.location.href = '/login'
    }
  }

  return (
<<<<<<< HEAD
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && <h1 className="text-xl font-bold text-primary-600">HRMS</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
=======
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : `${sidebarOpen ? 'w-64' : 'w-20'}`
        }
        bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-lg
      `}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200 min-h-[64px]">
          {(sidebarOpen || isMobile) && <h1 className="text-xl font-bold text-primary-600">HRMS</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Toggle sidebar"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
<<<<<<< HEAD
        <nav className="flex-1 p-4 space-y-2">
=======
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
<<<<<<< HEAD
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
=======
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all touch-manipulation ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                } ${(sidebarOpen || isMobile) ? '' : 'justify-center'}`}
              >
                <Icon size={20} />
                {(sidebarOpen || isMobile) && <span className="truncate">{item.label}</span>}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
<<<<<<< HEAD
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {menuItems.find(item => item.path === location.pathname)?.label || 'HRMS'}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer group"
                title="Go to Settings"
              >
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold group-hover:bg-primary-600 transition-colors">
                  {localStorage.getItem('userName')?.charAt(0) || 'A'}
                </div>
                <div className="text-right">
=======
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition-all touch-manipulation ${
              (sidebarOpen || isMobile) ? '' : 'justify-center'
            }`}
          >
            <LogOut size={20} />
            {(sidebarOpen || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'w-full' : ''}`}>
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
              )}
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                {menuItems.find(item => item.path === location.pathname)?.label || 'HRMS'}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Notifications Bell - Only for employees */}
              {isEmployee && (
                <div className="relative notifications-container">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer group"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && notifications.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border-2 border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                            <Bell size={20} />
                            Notifications
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {unreadCount} New
                              </span>
                            )}
                          </h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <div className="space-y-2 p-2">
                          {notifications.map((notif, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                notif.read 
                                  ? 'bg-gray-50 border-gray-200' 
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{notif.title}</p>
                                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notif.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex gap-2 ml-2">
                                  {!notif.read && (
                                    <button
                                      onClick={() => markNotificationAsRead(index)}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                      title="Mark as read"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(index)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                    title="Delete"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {showNotifications && notifications.length === 0 && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border-2 border-gray-200 z-50 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                          <Bell size={20} />
                          Notifications
                        </h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-center text-gray-500 py-4">No notifications</p>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 rounded-lg px-2 md:px-3 py-2 transition-all duration-200 cursor-pointer group"
                title="Go to Settings"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold group-hover:bg-primary-600 transition-colors text-sm md:text-base">
                  {localStorage.getItem('userName')?.charAt(0) || 'A'}
                </div>
                <div className="text-right hidden sm:block">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                    {localStorage.getItem('userName') || (isEmployee ? 'Employee' : 'Admin')}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                    {isEmployee 
                      ? `${localStorage.getItem('employeePosition') || 'Employee'} - ${localStorage.getItem('employeeDepartment') || ''}`
                      : userRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

<<<<<<< HEAD
        <main className="flex-1 overflow-y-auto p-6">
=======
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

