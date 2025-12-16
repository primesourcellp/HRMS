import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { TrendingUp, Users, Clock, Calendar, DollarSign, Download, BarChart3 } from 'lucide-react'
import api from '../services/api'

=======
import { TrendingUp, Users, Clock, Calendar, DollarSign, Download, BarChart3, Target, PieChart as PieChartIcon, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import api from '../services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
const Analytics = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
<<<<<<< HEAD
    totalPayroll: 0
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [leaveData, setLeaveData] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [loading, setLoading] = useState(false)
=======
    totalPayroll: 0,
    averagePerformance: 0,
    topPerformers: 0
  })
  const [attendanceTrendData, setAttendanceTrendData] = useState([])
  const [leaveData, setLeaveData] = useState([])
  const [payrollTrendData, setPayrollTrendData] = useState([])
  const [performanceTrendData, setPerformanceTrendData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [performanceDistribution, setPerformanceDistribution] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

<<<<<<< HEAD
  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [employees, attendance, leaves, payrolls] = await Promise.all([
        api.getEmployees(),
        api.getAttendance(),
        api.getLeaves(),
        api.getPayrolls()
      ])

      // Calculate statistics
      const activeEmployees = employees.filter(emp => emp.status === 'Active').length
      const today = new Date().toISOString().split('T')[0]
      const presentToday = attendance.filter(att => {
        const attDate = typeof att.date === 'string' ? att.date.split('T')[0] : att.date
        return attDate === today && att.status === 'Present'
      }).length
      const pendingLeaves = leaves.filter(leave => leave.status === 'PENDING').length
      const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0)

      setStats({
        totalEmployees: employees.length,
        activeEmployees,
        presentToday,
        pendingLeaves,
        totalPayroll
      })

      // Process data for charts
      setAttendanceData(processAttendanceData(attendance))
      setLeaveData(processLeaveData(leaves))
      setPayrollData(processPayrollData(payrolls))
