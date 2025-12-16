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
import { useState } from 'react'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    { path: '/recruitment', icon: Briefcase, label: 'Recruitment' },
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && <h1 className="text-xl font-bold text-primary-600">HRMS</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
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

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

