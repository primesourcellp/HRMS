import { useHRMS } from '../context/HRMSContext'
import { Users, Clock, Calendar, DollarSign, TrendingUp, ArrowUp, ArrowDown, UserPlus, CheckCircle, FileText, PlusCircle, Eye, Settings, LogIn, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Dashboard = () => {
  const { employees, attendance, leaves, payrolls } = useHRMS()
  const [dashboardStats, setDashboardStats] = useState(null)
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  const [employeeShift, setEmployeeShift] = useState(null)
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([])
  const [loadingWeeklyAttendance, setLoadingWeeklyAttendance] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState(null)
  const [checkInError, setCheckInError] = useState(null)
  const navigate = useNavigate()
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    // Check if user is an employee
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    setIsEmployee(userType === 'employee')
    const empId = userId ? parseInt(userId) : null
    setEmployeeId(empId)
    loadDashboardStats(empId && userType === 'employee' ? empId : null)
    
    // Load employee shift if user is an employee
    if (empId && userType === 'employee') {
      loadEmployeeShift(empId)
      loadTodayAttendance(empId)
    }

    // Load weekly attendance data for admin
    if (userType !== 'employee') {
      loadWeeklyAttendanceData()
    }
  }, [employees]) // Re-run when employees data is loaded

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

      {/* Check In Button - Only for employees who can check in */}
      {canCheckIn && (
        <div className="flex justify-start">
          <button
            onClick={handleCheckIn}
            disabled={checkInLoading}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-green-500 hover:border-green-600"
          >
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            {checkInLoading ? 'Checking In...' : 'Check In'}
          </button>
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

    </div>
  )
}

export default Dashboard