=======
  const getDateRange = () => {
    const now = new Date()
    switch (selectedPeriod) {
      case 'week':
        return { start: startOfWeek(subDays(now, 7)), end: endOfWeek(now) }
      case 'month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(now) }
      case 'quarter':
        return { start: startOfQuarter(subMonths(now, 3)), end: endOfQuarter(now) }
      case 'year':
        return { start: startOfYear(subYears(now, 1)), end: endOfYear(now) }
      default:
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(now) }
    }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [employees, attendance, leaves, payrolls, performance] = await Promise.all([
        api.getEmployees(),
        api.getAttendance(),
        api.getLeaves(),
        api.getPayrolls(),
        api.getPerformance()
      ])

      // Calculate statistics
      const activeEmployees = Array.isArray(employees) ? employees.filter(emp => emp.status === 'Active').length : 0
      const today = new Date().toISOString().split('T')[0]
      const presentToday = Array.isArray(attendance) ? attendance.filter(att => {
        const attDate = typeof att.date === 'string' ? att.date.split('T')[0] : att.date
        return attDate === today && att.status === 'Present'
      }).length : 0
      const pendingLeaves = Array.isArray(leaves) ? leaves.filter(leave => leave.status === 'PENDING' || leave.status === 'Pending').length : 0
      const totalPayroll = Array.isArray(payrolls) ? payrolls.reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0) : 0
      
      // Performance metrics
      const perfArray = Array.isArray(performance) ? performance : []
      const averagePerformance = perfArray.length > 0
        ? (perfArray.reduce((sum, p) => sum + (p.rating || 0), 0) / perfArray.length).toFixed(1)
        : 0
      const topPerformers = perfArray.filter(p => (p.rating || 0) >= 4).length

      setStats({
        totalEmployees: Array.isArray(employees) ? employees.length : 0,
        activeEmployees,
        presentToday,
        pendingLeaves,
        totalPayroll,
        averagePerformance: parseFloat(averagePerformance),
        topPerformers
      })

      // Process data for charts based on selected period
      const dateRange = getDateRange()
      setAttendanceTrendData(processAttendanceTrendData(attendance, employees, dateRange))
      setLeaveData(processLeaveData(leaves))
      setPayrollTrendData(processPayrollTrendData(payrolls, dateRange))
      setPerformanceTrendData(processPerformanceTrendData(performance, dateRange))
      setDepartmentData(processDepartmentData(employees))
      setPerformanceDistribution(processPerformanceDistribution(performance))
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  const processAttendanceData = (attendance) => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
=======
  const processAttendanceTrendData = (attendance, employees, dateRange) => {
    if (!Array.isArray(attendance) || !Array.isArray(employees)) return []
    
    const totalEmployees = employees.length
    const data = []
    const daysToShow = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : selectedPeriod === 'quarter' ? 90 : 365
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
      const present = attendance.filter(att => {
        const attDate = typeof att.date === 'string' ? att.date.split('T')[0] : att.date
        return attDate === dateStr && att.status === 'Present'
      }).length
<<<<<<< HEAD
      last7Days.push({ date: dateStr, present })
    }
    return last7Days
  }

  const processLeaveData = (leaves) => {
    const leaveTypes = {}
    leaves.forEach(leave => {
      const type = leave.type || 'Unknown'
      leaveTypes[type] = (leaveTypes[type] || 0) + 1
    })
    return Object.entries(leaveTypes).map(([type, count]) => ({ type, count }))
  }

  const processPayrollData = (payrolls) => {
    const monthly = {}
    payrolls.forEach(payroll => {
      const key = `${payroll.month}-${payroll.year}`
      monthly[key] = (monthly[key] || 0) + (payroll.netSalary || payroll.amount || 0)
    })
    return Object.entries(monthly).map(([month, amount]) => ({ month, amount }))
  }

  const handleExportReport = (type) => {
    // In a real app, this would generate and download a PDF/Excel report
    alert(`${type} report export functionality would be implemented here`)
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600 font-medium">Comprehensive insights and analytics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
=======
      
      const absent = attendance.filter(att => {
        const attDate = typeof att.date === 'string' ? att.date.split('T')[0] : att.date
        return attDate === dateStr && (att.status === 'Absent' || att.status === 'absent')
      }).length
      
      const attendanceRate = totalEmployees > 0 ? ((present / totalEmployees) * 100).toFixed(1) : 0
      
      data.push({
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        present,
        absent,
        attendanceRate: parseFloat(attendanceRate)
      })
    }
    
    return data
  }

  const processLeaveData = (leaves) => {
    if (!Array.isArray(leaves)) return []
    const leaveTypes = {}
    leaves.forEach(leave => {
      const type = leave.type || leave.leaveType || 'Unknown'
      leaveTypes[type] = (leaveTypes[type] || 0) + 1
    })
    return Object.entries(leaveTypes).map(([type, count]) => ({ name: type, value: count }))
  }

  const processPayrollTrendData = (payrolls, dateRange) => {
    if (!Array.isArray(payrolls)) return []
    
    const monthly = {}
    payrolls.forEach(payroll => {
      const payrollDate = payroll.payPeriod || payroll.monthYear || `${payroll.month}-${payroll.year}`
      monthly[payrollDate] = (monthly[payrollDate] || 0) + (payroll.netSalary || payroll.amount || 0)
    })
    
    return Object.entries(monthly)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12) // Last 12 periods
      .map(([period, amount]) => ({ period, amount: parseFloat(amount.toFixed(2)) }))
  }

  const processPerformanceTrendData = (performance, dateRange) => {
    if (!Array.isArray(performance)) return []
    
    const byPeriod = {}
    performance.forEach(perf => {
      const period = perf.period || 'Unknown'
      if (!byPeriod[period]) {
        byPeriod[period] = { total: 0, sum: 0, count: 0 }
      }
      byPeriod[period].sum += perf.rating || 0
      byPeriod[period].count += 1
      byPeriod[period].total = byPeriod[period].sum / byPeriod[period].count
    })
    
    return Object.entries(byPeriod)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, data]) => ({ period, averageRating: parseFloat(data.total.toFixed(2)) }))
  }

  const processDepartmentData = (employees) => {
    if (!Array.isArray(employees)) return []
    
    const deptData = {}
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned'
      deptData[dept] = (deptData[dept] || 0) + 1
    })
    
    return Object.entries(deptData).map(([name, value]) => ({ name, employees: value }))
  }

  const processPerformanceDistribution = (performance) => {
    if (!Array.isArray(performance)) return []
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    performance.forEach(perf => {
      const rating = perf.rating || 0
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = (distribution[rating] || 0) + 1
      }
    })
    
    return Object.entries(distribution).map(([rating, count]) => ({
      name: `${rating} Star${rating > 1 ? 's' : ''}`,
      value: count,
      rating: parseInt(rating)
    }))
  }

  const handleExportReport = (type) => {
    // Enhanced export functionality - in production, this would generate PDF/Excel
    const reportData = {
      type,
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      stats
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${type}_Report_${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">Analytics & Reports</h2>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              Detailed reports and visual dashboards to monitor HR activities, track trends, and support strategic workforce planning
            </p>
          </div>
          <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-600" size={24} />
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalEmployees}</h3>
          <p className="text-sm text-gray-600">Total Employees</p>
          <p className="text-xs text-gray-500 mt-1">{stats.activeEmployees} active</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-600" size={24} />
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.presentToday}</h3>
          <p className="text-sm text-gray-600">Present Today</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalEmployees > 0 ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) : 0}% attendance
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-blue-600" size={24} />
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.pendingLeaves}</h3>
          <p className="text-sm text-gray-600">Pending Leaves</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-blue-600" size={24} />
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">₹{(stats.totalPayroll / 100000).toFixed(1)}L</h3>
          <p className="text-sm text-gray-600">Total Payroll</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="text-blue-600" size={24} />
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">95%</h3>
          <p className="text-sm text-gray-600">System Health</p>
          <p className="text-xs text-gray-500 mt-1">All systems operational</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Attendance Trend (Last 7 Days)</h3>
            <button
              onClick={() => handleExportReport('Attendance')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
=======
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-600" size={28} />
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800">{stats.totalEmployees}</h3>
          <p className="text-sm text-gray-600 font-medium">Total Employees</p>
          <p className="text-xs text-gray-500 mt-1">{stats.activeEmployees} active</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-600" size={28} />
            <Activity className="text-green-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800">{stats.presentToday}</h3>
          <p className="text-sm text-gray-600 font-medium">Present Today</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalEmployees > 0 ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) : 0}% attendance rate
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-blue-600" size={28} />
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800">{stats.averagePerformance}</h3>
          <p className="text-sm text-gray-600 font-medium">Avg Performance</p>
          <p className="text-xs text-gray-500 mt-1">{stats.topPerformers} top performers</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-blue-600" size={28} />
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-gray-800">₹{(stats.totalPayroll / 100000).toFixed(1)}L</h3>
          <p className="text-sm text-gray-600 font-medium">Total Payroll</p>
          <p className="text-xs text-gray-500 mt-1">All time cumulative</p>
        </div>
      </div>

      {/* Charts Section - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                Attendance Trend
              </h3>
              <p className="text-sm text-gray-500">Daily attendance rate over time</p>
            </div>
            <button
              onClick={() => handleExportReport('Attendance')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            >
              <Download size={16} />
              Export
            </button>
          </div>
<<<<<<< HEAD
          <div className="space-y-2">
            {attendanceData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(item.present / stats.totalEmployees) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.present}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Types Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Leave Distribution</h3>
            <button
              onClick={() => handleExportReport('Leave')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
=======
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                label={{ value: 'Rate %', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [`${value}%`, 'Attendance Rate']}
              />
              <Area 
                type="monotone" 
                dataKey="attendanceRate" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                name="Attendance Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Target className="text-blue-600" size={20} />
                Performance Trends
              </h3>
              <p className="text-sm text-gray-500">Average performance ratings by period</p>
            </div>
            <button
              onClick={() => handleExportReport('Performance')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            >
              <Download size={16} />
              Export
            </button>
          </div>
<<<<<<< HEAD
          <div className="space-y-3">
            {leaveData.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                  <span className="text-sm text-gray-600">{item.count} leaves</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(item.count / leaveData.reduce((sum, d) => sum + d.count, 0)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll Report */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Payroll Summary</h3>
          <button
            onClick={() => handleExportReport('Payroll')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
=======
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="period" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                domain={[0, 5]}
                label={{ value: 'Rating', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [value, 'Average Rating']}
              />
              <Line 
                type="monotone" 
                dataKey="averageRating" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                name="Average Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                Department Distribution
              </h3>
              <p className="text-sm text-gray-500">Workforce by department</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="employees"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} />
                Performance Distribution
              </h3>
              <p className="text-sm text-gray-500">Rating distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Types Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                Leave Distribution
              </h3>
              <p className="text-sm text-gray-500">Leave types breakdown</p>
            </div>
            <button
              onClick={() => handleExportReport('Leave')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={leaveData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
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

      {/* Payroll Trend Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-blue-600" size={20} />
              Payroll Trends
            </h3>
            <p className="text-sm text-gray-500">Monthly payroll expenditure over time</p>
          </div>
          <button
            onClick={() => handleExportReport('Payroll')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-md"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
<<<<<<< HEAD
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.month}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">₹{item.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Processed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleExportReport('Employee')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <Users className="text-blue-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-800 mb-1">Employee Report</h3>
          <p className="text-sm text-gray-600">Export employee database</p>
=======
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={payrollTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value) => [`₹${value.toLocaleString()}`, 'Payroll']}
            />
            <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Payroll Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleExportReport('Employee')}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-300 text-left transform hover:scale-105"
        >
          <Users className="text-blue-600 mb-3" size={36} />
          <h3 className="font-semibold text-gray-800 mb-2 text-lg">Employee Report</h3>
          <p className="text-sm text-gray-600">Export comprehensive employee database with all details</p>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        </button>

        <button
          onClick={() => handleExportReport('Attendance')}
<<<<<<< HEAD
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <Clock className="text-blue-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-800 mb-1">Attendance Report</h3>
          <p className="text-sm text-gray-600">Export attendance records</p>
=======
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-300 text-left transform hover:scale-105"
        >
          <Clock className="text-blue-600 mb-3" size={36} />
          <h3 className="font-semibold text-gray-800 mb-2 text-lg">Attendance Report</h3>
          <p className="text-sm text-gray-600">Export detailed attendance records and trends</p>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        </button>

        <button
          onClick={() => handleExportReport('Performance')}
<<<<<<< HEAD
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <TrendingUp className="text-blue-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-800 mb-1">Performance Report</h3>
          <p className="text-sm text-gray-600">Export performance data</p>
=======
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-300 text-left transform hover:scale-105"
        >
          <TrendingUp className="text-blue-600 mb-3" size={36} />
          <h3 className="font-semibold text-gray-800 mb-2 text-lg">Performance Report</h3>
          <p className="text-sm text-gray-600">Export performance reviews and analytics data</p>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        </button>
      </div>
    </div>
  )
}

export default Analytics
<<<<<<< HEAD

=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
