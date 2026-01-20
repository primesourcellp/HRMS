import { useState, useEffect } from 'react'
import { Users, Clock, Calendar, Search, CheckCircle, XCircle, TrendingUp, Download, Filter } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const TeamAttendance = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewType, setViewType] = useState('daily') // 'daily', 'weekly', 'monthly'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])
  const currentUserId = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  const isManager = userRole === 'MANAGER'

  useEffect(() => {
    if (!isManager || !currentUserId) {
      setError('Access denied. This page is only for Managers.')
      return
    }
    loadTeamMembers()
  }, [isManager, currentUserId])

  useEffect(() => {
    if (teamMembers.length > 0) {
      loadAttendance()
    }
  }, [selectedDate, viewType, teamMembers])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load teams where manager is a member (like MyTeams does)
      const allTeams = await api.getTeams()
      const managerId = parseInt(currentUserId)
      
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
      if (allTeamMembers.length === 0) {
        setError('No employee team members assigned to you.')
      }
    } catch (error) {
      console.error('Error loading team members:', error)
      setError('Failed to load team members')
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  const loadAttendance = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dateObj = new Date(selectedDate)
      let startDate, endDate
      
      if (viewType === 'daily') {
        startDate = selectedDate
        endDate = selectedDate
      } else if (viewType === 'weekly') {
        const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(dateObj, { weekStartsOn: 1 })
        startDate = format(weekStart, 'yyyy-MM-dd')
        endDate = format(weekEnd, 'yyyy-MM-dd')
      } else if (viewType === 'monthly') {
        const monthStart = startOfMonth(dateObj)
        const monthEnd = endOfMonth(dateObj)
        startDate = format(monthStart, 'yyyy-MM-dd')
        endDate = format(monthEnd, 'yyyy-MM-dd')
      }
      
      // Get team member IDs
      const teamMemberIds = teamMembers.map(emp => {
        const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
        return empId
      })
      
      // Load attendance for all team members
      const attendancePromises = []
      const dates = []
      
      if (viewType === 'daily') {
        dates.push(selectedDate)
      } else {
        // For weekly/monthly, get all dates in range
        const start = new Date(startDate)
        const end = new Date(endDate)
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(format(new Date(d), 'yyyy-MM-dd'))
        }
      }
      
      for (const date of dates) {
        attendancePromises.push(api.getAttendanceByDate(date))
      }
      
      const attendanceResults = await Promise.all(attendancePromises)
      
      // Process attendance data
      const allAttendance = []
      attendanceResults.forEach((attendanceRecords, index) => {
        const date = dates[index]
        const attendanceArray = Array.isArray(attendanceRecords) ? attendanceRecords : []
        
        // Filter to only team members
        const teamAttendance = attendanceArray.filter(att => {
          const attEmpId = typeof att.employeeId === 'string' ? parseInt(att.employeeId) : att.employeeId
          return teamMemberIds.includes(attEmpId)
        })
        
        allAttendance.push(...teamAttendance.map(att => ({ ...att, date })))
      })
      
      setAttendance(allAttendance)
      
      // Generate chart data
      if (viewType === 'weekly' || viewType === 'monthly') {
        generateChartData(allAttendance, dates)
      } else {
        setChartData([])
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (attendanceData, dates) => {
    const chartDataMap = {}
    
    dates.forEach(date => {
      const dayName = format(new Date(date), 'EEE')
      chartDataMap[date] = {
        name: dayName,
        present: 0,
        absent: 0,
        date: date
      }
    })
    
    attendanceData.forEach(att => {
      const date = att.date || att.date
      if (chartDataMap[date]) {
        if (att.status === 'Present' || att.status === 'PRESENT') {
          chartDataMap[date].present++
        } else if (att.status === 'Absent' || att.status === 'ABSENT') {
          chartDataMap[date].absent++
        }
      }
    })
    
    setChartData(Object.values(chartDataMap))
  }

  const formatTimeAmPm = (timeStr) => {
    if (!timeStr) return '-'
    const parts = String(timeStr).trim().split(':')
    if (parts.length < 2) return String(timeStr)
    const hRaw = parseInt(parts[0], 10)
    const mRaw = parseInt(parts[1], 10)
    if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return String(timeStr)
    const h12 = ((hRaw % 12) || 12)
    const ampm = hRaw >= 12 ? 'PM' : 'AM'
    const mm = String(mRaw).padStart(2, '0')
    return `${h12}:${mm} ${ampm}`
  }

  const formatWorkingHours = (workingHours) => {
    if (workingHours === null || workingHours === undefined || workingHours === '') return '-'
    const hoursNum = typeof workingHours === 'string' ? parseFloat(workingHours) : workingHours
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) return '0h 0m'
    const h = Math.floor(hoursNum)
    const m = Math.round((hoursNum - h) * 60)
    const hh = m === 60 ? h + 1 : h
    const mm = m === 60 ? 0 : m
    return `${hh}h ${mm}m`
  }

  const getEmployeeName = (employeeId) => {
    const employee = teamMembers.find(emp => {
      const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
      return empId === employeeId
    })
    return employee ? employee.name : `Employee ${employeeId}`
  }

  const getEmployeeEmail = (employeeId) => {
    const employee = teamMembers.find(emp => {
      const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
      return empId === employeeId
    })
    return employee ? employee.email : '-'
  }

  // Filter attendance based on search and status
  const filteredAttendance = attendance.filter(att => {
    const employeeName = getEmployeeName(att.employeeId).toLowerCase()
    const matchesSearch = !searchTerm || employeeName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || att.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Group attendance by employee for display
  const groupedAttendance = {}
  filteredAttendance.forEach(att => {
    const empId = att.employeeId
    if (!groupedAttendance[empId]) {
      groupedAttendance[empId] = []
    }
    groupedAttendance[empId].push(att)
  })

  if (!isManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to Managers.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Team Attendance
            </h1>
            <p className="text-gray-600 mt-1">
              View attendance data for {teamMembers.length} {teamMembers.length === 1 ? 'team member' : 'team members'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">View Type</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {viewType === 'daily' ? 'Date' : viewType === 'weekly' ? 'Week' : 'Month'}
            </label>
            <input
              type={viewType === 'daily' ? 'date' : viewType === 'weekly' ? 'date' : 'month'}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600">Loading attendance data...</p>
              </div>
            </div>
          ) : Object.keys(groupedAttendance).length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(groupedAttendance).map(([employeeId, records]) => (
                  records.map((record, index) => (
                    <tr key={`${employeeId}-${record.date}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getEmployeeName(parseInt(employeeId))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getEmployeeEmail(parseInt(employeeId))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Present' || record.status === 'PRESENT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status || 'Absent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAmPm(record.checkIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAmPm(record.checkOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatWorkingHours(record.workingHours)}
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamAttendance
