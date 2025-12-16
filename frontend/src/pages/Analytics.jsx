import { useState, useEffect } from 'react'
import { TrendingUp, Users, Clock, Calendar, DollarSign, Download, BarChart3 } from 'lucide-react'
import api from '../services/api'

const Analytics = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [leaveData, setLeaveData] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

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
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAttendanceData = (attendance) => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const present = attendance.filter(att => {
        const attDate = typeof att.date === 'string' ? att.date.split('T')[0] : att.date
        return attDate === dateStr && att.status === 'Present'
      }).length
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
            >
              <Download size={16} />
              Export
            </button>
          </div>
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
            >
              <Download size={16} />
              Export
            </button>
          </div>
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
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
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
        </button>

        <button
          onClick={() => handleExportReport('Attendance')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <Clock className="text-blue-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-800 mb-1">Attendance Report</h3>
          <p className="text-sm text-gray-600">Export attendance records</p>
        </button>

        <button
          onClick={() => handleExportReport('Performance')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <TrendingUp className="text-blue-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-800 mb-1">Performance Report</h3>
          <p className="text-sm text-gray-600">Export performance data</p>
        </button>
      </div>
    </div>
  )
}

export default Analytics

