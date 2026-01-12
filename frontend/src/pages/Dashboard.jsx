import { useHRMS } from '../context/HRMSContext'
import { Users, Clock, Calendar, DollarSign, TrendingUp, ArrowUp, ArrowDown, UserPlus, CheckCircle, FileText, PlusCircle, Eye, Settings, LogIn, LogOut, X, Building2, MapPin, EyeOff, LayoutGrid, Eye as EyeIcon, Ticket, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { format } from 'date-fns'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useRolePermissions } from '../hooks/useRolePermissions'

const Dashboard = () => {
  const { employees, attendance, leaves, payrolls } = useHRMS()
  const [dashboardStats, setDashboardStats] = useState(null)
  const [executiveData, setExecutiveData] = useState(null)
  const [loadingExecutive, setLoadingExecutive] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  const [employeeShift, setEmployeeShift] = useState(null)
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([])
  const [loadingWeeklyAttendance, setLoadingWeeklyAttendance] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState(null)
  const [checkInError, setCheckInError] = useState(null)
  const [checkOutLoading, setCheckOutLoading] = useState(false)
  const [checkOutMessage, setCheckOutMessage] = useState(null)
  const [checkOutError, setCheckOutError] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [widgetVisibility, setWidgetVisibility] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('dashboardWidgetVisibility')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing saved widget visibility:', e)
      }
    }
    // Default visibility
    return {
      kpis: true,
      monthlyAttendance: true,
      leavePatterns: true,
      payrollVariance: true,
      departmentAnalytics: true,
      locationAnalytics: true
    }
  })
  const [showWidgetConfig, setShowWidgetConfig] = useState(false)
  const [attendanceView, setAttendanceView] = useState('monthly') // 'monthly' or 'daily'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const dailyChartRef = useRef(null)
  const navigate = useNavigate()
  const permissions = useRolePermissions()
  const { 
    isAdmin = false, 
    isHRAdmin = false, 
    isManager = false, 
    isEmployee = false, 
    isFinance = false, 
    canManageEmployees = false 
  } = permissions || {}
  
  const isExecutiveView = isAdmin || isHRAdmin

  useEffect(() => {
    // Check if user is an employee
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    const empId = userId ? parseInt(userId) : null
    setEmployeeId(empId)
    loadDashboardStats(empId && (isEmployee || userType === 'employee') ? empId : null)
    
    // Load executive dashboard for Super Admin/HR Admin
    if (isExecutiveView) {
      loadExecutiveDashboard()
    }
    
    // Load employee shift and today's attendance if user is an employee
    if (empId && (isEmployee || userType === 'employee')) {
      loadEmployeeShift(empId)
      loadTodayAttendance(empId)
    }

    // Load weekly attendance data for admin/manager/finance
    if (!isEmployee && userType !== 'employee') {
      loadWeeklyAttendanceData()
    }

    // Load tickets for finance users
    if (isFinance) {
      loadTickets()
    }
  }, [employees, isEmployee, isExecutiveView, selectedMonth, isFinance]) // Re-run when employees data is loaded or selectedMonth changes

  const loadEmployeeShift = async (empId) => {
    try {
      console.log('Loading shift for employee ID:', empId)
      
      // First, try to get shift from API
      const shift = await api.getShiftByEmployeeId(empId)
      console.log('Shift from API:', shift)
      
      if (shift) {
        setEmployeeShift(shift)
        return
      }
      
      // Fallback: Check if employee object has shift info
      if (employees && Array.isArray(employees)) {
        const employee = employees.find(emp => {
          const empIdNum = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
          return empIdNum === empId
        })
        
        if (employee && employee.shift) {
          console.log('Found shift in employee object:', employee.shift)
          setEmployeeShift(employee.shift)
          return
        }
      }
      
      // If no shift found, set to null
      setEmployeeShift(null)
    } catch (error) {
      console.error('Error loading employee shift:', error)
      setEmployeeShift(null)
    }
  }

  const loadDashboardStats = async (empId = null) => {
    try {
      const stats = await api.getDashboardStats(null, empId)
      setDashboardStats(stats)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const loadExecutiveDashboard = async () => {
    setLoadingExecutive(true)
    try {
      const data = await api.getExecutiveDashboard(12, selectedMonth)
      setExecutiveData(data)
    } catch (error) {
      console.error('Error loading executive dashboard:', error)
    } finally {
      setLoadingExecutive(false)
    }
  }

  const toggleWidget = (widgetName) => {
    setWidgetVisibility(prev => {
      const updated = {
        ...prev,
        [widgetName]: !prev[widgetName]
      }
      // Save to localStorage
      localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(updated))
      return updated
    })
  }

  const resetWidgets = () => {
    const defaultVisibility = {
      kpis: true,
      monthlyAttendance: true,
      leavePatterns: true,
      payrollVariance: true,
      departmentAnalytics: true,
      locationAnalytics: true
    }
    setWidgetVisibility(defaultVisibility)
    localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(defaultVisibility))
  }

  const showAllWidgets = () => {
    const allVisible = {
      kpis: true,
      monthlyAttendance: true,
      leavePatterns: true,
      payrollVariance: true,
      departmentAnalytics: true,
      locationAnalytics: true
    }
    setWidgetVisibility(allVisible)
    localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(allVisible))
  }

  const hideAllWidgets = () => {
    const allHidden = {
      kpis: false,
      monthlyAttendance: false,
      leavePatterns: false,
      payrollVariance: false,
      departmentAnalytics: false,
      locationAnalytics: false
    }
    setWidgetVisibility(allHidden)
    localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(allHidden))
  }

  const loadTodayAttendance = async (empId) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const attendanceRecords = await api.getAttendanceByDate(today)
      const todayRecord = Array.isArray(attendanceRecords) 
        ? attendanceRecords.find(a => a.employeeId === empId)
        : null
      setTodayAttendance(todayRecord || null)
    } catch (error) {
      console.error('Error loading today attendance:', error)
      setTodayAttendance(null)
    }
  }

  const handleCheckIn = async () => {
    if (!employeeId) return
    
    setCheckInLoading(true)
    setCheckInError(null)
    setCheckInMessage(null)
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkInData = {
        employeeId,
        date: today,
        checkInTime: currentTime,
        method: 'WEB'
      }
      
      const response = await api.checkIn(checkInData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-in failed')
      }
      
      setCheckInMessage('Check-in successful!')
      setTimeout(() => setCheckInMessage(null), 3000)
      
      // Reload dashboard stats and today's attendance
      await loadDashboardStats(employeeId)
      await loadTodayAttendance(employeeId)
    } catch (error) {
      setCheckInError(error.message || 'Error checking in')
      setTimeout(() => setCheckInError(null), 5000)
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!employeeId) return
    
    setCheckOutLoading(true)
    setCheckOutError(null)
    setCheckOutMessage(null)
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkOutData = {
        employeeId,
        date: today,
        checkOutTime: currentTime
      }
      
      const response = await api.checkOut(checkOutData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-out failed')
      }
      
      setCheckOutMessage('Check-out successful!')
      setTimeout(() => setCheckOutMessage(null), 3000)
      
      // Reload dashboard stats and today's attendance
      await loadDashboardStats(employeeId)
      await loadTodayAttendance(employeeId)
    } catch (error) {
      setCheckOutError(error.message || 'Error checking out')
      setTimeout(() => setCheckOutError(null), 5000)
    } finally {
      setCheckOutLoading(false)
    }
  }

  const loadWeeklyAttendanceData = async () => {
    try {
      setLoadingWeeklyAttendance(true)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      const weekData = []

      // Get all employees to calculate total count
      let allEmployees = []
      try {
        const employeesData = await api.getEmployees()
        allEmployees = Array.isArray(employeesData) ? employeesData : []
      } catch (error) {
        console.error('Error fetching employees for weekly attendance:', error)
        // Fallback to context employees
        allEmployees = Array.isArray(employees) ? employees : []
      }

      const totalEmployees = allEmployees.length

      // Fetch attendance for each day of the past week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        
        try {
          // Fetch attendance for this date
          const attendanceRecords = await api.getAttendanceByDate(dateStr)
          const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
          
          // Count present and absent
          let present = 0
          let absent = 0
          
          if (attendanceArray.length > 0) {
            // Count present employees
            present = attendanceArray.filter(a => 
              a.status === 'Present' || a.status === 'PRESENT'
            ).length
            
            // Calculate absent: total employees - present
            absent = Math.max(0, totalEmployees - present)
          } else {
            // If no attendance records, check if it's today or future
            const dateOnly = new Date(date)
            dateOnly.setHours(0, 0, 0, 0)
            const todayOnly = new Date(today)
            todayOnly.setHours(0, 0, 0, 0)
            
            // For past dates with no records, count as absent
            // For today and future dates, don't count as absent yet
            if (dateOnly < todayOnly) {
              absent = totalEmployees
            }
          }
          
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: present,
            absent: absent
          })
        } catch (error) {
          console.error(`Error fetching attendance for ${dateStr}:`, error)
          // On error, add default values
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: 0,
            absent: 0
          })
        }
      }
      
      setWeeklyAttendanceData(weekData)
    } catch (error) {
      console.error('Error loading weekly attendance data:', error)
      // Set empty data on error
      setWeeklyAttendanceData([])
    } finally {
      setLoadingWeeklyAttendance(false)
    }
  }

  const loadTickets = async () => {
    try {
      setLoadingTickets(true)
      const ticketsData = await api.getTickets()
      // Filter to show only open/pending tickets for finance dashboard
      const filteredTickets = Array.isArray(ticketsData) 
        ? ticketsData.filter(t => t.status === 'OPEN' || t.status === 'PENDING' || t.status === 'IN_PROGRESS')
        : []
      // Sort by priority and date, show most urgent first
      filteredTickets.sort((a, b) => {
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      setTickets(filteredTickets.slice(0, 5)) // Show top 5 tickets
    } catch (error) {
      console.error('Error loading tickets:', error)
      setTickets([])
    } finally {
      setLoadingTickets(false)
    }
  }

  // Filter data based on employee or admin view
  // Ensure arrays exist before filtering
  const safeAttendance = Array.isArray(attendance) ? attendance : []
  const safeLeaves = Array.isArray(leaves) ? leaves : []
  const safePayrolls = Array.isArray(payrolls) ? payrolls : []
  const safeEmployees = Array.isArray(employees) ? employees : []
  
  const filteredAttendance = isEmployee && employeeId 
    ? safeAttendance.filter(a => a.employeeId === employeeId)
    : safeAttendance
  
  const filteredLeaves = isEmployee && employeeId
    ? safeLeaves.filter(l => l.employeeId === employeeId)
    : safeLeaves
  
  const filteredPayrolls = isEmployee && employeeId
    ? safePayrolls.filter(p => p.employeeId === employeeId)
    : safePayrolls

  const stats = isEmployee ? [
    {
      title: 'My Status Today',
      value: dashboardStats?.presentToday > 0 ? 'Present' : 'Absent',
      change: dashboardStats?.presentToday > 0 ? 'Present' : 'Absent',
      trend: dashboardStats?.presentToday > 0 ? 'up' : 'down',
      icon: Clock,
      color: dashboardStats?.presentToday > 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      title: 'My Pending Leaves',
      value: dashboardStats?.pendingLeaves || filteredLeaves.filter(l => l.status === 'PENDING' || l.status === 'Pending').length,
      change: '-3%',
      trend: 'down',
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    {
      title: 'My Approved Leaves',
      value: dashboardStats?.approvedLeaves || filteredLeaves.filter(l => l.status === 'APPROVED' || l.status === 'Approved').length,
      change: '+5%',
      trend: 'up',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'My Total Payroll',
      value: `$${dashboardStats?.totalPayroll?.toLocaleString() || filteredPayrolls.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ] : [
    {
      title: 'Total Employees',
      value: safeEmployees.length,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Present Today',
      value: dashboardStats?.presentToday || filteredAttendance.filter(a => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return (a.date === today || a.date?.startsWith(today)) && a.status === 'Present'
      }).length,
      change: '+5%',
      trend: 'up',
      icon: Clock,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Leaves',
      value: dashboardStats?.pendingLeaves || (Array.isArray(leaves) ? leaves.filter(l => l.status === 'PENDING' || l.status === 'Pending').length : 0),
      change: '-3%',
      trend: 'down',
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    {
      title: 'Total Payroll',
      value: `$${dashboardStats?.totalPayroll?.toLocaleString() || (Array.isArray(payrolls) ? payrolls.reduce((sum, p) => sum + (p.amount || p.netSalary || 0), 0).toLocaleString() : '0')}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ]

  // For employee view, show their department only
  const departmentData = isEmployee 
    ? (dashboardStats?.department ? { [dashboardStats.department]: 1 } : {})
    : (dashboardStats?.departmentDistribution || safeEmployees.reduce((acc, emp) => {
        if (emp && emp.department) {
          acc[emp.department] = (acc[emp.department] || 0) + 1
        }
        return acc
      }, {}))

  const chartData = Object.entries(departmentData).map(([name, value]) => ({ 
    name, 
    value: typeof value === 'number' ? value : parseInt(value) 
  }))

  // Generate attendance data for the week
  const getWeeklyAttendanceData = () => {
    if (isEmployee && dashboardStats?.weekAttendance) {
      // For employee, show their weekly attendance
      const weekData = []
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dayName = weekDays[date.getDay()]
        const dateStr = format(date, 'yyyy-MM-dd')
        
        const dayAttendance = dashboardStats.weekAttendance.find(a => {
          const attendanceDate = typeof a.date === 'string' ? a.date : (a.date || '')
          return attendanceDate === dateStr || attendanceDate.startsWith(dateStr)
        })
        
        weekData.push({
          name: dayName,
          present: dayAttendance && dayAttendance.status === 'Present' ? 1 : 0,
          absent: dayAttendance && dayAttendance.status === 'Absent' ? 1 : 0
        })
      }
      
      return weekData
    } else {
      // For admin, use dynamically loaded weekly attendance data
      if (weeklyAttendanceData.length > 0) {
        return weeklyAttendanceData
      }
      // Return empty data while loading
      return [
        { name: 'Mon', present: 0, absent: 0 },
        { name: 'Tue', present: 0, absent: 0 },
        { name: 'Wed', present: 0, absent: 0 },
        { name: 'Thu', present: 0, absent: 0 },
        { name: 'Fri', present: 0, absent: 0 },
        { name: 'Sat', present: 0, absent: 0 },
        { name: 'Sun', present: 0, absent: 0 }
      ]
    }
  }

  const attendanceData = getWeeklyAttendanceData()

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  // For employee view, show only their own info
  const recentEmployees = isEmployee && employeeId
    ? safeEmployees.filter(emp => emp.id === employeeId)
    : (dashboardStats?.recentEmployees || safeEmployees
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 5))

  // Check if employee can check in
  const canCheckIn = isEmployee && employeeId && (!todayAttendance || !todayAttendance.checkIn)
  
  // Check if employee can check out
  const canCheckOut = isEmployee && employeeId && todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut

  // Executive Dashboard KPIs
  const executiveKPIs = executiveData ? [
    {
      title: 'Headcount',
      value: executiveData.headcount || 0,
      subtitle: 'Active Employees',
      icon: Users,
      color: 'bg-blue-500',
      trend: 'up'
    },
    {
      title: 'Attrition Rate',
      value: `${executiveData.attritionRate || 0}%`,
      subtitle: `${executiveData.exitedEmployees || 0} exited (12M)`,
      icon: TrendingUp,
      color: executiveData.attritionRate > 10 ? 'bg-red-500' : 'bg-orange-500',
      trend: executiveData.attritionRate > 10 ? 'up' : 'down'
    },
    {
      title: 'Attendance %',
      value: `${executiveData.attendancePercentage || 0}%`,
      subtitle: 'Current Month',
      icon: Clock,
      color: 'bg-green-500',
      trend: 'up'
    },
    {
      title: 'Payroll Cost',
      value: `$${(executiveData.payrollCost || 0).toLocaleString()}`,
      subtitle: 'Current Month',
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: 'up'
    }
  ] : []

  return (
    <div className="space-y-3 sm:space-y-4 bg-gray-50 p-2 sm:p-3 md:p-4 max-w-full overflow-x-hidden">
      {/* Success/Error Messages */}
      {checkInMessage && (
        <div className="p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {checkInMessage}
        </div>
      )}
      {checkInError && (
        <div className="p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {checkInError}
        </div>
      )}
      {checkOutMessage && (
        <div className="p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {checkOutMessage}
        </div>
      )}
      {checkOutError && (
        <div className="p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {checkOutError}
        </div>
      )}

      {/* Executive Dashboard View */}
      {isExecutiveView && (
        <div className="space-y-4">
          {/* Widget Configuration Modal */}
          {showWidgetConfig && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5" />
                    Configure Dashboard Widgets
                  </h2>
                  <button
                    onClick={() => setShowWidgetConfig(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Select which widgets to display on your dashboard. Changes are saved automatically.
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-6 pb-4 border-b border-gray-200">
                    <button
                      onClick={showAllWidgets}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Show All
                    </button>
                    <button
                      onClick={hideAllWidgets}
                      className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Hide All
                    </button>
                    <button
                      onClick={resetWidgets}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>

                  {/* Widget Toggles */}
                  <div className="space-y-3">
                    {/* KPIs Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Key Performance Indicators (KPIs)</h3>
                          <p className="text-xs text-gray-500">Headcount, Attrition Rate, Attendance %, Payroll Cost</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetVisibility.kpis}
                          onChange={() => toggleWidget('kpis')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Monthly Attendance Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Attendance Trends</h3>
                          <p className="text-xs text-gray-500">Monthly and Daily attendance charts with trends</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetVisibility.monthlyAttendance}
                          onChange={() => toggleWidget('monthlyAttendance')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Leave Patterns Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Leave Patterns</h3>
                          <p className="text-xs text-gray-500">Approved vs Pending leave trends over time</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetVisibility.leavePatterns}
                          onChange={() => toggleWidget('leavePatterns')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Payroll Variance Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500 p-2 rounded-lg">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Payroll Variance</h3>
                          <p className="text-xs text-gray-500">Payroll costs and month-over-month variance</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetVisibility.payrollVariance}
                          onChange={() => toggleWidget('payrollVariance')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Department Analytics Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Department Analytics</h3>
                          <p className="text-xs text-gray-500">Department-wise headcount, attendance, and payroll</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetVisibility.departmentAnalytics}
                          onChange={() => toggleWidget('departmentAnalytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Location Analytics Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-teal-500 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Location Analytics</h3>
                          <p className="text-xs text-gray-500">Location-wise headcount, attendance, and payroll</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetVisibility.locationAnalytics}
                          onChange={() => toggleWidget('locationAnalytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowWidgetConfig(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Executive KPIs - Compact Size */}
          {widgetVisibility.kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {loadingExecutive ? (
                <div className="col-span-5 text-center py-3 text-xs">Loading executive data...</div>
              ) : (
                <>
                  {executiveKPIs.map((kpi, index) => {
                    const Icon = kpi.icon
                    return (
                      <div key={index} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-2 border border-gray-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`${kpi.color} p-1 rounded-lg shadow-sm`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-0.5">{kpi.value}</h3>
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">{kpi.title}</p>
                        <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                      </div>
                    )
                  })}
                  {/* Configure Widgets Button - Inline with grid, next to Payroll Cost */}
                  <button
                    onClick={() => setShowWidgetConfig(true)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-2 border border-gray-200 border-dashed hover:border-blue-400 flex flex-col items-center justify-center gap-1.5"
                    title="Configure Dashboard Widgets"
                  >
                    <LayoutGrid className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 text-center">Configure Widgets</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Attendance Trends - Monthly/Daily Switchable */}
          {widgetVisibility.monthlyAttendance && (
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {attendanceView === 'monthly' ? 'Monthly Attendance Trends' : `Daily Attendance Trends - ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                </h3>
                <div className="flex items-center gap-3">
                  {/* Month Filter */}
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value)
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Select month"
                  />
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setAttendanceView('monthly')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        attendanceView === 'monthly'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setAttendanceView('daily')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        attendanceView === 'daily'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Daily
                    </button>
                  </div>
                </div>
              </div>
              {attendanceView === 'monthly' && executiveData?.monthlyAttendanceTrends ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={executiveData.monthlyAttendanceTrends}
                    barCategoryGap="10%"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" name="Present" barSize={50} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : attendanceView === 'daily' && executiveData?.dailyAttendanceTrends ? (
                <div className="relative">
                  {/* Scrollable Chart Container */}
                  <div 
                    ref={dailyChartRef}
                    className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100" 
                    style={{ maxHeight: '320px', scrollBehavior: 'smooth' }}
                  >
                    <div style={{ minWidth: `${executiveData.dailyAttendanceTrends.length * 50}px` }}>
                      <ResponsiveContainer width="100%" height={280} minWidth={executiveData.dailyAttendanceTrends.length * 50}>
                        <BarChart 
                          data={executiveData.dailyAttendanceTrends}
                          barCategoryGap="10%"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                            tick={{ fontSize: 9 }}
                            tickFormatter={(value, index) => {
                              const data = executiveData.dailyAttendanceTrends[index]
                              if (data?.isToday) {
                                return value + ' (Today)'
                              }
                              return value
                            }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="present" 
                            name="Present"
                            fill="#10b981"
                            barSize={50}
                          />
                          <Bar 
                            dataKey="absent" 
                            name="Absent"
                            fill="#ef4444"
                            barSize={50}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Scroll Indicator */}
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    <span className="flex items-center justify-center gap-1">
                      Use arrows or scroll to view all 31 days
                    </span>
                  </div>
                </div>
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ height: '280px' }}>
                    <p className="text-gray-500">Loading attendance data...</p>
                  </div>
                )}
            </div>
          )}

          {/* Leave Patterns */}
          {widgetVisibility.leavePatterns && executiveData?.leavePatterns && (
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Leave Patterns</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={executiveData.leavePatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="approvedLeaves" stackId="1" stroke="#10b981" fill="#10b981" name="Approved" />
                  <Area type="monotone" dataKey="pendingLeaves" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Pending" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Payroll Variance */}
          {widgetVisibility.payrollVariance && executiveData?.payrollVariance && (
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Payroll Variance</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={executiveData.payrollVariance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="amount" fill="#8b5cf6" name="Payroll Amount ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="variance" stroke="#ef4444" strokeWidth={2} name="Variance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Department & Location Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Analytics */}
            {widgetVisibility.departmentAnalytics && executiveData?.departmentAnalytics && (
              <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Department Analytics
                  </h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(executiveData.departmentAnalytics).map(([dept, data]) => (
                    <div key={dept} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">{dept}</span>
                        <span className="text-sm text-gray-600">{data.headcount} employees</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Attendance:</span>
                          <span className="ml-2 font-semibold text-green-600">{data.attendanceRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Payroll:</span>
                          <span className="ml-2 font-semibold text-purple-600">${(data.payrollCost || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Analytics */}
            {widgetVisibility.locationAnalytics && executiveData?.locationAnalytics && (
              <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Analytics
                  </h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(executiveData.locationAnalytics).map(([location, data]) => (
                    <div key={location} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">{location}</span>
                        <span className="text-sm text-gray-600">{data.headcount} employees</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Attendance:</span>
                          <span className="ml-2 font-semibold text-green-600">{data.attendanceRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Payroll:</span>
                          <span className="ml-2 font-semibold text-purple-600">${(data.payrollCost || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regular Dashboard Stats Grid (for non-executive or when executive view is not active) */}
      {!isExecutiveView && (
        <>
          {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 border-2 border-gray-200 hover:border-blue-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="bg-blue-600 p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl shadow-md">
                  <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp size={12} className="sm:w-4 sm:h-4" /> : <ArrowDown size={12} className="sm:w-4 sm:h-4" />}
                  <span className="hidden sm:inline">{stat.change}</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* Check In/Out Buttons - Only for employees */}
      {(canCheckIn || canCheckOut) && (
        <div className="flex flex-wrap justify-start gap-3">
          {canCheckIn && (
            <button
              onClick={handleCheckIn}
              disabled={checkInLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-green-500 hover:border-green-600"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              {checkInLoading ? 'Checking In...' : 'Check In'}
            </button>
          )}
          {canCheckOut && (
            <button
              onClick={handleCheckOut}
              disabled={checkOutLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-blue-500 hover:border-blue-600"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              {checkOutLoading ? 'Checking Out...' : 'Check Out'}
            </button>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Attendance Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 border-2 border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-2 sm:mb-3">
            {isEmployee ? 'My Weekly Attendance' : 'Weekly Attendance'}
          </h3>
          {loadingWeeklyAttendance && !isEmployee ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600">Loading attendance data...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Distribution - Only show for admin */}
        {!isEmployee && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-blue-600 mb-3">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Employee Info Card - Only show for employee */}
        {isEmployee && dashboardStats && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-blue-600 mb-3">My Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="text-lg font-semibold text-gray-800">{dashboardStats.department || 'N/A'}</p>
              </div>
              {employeeShift && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-blue-600" size={14} />
                    <p className="text-sm font-semibold text-blue-800">My Shift</p>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-1">{employeeShift.name}</p>
                  <p className="text-sm text-gray-600">
                    {employeeShift.startTime ? employeeShift.startTime.substring(0, 5) : ''} - {employeeShift.endTime ? employeeShift.endTime.substring(0, 5) : ''}
                  </p>
                  {employeeShift.workingHours && (
                    <p className="text-xs text-gray-500 mt-1">
                      Working Hours: {employeeShift.workingHours.toFixed(2)} hrs
                      {employeeShift.breakDuration && ` | Break: ${employeeShift.breakDuration} min`}
                    </p>
                  )}
                  {employeeShift.description && (
                    <p className="text-xs text-gray-600 mt-2">{employeeShift.description}</p>
                  )}
                </div>
              )}
              {!employeeShift && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={14} />
                    <p className="text-sm text-gray-600">No shift assigned</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Attendance Rate (Last 30 Days)</p>
                <p className="text-lg font-semibold text-gray-800">{dashboardStats.attendanceRate?.toFixed(1) || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Payroll</p>
                <p className="text-lg font-semibold text-gray-800">
                  ${dashboardStats.monthlyPayroll?.toLocaleString() || '0.00'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HR Tickets Section - Only for Finance Users */}
      {isFinance && (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              HR Tickets
            </h3>
            <button
              onClick={() => navigate('/tickets')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All
              <Eye className="w-4 h-4" />
            </button>
          </div>
          {loadingTickets ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600">Loading tickets...</p>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500">No pending tickets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                if (!ticket || !ticket.id) return null
                const priorityColors = {
                  'URGENT': 'bg-red-100 text-red-800 border-red-200',
                  'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
                  'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  'LOW': 'bg-blue-100 text-blue-800 border-blue-200'
                }
                const statusColors = {
                  'OPEN': 'bg-blue-100 text-blue-800 border-blue-200',
                  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  'PENDING': 'bg-gray-100 text-gray-800 border-gray-200',
                  'RESOLVED': 'bg-green-100 text-green-800 border-green-200',
                  'CLOSED': 'bg-gray-100 text-gray-800 border-gray-200'
                }
                const ticketTypeLabels = {
                  'SALARY_ISSUE': 'Salary Issue',
                  'LEAVE_CORRECTION': 'Leave Correction',
                  'ATTENDANCE_CORRECTION': 'Attendance Correction',
                  'SYSTEM_ACCESS': 'System Access',
                  'HARDWARE_REQUEST': 'Hardware Request'
                }
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate('/tickets')}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{ticket.subject || 'No Subject'}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            {ticket.priority || 'MEDIUM'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            {ticket.status || 'OPEN'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {ticket.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <AlertCircle size={12} />
                            {ticketTypeLabels[ticket.ticketType] || ticket.ticketType || 'Unknown'}
                          </span>
                          {ticket.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions - Moved to Bottom */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-blue-600 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isAdmin ? (
            <>
              <button
                onClick={() => navigate('/employees')}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <UserPlus className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Add Employee</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <CheckCircle className="w-5 h-5 text-green-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Mark Attendance</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <Calendar className="w-5 h-5 text-yellow-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Approve Leaves</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Process Payroll</span>
              </button>
              <button
                onClick={() => navigate('/shifts')}
                className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-400 group"
              >
                <Clock className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Manage Shifts</span>
              </button>
              <button
                onClick={() => navigate('/recruitment')}
                className="flex flex-col items-center justify-center p-3 bg-pink-50 hover:bg-pink-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-200 hover:border-pink-400 group"
              >
                <FileText className="w-5 h-5 text-pink-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Recruitment</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <CheckCircle className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Check In/Out</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <PlusCircle className="w-5 h-5 text-green-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Apply Leave</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Payroll</span>
              </button>
              <button
                onClick={() => navigate('/performance')}
                className="flex flex-col items-center justify-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <TrendingUp className="w-5 h-5 text-yellow-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Performance</span>
              </button>
              <button
                onClick={() => navigate('/hrtickets')}
                className="flex flex-col items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-200 hover:border-orange-400 group"
              >
                <FileText className="w-5 h-5 text-orange-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Tickets</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-gray-400 group"
              >
                <Settings className="w-5 h-5 text-gray-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Settings</span>
              </button>
            </>
          )}
        </div>
      </div>
        </>
      )}

    </div>
  )
}

export default Dashboard

