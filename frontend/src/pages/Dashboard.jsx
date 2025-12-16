import { useHRMS } from '../context/HRMSContext'
import { Users, Clock, Calendar, DollarSign, TrendingUp, ArrowUp, ArrowDown, UserPlus, CheckCircle, FileText, PlusCircle, Eye, Settings } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Dashboard = () => {
  const { employees, attendance, leaves, payrolls } = useHRMS()
  const [dashboardStats, setDashboardStats] = useState(null)
<<<<<<< HEAD
=======
  const [shifts, setShifts] = useState([])
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  const navigate = useNavigate()
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    // Check if user is an employee
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    setIsEmployee(userType === 'employee')
    setEmployeeId(userId ? parseInt(userId) : null)
    loadDashboardStats(userId && userType === 'employee' ? parseInt(userId) : null)
<<<<<<< HEAD
  }, [])

=======
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      loadShifts()
    }
  }, [])

  const loadShifts = async () => {
    try {
      const data = await api.getShifts()
      setShifts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading shifts:', error)
    }
  }

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  const loadDashboardStats = async (empId = null) => {
    try {
      const stats = await api.getDashboardStats(null, empId)
      setDashboardStats(stats)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
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
<<<<<<< HEAD
=======
      title: 'Active Shifts',
      value: shifts.filter(s => s.active).length,
      change: `${shifts.length > 0 ? Math.round((shifts.filter(s => s.active).length / shifts.length) * 100) : 0}%`,
      trend: 'up',
      icon: Clock,
      color: 'bg-indigo-500'
    },
    {
      title: 'Employees in Shifts',
      value: safeEmployees.filter(emp => emp.shiftId).length,
      change: `${safeEmployees.length > 0 ? Math.round((safeEmployees.filter(emp => emp.shiftId).length / safeEmployees.length) * 100) : 0}%`,
      trend: 'up',
      icon: UserPlus,
      color: 'bg-teal-500'
    },
    {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
      // For admin, show aggregated data (mock data for now)
      return [
        { name: 'Mon', present: 45, absent: 5 },
        { name: 'Tue', present: 47, absent: 3 },
        { name: 'Wed', present: 46, absent: 4 },
        { name: 'Thu', present: 48, absent: 2 },
        { name: 'Fri', present: 44, absent: 6 },
        { name: 'Sat', present: 30, absent: 20 },
        { name: 'Sun', present: 10, absent: 40 }
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

  return (
<<<<<<< HEAD
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-600 p-4 rounded-xl shadow-md">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
=======
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-4 md:gap-6`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="bg-blue-600 p-2 md:p-3 rounded-lg md:rounded-xl shadow-md">
                  <Icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs md:text-sm font-semibold px-2 md:px-3 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp size={14} className="md:w-4 md:h-4" /> : <ArrowDown size={14} className="md:w-4 md:h-4" />}
                  <span className="hidden sm:inline">{stat.change}</span>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-xs md:text-sm text-gray-600">{stat.title}</p>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
<<<<<<< HEAD
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-blue-600 mb-4">
            {isEmployee ? 'My Weekly Attendance' : 'Weekly Attendance'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
=======
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Attendance Chart */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-4">
            {isEmployee ? 'My Weekly Attendance' : 'Weekly Attendance'}
          </h3>
          <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
        </div>

        {/* Department Distribution - Only show for admin */}
        {!isEmployee && (
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-blue-600 mb-4">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
            <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-4">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
        {/* Employee Info Card - Only show for employee */}
        {isEmployee && dashboardStats && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-blue-600 mb-4">My Information</h3>
=======
        {/* Shift Distribution - Only show for admin */}
        {!isEmployee && shifts.length > 0 && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
            <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-4">Shift Distribution</h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {shifts.filter(s => s.active).map((shift) => {
                const employeesInShift = safeEmployees.filter(emp => emp.shiftId === shift.id)
                return (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-600" size={20} />
                      <div>
                        <p className="font-semibold text-gray-800">{shift.name}</p>
                        <p className="text-xs text-gray-500">{shift.startTime} - {shift.endTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{employeesInShift.length}</p>
                      <p className="text-xs text-gray-500">employees</p>
                    </div>
                  </div>
                )
              })}
              {shifts.filter(s => s.active).length === 0 && (
                <p className="text-center text-gray-500 py-4">No active shifts</p>
              )}
            </div>
          </div>
        )}

        {/* Employee Info Card - Only show for employee */}
        {isEmployee && dashboardStats && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
            <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-4">My Information</h3>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="text-lg font-semibold text-gray-800">{dashboardStats.department || 'N/A'}</p>
              </div>
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
<<<<<<< HEAD
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-blue-600 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
=======
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
        <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          {isAdmin ? (
            <>
              <button
                onClick={() => navigate('/employees')}
<<<<<<< HEAD
                className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <UserPlus className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Add Employee</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <CheckCircle className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Mark Attendance</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <Calendar className="w-8 h-8 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Approve Leaves</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Process Payroll</span>
              </button>
              <button
                onClick={() => navigate('/shifts')}
                className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-400 group"
              >
                <Clock className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Manage Shifts</span>
              </button>
              <button
                onClick={() => navigate('/recruitment')}
                className="flex flex-col items-center justify-center p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-200 hover:border-pink-400 group"
              >
                <FileText className="w-8 h-8 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Recruitment</span>
=======
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Add Employee</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-green-50 hover:bg-green-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Mark Attendance</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Approve Leaves</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Process Payroll</span>
              </button>
              <button
                onClick={() => navigate('/shifts')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-400 group"
              >
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Manage Shifts</span>
              </button>
              <button
                onClick={() => navigate('/recruitment')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-pink-50 hover:bg-pink-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-200 hover:border-pink-400 group"
              >
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-pink-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Recruitment</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/attendance')}
<<<<<<< HEAD
                className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <CheckCircle className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Check In/Out</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <PlusCircle className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Apply Leave</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Payroll</span>
              </button>
              <button
                onClick={() => navigate('/performance')}
                className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <TrendingUp className="w-8 h-8 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Performance</span>
              </button>
              <button
                onClick={() => navigate('/hrtickets')}
                className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-200 hover:border-orange-400 group"
              >
                <FileText className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">My Tickets</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-gray-400 group"
              >
                <Settings className="w-8 h-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-800">Settings</span>
=======
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 hover:border-blue-400 group"
              >
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Check In/Out</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-green-50 hover:bg-green-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 hover:border-green-400 group"
              >
                <PlusCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Apply Leave</span>
              </button>
              <button
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 hover:border-purple-400 group"
              >
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">My Payroll</span>
              </button>
              <button
                onClick={() => navigate('/performance')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400 group"
              >
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">My Performance</span>
              </button>
              <button
                onClick={() => navigate('/hrtickets')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-orange-50 hover:bg-orange-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-200 hover:border-orange-400 group"
              >
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-orange-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">My Tickets</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center p-3 md:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-gray-400 group"
              >
                <Settings className="w-5 h-5 md:w-6 md:h-6 text-gray-600 mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center">Settings</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  )
}

export default Dashboard

