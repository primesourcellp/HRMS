import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle, LogOut, X, LogIn, Timer, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, getDaysInMonth, getDay, differenceInDays, parseISO, isAfter, isBefore, startOfToday } from 'date-fns'

const MyAttendance = () => {
  const navigate = useNavigate()
  const [myAttendanceData, setMyAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [canCheckOut, setCanCheckOut] = useState(false)
  const [viewType, setViewType] = useState('daily') // 'daily', 'weekly', 'monthly', 'calendar'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [calendarAttendance, setCalendarAttendance] = useState([])
  
  // Leave application modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [leaveFormData, setLeaveFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    halfDayType: 'FIRST_HALF'
  })
  const [calculatedDays, setCalculatedDays] = useState(0)
  const [validationError, setValidationError] = useState('')
  
  const employeeId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
  const userRole = localStorage.getItem('userRole')
  const isHrAdmin = userRole === 'HR_ADMIN'
  const currentUserId = localStorage.getItem('userId')

  useEffect(() => {
    const allowedRoles = ['HR_ADMIN', 'FINANCE']
    if (!allowedRoles.includes(userRole) || !employeeId) {
      setError('Access denied. This page is only for HR Administrators and Finance users.')
      return
    }
    loadTodayAttendance()
    if (viewType === 'calendar') {
      loadCalendarData()
    } else {
      loadMyAttendance()
    }
  }, [employeeId, selectedDate, viewType])

  useEffect(() => {
    if (viewType === 'calendar') {
      loadCalendarData()
    }
  }, [selectedMonth, selectedYear])

  const loadMyAttendance = async () => {
    if (!employeeId) return
    
    setLoading(true)
    try {
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
      } else {
        startDate = selectedDate
        endDate = selectedDate
      }
      
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined') {
        setError('Invalid date range. Please select a valid date.')
        setTimeout(() => setError(null), 5000)
        setLoading(false)
        return
      }
      
      const attendanceData = await api.getAttendanceByEmployeeDateRange(employeeId, startDate, endDate)
      setMyAttendanceData(Array.isArray(attendanceData) ? attendanceData : [])
    } catch (error) {
      console.error('Error loading my attendance:', error)
      setError('Failed to load attendance data')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendarData = async () => {
    if (!employeeId) return
    
    setLoading(true)
    try {
      if (!selectedMonth || !selectedYear || selectedMonth < 1 || selectedMonth > 12 || !selectedYear || isNaN(selectedYear)) {
        setError('Invalid month or year selected')
        setTimeout(() => setError(null), 5000)
        setLoading(false)
        return
      }
      
      const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd')
      const endDate = format(new Date(selectedYear, selectedMonth, 0), 'yyyy-MM-dd')
      
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined' || startDate.includes('Invalid') || endDate.includes('Invalid')) {
        setError('Invalid date range. Please select a valid month and year.')
        setTimeout(() => setError(null), 5000)
        setLoading(false)
        return
      }
      
      const attendanceData = await api.getAttendanceByEmployeeDateRange(employeeId, startDate, endDate)
      setCalendarAttendance(Array.isArray(attendanceData) ? attendanceData : [])
    } catch (error) {
      console.error('Error loading calendar data:', error)
      setError('Failed to load calendar data')
      setTimeout(() => setError(null), 5000)
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

  const getDaysInSelectedMonth = () => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }

  const getAttendanceForDay = (day) => {
    const dateStr = format(new Date(selectedYear, selectedMonth - 1, day), 'yyyy-MM-dd')
    return calendarAttendance.find(att => {
      let recordDate
      if (typeof att.date === 'string') {
        recordDate = att.date.split('T')[0]
      } else {
        try {
          recordDate = format(new Date(att.date), 'yyyy-MM-dd')
        } catch {
          recordDate = ''
        }
      }
      return recordDate === dateStr
    })
  }

  const getAttendanceStatus = (date) => {
    const checkDate = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')
    return myAttendanceData.find(a => {
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
      return recordDate === checkDate
    })
  }

  const handleDateChange = (direction) => {
    const dateObj = new Date(selectedDate)
    let newDate
    
    if (viewType === 'daily') {
      newDate = direction === 'next' ? addDays(dateObj, 1) : subDays(dateObj, 1)
    } else if (viewType === 'weekly') {
      newDate = direction === 'next' ? addWeeks(dateObj, 1) : subWeeks(dateObj, 1)
    } else if (viewType === 'monthly') {
      newDate = direction === 'next' ? addMonths(dateObj, 1) : subMonths(dateObj, 1)
    } else {
      newDate = dateObj
    }
    
    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
  }

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const goToThisWeek = () => {
    const today = new Date()
    setSelectedDate(format(today, 'yyyy-MM-dd'))
    setViewType('weekly')
  }

  const goToThisMonth = () => {
    const today = new Date()
    setSelectedDate(format(today, 'yyyy-MM-dd'))
    setViewType('monthly')
  }

  const formatWorkingHours = (hours) => {
    if (!hours && hours !== 0) return '-'
    const totalMinutes = Math.round(hours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`
    } else if (h > 0) {
      return `${h}h`
    } else if (m > 0) {
      return `${m}m`
    } else {
      return '0m'
    }
  }

  const loadTodayAttendance = async () => {
    if (!employeeId) return
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const todayAtt = await api.getAttendanceByEmployee(employeeId)
      const todayRecord = Array.isArray(todayAtt) ? todayAtt.find(a => {
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
        return recordDate === today
      }) : null
      
      setTodayAttendance(todayRecord)
      setCanCheckIn(!todayRecord || !todayRecord.checkIn)
      setCanCheckOut(todayRecord && todayRecord.checkIn && !todayRecord.checkOut)
    } catch (error) {
      console.error('Error loading today attendance:', error)
    }
  }

  const handleCheckIn = async () => {
    if (!employeeId) return
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkInData = {
        employeeId,
        date: today,
        checkInTime: currentTime,
        method: 'WEB'
      }
      
      await api.checkIn(checkInData)
      setSuccessMessage('Check-in successful!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadTodayAttendance()
      if (viewType === 'calendar') {
        await loadCalendarData()
      } else {
        await loadMyAttendance()
      }
    } catch (error) {
      setError(error.message || 'Error checking in')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!employeeId) return
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkOutData = {
        employeeId,
        date: today,
        checkOutTime: currentTime
      }
      
      await api.checkOut(checkOutData)
      setSuccessMessage('Check-out successful!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadTodayAttendance()
      if (viewType === 'calendar') {
        await loadCalendarData()
      } else {
        await loadMyAttendance()
      }
    } catch (error) {
      setError(error.message || 'Error checking out')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const allowedRoles = ['HR_ADMIN', 'FINANCE']
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to HR Administrators and Finance users.</p>
        </div>
      </div>
    )
  }

  const userName = localStorage.getItem('userName') || 'User'
  const userEmail = localStorage.getItem('userEmail') || ''

  const handleApplyLeave = () => {
    // Navigate to leave management page
    navigate('/leave')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">My Attendance</h1>
        {isHrAdmin && (
          <button
            onClick={handleApplyLeave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <FileText className="w-4 h-4" />
            Apply Leave
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters and Today's Attendance Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* View Type Toggle and Date Navigation */}
        <div className="bg-white rounded-xl shadow-md p-3 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <button
              onClick={() => setViewType('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewType('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewType('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
          </div>

          {/* Date Navigation */}
          {viewType !== 'calendar' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => handleDateChange('next')}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
              {viewType === 'weekly' && (
                <button
                  onClick={goToThisWeek}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  This Week
                </button>
              )}
              {viewType === 'monthly' && (
                <button
                  onClick={goToThisMonth}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  This Month
                </button>
              )}
            </div>
          )}
        </div>

        {/* Today's Attendance Card */}
        {employeeId && (
          <div className="bg-white rounded-xl shadow-md p-3 border border-blue-200 lg:w-80">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Today's Attendance</h2>
                <p className="text-xs text-gray-600">{format(new Date(), 'EEE, MMM dd, yyyy')}</p>
              </div>
              {todayAttendance && (
                <div className="space-y-1.5">
                  {todayAttendance.checkIn && (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <LogIn className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Check-in: {todayAttendance.checkIn}</span>
                    </div>
                  )}
                  {todayAttendance.checkOut && (
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Check-out: {todayAttendance.checkOut}</span>
                    </div>
                  )}
                  {todayAttendance.workingHours && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Timer className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Working Hours: {formatWorkingHours(todayAttendance.workingHours)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-1.5 pt-1">
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Check In
                  </button>
                )}
                {canCheckOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewType === 'calendar' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Calendar View</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button
                onClick={loadCalendarData}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
            </div>
          </div>

          {/* Calendar Grid Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading calendar data...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 border border-gray-200 sticky left-0 bg-blue-50 z-10">
                      Employee Name
                    </th>
                    {getDaysInSelectedMonth().map(day => {
                      const date = new Date(selectedYear, selectedMonth - 1, day)
                      const dayOfWeek = getDay(date)
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      return (
                        <th
                          key={day}
                          className={`px-2 py-3 text-center text-xs font-bold uppercase tracking-wider border border-gray-200 min-w-[50px] ${
                            isWeekend ? 'bg-yellow-50' : 'bg-blue-50'
                          }`}
                        >
                          {day}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 border border-gray-200 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{userName}</div>
                          <div className="text-xs text-gray-500">{userEmail}</div>
                        </div>
                      </div>
                    </td>
                    {getDaysInSelectedMonth().map(day => {
                      const date = new Date(selectedYear, selectedMonth - 1, day)
                      const dayOfWeek = getDay(date)
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      const attendanceRecord = getAttendanceForDay(day)
                      const isPresent = attendanceRecord && attendanceRecord.status === 'Present'
                      
                      return (
                        <td
                          key={day}
                          className={`px-2 py-3 text-center border border-gray-200 ${
                            isWeekend ? 'bg-yellow-50' : ''
                          }`}
                        >
                          {isPresent ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : attendanceRecord ? (
                            <X className="w-5 h-5 text-red-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attendance History Table */}
      {viewType !== 'calendar' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {viewType === 'daily' ? 'Daily Attendance' : viewType === 'weekly' ? 'Weekly Attendance' : 'Monthly Attendance'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading attendance data...</div>
              </div>
            ) : myAttendanceData.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No attendance records found {viewType === 'daily' ? 'for this date' : viewType === 'weekly' ? 'for this week' : 'for this month'}</div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                    {(viewType === 'daily' || viewType === 'weekly' || viewType === 'monthly') && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Working Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {viewType === 'daily' ? (
                    // Daily view - single record
                    (() => {
                      const record = getAttendanceStatus(selectedDate)
                      if (!record) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-4 py-2 text-center text-xs text-gray-500">
                              No attendance record for {format(new Date(selectedDate), 'MMM dd, yyyy')}
                            </td>
                          </tr>
                        )
                      }
                      const formattedDate = format(new Date(selectedDate), 'MMM dd, yyyy')
                      const workingHoursValue = record.workingHours || (record.checkIn && record.checkOut ? 
                        ((new Date(`2000-01-01 ${record.checkOut}`) - new Date(`2000-01-01 ${record.checkIn}`)) / (1000 * 60 * 60)) : null)
                      
                      return (
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {formattedDate}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {record.checkIn ? (
                              <div className="flex items-center gap-1.5 text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {record.checkIn}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {record.checkOut ? (
                              <div className="flex items-center gap-1.5 text-blue-600">
                                <LogOut className="w-3.5 h-3.5" />
                                {record.checkOut}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {formatWorkingHours(workingHoursValue)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              record.status === 'Present' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status || 'Absent'}
                            </span>
                          </td>
                        </tr>
                      )
                    })()
                  ) : (
                    // Weekly/Monthly view - multiple records
                    myAttendanceData
                      .sort((a, b) => {
                        const dateA = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd')
                        const dateB = typeof b.date === 'string' ? b.date.split('T')[0] : format(new Date(b.date), 'yyyy-MM-dd')
                        return dateB.localeCompare(dateA) // Sort descending (newest first)
                      })
                      .map((record, index) => {
                        let recordDate
                        if (typeof record.date === 'string') {
                          recordDate = record.date.split('T')[0]
                        } else {
                          try {
                            recordDate = format(new Date(record.date), 'yyyy-MM-dd')
                          } catch {
                            recordDate = ''
                          }
                        }
                        const formattedDate = recordDate ? format(new Date(recordDate), 'MMM dd, yyyy') : 'N/A'
                        const workingHoursValue = record.workingHours || (record.checkIn && record.checkOut ? 
                          ((new Date(`2000-01-01 ${record.checkOut}`) - new Date(`2000-01-01 ${record.checkIn}`)) / (1000 * 60 * 60)) : null)
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                              {formattedDate}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                              {record.checkIn ? (
                                <div className="flex items-center gap-1.5 text-green-600">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {record.checkIn}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                              {record.checkOut ? (
                                <div className="flex items-center gap-1.5 text-blue-600">
                                  <LogOut className="w-3.5 h-3.5" />
                                  {record.checkOut}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                              {formatWorkingHours(workingHoursValue)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                record.status === 'Present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status || 'Absent'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && isHrAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Calendar size={24} className="text-blue-600" />
                Apply for Leave
              </h3>
              <button
                onClick={() => {
                  setShowLeaveModal(false)
                  resetLeaveForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {validationError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{validationError}</p>
              </div>
            )}
            <form onSubmit={handleLeaveSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type *</label>
                  <select
                    value={leaveFormData.leaveTypeId}
                    onChange={async (e) => {
                      setLeaveFormData({ ...leaveFormData, leaveTypeId: e.target.value })
                      if (e.target.value && currentUserId) {
                        const selectedType = leaveTypes.find(t => t.id === parseInt(e.target.value))
                        const currentBalance = getLeaveBalance(parseInt(e.target.value))
                        if (currentBalance === 0 && selectedType && selectedType.maxDays && selectedType.maxDays > 0) {
                          try {
                            await api.initializeLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                            const balances = await api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear())
                            setLeaveBalances(Array.isArray(balances) ? balances : [])
                            if (validationError && validationError.includes('Insufficient leave balance')) {
                              setValidationError('')
                            }
                          } catch (error) {
                            console.error('Error initializing balance for leave type:', error)
                          }
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                    disabled={leaveTypes.length === 0}
                  >
                    <option value="">
                      {leaveTypes.length === 0 ? 'No leave types available' : 'Select Leave Type'}
                    </option>
                    {leaveTypes.map(type => {
                      const balance = getLeaveBalance(type.id)
                      return (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.maxDays ? `(Max: ${type.maxDays} days)` : ''} (Balance: {balance.toFixed(1)})
                        </option>
                      )
                    })}
                  </select>
                  {leaveTypes.length === 0 && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Please create leave types in Leave Management page first
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Half Day</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leaveFormData.halfDay}
                        onChange={(e) => setLeaveFormData({ ...leaveFormData, halfDay: e.target.checked })}
                        className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Half Day</span>
                    </label>
                    {leaveFormData.halfDay && (
                      <select
                        value={leaveFormData.halfDayType}
                        onChange={(e) => setLeaveFormData({ ...leaveFormData, halfDayType: e.target.value })}
                        className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FIRST_HALF">First Half</option>
                        <option value="SECOND_HALF">Second Half</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={leaveFormData.startDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={leaveFormData.endDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min={leaveFormData.startDate || undefined}
                  />
                </div>
              </div>
              {calculatedDays > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-blue-600" />
                    <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Leave Summary</p>
                  </div>
                  <p className="text-base text-blue-900 font-semibold">
                    <strong>Total Days:</strong> {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                    {leaveFormData.leaveTypeId && (
                      <span className="ml-3 text-sm">
                        (Available Balance: <span className="font-bold">{getLeaveBalance(parseInt(leaveFormData.leaveTypeId)).toFixed(1)} days</span>)
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason *</label>
                <textarea
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  required
                  placeholder="Please provide a reason for your leave application..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false)
                    resetLeaveForm()
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyAttendance

