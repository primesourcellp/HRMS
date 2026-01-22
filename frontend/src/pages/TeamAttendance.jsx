import { useState, useEffect } from 'react'
import { Clock, CheckCircle, Calendar, Search, TrendingUp, CalendarDays, Timer, CheckCircle2, Edit, X, Download, Filter, LogIn, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, getDaysInMonth, getDay, isBefore, startOfToday } from 'date-fns'

const TeamAttendance = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewType, setViewType] = useState('daily') // 'daily', 'weekly', 'monthly'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const currentUserId = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  const isManager = userRole === 'MANAGER'

  const formatWorkingHoursShort = (workingHours) => {
    if (workingHours === null || workingHours === undefined || workingHours === '') return '-'
    const hoursNum = typeof workingHours === 'string' ? parseFloat(workingHours) : workingHours
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) return '0h 0m'
    const h = Math.floor(hoursNum)
    const m = Math.round((hoursNum - h) * 60)
    const hh = m === 60 ? h + 1 : h
    const mm = m === 60 ? 0 : m
    return `${hh}h ${mm}m`
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

  const getAttendanceTooltip = (record) => {
    if (!record) return ''
    const status = (record.status || '').toString().toLowerCase()
    const isAbsent = status === 'absent'
    if (isAbsent) return 'Absent'
    const checkIn = formatTimeAmPm(record.checkIn)
    const checkOut = formatTimeAmPm(record.checkOut)
    const wh = formatWorkingHoursShort(record.workingHours)
    const hasAnyTime = (record.checkIn || record.checkOut || record.workingHours)
    if (!hasAnyTime) return ''
    return `Login: ${checkIn}\nLogout: ${checkOut}\nWorking: ${wh}`
  }

  const AttendanceHoverTooltip = ({ record }) => {
    if (!record) return null
    const text = getAttendanceTooltip(record)
    if (!text) return null
    return (
      <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 whitespace-pre-line min-w-[160px]">
          {text}
        </div>
        <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    )
  }

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
      
      const [allTeams, allEmployees] = await Promise.all([
        api.getTeams(),
        api.getEmployees()
      ])
      
      const managerId = parseInt(currentUserId)
      
      const myTeams = allTeams.filter(team => {
        const isTeamManager = team.managerId && (
          team.managerId === managerId || 
          parseInt(team.managerId) === managerId ||
          team.managerId === currentUserId ||
          parseInt(team.managerId) === parseInt(currentUserId)
        )
        
        const isInMembers = team.members && Array.isArray(team.members) && team.members.some(member => {
          const memberId = typeof member.employeeId === 'string' ? parseInt(member.employeeId) : member.employeeId
          return memberId === managerId || 
                 parseInt(member.employeeId) === managerId ||
                 member.employeeId === currentUserId ||
                 parseInt(member.employeeId) === parseInt(currentUserId)
        })
        
        return isTeamManager || isInMembers
      })
      
      const teamMemberIds = new Set()
      myTeams.forEach(team => {
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach(member => {
            const memberId = typeof member.employeeId === 'string' ? parseInt(member.employeeId) : member.employeeId
            if (memberId && memberId !== managerId) {
              teamMemberIds.add(memberId)
            }
          })
        }
      })
      
      const allTeamMembers = []
      const employeeArray = Array.isArray(allEmployees) ? allEmployees : []
      
      teamMemberIds.forEach(memberId => {
        const employee = employeeArray.find(emp => {
          const empId = emp.id || emp.employeeId
          return empId === memberId || 
                 parseInt(empId) === memberId ||
                 empId === memberId.toString() ||
                 parseInt(empId) === parseInt(memberId)
        })
        
        if (employee) {
          const role = (employee.role || employee.designation || '').toUpperCase()
          if (role === 'HR_ADMIN') {
            return
          }
          
          allTeamMembers.push({
            id: employee.id || employee.employeeId,
            name: employee.name || `Employee ${memberId}`,
            email: employee.email || '-',
            employeeId: employee.id || employee.employeeId,
            department: employee.department || '-',
            role: employee.role || employee.designation || '-'
          })
        }
      })
      
      setTeamMembers(allTeamMembers)
      if (allTeamMembers.length === 0) {
        setError('No team members assigned to you.')
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
    if (teamMembers.length === 0) {
      setAttendance([])
      setAllAttendance([])
      return
    }
    
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
      
      const teamMemberIdsSet = new Set()
      teamMembers.forEach(emp => {
        const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id
        const employeeId = typeof emp.employeeId === 'string' ? parseInt(emp.employeeId) : emp.employeeId
        if (empId) teamMemberIdsSet.add(empId)
        if (employeeId) teamMemberIdsSet.add(employeeId)
      })
      
      const allAttendanceData = viewType === 'daily'
        ? await api.getAttendanceByDate(selectedDate)
        : await api.getAttendanceByDateRange(startDate, endDate)
      
      const attendanceArray = Array.isArray(allAttendanceData) ? allAttendanceData : []
      
      const teamAttendance = attendanceArray.filter(att => {
        if (!att || !att.employeeId) return false
        
        let attEmpId
        if (typeof att.employeeId === 'string') {
          attEmpId = parseInt(att.employeeId)
          if (isNaN(attEmpId)) {
            attEmpId = att.employeeId
          }
        } else {
          attEmpId = att.employeeId
        }
        
        return teamMemberIdsSet.has(attEmpId) || 
               (typeof attEmpId === 'number' && teamMemberIdsSet.has(attEmpId)) ||
               (typeof attEmpId === 'string' && teamMemberIdsSet.has(parseInt(attEmpId)))
      })
      
      const normalizedAttendance = teamAttendance.map(att => {
        let recordDate = att.date
        if (typeof recordDate === 'string') {
          recordDate = recordDate.split('T')[0]
        } else if (recordDate instanceof Date) {
          recordDate = format(recordDate, 'yyyy-MM-dd')
        } else if (recordDate) {
          try {
            recordDate = format(new Date(recordDate), 'yyyy-MM-dd')
          } catch {
            recordDate = selectedDate
          }
        } else {
          recordDate = selectedDate
        }
        return { ...att, date: recordDate }
      })
      
      setAllAttendance(normalizedAttendance)
      
      if (viewType === 'daily') {
        const dateAttendance = normalizedAttendance.filter(a => {
          let recordDate
          if (typeof a.date === 'string') {
            recordDate = a.date.split('T')[0]
          } else {
            try {
              recordDate = format(new Date(a.date), 'yyyy-MM-dd')
            } catch {
              recordDate = ''
            }
          }
          return recordDate === selectedDate
        })
        setAttendance(dateAttendance)
      } else {
        setAttendance(normalizedAttendance)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      setError('Failed to load attendance data: ' + (error.message || 'Unknown error'))
      setAttendance([])
      setAllAttendance([])
    } finally {
      setLoading(false)
    }
  }

  const getDaysForView = () => {
    const dateObj = new Date(selectedDate)
    if (viewType === 'daily') {
      return [dateObj]
    } else if (viewType === 'weekly') {
      const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: weekStart, end: endOfWeek(dateObj, { weekStartsOn: 1 }) })
    } else if (viewType === 'monthly') {
      const monthStart = startOfMonth(dateObj)
      const monthEnd = endOfMonth(dateObj)
      return eachDayOfInterval({ start: monthStart, end: monthEnd })
    }
    return []
  }

  const getAttendanceStatus = (employeeId, date = null) => {
    const checkDate = date || selectedDate
    if (!employeeId || !checkDate) return null
    
    let normalizedEmpId
    if (typeof employeeId === 'string') {
      normalizedEmpId = parseInt(employeeId)
      if (isNaN(normalizedEmpId)) {
        normalizedEmpId = employeeId
      }
    } else {
      normalizedEmpId = employeeId
    }
    
    const attendanceDataToSearch = (viewType === 'weekly' || viewType === 'monthly') ? allAttendance : attendance
    
    if (!attendanceDataToSearch || attendanceDataToSearch.length === 0) {
      return null
    }
    
    return attendanceDataToSearch.find(a => {
      if (!a || !a.employeeId) return false
      
      let attEmpId
      if (typeof a.employeeId === 'string') {
        attEmpId = parseInt(a.employeeId)
        if (isNaN(attEmpId)) {
          attEmpId = a.employeeId
        }
      } else {
        attEmpId = a.employeeId
      }
      
      const attNum = typeof attEmpId === 'number' ? attEmpId : (typeof attEmpId === 'string' && !isNaN(parseInt(attEmpId)) ? parseInt(attEmpId) : null)
      const normNum = typeof normalizedEmpId === 'number' ? normalizedEmpId : (typeof normalizedEmpId === 'string' && !isNaN(parseInt(normalizedEmpId)) ? parseInt(normalizedEmpId) : null)
      
      if (attNum !== null && normNum !== null) {
        if (attNum !== normNum) return false
      } else {
        if (String(attEmpId) !== String(normalizedEmpId)) return false
      }
      
      let recordDate
      if (typeof a.date === 'string') {
        recordDate = a.date.split('T')[0].split(' ')[0]
      } else if (a.date instanceof Date) {
        recordDate = format(a.date, 'yyyy-MM-dd')
      } else if (a.date) {
        try {
          recordDate = format(new Date(a.date), 'yyyy-MM-dd')
        } catch {
          return false
        }
      } else {
        return false
      }
      
      let normalizedCheckDate = checkDate
      if (checkDate.includes('T')) {
        normalizedCheckDate = checkDate.split('T')[0]
      }
      
      return recordDate === normalizedCheckDate
    })
  }

  const filteredTeamMembers = teamMembers.filter(emp => {
    const searchLower = (searchTerm || '').toLowerCase().trim()
    if (searchLower) {
      const name = (emp.name || '').toLowerCase()
      const email = (emp.email || '').toLowerCase()
      const department = (emp.department || '').toLowerCase()
      if (!name.includes(searchLower) && !email.includes(searchLower) && !department.includes(searchLower)) {
        return false
      }
    }
    
    if (statusFilter === 'All') return true
    
    const empId = emp.id || emp.employeeId
    const normalizedEmpId = typeof empId === 'string' ? parseInt(empId) : empId
    
    if (viewType === 'daily') {
      const record = getAttendanceStatus(normalizedEmpId, selectedDate)
      const statusLower = (record?.status || '').toString().toLowerCase()
      const isExplicitAbsent = statusLower === 'absent'
      const isPresent = record && (
        statusLower === 'present' || 
        record.checkIn || 
        record.checkInTime
      ) && !isExplicitAbsent
      const isPast = isBefore(new Date(selectedDate), startOfToday())
      const dayOfWeek = getDay(new Date(selectedDate))
      const isAutoAbsent = !record && isPast && dayOfWeek !== 0
      
      if (statusFilter === 'Present') return isPresent
      if (statusFilter === 'Absent') return isExplicitAbsent || isAutoAbsent
    } else {
      const record = allAttendance.find(a => {
        const attEmpId = typeof a.employeeId === 'string' ? parseInt(a.employeeId) : a.employeeId
        return attEmpId === normalizedEmpId || 
               parseInt(a.employeeId) === normalizedEmpId ||
               a.employeeId === normalizedEmpId?.toString() ||
               parseInt(a.employeeId) === parseInt(normalizedEmpId)
      })
      
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Present' && record && (record.status === 'Present' || record.checkIn || record.checkInTime)) ||
        (statusFilter === 'Absent' && (!record || record.status === 'Absent'))
      
      return matchesStatus
    }
    
    return true
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Team Attendance</h1>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 md:mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* View Type Toggle */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              onClick={() => {
                setViewType('daily')
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'daily'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => {
                setViewType('weekly')
                const today = new Date()
                const weekStart = startOfWeek(today, { weekStartsOn: 1 })
                setSelectedDate(format(weekStart, 'yyyy-MM-dd'))
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'weekly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => {
                setViewType('monthly')
                const today = new Date()
                const monthStart = startOfMonth(today)
                setSelectedDate(format(monthStart, 'yyyy-MM-dd'))
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {viewType === 'daily' && (
              <>
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate)
                    const prevDay = subDays(currentDate, 1)
                    setSelectedDate(format(prevDay, 'yyyy-MM-dd'))
                  }}
                  className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate)
                    const nextDay = addDays(currentDate, 1)
                    setSelectedDate(format(nextDay, 'yyyy-MM-dd'))
                  }}
                  className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                  className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                >
                  Today
                </button>
              </>
            )}
            {viewType === 'weekly' && (
              <>
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate)
                    const prevWeek = subWeeks(currentDate, 1)
                    setSelectedDate(format(startOfWeek(prevWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
                  }}
                  className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg">
                  {format(startOfWeek(new Date(selectedDate), { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(new Date(selectedDate), { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                </div>
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate)
                    const nextWeek = addWeeks(currentDate, 1)
                    setSelectedDate(format(startOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
                  }}
                  className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    setSelectedDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
                  }}
                  className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  This Week
                </button>
              </>
            )}
            {viewType === 'monthly' && (
              <>
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate)
                    const prevMonth = subMonths(currentDate, 1)
                    setSelectedDate(format(startOfMonth(prevMonth), 'yyyy-MM-dd'))
                  }}
                  className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg">
                  {format(new Date(selectedDate), 'MMMM yyyy')}
                </div>
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate)
                    const nextMonth = addMonths(currentDate, 1)
                    setSelectedDate(format(startOfMonth(nextMonth), 'yyyy-MM-dd'))
                  }}
                  className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    setSelectedDate(format(startOfMonth(today), 'yyyy-MM-dd'))
                  }}
                  className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  This Month
                </button>
              </>
            )}
          </div>

          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[220px] px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[640px]">
            <thead className="bg-blue-50">
              <tr>
                {viewType === 'daily' && (
                  <>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 sticky left-0 bg-blue-50 z-10">
                      Employee
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 hidden sm:table-cell">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Check In</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Check Out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Working Hours</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  </>
                )}
                {(viewType === 'weekly' || viewType === 'monthly') && (
                  <>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 sticky left-0 bg-blue-50 z-10">
                      Employee
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 hidden sm:table-cell">Department</th>
                    {getDaysForView().map((day, idx) => (
                      <th key={idx} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 min-w-[100px]">
                        <div className="flex flex-col">
                          <span>{format(day, 'EEE')}</span>
                          <span className="text-xs font-normal">{format(day, 'MMM dd')}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">Total Hours</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">Present Days</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={
                    viewType === 'daily' 
                      ? 7
                      : (viewType === 'weekly' 
                          ? (2 + 7 + 2)
                          : (viewType === 'monthly'
                              ? (2 + getDaysForView().length + 2)
                              : 7))
                  } className="px-6 py-8 text-center text-gray-500">
                    Loading attendance data...
                  </td>
                </tr>
              ) : filteredTeamMembers.length === 0 ? (
                <tr>
                  <td colSpan={
                    viewType === 'daily' 
                      ? 7
                      : (viewType === 'weekly' 
                          ? (2 + 7 + 2)
                          : (viewType === 'monthly'
                              ? (2 + getDaysForView().length + 2)
                              : 7))
                  } className="px-6 py-8 text-center text-gray-500">
                    No attendance records found {viewType === 'daily' ? 'for this date' : viewType === 'weekly' ? 'for this week' : 'for this month'}
                  </td>
                </tr>
              ) : (
                filteredTeamMembers.map((employee) => {
                  const employeeName = employee.name || 'Unknown'
                  let empId = employee.id || employee.employeeId
                  if (empId && typeof empId === 'string') {
                    const parsed = parseInt(empId)
                    empId = isNaN(parsed) ? empId : parsed
                  }
                  
                  if (viewType === 'weekly' || viewType === 'monthly') {
                    const days = getDaysForView()
                    let totalHours = 0
                    let presentDays = 0
                    
                    days.forEach(day => {
                      const dayStr = format(day, 'yyyy-MM-dd')
                      const dayRecord = empId ? getAttendanceStatus(empId, dayStr) : null
                      if (dayRecord) {
                        if (dayRecord.workingHours) {
                          totalHours += parseFloat(dayRecord.workingHours) || 0
                        }
                        const statusLower = (dayRecord.status || '').toString().toLowerCase()
                        if (statusLower === 'present' || dayRecord.checkIn || dayRecord.checkInTime) {
                          presentDays++
                        }
                      }
                    })
                    
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {employeeName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {employee.department || 'N/A'}
                        </td>
                        {days.map((day, idx) => {
                          const dayStr = format(day, 'yyyy-MM-dd')
                          const dayRecord = empId ? getAttendanceStatus(empId, dayStr) : null
                          const statusLower = (dayRecord?.status || '').toString().toLowerCase()
                          const isExplicitAbsent = statusLower === 'absent'
                          const isPresent = dayRecord && (
                            statusLower === 'present' || 
                            dayRecord.checkIn || 
                            dayRecord.checkInTime
                          ) && !isExplicitAbsent
                          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          const isPast = isBefore(day, startOfToday())
                          const dayOfWeek = getDay(day)
                          const isAutoAbsent = !dayRecord && isPast && dayOfWeek !== 0
                          
                          return (
                            <td 
                              key={idx} 
                              className="relative group px-2 py-3 text-center"
                            >
                              <AttendanceHoverTooltip record={dayRecord} />
                              {isPresent ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="inline-flex">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  </div>
                                  {dayRecord.workingHours && (
                                    <span className="text-xs font-semibold text-gray-700">
                                      {parseFloat(dayRecord.workingHours).toFixed(1)}h
                                    </span>
                                  )}
                                </div>
                              ) : isExplicitAbsent || isAutoAbsent ? (
                                <X className="w-5 h-5 text-red-600" />
                              ) : (
                                <span className={`text-gray-400 ${isToday ? 'font-semibold' : ''}`}>-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          {totalHours > 0 ? `${totalHours.toFixed(1)}h` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          {presentDays}/{days.length}
                        </td>
                      </tr>
                    )
                  }
                  
                  // Daily view
                  const record = getAttendanceStatus(empId)
                  const selectedDateObj = new Date(selectedDate)
                  const dayOfWeek = getDay(selectedDateObj)
                  const isPast = isBefore(selectedDateObj, startOfToday())
                  const isSunday = dayOfWeek === 0
                  const isAutoAbsent = !record && isPast && !isSunday
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {employeeName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                        {employee.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(selectedDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record?.checkIn ? (
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            {record.checkIn}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record?.checkOut ? (
                          <span className="flex items-center gap-1 text-blue-600 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            {record.checkOut}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record?.workingHours ? (
                          <span className="font-semibold">{parseFloat(record.workingHours).toFixed(2)}h</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record?.status === 'Present' 
                            ? 'bg-green-100 text-green-800' 
                            : record?.status === 'Absent' || isAutoAbsent
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record?.status || (isAutoAbsent ? 'Absent' : '-')}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TeamAttendance
