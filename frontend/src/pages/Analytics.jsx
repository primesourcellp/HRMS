import { useState, useEffect } from 'react'
import api from '../services/api'
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const Analytics = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalPayroll: 0,
    monthlyPayroll: 0,
    averageRating: 0,
    totalTickets: 0,
    openTickets: 0
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [leaveData, setLeaveData] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [performanceData, setPerformanceData] = useState([])
  const [attendanceTrend, setAttendanceTrend] = useState([])
  const [leaveStatusData, setLeaveStatusData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [leaves, setLeaves] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [performances, setPerformances] = useState([])
  const [tickets, setTickets] = useState([])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod, selectedDateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [employeesData, attendanceData, leavesData, payrollsData, performancesData, ticketsData] = await Promise.all([
        api.getEmployees(),
        api.getAttendance(),
        api.getLeaves(),
        api.getPayrolls(),
        api.getPerformance(),
        api.getTickets().catch(() => [])
      ])

      const employeesArray = Array.isArray(employeesData) ? employeesData : []
      const attendanceArray = Array.isArray(attendanceData) ? attendanceData : []
      const leavesArray = Array.isArray(leavesData) ? leavesData : []
      const payrollsArray = Array.isArray(payrollsData) ? payrollsData : []
      const performancesArray = Array.isArray(performancesData) ? performancesData : []
      const ticketsArray = Array.isArray(ticketsData) ? ticketsData : []

      setEmployees(employeesArray)
      setLeaves(leavesArray)
      setPayrolls(payrollsArray)
      setPerformances(performancesArray)
      setTickets(ticketsArray)

      // Calculate comprehensive statistics
      const activeEmployees = employeesArray.filter(emp => emp.status === 'Active').length
      const today = format(new Date(), 'yyyy-MM-dd')
      const todayAttendance = attendanceArray.filter(att => {
        let attDate
        if (typeof att.date === 'string') {
          attDate = att.date.split('T')[0]
        } else if (att.date instanceof Date) {
          attDate = format(att.date, 'yyyy-MM-dd')
        } else {
          try {
            attDate = format(parseISO(att.date), 'yyyy-MM-dd')
          } catch {
            attDate = ''
          }
        }
        return attDate === today
      })
      const presentToday = todayAttendance.filter(att => att.status === 'Present').length
      const absentToday = todayAttendance.filter(att => att.status === 'Absent').length
      const pendingLeaves = leavesArray.filter(leave => leave.status === 'PENDING' || leave.status === 'Pending').length
      const approvedLeaves = leavesArray.filter(leave => leave.status === 'APPROVED' || leave.status === 'Approved').length
      
      const totalPayroll = payrollsArray.reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0)
      const currentMonth = format(new Date(), 'yyyy-MM')
      const monthlyPayroll = payrollsArray
        .filter(p => {
          const payrollMonth = p.month || format(parseISO(p.createdAt || new Date()), 'yyyy-MM')
          return payrollMonth === currentMonth
        })
        .reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0)

      const averageRating = performancesArray.length > 0
        ? performancesArray.reduce((sum, p) => sum + (p.rating || 0), 0) / performancesArray.length
        : 0

      const openTickets = ticketsArray.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length

      setStats({
        totalEmployees: employeesArray.length,
        activeEmployees,
        presentToday,
        absentToday,
        pendingLeaves,
        approvedLeaves,
        totalPayroll,
        monthlyPayroll,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalTickets: ticketsArray.length,
        openTickets
      })

      // Process data for charts
      setAttendanceData(processAttendanceData(attendanceArray))
      setLeaveData(processLeaveData(leavesArray))
      setPayrollData(processPayrollData(payrollsArray))
      setDepartmentData(processDepartmentData(employeesArray))
      setPerformanceData(processPerformanceData(performancesArray))
      setAttendanceTrend(processAttendanceTrend(attendanceArray))
      setLeaveStatusData(processLeaveStatusData(leavesArray))
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError(error.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const processAttendanceData = (attendance) => {
    const last30Days = []
    const daysToShow = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayAttendance = attendance.filter(att => {
        let attDate
        if (typeof att.date === 'string') {
          attDate = att.date.split('T')[0]
        } else if (att.date instanceof Date) {
          attDate = format(att.date, 'yyyy-MM-dd')
        } else {
          try {
            attDate = format(parseISO(att.date), 'yyyy-MM-dd')
          } catch {
            attDate = ''
          }
        }
        return attDate === dateStr
      })
      const present = dayAttendance.filter(att => att.status === 'Present').length
      const absent = dayAttendance.filter(att => att.status === 'Absent').length
      last30Days.push({
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        present,
        absent,
        total: present + absent
      })
    }
    return last30Days
  }

  const processLeaveData = (leaves) => {
    const leaveTypes = {}
    leaves.forEach(leave => {
      const type = leave.type || leave.leaveType || 'Unknown'
      leaveTypes[type] = (leaveTypes[type] || 0) + 1
    })
    return Object.entries(leaveTypes).map(([type, count]) => ({ name: type, value: count }))
  }

  const processPayrollData = (payrolls) => {
    const monthly = {}
    payrolls.forEach(payroll => {
      let month
      if (payroll.month) {
        month = payroll.month
      } else if (payroll.createdAt) {
        try {
          const createdAt = typeof payroll.createdAt === 'string' ? parseISO(payroll.createdAt) : payroll.createdAt
          month = format(createdAt instanceof Date ? createdAt : parseISO(payroll.createdAt), 'yyyy-MM')
        } catch {
          month = format(new Date(), 'yyyy-MM')
        }
      } else {
        month = format(new Date(), 'yyyy-MM')
      }
      monthly[month] = (monthly[month] || 0) + (payroll.netSalary || payroll.amount || 0)
    })
    return Object.entries(monthly)
      .sort()
      .slice(-12)
      .map(([month, amount]) => ({
        month: (() => {
          try {
            return format(parseISO(month + '-01'), 'MMM yyyy')
          } catch {
            return month
          }
        })(),
        amount: parseFloat(amount.toFixed(2))
      }))
  }

  const processDepartmentData = (employees) => {
    const deptCount = {}
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned'
      deptCount[dept] = (deptCount[dept] || 0) + 1
    })
    return Object.entries(deptCount).map(([name, value]) => ({ name, value }))
  }

  const processPerformanceData = (performances) => {
    const ratingDistribution = {}
    performances.forEach(perf => {
      const rating = perf.rating || 0
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1
    })
    return [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating} Star${rating > 1 ? 's' : ''}`,
      count: ratingDistribution[rating] || 0
    }))
  }

  const processAttendanceTrend = (attendance) => {
    const weeklyData = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = subDays(new Date(), i * 7)
      const weekEnd = subDays(weekStart, -6)
      const weekAttendance = attendance.filter(att => {
        let attDate
        if (typeof att.date === 'string') {
          try {
            attDate = parseISO(att.date.split('T')[0])
          } catch {
            return false
          }
        } else if (att.date instanceof Date) {
          attDate = att.date
        } else {
          try {
            attDate = parseISO(att.date)
          } catch {
            return false
          }
        }
        return attDate >= weekStart && attDate <= weekEnd
      })
      const present = weekAttendance.filter(att => att.status === 'Present').length
      const absent = weekAttendance.filter(att => att.status === 'Absent').length
      weeklyData.push({
        week: `Week ${12 - i}`,
        present,
        absent,
        attendanceRate: weekAttendance.length > 0 ? ((present / weekAttendance.length) * 100).toFixed(1) : 0
      })
    }
    return weeklyData
  }

  const processLeaveStatusData = (leaves) => {
    const statusCount = {}
    leaves.forEach(leave => {
      const status = leave.status || 'Unknown'
      statusCount[status] = (statusCount[status] || 0) + 1
    })
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
  }

  const handleExportReport = (type) => {
    // In a real app, this would generate and download a PDF/Excel report
    setError(null)
    setTimeout(() => {
      alert(`${type} report export functionality would be implemented here`)
    }, 100)
  }

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  if (loading && stats.totalEmployees === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }







  
  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-2">
              Analytics & Reports
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium">Comprehensive insights and data analytics dashboard</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 sm:px-4 sm:py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-sm sm:text-base flex-1 md:flex-none"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={loadAnalytics}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm sm:text-base w-full md:w-auto"
              title="Refresh Data"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalEmployees}</h3>
          <p className="text-gray-600 text-sm font-medium">Total Employees</p>
          <p className="text-gray-500 text-xs mt-1">{stats.activeEmployees} active</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.presentToday}</h3>
          <p className="text-gray-600 text-sm font-medium">Present Today</p>
          <p className="text-gray-500 text-xs mt-1">
            {stats.totalEmployees > 0 ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) : 0}% attendance rate
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.pendingLeaves}</h3>
          <p className="text-gray-600 text-sm font-medium">Pending Leaves</p>
          <p className="text-gray-500 text-xs mt-1">{stats.approvedLeaves} approved</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            ${(stats.monthlyPayroll / 1000).toFixed(1)}K
          </h3>
          <p className="text-gray-600 text-sm font-medium">Monthly Payroll</p>
          <p className="text-gray-500 text-xs mt-1">${(stats.totalPayroll / 1000000).toFixed(2)}M total</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.averageRating}</h3>
          <p className="text-gray-600 text-sm font-medium">Avg Performance</p>
          <p className="text-gray-500 text-xs mt-1">Out of 5.0 rating</p>
        </div>
      </div>

      {/* Charts Row 1 - Attendance & Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Attendance Trend
            </h3>
            <button
              onClick={() => handleExportReport('Attendance')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="present" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Present" />
              <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Leave Distribution
            </h3>
            <button
              onClick={() => handleExportReport('Leave')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leaveData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 - Payroll & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Payroll Trend
            </h3>
            <button
              onClick={() => handleExportReport('Payroll')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payrollData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#8b5cf6" name="Payroll Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Rating Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Performance Ratings
            </h3>
            <button
              onClick={() => handleExportReport('Performance')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 - Department & Attendance Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Department Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Rate Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Weekly Attendance Rate
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="attendanceRate" stroke="#10b981" strokeWidth={3} name="Attendance Rate %" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leave Status Chart */}
      {leaveStatusData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600">
              Leave Status Overview
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leaveStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Leave Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Attendance Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Present Today</span>
              <span className="font-bold text-green-600">{stats.presentToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Absent Today</span>
              <span className="font-bold text-red-600">{stats.absentToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Attendance Rate</span>
              <span className="font-bold text-blue-600">
                {stats.totalEmployees > 0 ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Leave Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Leave Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-bold text-yellow-600">{stats.pendingLeaves}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-bold text-green-600">{stats.approvedLeaves}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Leaves</span>
              <span className="font-bold text-blue-600">{leaves.length}</span>
            </div>
          </div>
        </div>

        {/* Performance Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Performance Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Rating</span>
              <span className="font-bold text-purple-600">{stats.averageRating}/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Reviews</span>
              <span className="font-bold text-blue-600">{performances.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Top Performers</span>
              <span className="font-bold text-green-600">
                {performances.filter(p => (p.rating || 0) >= 4).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reports Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Quick Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleExportReport('Employee')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-all text-left border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105"
          >
            <h3 className="font-bold text-gray-800 mb-1">Employee Report</h3>
            <p className="text-sm text-gray-600">Export employee database</p>
          </button>

          <button
            onClick={() => handleExportReport('Attendance')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-all text-left border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105"
          >
            <h3 className="font-bold text-gray-800 mb-1">Attendance Report</h3>
            <p className="text-sm text-gray-600">Export attendance records</p>
          </button>

          <button
            onClick={() => handleExportReport('Payroll')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-all text-left border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105"
          >
            <h3 className="font-bold text-gray-800 mb-1">Payroll Report</h3>
            <p className="text-sm text-gray-600">Export payroll data</p>
          </button>

          <button
            onClick={() => handleExportReport('Performance')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-all text-left border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105"
          >
            <h3 className="font-bold text-gray-800 mb-1">Performance Report</h3>
            <p className="text-sm text-gray-600">Export performance data</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Analytics
