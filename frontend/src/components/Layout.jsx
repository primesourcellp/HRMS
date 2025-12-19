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
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])
  const userRole = localStorage.getItem('userRole')
  const userType = localStorage.getItem('userType') // 'admin' or 'employee'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

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
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    ...(isSuperAdmin ? [{ path: '/users', icon: Shield, label: 'User Management' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  // Employee menu items (limited access)
  const employeeMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/attendance', icon: Clock, label: 'My Attendance' },
    { path: '/leave', icon: Calendar, label: 'My Leaves' },
    { path: '/shifts', icon: Clock, label: 'My Shift' },
    { path: '/payroll', icon: DollarSign, label: 'My Payroll' },
    { path: '/performance', icon: TrendingUp, label: 'My Performance' },
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
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${sidebarOpen ? 'w-64' : 'w-20'}`
          }
          bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden
        `}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && <h1 className="text-lg font-bold text-primary-600">HRMS</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:block"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 truncate">
                {menuItems.find(item => item.path === location.pathname)?.label || 'HRMS'}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 rounded-lg px-2 md:px-3 py-2 transition-all duration-200 cursor-pointer group"
                title="Go to Settings"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold group-hover:bg-primary-600 transition-colors text-sm md:text-base">
                  {localStorage.getItem('userName')?.charAt(0) || 'A'}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs md:text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                    {localStorage.getItem('userName') || (isEmployee ? 'Employee' : 'Admin')}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors hidden md:block">
                    {isEmployee 
                      ? `${localStorage.getItem('employeePosition') || 'Employee'} - ${localStorage.getItem('employeeDepartment') || ''}`
                      : userRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

