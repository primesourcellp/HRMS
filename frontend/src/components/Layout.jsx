import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { 
  LayoutDashboard, 
  Users, 
  Clock,
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  Ticket,
  FileText,
  BarChart3,
  UserCog,
  Building2,
  Receipt,
  UserCheck,
  FileCheck,
  Briefcase
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUserRole, hasPermission, ROLES } from '../utils/roles'
import NotificationBell from './NotificationBell'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [logoError, setLogoError] = useState(false)

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
  
  // Safely get user role with error handling
  const getUserRoleSafely = () => {
    try {
      return getUserRole()
    } catch (error) {
      console.error('Error getting user role:', error)
      return ROLES.EMPLOYEE
    }
  }

  const userRole = getUserRoleSafely()
  const userType = localStorage.getItem('userType') || 'employee' // 'admin' or 'employee'
  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN
  const isHRAdmin = userRole === ROLES.HR_ADMIN
  const isManager = userRole === ROLES.MANAGER
  const isEmployee = userRole === ROLES.EMPLOYEE
  const isFinance = userRole === ROLES.FINANCE

  // Build menu items based on role permissions
  const getMenuItems = () => {
    try {
      const allMenuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
        { path: '/employees', icon: Users, label: 'Employee', permission: 'employees' },
        { path: '/attendance', icon: Clock, label: userRole === ROLES.EMPLOYEE ? 'My Attendance' : userRole === ROLES.MANAGER ? 'My Attendance' : 'Attendance', permission: 'attendance' },
        { path: '/team-attendance', icon: Users, label: 'Team Attendance', permission: 'attendance', roles: [ROLES.MANAGER] },
        { path: '/my-attendance', icon: Calendar, label: 'My Attendance', permission: 'myAttendance', roles: [ROLES.HR_ADMIN, ROLES.FINANCE] },
        { path: '/leave', icon: Calendar, label: userRole === ROLES.EMPLOYEE ? 'My Leaves' : userRole === ROLES.MANAGER ? 'Leave Approvals' : userRole === ROLES.FINANCE ? 'My Leaves' : 'Leave Management', permission: 'leave' },
        { path: '/payroll', icon: null, label: userRole === ROLES.EMPLOYEE || userRole === ROLES.MANAGER ? 'My Payroll' : userRole === ROLES.FINANCE ? 'Payroll Validation' : 'Payroll', permission: 'payroll', customIcon: '₹' },
        { path: '/performance', icon: TrendingUp, label: userRole === ROLES.EMPLOYEE ? 'My Performance' : userRole === ROLES.MANAGER ? 'Team Performance' : 'Performance', permission: 'performance' },
        { path: '/shifts', icon: Clock, label: (userRole === ROLES.EMPLOYEE || userRole === ROLES.MANAGER || userRole === ROLES.FINANCE) ? 'My Shift' : 'Shifts', permission: 'shifts' },
        { path: '/tickets', icon: Ticket, label: userRole === ROLES.EMPLOYEE ? 'My Tickets' : userRole === ROLES.FINANCE ? 'Payroll Tickets' : 'HR Tickets', permission: 'tickets' },
        { path: '/my-tickets', icon: Ticket, label: 'My Tickets', permission: 'tickets', roles: [ROLES.FINANCE] },
        { path: '/recruitment', icon: Briefcase, label: 'Recruitment', permission: 'recruitment' },
        { path: '/analytics', icon: BarChart3, label: userRole === ROLES.FINANCE ? 'Cost Analytics' : 'Analytics', permission: 'analytics' },
        { path: '/compliance', icon: FileCheck, label: 'Compliance & Audit', permission: 'compliance', roles: [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.FINANCE] },
        { path: '/clients', icon: Building2, label: 'Client Management', permission: 'employees' },
        { path: '/users', icon: Shield, label: 'User Management', permission: 'users' },
        { path: '/teams', icon: UserCheck, label: 'Team Management', permission: 'teamManagement', roles: [ROLES.SUPER_ADMIN] },
        { path: '/my-teams', icon: UserCheck, label: 'My Teams', permission: 'myTeams', roles: [ROLES.HR_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE] },
        { path: '/settings', icon: Settings, label: 'Profile', permission: 'settings' },
      ]

      // Filter menu items based on permissions and roles
      return allMenuItems.filter(item => {
        try {
          // Check if item has specific roles requirement
          if (item.roles && !item.roles.includes(userRole)) {
            return false
          }
          // Exclude Attendance menu item for FINANCE role (they have My Attendance instead)
          if (item.path === '/attendance' && userRole === ROLES.FINANCE) {
            return false
          }
          return hasPermission(userRole, item.permission)
        } catch (error) {
          console.error('Error checking permission:', error)
          return false
        }
      })
    } catch (error) {
      console.error('Error building menu items:', error)
      // Return at least dashboard and settings as fallback
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
        { path: '/settings', icon: Settings, label: 'Profile', permission: 'settings' },
      ]
    }
  }

  const menuItems = getMenuItems()

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
            ? `fixed inset-y-0 left-0 z-50 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${sidebarOpen ? 'w-64' : 'w-20'}`
          }
          bg-white border-r border-gray-200 ${isMobile ? 'transition-transform duration-300' : 'transition-all duration-300'} flex flex-col shadow-lg relative
        `}
        style={{ zIndex: 30, overflow: 'visible' }}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          {sidebarOpen && (
            <>
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="Advances Solutions Logo" 
                  className="h-11 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <h1 className="text-lg font-bold text-primary-600">HRMS</h1>
              )}
            </>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" style={{ overflowX: 'visible' }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <div key={item.path} className="relative group" style={{ zIndex: 1000 + index }}>
                <button
                  onClick={() => navigate(item.path)}
                  onMouseEnter={(e) => {
                    if (!sidebarOpen) {
                      const button = e.currentTarget
                      const rect = button.getBoundingClientRect()
                      const tooltip = button.nextElementSibling
                      if (tooltip) {
                        tooltip.style.top = `${rect.top + rect.height / 2}px`
                        tooltip.style.left = `${rect.right + 8}px`
                      }
                    }
                  }}
                  className={`w-full flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} ${sidebarOpen ? 'px-4' : 'px-2'} py-3 rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  title={sidebarOpen ? item.label : ''}
                >
                  {item.customIcon ? (
                    <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-800'}`} style={{ fontSize: '18px' }}>{item.customIcon}</span>
                  ) : (
                    Icon && <Icon size={18} className={isActive ? 'text-white' : 'text-gray-800'} strokeWidth={isActive ? 2.5 : 2} style={{ width: '18px', height: '18px' }} />
                  )}
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </>
                  )}
                </button>
                {/* Tooltip - Show when sidebar is collapsed */}
                {!sidebarOpen && (
                  <div 
                    className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[10000] font-medium"
                    style={{ 
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

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
              <NotificationBell />
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
                      : isSuperAdmin ? 'Super Administrator'
                      : isHRAdmin ? 'HR Administrator'
                      : isManager ? 'Manager'
                      : isFinance ? 'Finance'
                      : 'User'}
                  </p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-all duration-200"
                title="Logout"
              >
                <LogOut size={20} />
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

