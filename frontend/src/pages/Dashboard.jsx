import { useHRMS } from '../context/HRMSContext'
import { Users, Clock, Calendar, DollarSign, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import api from '../services/api'

const Dashboard = () => {
  const { employees, attendance, leaves, payrolls } = useHRMS()
  const [dashboardStats, setDashboardStats] = useState(null)
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)

  useEffect(() => {
    // Check if user is an employee
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    setIsEmployee(userType === 'employee')
    setEmployeeId(userId ? parseInt(userId) : null)
    loadDashboardStats(userId && userType === 'employee' ? parseInt(userId) : null)
  }, [])

  const loadDashboardStats = async (empId = null) => {
    try {
      const stats = await api.getDashboardStats(null, empId)
      setDashboardStats(stats)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  // Filter data based on employee or admin view
  const filteredAttendance = isEmployee && employeeId 
    ? attendance.filter(a => a.employeeId === employeeId)
    : attendance
  
  const filteredLeaves = isEmployee && employeeId
    ? leaves.filter(l => l.employeeId === employeeId)
    : leaves
  
  const filteredPayrolls = isEmployee && employeeId
    ? payrolls.filter(p => p.employeeId === employeeId)
    : payrolls

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
      value: dashboardStats?.pendingLeaves || filteredLeaves.filter(l => l.status === 'Pending').length,
      change: '-3%',
      trend: 'down',
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    {
      title: 'My Approved Leaves',
      value: dashboardStats?.approvedLeaves || filteredLeaves.filter(l => l.status === 'Approved').length,
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
      value: employees.length,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Present Today',
      value: dashboardStats?.presentToday || attendance.filter(a => {
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
      value: dashboardStats?.pendingLeaves || leaves.filter(l => l.status === 'Pending').length,
      change: '-3%',
      trend: 'down',
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    {
      title: 'Total Payroll',
      value: `$${dashboardStats?.totalPayroll?.toLocaleString() || payrolls.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ]

  // For employee view, show their department only
  const departmentData = isEmployee 
    ? (dashboardStats?.department ? { [dashboardStats.department]: 1 } : {})
    : (dashboardStats?.departmentDistribution || employees.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1
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
    ? employees.filter(emp => emp.id === employeeId)
    : (dashboardStats?.recentEmployees || employees
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 5))

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {isEmployee ? 'My Weekly Attendance' : 'Weekly Attendance'}
          </h3>
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
        </div>

        {/* Department Distribution - Only show for admin */}
        {!isEmployee && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Distribution</h3>
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Information</h3>
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

      {/* Recent Employees - Only show for admins */}
      {!isEmployee && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Employees</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold mr-3">
                          {emp.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                          <div className="text-sm text-gray-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

