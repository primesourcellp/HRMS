import { useHRMS } from '../context/HRMSContext'
import { Users, Clock, Calendar, DollarSign, TrendingUp, ArrowUp, ArrowDown, UserPlus, CheckCircle, FileText, PlusCircle, Eye, Settings, LogIn, LogOut, X, Building2, MapPin, EyeOff, LayoutGrid, Eye as EyeIcon, Ticket, AlertCircle, RefreshCw, UserCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { format } from 'date-fns'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useRolePermissions } from '../hooks/useRolePermissions'

const Dashboard = () => {
  const { employees, attendance, leaves } = useHRMS()
  const [dashboardStats, setDashboardStats] = useState(null)
  const [executiveData, setExecutiveData] = useState(null)
  const [loadingExecutive, setLoadingExecutive] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  const [employeeShift, setEmployeeShift] = useState(null)
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([])
  const [dailyAttendanceData, setDailyAttendanceData] = useState([])
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState([])
  const [loadingWeeklyAttendance, setLoadingWeeklyAttendance] = useState(false)
  const [loadingDailyAttendance, setLoadingDailyAttendance] = useState(false)
  const [loadingMonthlyAttendance, setLoadingMonthlyAttendance] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState(null)
  const [checkInError, setCheckInError] = useState(null)
  const [checkOutLoading, setCheckOutLoading] = useState(false)
  const [checkOutMessage, setCheckOutMessage] = useState(null)
  const [checkOutError, setCheckOutError] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [teamAttendanceData, setTeamAttendanceData] = useState([])
  const [loadingTeamAttendance, setLoadingTeamAttendance] = useState(false)
  const [teamMonthlyAttendanceData, setTeamMonthlyAttendanceData] = useState([])
  const [teamDailyAttendanceData, setTeamDailyAttendanceData] = useState([])
  const [loadingTeamMonthlyAttendance, setLoadingTeamMonthlyAttendance] = useState(false)
  const [loadingTeamDailyAttendance, setLoadingTeamDailyAttendance] = useState(false)
  const [teamAttendanceView, setTeamAttendanceView] = useState('monthly') // 'monthly' or 'daily'
  const [myAttendanceData, setMyAttendanceData] = useState([])
  const [loadingMyAttendance, setLoadingMyAttendance] = useState(false)
  const [employeeLeaves, setEmployeeLeaves] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [loadingLeaveBalances, setLoadingLeaveBalances] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState([])
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
    // Load dashboard stats with empId for employees and finance users (to show their department)
    loadDashboardStats(empId && (isEmployee || userType === 'employee' || isFinance) ? empId : null)
    
    // Load executive dashboard for Super Admin/HR Admin
    if (isExecutiveView) {
      loadExecutiveDashboard()
    }
    
    // Load employee shift and today's attendance if user is an employee
    if (empId && (isEmployee || userType === 'employee')) {
      loadEmployeeShift(empId)
      loadTodayAttendance(empId)
      // Load monthly attendance for employee view (default)
      loadEmployeeMonthlyAttendance(empId)
      // Load employee leaves for pending/approved counts
      loadEmployeeLeaves(empId)
      // Load leave balances
      loadLeaveBalances(empId)
    }

    // Load manager-specific data
    if (isManager && empId) {
      loadEmployeeShift(empId)
      loadTodayAttendance(empId)
      loadMyAttendance(empId)
      loadTeamMembers(empId)
      // Load manager's own leaves and leave balances
      loadEmployeeLeaves(empId)
      loadLeaveBalances(empId)
      // Load monthly attendance for manager view (like employees)
      loadEmployeeMonthlyAttendance(empId)
    }

    // Load weekly attendance data for admin (overall attendance)
    if (!isEmployee && userType !== 'employee' && !isManager && !isFinance) {
      loadWeeklyAttendanceData()
    }

    // Load finance-specific data (like employees - personal attendance)
    if (isFinance && empId) {
      loadTickets()
      loadEmployeeShift(empId)
      loadTodayAttendance(empId)
      loadEmployeeLeaves(empId)
      loadEmployeeMonthlyAttendance(empId) // Load personal monthly attendance like employees
    }

    // Load HR Admin-specific data (personal attendance for check-in/out)
    if (isHRAdmin && empId) {
      loadEmployeeShift(empId)
      loadTodayAttendance(empId)
      loadEmployeeLeaves(empId)
      loadEmployeeMonthlyAttendance(empId) // Load personal monthly attendance like employees
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

  const loadEmployeeWeeklyAttendance = async (empId) => {
    try {
      setLoadingWeeklyAttendance(true)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekData = []

      // Fetch attendance for each day of the past week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        
        try {
          const attendanceRecords = await api.getAttendanceByDate(dateStr)
          const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
          
          // Find this employee's attendance
          const employeeAttendance = attendanceArray.find(a => {
            const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
            return attEmpId === empId
          })
          
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: employeeAttendance && (employeeAttendance.status === 'Present' || employeeAttendance.status === 'PRESENT') ? 1 : 0,
            absent: employeeAttendance && (employeeAttendance.status === 'Absent' || employeeAttendance.status === 'ABSENT') ? 1 : 0
          })
        } catch (error) {
          console.error(`Error fetching attendance for ${dateStr}:`, error)
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
      console.error('Error loading employee weekly attendance:', error)
      setWeeklyAttendanceData([])
    } finally {
      setLoadingWeeklyAttendance(false)
    }
  }

  const loadEmployeeDailyAttendance = async (empId, month = null) => {
    try {
      setLoadingDailyAttendance(true)
      const dailyData = []
      
      // If month is provided, use that month; otherwise use current month
      const selectedDate = month ? new Date(month + '-01') : new Date()
      const year = selectedDate.getFullYear()
      const monthNum = selectedDate.getMonth() + 1
      const daysInMonth = new Date(year, monthNum, 0).getDate()

      // Fetch attendance for each day of the selected month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthNum - 1, day)
        const dateStr = format(date, 'yyyy-MM-dd')
        
        try {
          const attendanceRecords = await api.getAttendanceByDate(dateStr)
          const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
          
          // Find this employee's attendance
          const employeeAttendance = attendanceArray.find(a => {
            const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
            return attEmpId === empId
          })
          
          const dayLabel = format(date, 'MMM dd')
          dailyData.push({
            name: dayLabel,
            present: employeeAttendance && (employeeAttendance.status === 'Present' || employeeAttendance.status === 'PRESENT') ? 1 : 0,
            absent: employeeAttendance && (employeeAttendance.status === 'Absent' || employeeAttendance.status === 'ABSENT') ? 1 : 0
          })
        } catch (error) {
          console.error(`Error fetching attendance for ${dateStr}:`, error)
          const dayLabel = format(date, 'MMM dd')
          dailyData.push({
            name: dayLabel,
            present: 0,
            absent: 0
          })
        }
      }
      
      setDailyAttendanceData(dailyData)
    } catch (error) {
      console.error('Error loading employee daily attendance:', error)
      setDailyAttendanceData([])
    } finally {
      setLoadingDailyAttendance(false)
    }
  }

  const loadEmployeeMonthlyAttendance = async (empId) => {
    try {
      setLoadingMonthlyAttendance(true)
      const today = new Date()
      const monthlyData = []

      // Fetch attendance for last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        
        try {
          let presentCount = 0
          let absentCount = 0
          const daysInMonth = new Date(year, month, 0).getDate()
          
          // Fetch attendance for each day of the month
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = format(new Date(year, month - 1, day), 'yyyy-MM-dd')
            try {
              const attendanceRecords = await api.getAttendanceByDate(dateStr)
              const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
              
              const employeeAttendance = attendanceArray.find(a => {
                const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
                return attEmpId === empId
              })
              
              if (employeeAttendance) {
                if (employeeAttendance.status === 'Present' || employeeAttendance.status === 'PRESENT') {
                  presentCount++
                } else if (employeeAttendance.status === 'Absent' || employeeAttendance.status === 'ABSENT') {
                  absentCount++
                }
              }
            } catch (error) {
              // Skip errors for individual days
            }
          }
          
          const monthLabel = `${year}-${String(month).padStart(2, '0')}`
          monthlyData.push({
            name: monthLabel,
            present: presentCount,
            absent: absentCount
          })
        } catch (error) {
          console.error(`Error fetching monthly attendance for ${year}-${month}:`, error)
          const monthLabel = `${year}-${String(month).padStart(2, '0')}`
          monthlyData.push({
            name: monthLabel,
            present: 0,
            absent: 0
          })
        }
      }
      
      setMonthlyAttendanceData(monthlyData)
    } catch (error) {
      console.error('Error loading employee monthly attendance:', error)
      setMonthlyAttendanceData([])
    } finally {
      setLoadingMonthlyAttendance(false)
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

  const loadTeamMembers = async (managerId) => {
    try {
      // Load teams where manager is a member (like TeamAttendance page does)
      const allTeams = await api.getTeams()
      
      // Filter teams where current user (manager) is a member
      const myTeams = allTeams.filter(team => {
        if (!team.members || !Array.isArray(team.members)) return false
        return team.members.some(member => {
          const memberId = typeof member.employeeId === 'string' ? parseInt(member.employeeId) : member.employeeId
          return memberId === managerId
        })
      })
      
      // Extract all team members from teams where manager is a member
      const allTeamMembers = []
      myTeams.forEach(team => {
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach(member => {
            // Only include EMPLOYEE role members (exclude MANAGER, HR_ADMIN, etc.)
            const memberRole = member.employeeRole || member.role
            if (memberRole === 'EMPLOYEE') {
              // Avoid duplicates
              const memberId = typeof member.employeeId === 'string' ? parseInt(member.employeeId) : member.employeeId
              if (!allTeamMembers.find(m => {
                const mId = typeof m.id === 'string' ? parseInt(m.id) : m.id
                return mId === memberId
              })) {
                allTeamMembers.push({
                  id: memberId,
                  name: member.employeeName || `Employee ${memberId}`,
                  email: member.employeeEmail || '-',
                  employeeId: member.employeeId
                })
              }
            }
          })
        }
      })
      
      setTeamMembers(allTeamMembers)
      // Load team attendance after team members are loaded
      if (allTeamMembers.length > 0) {
        loadTeamAttendance(managerId, allTeamMembers)
        loadTeamMonthlyAttendance(managerId, allTeamMembers)
      } else {
        // If no team members, set empty attendance data
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekData = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: 0,
            absent: 0
          })
        }
        setTeamAttendanceData(weekData)
        setTeamMonthlyAttendanceData([])
        setTeamDailyAttendanceData([])
      }
    } catch (error) {
      console.error('Error loading team members:', error)
      setTeamMembers([])
    }
  }

  const loadMyAttendance = async (empId) => {
    try {
      setLoadingMyAttendance(true)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekData = []

      // Fetch attendance for each day of the past week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        
        try {
          const attendanceRecords = await api.getAttendanceByDate(dateStr)
          const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
          
          // Find this employee's attendance
          const employeeAttendance = attendanceArray.find(a => {
            const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
            return attEmpId === empId
          })
          
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: employeeAttendance && (employeeAttendance.status === 'Present' || employeeAttendance.status === 'PRESENT') ? 1 : 0,
            absent: employeeAttendance && (employeeAttendance.status === 'Absent' || employeeAttendance.status === 'ABSENT') ? 1 : 0
          })
        } catch (error) {
          console.error(`Error fetching attendance for ${dateStr}:`, error)
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: 0,
            absent: 0
          })
        }
      }
      
      setMyAttendanceData(weekData)
    } catch (error) {
      console.error('Error loading my attendance:', error)
      setMyAttendanceData([])
    } finally {
      setLoadingMyAttendance(false)
    }
  }

  const loadEmployeeLeaves = async (empId) => {
    try {
      const leavesData = await api.getLeavesByEmployee(empId)
      const leavesArray = Array.isArray(leavesData) ? leavesData : []
      setEmployeeLeaves(leavesArray)
      console.log('Employee leaves loaded:', leavesArray.length, leavesArray)
    } catch (error) {
      console.error('Error loading employee leaves:', error)
      setEmployeeLeaves([])
    }
  }

  const loadLeaveBalances = async (empId) => {
    try {
      setLoadingLeaveBalances(true)
      const currentYear = new Date().getFullYear()
      const balancesData = await api.getLeaveBalances(empId, currentYear)
      const balancesArray = Array.isArray(balancesData) ? balancesData : []
      setLeaveBalances(balancesArray)
      
      // Load leave types to get codes
      try {
        const typesData = await api.getLeaveTypes()
        setLeaveTypes(Array.isArray(typesData) ? typesData : [])
      } catch (error) {
        console.error('Error loading leave types:', error)
      }
    } catch (error) {
      console.error('Error loading leave balances:', error)
      setLeaveBalances([])
    } finally {
      setLoadingLeaveBalances(false)
    }
  }


  const loadTeamAttendance = async (managerId, teamMembersList = null) => {
    try {
      setLoadingTeamAttendance(true)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekData = []

      // Use provided team members list or state
      const membersToUse = teamMembersList || teamMembers
      
      // Get team member IDs
      const teamMemberIds = membersToUse.map(emp => {
        const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
        return empId
      })

      if (teamMemberIds.length === 0) {
        // If no team members, return empty data
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: 0,
            absent: 0
          })
        }
        setTeamAttendanceData(weekData)
        setLoadingTeamAttendance(false)
        return
      }
      
      // Fetch attendance for each day of the past week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        
        try {
          const attendanceRecords = await api.getAttendanceByDate(dateStr)
          const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
          
          // Count present and absent for team members
          let present = 0
          let absent = 0
          
          teamMemberIds.forEach(teamMemberId => {
            const teamMemberAttendance = attendanceArray.find(a => {
              const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
              return attEmpId === teamMemberId
            })
            
            if (teamMemberAttendance) {
              if (teamMemberAttendance.status === 'Present' || teamMemberAttendance.status === 'PRESENT') {
                present++
              } else if (teamMemberAttendance.status === 'Absent' || teamMemberAttendance.status === 'ABSENT') {
                absent++
              }
            } else {
              // If no attendance record for past dates, count as absent
              const dateOnly = new Date(date)
              dateOnly.setHours(0, 0, 0, 0)
              const todayOnly = new Date(today)
              todayOnly.setHours(0, 0, 0, 0)
              if (dateOnly < todayOnly) {
                absent++
              }
            }
          })
          
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: present,
            absent: absent
          })
        } catch (error) {
          console.error(`Error fetching team attendance for ${dateStr}:`, error)
          const dayName = weekDays[date.getDay()]
          weekData.push({
            name: dayName,
            present: 0,
            absent: 0
          })
        }
      }
      
      setTeamAttendanceData(weekData)
    } catch (error) {
      console.error('Error loading team attendance:', error)
      setTeamAttendanceData([])
    } finally {
      setLoadingTeamAttendance(false)
    }
  }

  const loadTeamMonthlyAttendance = async (managerId, teamMembersList = null) => {
    try {
      setLoadingTeamMonthlyAttendance(true)
      const today = new Date()
      const monthlyData = []
      const membersToUse = teamMembersList || teamMembers
      const teamMemberIds = membersToUse.map(emp => {
        const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
        return empId
      })

      if (teamMemberIds.length === 0) {
        setTeamMonthlyAttendanceData([])
        setLoadingTeamMonthlyAttendance(false)
        return
      }

      // Fetch attendance for last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        
        try {
          let presentCount = 0
          let absentCount = 0
          const daysInMonth = new Date(year, month, 0).getDate()
          
          // Fetch attendance for each day of the month
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = format(new Date(year, month - 1, day), 'yyyy-MM-dd')
            try {
              const attendanceRecords = await api.getAttendanceByDate(dateStr)
              const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
              
              // Count present and absent for all team members
              teamMemberIds.forEach(teamMemberId => {
                const teamMemberAttendance = attendanceArray.find(a => {
                  const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
                  return attEmpId === teamMemberId
                })
                
                if (teamMemberAttendance) {
                  if (teamMemberAttendance.status === 'Present' || teamMemberAttendance.status === 'PRESENT') {
                    presentCount++
                  } else if (teamMemberAttendance.status === 'Absent' || teamMemberAttendance.status === 'ABSENT') {
                    absentCount++
                  }
                }
              })
            } catch (error) {
              // Skip errors for individual days
            }
          }
          
          const monthLabel = format(new Date(year, month - 1), 'MMM yyyy')
          monthlyData.push({
            name: monthLabel,
            present: presentCount,
            absent: absentCount
          })
        } catch (error) {
          console.error(`Error fetching team monthly attendance for ${year}-${month}:`, error)
          const monthLabel = format(new Date(year, month - 1), 'MMM yyyy')
          monthlyData.push({
            name: monthLabel,
            present: 0,
            absent: 0
          })
        }
      }
      
      setTeamMonthlyAttendanceData(monthlyData)
    } catch (error) {
      console.error('Error loading team monthly attendance:', error)
      setTeamMonthlyAttendanceData([])
    } finally {
      setLoadingTeamMonthlyAttendance(false)
    }
  }

  const loadTeamDailyAttendance = async (managerId, teamMembersList = null, month = null) => {
    try {
      setLoadingTeamDailyAttendance(true)
      const dailyData = []
      const membersToUse = teamMembersList || teamMembers
      const teamMemberIds = membersToUse.map(emp => {
        const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
        return empId
      })

      if (teamMemberIds.length === 0) {
        setTeamDailyAttendanceData([])
        setLoadingTeamDailyAttendance(false)
        return
      }

      // If month is provided, use that month; otherwise use current month
      const selectedDate = month ? new Date(month + '-01') : new Date()
      const year = selectedDate.getFullYear()
      const monthNum = selectedDate.getMonth() + 1
      const daysInMonth = new Date(year, monthNum, 0).getDate()

      // Fetch attendance for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = format(new Date(year, monthNum - 1, day), 'yyyy-MM-dd')
        
        try {
          const attendanceRecords = await api.getAttendanceByDate(dateStr)
          const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
          
          // Count present and absent for all team members
          let presentCount = 0
          let absentCount = 0
          
          teamMemberIds.forEach(teamMemberId => {
            const teamMemberAttendance = attendanceArray.find(a => {
              const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
              return attEmpId === teamMemberId
            })
            
            if (teamMemberAttendance) {
              if (teamMemberAttendance.status === 'Present' || teamMemberAttendance.status === 'PRESENT') {
                presentCount++
              } else if (teamMemberAttendance.status === 'Absent' || teamMemberAttendance.status === 'ABSENT') {
                absentCount++
              }
            }
          })
          
          dailyData.push({
            name: String(day),
            present: presentCount,
            absent: absentCount
          })
        } catch (error) {
          console.error(`Error fetching team daily attendance for ${dateStr}:`, error)
          dailyData.push({
            name: String(day),
            present: 0,
            absent: 0
          })
        }
      }
      
      setTeamDailyAttendanceData(dailyData)
    } catch (error) {
      console.error('Error loading team daily attendance:', error)
      setTeamDailyAttendanceData([])
    } finally {
      setLoadingTeamDailyAttendance(false)
    }
  }

  // Filter data based on employee or admin view
  // Ensure arrays exist before filtering
  const safeAttendance = Array.isArray(attendance) ? attendance : []
  // For employees, use employeeLeaves if loaded, otherwise fall back to filtered context leaves
  const safeLeaves = isEmployee && employeeId && employeeLeaves.length > 0
    ? employeeLeaves
    : Array.isArray(leaves) ? leaves : []
  const safeEmployees = Array.isArray(employees) ? employees : []
  
  const filteredAttendance = isEmployee && employeeId 
    ? safeAttendance.filter(a => a.employeeId === employeeId)
    : safeAttendance
  
  const filteredLeaves = isEmployee && employeeId
    ? safeLeaves.filter(l => {
        const leaveEmpId = typeof l.employeeId === 'string' ? parseInt(l.employeeId) : l.employeeId
        return leaveEmpId === employeeId || parseInt(leaveEmpId) === employeeId
      })
    : safeLeaves

  // Get manager stats - Enhanced with better metrics
  const managerStats = isManager ? [
    {
      title: 'My Status Today',
      value: dashboardStats?.presentToday > 0 ? 'Present' : 'Absent',
      change: dashboardStats?.presentToday > 0 ? 'Present' : 'Absent',
      trend: dashboardStats?.presentToday > 0 ? 'up' : 'down',
      icon: Clock,
      color: dashboardStats?.presentToday > 0 ? 'bg-green-500' : 'bg-red-500',
      gradient: dashboardStats?.presentToday > 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
    },
    {
      title: 'Team Members',
      value: teamMembers.length,
      change: 'Active',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Pending Leaves',
      value: dashboardStats?.pendingLeaves || filteredLeaves.filter(l => {
        const status = (l.status || '').toUpperCase()
        return status === 'PENDING'
      }).length,
      change: 'Requires Action',
      trend: 'down',
      icon: Calendar,
      color: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-amber-600'
    },
    {
      title: 'Team Present Today',
      value: (() => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const teamMemberIds = teamMembers.map(m => typeof m.id === 'string' ? parseInt(m.id) : m.id)
        const todayAttendance = safeAttendance.filter(a => {
          const attDate = a.date || (a.attendanceDate || '')
          const matchesDate = attDate === today || attDate.startsWith(today)
          if (!matchesDate) return false
          const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
          return teamMemberIds.includes(attEmpId) && (a.status === 'Present' || a.status === 'PRESENT')
        })
        return todayAttendance.length
      })(),
      change: `of ${teamMembers.length}`,
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-600'
    }
  ] : []

  // Finance-specific stats - Enhanced with better metrics
  const financeStats = isFinance ? [
    {
      title: 'My Status Today',
      value: dashboardStats?.presentToday > 0 ? 'Present' : 'Absent',
      change: dashboardStats?.presentToday > 0 ? 'Present' : 'Absent',
      trend: dashboardStats?.presentToday > 0 ? 'up' : 'down',
      icon: Clock,
      color: dashboardStats?.presentToday > 0 ? 'bg-green-500' : 'bg-red-500',
      gradient: dashboardStats?.presentToday > 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
    },
    {
      title: 'HR Tickets',
      value: tickets.length,
      change: tickets.length > 0 ? 'Active' : 'None',
      trend: 'neutral',
      icon: Ticket,
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-600'
    }
  ] : []

  // HR Admin stats (only personal attendance with check-in/out)
  const hrAdminStats = isHRAdmin ? [
    {
      title: 'My Status Today',
      value: (todayAttendance?.checkIn || dashboardStats?.presentToday > 0) ? 'Present' : 'Absent',
      change: (todayAttendance?.checkIn || dashboardStats?.presentToday > 0) ? 'Present' : 'Absent',
      trend: (todayAttendance?.checkIn || dashboardStats?.presentToday > 0) ? 'up' : 'down',
      icon: Clock,
      color: (todayAttendance?.checkIn || dashboardStats?.presentToday > 0) ? 'bg-green-500' : 'bg-red-500'
    }
  ] : []

  const stats = isFinance ? financeStats : isManager ? managerStats : isHRAdmin ? hrAdminStats : isEmployee ? [
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
      value: dashboardStats?.pendingLeaves !== undefined 
        ? dashboardStats.pendingLeaves 
        : filteredLeaves.filter(l => {
            const status = (l.status || '').toUpperCase()
            return status === 'PENDING'
          }).length,
      change: '', // Dynamic data - no hardcoded change
      trend: 'neutral',
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    {
      title: 'My Approved Leaves',
      value: dashboardStats?.approvedLeaves !== undefined
        ? dashboardStats.approvedLeaves
        : filteredLeaves.filter(l => {
            const status = (l.status || '').toUpperCase()
            return status === 'APPROVED'
          }).length,
      change: '', // Dynamic data - no hardcoded change
      trend: 'neutral',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Total Leaves Taken',
      value: (() => {
        // Calculate total days from approved leaves
        const approvedLeaves = filteredLeaves.filter(l => {
          const status = (l.status || '').toUpperCase()
          return status === 'APPROVED'
        })
        if (approvedLeaves.length === 0) return 0
        
        // Calculate total days from leave dates
        let totalDays = 0
        approvedLeaves.forEach(leave => {
          if (leave.startDate && leave.endDate) {
            try {
              const start = new Date(leave.startDate)
              const end = new Date(leave.endDate)
              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
              totalDays += days > 0 ? days : 1
            } catch (e) {
              totalDays += 1 // Fallback to 1 day if date parsing fails
            }
          } else {
            totalDays += 1 // If no dates, count as 1 day
          }
        })
        return totalDays
      })(),
      subtitle: 'All Time',
      icon: FileText,
      color: 'bg-blue-500',
      trend: 'neutral'
    },
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
    // For employee and finance, use personal weekly attendance data (like employee pages)
    if (isEmployee || isFinance) {
      if (weeklyAttendanceData.length > 0) {
        return weeklyAttendanceData
      }
      // Fallback to dashboard stats if available
      if (dashboardStats?.weekAttendance) {
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
      }
      // Return empty data while loading
      return [
        { name: 'Sun', present: 0, absent: 0 },
        { name: 'Mon', present: 0, absent: 0 },
        { name: 'Tue', present: 0, absent: 0 },
        { name: 'Wed', present: 0, absent: 0 },
        { name: 'Thu', present: 0, absent: 0 },
        { name: 'Fri', present: 0, absent: 0 },
        { name: 'Sat', present: 0, absent: 0 }
      ]
    } else {
      // For admin, use overall weekly attendance data (all employees)
      if (weeklyAttendanceData.length > 0) {
        return weeklyAttendanceData
      }
      // Return empty data while loading
      return [
        { name: 'Sun', present: 0, absent: 0 },
        { name: 'Mon', present: 0, absent: 0 },
        { name: 'Tue', present: 0, absent: 0 },
        { name: 'Wed', present: 0, absent: 0 },
        { name: 'Thu', present: 0, absent: 0 },
        { name: 'Fri', present: 0, absent: 0 },
        { name: 'Sat', present: 0, absent: 0 }
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

  // Check if employee, manager, finance, or HR Admin can check in
  const canCheckIn = (isEmployee || isManager || isFinance || isHRAdmin) && employeeId && (!todayAttendance || !todayAttendance.checkIn)
  
  // Check if employee, manager, finance, or HR Admin can check out
  const canCheckOut = (isEmployee || isManager || isFinance || isHRAdmin) && employeeId && todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut

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
      title: 'Present Today',
      value: executiveData.presentToday || dashboardStats?.presentToday || 0,
      subtitle: 'Employees Present',
      icon: UserCheck,
      color: 'bg-emerald-500',
      trend: 'up'
    },
  ] : []

  // Get user name for welcome message
  const userName = localStorage.getItem('userName') || 'User'
  const currentDate = format(new Date(), 'EEEE, MMMM dd, yyyy')
  const currentTime = format(new Date(), 'h:mm a')
  
  // Get role display name
  const getRoleDisplayName = () => {
    if (isAdmin || isHRAdmin) return 'Administrator'
    if (isManager) return 'Manager'
    if (isFinance) return 'Finance'
    if (isEmployee) return 'Employee'
    return 'User'
  }

  return (
    <div className="space-y-3 sm:space-y-4 bg-[#f5f7fa] p-2 sm:p-3 md:p-4 max-w-full overflow-x-hidden">
      {/* Professional Header Section - Light Colors */}
      {(isEmployee || isManager || isFinance) && (
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-white px-4 py-6 sm:px-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                    Welcome back, {userName.split(' ')[0]}! 
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-gray-600">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">{currentDate}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">{currentTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {isEmployee && dashboardStats && (
                    <div className="bg-gray-50 rounded-xl px-5 py-4 shadow-md border-2 border-gray-200">
                      <p className="text-gray-600 text-sm font-semibold mb-1.5">Today's Status</p>
                      <p className={`text-xl font-bold ${
                        dashboardStats.presentToday > 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {dashboardStats.presentToday > 0 ? 'Present ✓' : 'Not Checked In'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                          <p className="text-xs text-gray-500">Headcount, Attrition Rate, Attendance %</p>
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

                    {/* Department Analytics Widget */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Department Analytics</h3>
                          <p className="text-xs text-gray-500">Department-wise headcount and attendance</p>
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
                          <p className="text-xs text-gray-500">Location-wise headcount and attendance</p>
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

          {/* Fallback: Show Configure Widgets button when all widgets are hidden */}
          {!widgetVisibility.kpis && !widgetVisibility.monthlyAttendance && !widgetVisibility.leavePatterns && 
           !widgetVisibility.departmentAnalytics && !widgetVisibility.locationAnalytics && (
            <div className="bg-white rounded-lg shadow-md p-8 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[300px]">
              <LayoutGrid className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">All Widgets are Hidden</h3>
              <p className="text-gray-600 mb-6 text-center">Configure your dashboard to show widgets</p>
              <button
                onClick={() => setShowWidgetConfig(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <LayoutGrid className="w-5 h-5" />
                Configure Dashboard Widgets
              </button>
            </div>
          )}

          {/* Executive KPIs - Compact Size */}
          {widgetVisibility.kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {loadingExecutive ? (
                <div className="col-span-5 text-center py-3 text-xs">Loading executive data...</div>
              ) : (
                <>
                  {/* HR Admin, Manager, Finance Check-in/out button - Inline with Headcount */}
                  {(isHRAdmin || isManager || isFinance) && stats.length > 0 && stats.map((stat, statIndex) => {
                    const Icon = stat.icon
                    const isPresentStatus = stat.title === 'My Status Today'
                    
                    return (
                      <div 
                        key={`hr-admin-stat-${statIndex}`}
                        className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-2 border ${
                          isPresentStatus 
                            ? (stat.value === 'Present' ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' : 'border-red-300 bg-gradient-to-br from-red-50 to-white')
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`p-1 rounded-lg shadow-sm ${
                            isPresentStatus 
                              ? (stat.value === 'Present' ? 'bg-green-500' : 'bg-red-500')
                              : stat.color
                          }`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          {isPresentStatus && stat.value === 'Present' && (
                            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <ArrowUp size={12} />
                              <span>Present</span>
                            </div>
                          )}
                        </div>
                        <h3 className={`text-base font-bold mb-0.5 ${
                          isPresentStatus 
                            ? (stat.value === 'Present' ? 'text-green-700' : 'text-red-700')
                            : 'text-gray-800'
                        }`}>
                          {stat.value}
                        </h3>
                        <p className="text-xs font-semibold text-gray-700 mb-1">{stat.title}</p>
                        
                        {/* Check Out Button - Only for Present Status card */}
                        {isPresentStatus && canCheckOut && (
                          <button
                            onClick={handleCheckOut}
                            disabled={checkOutLoading}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm hover:shadow-md mt-2"
                          >
                            <LogOut className="w-3 h-3" />
                            {checkOutLoading ? 'Checking Out...' : '→ Check Out'}
                          </button>
                        )}
                        
                        {/* Check In Button - Only for Absent Status card */}
                        {isPresentStatus && canCheckIn && (
                          <button
                            onClick={handleCheckIn}
                            disabled={checkInLoading}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm hover:shadow-md mt-2"
                          >
                            <LogIn className="w-3 h-3" />
                            {checkInLoading ? 'Checking In...' : '→ Please login for a day'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  
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
                  {/* Configure Widgets Button */}
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
                      <div className="text-sm">
                        <div>
                          <span className="text-gray-500">Attendance:</span>
                          <span className="ml-2 font-semibold text-green-600">{data.attendanceRate}%</span>
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
                      <div className="text-sm">
                        <div>
                          <span className="text-gray-500">Attendance:</span>
                          <span className="ml-2 font-semibold text-green-600">{data.attendanceRate}%</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              const isPresentStatus = (isEmployee || isManager || isHRAdmin || isFinance) && stat.title === 'My Status Today'
              const hasGradient = stat.gradient && (isManager || isFinance)
              
              return (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-5 border-2 ${
                    isPresentStatus 
                      ? (stat.value === 'Present' ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' : 'border-red-300 bg-gradient-to-br from-red-50 to-white')
                      : hasGradient
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-200'
                  } group hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-2 sm:p-2.5 rounded-xl shadow-md ${
                      isPresentStatus 
                        ? (stat.value === 'Present' ? 'bg-green-500' : 'bg-red-500')
                        : hasGradient
                        ? stat.color
                        : stat.color
                    }`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    {!isPresentStatus && stat.change && stat.change.trim() !== '' && (
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        stat.trend === 'up' ? 'bg-green-100 text-green-600' : stat.trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.trend === 'up' ? <ArrowUp size={12} /> : stat.trend === 'down' ? <ArrowDown size={12} /> : null}
                        <span>{stat.change}</span>
                      </div>
                    )}
                    {isPresentStatus && stat.value === 'Present' && (
                      <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-600">
                        <ArrowUp size={12} />
                        <span>Present</span>
                      </div>
                    )}
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${
                    isPresentStatus 
                      ? (stat.value === 'Present' ? 'text-green-600' : 'text-red-600')
                      : 'text-gray-700'
                  }`}>
                    {stat.value}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold mb-0.5 text-gray-600">
                    {stat.title}
                  </p>
                  
                  {/* Check Out Button - Only for Present Status card */}
                  {isPresentStatus && canCheckOut && (
                    <button
                      onClick={handleCheckOut}
                      disabled={checkOutLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm hover:shadow-md mt-2"
                    >
                      <LogOut className="w-3 h-3" />
                      {checkOutLoading ? 'Checking Out...' : '→ Check Out'}
                    </button>
                  )}
                  
                  {/* Check In Button - Only for Absent Status card */}
                  {isPresentStatus && canCheckIn && (
                    <button
                      onClick={handleCheckIn}
                      disabled={checkInLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm hover:shadow-md mt-2"
                    >
                      <LogIn className="w-3 h-3" />
                      {checkInLoading ? 'Checking In...' : '→ Please login for a day'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Finance-Specific Sections */}

          {/* Manager-Specific Sections */}
          {isManager && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Team Overview Card */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Team Overview
                  </h3>
                  <button
                    onClick={() => navigate('/team-attendance')}
                    className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 hover:underline"
                  >
                    View Details
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-indigo-300 mx-auto mb-3" />
                    <p className="text-indigo-600 font-medium">No team members assigned</p>
                    <p className="text-sm text-indigo-500 mt-1">Contact HR to assign team members</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const today = format(new Date(), 'yyyy-MM-dd')
                      const teamMemberIds = teamMembers.map(m => typeof m.id === 'string' ? parseInt(m.id) : m.id)
                      let presentCount = 0
                      let absentCount = 0
                      
                      teamMembers.forEach(member => {
                        const memberId = typeof member.id === 'string' ? parseInt(member.id) : member.id
                        const todayAtt = safeAttendance.find(a => {
                          const attDate = a.date || (a.attendanceDate || '')
                          const matchesDate = attDate === today || attDate.startsWith(today)
                          if (!matchesDate) return false
                          const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
                          return attEmpId === memberId
                        })
                        const isPresent = todayAtt && (todayAtt.status === 'Present' || todayAtt.status === 'PRESENT')
                        if (isPresent) {
                          presentCount++
                        } else {
                          absentCount++
                        }
                      })
                      
                      return (
                        <>
                          {/* Present/Absent Count Summary */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-4 text-center border border-emerald-200 shadow-sm">
                              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                              <p className="text-xs font-semibold text-emerald-500 mt-1">Present</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center border border-red-200 shadow-sm">
                              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                              <p className="text-xs font-semibold text-red-500 mt-1">Absent</p>
                            </div>
                          </div>
                          
                          {/* Team Member Status List */}
                          <div className="bg-white rounded-xl p-4 border border-indigo-200">
                            <p className="text-sm font-semibold text-indigo-600 mb-2">Team Member Status</p>
                            <div className="space-y-2">
                              {teamMembers.slice(0, 5).map((member) => {
                                const memberId = typeof member.id === 'string' ? parseInt(member.id) : member.id
                                const todayAtt = safeAttendance.find(a => {
                                  const attDate = a.date || (a.attendanceDate || '')
                                  const matchesDate = attDate === today || attDate.startsWith(today)
                                  if (!matchesDate) return false
                                  const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
                                  return attEmpId === memberId
                                })
                                const isPresent = todayAtt && (todayAtt.status === 'Present' || todayAtt.status === 'PRESENT')
                                return (
                                  <div key={member.id} className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-600 truncate flex-1">{member.name || `Employee ${member.id}`}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {isPresent ? 'Present' : 'Absent'}
                                    </span>
                                  </div>
                                )
                              })}
                              {teamMembers.length > 5 && (
                                <p className="text-xs text-indigo-500 font-medium text-center pt-1">
                                  +{teamMembers.length - 5} more members
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Pending Leave Approvals Card */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Pending Leave Approvals
                  </h3>
                  <button
                    onClick={() => navigate('/leave')}
                    className="text-sm text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1 hover:underline"
                  >
                    View All
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                {(() => {
                  // Get team member IDs
                  const teamMemberIds = teamMembers.map(m => {
                    const memberId = typeof m.id === 'string' ? parseInt(m.id) : m.id
                    return memberId
                  })
                  
                  // Filter leaves to only show team members' pending leaves
                  const pendingLeaves = safeLeaves.filter(l => {
                    const status = (l.status || '').toUpperCase()
                    if (status !== 'PENDING') return false
                    
                    // Check if the leave belongs to a team member
                    const leaveEmpId = typeof l.employeeId === 'string' ? parseInt(l.employeeId) : l.employeeId
                    return teamMemberIds.includes(leaveEmpId) || teamMemberIds.includes(parseInt(leaveEmpId))
                  }).slice(0, 5)
                  
                  if (pendingLeaves.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-amber-300 mx-auto mb-3" />
                        <p className="text-amber-600 font-medium">No pending leave requests</p>
                        <p className="text-sm text-amber-500 mt-1">All caught up!</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pendingLeaves.map((leave) => {
                        const employee = safeEmployees.find(emp => {
                          const empId = emp.id || emp.employeeId
                          const leaveEmpId = leave.employeeId
                          return empId === leaveEmpId || parseInt(empId) === leaveEmpId || parseInt(empId) === parseInt(leaveEmpId)
                        })
                        const employeeName = employee ? (employee.name || 'N/A') : 'N/A'
                        const startDate = leave.startDate ? format(new Date(leave.startDate), 'MMM dd') : 'N/A'
                        const endDate = leave.endDate ? format(new Date(leave.endDate), 'MMM dd, yyyy') : 'N/A'
                        const days = leave.days || (leave.startDate && leave.endDate ? 
                          Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 1)
                        
                        return (
                          <div
                            key={leave.id}
                            onClick={() => navigate('/leave')}
                            className="bg-white rounded-xl p-4 border border-amber-200 hover:border-amber-300 cursor-pointer transition-all hover:shadow-md"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-bold text-gray-700 text-sm">{employeeName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{leave.type || 'Leave'}</p>
                              </div>
                              <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-semibold">
                                {days} {days === 1 ? 'day' : 'days'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{startDate} - {endDate}</span>
                            </div>
                            {leave.reason && (
                              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{leave.reason}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

      {/* Monthly Attendance Trends Chart - Employee/Finance */}
      {(isEmployee || isFinance) && (
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {attendanceView === 'monthly' ? 'Monthly Attendance Trends' : `Daily Attendance Trends - ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            </h3>
            <div className="flex items-center gap-3">
              {/* Month Filter */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  if (employeeId && (isEmployee || isFinance)) {
                    if (attendanceView === 'daily') {
                      loadEmployeeDailyAttendance(employeeId, e.target.value)
                    } else {
                      loadEmployeeMonthlyAttendance(employeeId)
                    }
                  }
                }}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Select month"
              />
              {/* Toggle Switch */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setAttendanceView('monthly')
                    if (employeeId && (isEmployee || isFinance)) {
                      loadEmployeeMonthlyAttendance(employeeId)
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    attendanceView === 'monthly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => {
                    setAttendanceView('daily')
                    if (employeeId && (isEmployee || isFinance)) {
                      loadEmployeeDailyAttendance(employeeId, selectedMonth)
                    }
                  }}
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
          {attendanceView === 'monthly' ? (
            loadingMonthlyAttendance ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              </div>
            ) : monthlyAttendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 text-sm">No attendance data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyAttendanceData} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    domain={[0, 'auto']}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="square"
                  />
                  <Bar 
                    dataKey="present" 
                    fill="#10b981" 
                    name="Present" 
                    barSize={50}
                  />
                  <Bar 
                    dataKey="absent" 
                    fill="#ef4444" 
                    name="Absent" 
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            loadingDailyAttendance ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              </div>
            ) : dailyAttendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 text-sm">No attendance data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyAttendanceData} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 1]}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="square"
                  />
                  <Bar 
                    dataKey="present" 
                    fill="#10b981" 
                    name="Present" 
                    barSize={50}
                  />
                  <Bar 
                    dataKey="absent" 
                    fill="#ef4444" 
                    name="Absent" 
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )
          )}
        </div>
      )}

      {/* Charts Row - Weekly Attendance for Admin/HR Admin */}
      {!isManager && !isEmployee && !isFinance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Attendance</h3>
          {loadingWeeklyAttendance ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  domain={[0, 'auto']}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                <Bar 
                  dataKey="present" 
                  fill="#10b981" 
                  name="Present" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
                <Bar 
                  dataKey="absent" 
                  fill="#ef4444" 
                  name="Absent" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
          </div>
        )}

        {/* Manager-specific sections: My Attendance and Team Attendance */}
        {isManager && (
          <>
            {/* My Attendance Trends Chart - Manager */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {attendanceView === 'monthly' ? 'My Attendance Trends' : `My Daily Attendance - ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                </h3>
                <div className="flex items-center gap-3">
                  {/* Month Filter */}
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value)
                      if (employeeId && isManager) {
                        if (attendanceView === 'daily') {
                          loadEmployeeDailyAttendance(employeeId, e.target.value)
                        } else {
                          loadEmployeeMonthlyAttendance(employeeId)
                        }
                      }
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Select month"
                  />
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setAttendanceView('monthly')
                        if (employeeId && isManager) {
                          loadEmployeeMonthlyAttendance(employeeId)
                        }
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        attendanceView === 'monthly'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => {
                        setAttendanceView('daily')
                        if (employeeId && isManager) {
                          loadEmployeeDailyAttendance(employeeId, selectedMonth)
                        }
                      }}
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
              {attendanceView === 'monthly' ? (
                loadingMonthlyAttendance ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading...</p>
                    </div>
                  </div>
                ) : monthlyAttendanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500 text-sm">No attendance data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyAttendanceData} barCategoryGap="10%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        domain={[0, 'auto']}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="present" 
                        fill="#10b981" 
                        name="Present" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar 
                        dataKey="absent" 
                        fill="#ef4444" 
                        name="Absent" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )
              ) : (
                loadingDailyAttendance ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading...</p>
                    </div>
                  </div>
                ) : dailyAttendanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500 text-sm">No attendance data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyAttendanceData} barCategoryGap="10%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        domain={[0, 'auto']}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="present" 
                        fill="#10b981" 
                        name="Present" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar 
                        dataKey="absent" 
                        fill="#ef4444" 
                        name="Absent" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </div>

            {/* Team Attendance Trends Chart - Manager */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {teamAttendanceView === 'monthly' ? 'Team Attendance Trends' : `Team Daily Attendance - ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                </h3>
                <div className="flex items-center gap-3">
                  {/* Month Filter */}
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value)
                      if (employeeId && isManager && teamMembers.length > 0) {
                        if (teamAttendanceView === 'daily') {
                          loadTeamDailyAttendance(employeeId, teamMembers, e.target.value)
                        } else {
                          loadTeamMonthlyAttendance(employeeId, teamMembers)
                        }
                      }
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Select month"
                  />
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setTeamAttendanceView('monthly')
                        if (employeeId && isManager && teamMembers.length > 0) {
                          loadTeamMonthlyAttendance(employeeId, teamMembers)
                        }
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        teamAttendanceView === 'monthly'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => {
                        setTeamAttendanceView('daily')
                        if (employeeId && isManager && teamMembers.length > 0) {
                          loadTeamDailyAttendance(employeeId, teamMembers, selectedMonth)
                        }
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        teamAttendanceView === 'daily'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Daily
                    </button>
                  </div>
                </div>
              </div>
              {teamMembers.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No team members assigned</p>
                  </div>
                </div>
              ) : teamAttendanceView === 'monthly' ? (
                loadingTeamMonthlyAttendance ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading...</p>
                    </div>
                  </div>
                ) : teamMonthlyAttendanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500 text-sm">No attendance data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamMonthlyAttendanceData} barCategoryGap="10%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        domain={[0, 'auto']}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="present" 
                        fill="#10b981" 
                        name="Present" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar 
                        dataKey="absent" 
                        fill="#ef4444" 
                        name="Absent" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )
              ) : (
                loadingTeamDailyAttendance ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading...</p>
                    </div>
                  </div>
                ) : teamDailyAttendanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500 text-sm">No attendance data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamDailyAttendanceData} barCategoryGap="10%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        domain={[0, 'auto']}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="present" 
                        fill="#10b981" 
                        name="Present" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar 
                        dataKey="absent" 
                        fill="#ef4444" 
                        name="Absent" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
          </>
        )}

        {/* Department Distribution - Only show for admin (not finance) */}
        {!isEmployee && !isManager && !isFinance && (
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

        {/* Recent Leaves and My Information in Same Row - Employee Only */}
        {isEmployee && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Recent Leaves */}
            {filteredLeaves.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Leaves</h3>
                  <button
                    onClick={() => navigate('/leave')}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredLeaves
                    .sort((a, b) => {
                      const dateA = a.startDate ? new Date(a.startDate) : new Date(0)
                      const dateB = b.startDate ? new Date(b.startDate) : new Date(0)
                      return dateB - dateA
                    })
                    .slice(0, 3)
                    .map((leave) => {
                      const statusColors = {
                        'PENDING': 'text-yellow-600',
                        'APPROVED': 'text-green-600',
                        'REJECTED': 'text-red-600',
                        'CANCELLED': 'text-gray-500'
                      }
                      const status = (leave.status || '').toUpperCase()
                      return (
                        <div
                          key={leave.id}
                          onClick={() => navigate('/leave')}
                          className="p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">{leave.type || 'Leave'}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {(() => {
                                  try {
                                    if (leave.startDate && leave.endDate) {
                                      const startDate = new Date(leave.startDate)
                                      const endDate = new Date(leave.endDate)
                                      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                        return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
                                      }
                                    } else if (leave.startDate) {
                                      const startDate = new Date(leave.startDate)
                                      if (!isNaN(startDate.getTime())) {
                                        return format(startDate, 'MMM dd, yyyy')
                                      }
                                    }
                                    return 'N/A'
                                  } catch (error) {
                                    console.error('Error formatting leave date:', error)
                                    return 'N/A'
                                  }
                                })()}
                              </p>
                            </div>
                            <span className={`text-xs font-medium ${statusColors[status] || 'text-gray-500'}`}>
                              {status || 'PENDING'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* My Information */}
            {dashboardStats && (
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">My Information</h3>
            <div className="space-y-4">
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Department</p>
                    <p className="text-base font-medium text-gray-800">{dashboardStats.department || 'N/A'}</p>
              </div>
              
              {employeeShift ? (
                    <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-gray-600" size={16} />
                        <p className="text-xs text-gray-500">Shift</p>
                  </div>
                      <p className="text-base font-semibold text-gray-800 mb-1">{employeeShift.name}</p>
                      <p className="text-sm text-gray-600 mb-2">
                    {employeeShift.startTime ? employeeShift.startTime.substring(0, 5) : ''} - {employeeShift.endTime ? employeeShift.endTime.substring(0, 5) : ''}
                  </p>
                  {employeeShift.workingHours && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{employeeShift.workingHours.toFixed(2)} hrs</span>
                      {employeeShift.breakDuration && (
                            <span>• Break: {employeeShift.breakDuration} min</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                    <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex items-center gap-2">
                        <Clock className="text-gray-400" size={16} />
                        <p className="text-sm text-gray-500">No shift assigned</p>
                  </div>
                    </div>
                  )}
                </div>
              </div>
            )}
                </div>
              )}
              
        {/* Leave Balance Summary - Employee Only */}
        {isEmployee && leaveBalances.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Your Leave Balance</h3>
                <p className="text-xs text-gray-500 mt-0.5">Year {new Date().getFullYear()}</p>
              </div>
              <button
                onClick={() => {
                  if (employeeId) {
                    loadLeaveBalances(employeeId)
                  }
                }}
                disabled={loadingLeaveBalances}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Leave Balances"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLeaveBalances ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {leaveBalances.map((balance) => {
                const type = leaveTypes.find(t => {
                  const typeId = typeof t.id === 'string' ? parseInt(t.id) : t.id
                  const balanceTypeId = typeof balance.leaveTypeId === 'string' ? parseInt(balance.leaveTypeId) : balance.leaveTypeId
                  return typeId === balanceTypeId
                })
                const leaveTypeName = type?.name || balance.leaveType || balance.leaveTypeName || 'Leave'
                const leaveTypeCode = type?.code || ''
                const availableBalance = balance.balance || 0
                const usedDays = balance.usedDays || ((balance.totalDays || 0) - availableBalance)
                const totalDays = balance.totalDays || 0
                const usagePercentage = totalDays > 0 ? (usedDays / totalDays) * 100 : 0
                
                return (
                  <div
                    key={balance.id || balance.leaveTypeId}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-blue-300 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-800 mb-0.5">{leaveTypeName}</h3>
                        {leaveTypeCode && (
                          <p className="text-xs text-gray-500">ID: {leaveTypeCode}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-bold text-blue-600">{availableBalance.toFixed(1)}</div>
                        <p className="text-xs text-gray-500">Available Balance</p>
                      </div>
                    </div>
                    
                    {totalDays > 0 && (
                      <div className="mt-auto pt-2 border-t border-gray-200">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-1">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600">
                          {usedDays.toFixed(1)} days used out of {totalDays.toFixed(1)} days total
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        </>
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
              {/* Recruitment removed */}
            </>
          ) : isFinance ? (
            <>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Payroll Validation</span>
              </button>
              <button
                onClick={() => navigate('/tickets')}
                className="flex flex-col items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-200 hover:border-orange-400 group"
              >
                <Ticket className="w-5 h-5 text-orange-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">HR Tickets</span>
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-400 group"
              >
                <TrendingUp className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Cost Analytics</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <Calendar className="w-5 h-5 text-yellow-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Leaves</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <Clock className="w-5 h-5 text-green-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Attendance</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-gray-400 group"
              >
                <Settings className="w-5 h-5 text-gray-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Settings</span>
              </button>
            </>
          ) : isManager ? (
            <>
              <button
                onClick={() => navigate('/team-attendance')}
                className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-400 group"
              >
                <Users className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Team Attendance</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-amber-200 hover:border-amber-400 group"
              >
                <Calendar className="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Approve Leaves</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <CheckCircle className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Attendance</span>
              </button>
              <button
                onClick={() => navigate('/performance')}
                className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Team Performance</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <DollarSign className="w-5 h-5 text-green-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Payroll</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-gray-400 group"
              >
                <Settings className="w-5 h-5 text-gray-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Settings</span>
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
                onClick={() => navigate('/tickets')}
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
    </div>
  )
}

export default Dashboard

