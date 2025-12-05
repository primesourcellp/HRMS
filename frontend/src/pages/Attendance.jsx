import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Calendar, Search, Smartphone, Monitor, TrendingUp, CalendarDays, Timer, CheckCircle2, Edit, X, Download, Filter, Network } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'

const Attendance = () => {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([]) // All attendance records for employee
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [markFormData, setMarkFormData] = useState({
    status: 'Present',
    checkIn: '',
    checkOut: ''
  })
  const [error, setError] = useState(null)
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const currentUserId = localStorage.getItem('userId')

  useEffect(() => {
    // Check if user is an employee
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    const isEmp = userType === 'employee'
    const empId = userId ? parseInt(userId) : null
    setIsEmployee(isEmp)
    setEmployeeId(empId)
    loadData(isEmp, empId)
  }, [selectedDate])

  const loadData = async (isEmp = null, empId = null) => {
    try {
      // Use provided values or fall back to state
      const userIsEmployee = isEmp !== null ? isEmp : isEmployee
      const userEmployeeId = empId !== null ? empId : employeeId
      
      if (userIsEmployee && userEmployeeId) {
        // For employees, only load their own data
        const [empData, attData, shiftsData] = await Promise.all([
          api.getEmployees(),
          api.getAttendanceByEmployee(userEmployeeId),
          api.getActiveShifts()
        ])
        // Filter to only show the logged-in employee
        const currentEmployee = Array.isArray(empData) ? empData.find(emp => emp.id === userEmployeeId) : null
        setEmployees(currentEmployee ? [currentEmployee] : [])
        // Store all attendance records - ensure it's an array
        const attendanceArray = Array.isArray(attData) ? attData : []
        setAllAttendance(attendanceArray)
        // Filter attendance for selected date
        const dateAttendance = attendanceArray.filter(a => {
          const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
          return recordDate === selectedDate
        })
        setAttendance(dateAttendance)
        setShifts(Array.isArray(shiftsData) ? shiftsData : [])
      } else {
        // For admins, load all data
      const [empData, attData, shiftsData] = await Promise.all([
        api.getEmployees(),
        api.getAttendanceByDate(selectedDate),
        api.getActiveShifts()
      ])
        setEmployees(Array.isArray(empData) ? empData : [])
        setAttendance(Array.isArray(attData) ? attData : [])
        setShifts(Array.isArray(shiftsData) ? shiftsData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }


  const getAttendanceStatus = (employeeId) => {
    return attendance.find(a => {
      const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
      return a.employeeId === employeeId && recordDate === selectedDate
    })
  }

  const handleCheckIn = async (employeeId) => {
    setLoading(true)
    setError(null)
    try {
      const checkInData = {
        employeeId,
        date: selectedDate,
        checkInTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        shiftId: null,
        method: 'WEB' // Laptops use WEB method, IP address captured automatically by backend
      }
      const response = await api.checkIn(checkInData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-in failed')
      }
      await loadData()
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
      successMsg.style.opacity = '1'
      successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Check-in successful! Login time and IP address recorded.</span>'
      document.body.appendChild(successMsg)
      
      setTimeout(() => {
        successMsg.style.opacity = '0'
        setTimeout(() => {
          if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg)
          }
        }, 300)
      }, 3000)
    } catch (error) {
      setError(error.message || 'Error checking in')
      alert('Error checking in: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (employeeId) => {
    setLoading(true)
    setError(null)
    try {
      const checkOutData = {
        employeeId,
        date: selectedDate,
        checkOutTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        method: 'WEB' // Laptops use WEB method, IP address captured automatically by backend
      }
      const response = await api.checkOut(checkOutData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-out failed')
      }
      await loadData()
      
      // Show success message with working hours
      const workingHours = response.attendance?.workingHours || 0
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
      successMsg.style.opacity = '1'
      successMsg.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Check-out successful! Logout time and IP address recorded. Total working hours: ${workingHours.toFixed(2)}h</span>`
      document.body.appendChild(successMsg)
      
      setTimeout(() => {
        successMsg.style.opacity = '0'
        setTimeout(() => {
          if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg)
          }
        }, 300)
      }, 4000)
    } catch (error) {
      setError(error.message || 'Error checking out')
      alert('Error checking out: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    if (!markFormData.status) {
      alert('Please select a status')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const markData = {
        employeeId: selectedEmployee.id,
        date: selectedDate,
        status: markFormData.status,
        checkIn: markFormData.checkIn || null,
        checkOut: markFormData.checkOut || null
      }
      await api.markAttendance(markData)
      await loadData()
      setShowMarkModal(false)
      setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
      setSelectedEmployee(null)
      alert('Attendance marked successfully')
    } catch (error) {
      setError(error.message || 'Error marking attendance')
      alert('Error marking attendance: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleEditAttendance = async (e) => {
    e.preventDefault()
    if (!markFormData.status) {
      alert('Please select a status')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const markData = {
        employeeId: selectedRecord.employeeId,
        date: selectedRecord.date,
        status: markFormData.status,
        checkIn: markFormData.checkIn || null,
        checkOut: markFormData.checkOut || null
      }
      await api.markAttendance(markData)
      await loadData()
      setShowEditModal(false)
      setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
      setSelectedRecord(null)
      alert('Attendance updated successfully')
    } catch (error) {
      setError(error.message || 'Error updating attendance')
      alert('Error updating attendance: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleExportAttendance = () => {
    try {
      const exportData = attendance.map(record => {
        const employee = employees.find(emp => emp.id === record.employeeId)
        return {
          Date: record.date,
          Employee: employee?.name || 'Unknown',
          Department: employee?.department || 'N/A',
          'Check In': record.checkIn || '-',
          'Check In IP': record.checkInIpAddress || '-',
          'Check Out': record.checkOut || '-',
          'Check Out IP': record.checkOutIpAddress || '-',
          'Working Hours': record.workingHours ? `${record.workingHours.toFixed(2)}h` : '-',
          Status: record.status || 'N/A',
          'Overtime Hours': record.overtimeHours ? `${record.overtimeHours.toFixed(2)}h` : '-',
          'Undertime Hours': record.undertimeHours ? `${record.undertimeHours.toFixed(2)}h` : '-'
        }
      })

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `attendance_${selectedDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert('Attendance data exported successfully')
    } catch (error) {
      alert('Error exporting data: ' + error.message)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const record = getAttendanceStatus(emp.id)
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Present' && record?.status === 'Present') ||
      (statusFilter === 'Absent' && record?.status === 'Absent') ||
      (statusFilter === 'Not Marked' && !record)
    
    return matchesSearch && matchesStatus
  })

  // Get today's attendance record
  const todayRecord = isEmployee && employeeId && Array.isArray(allAttendance)
    ? allAttendance.find(a => {
        const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
        return recordDate === format(new Date(), 'yyyy-MM-dd')
      })
    : attendance.find(a => {
        const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
        return recordDate === format(new Date(), 'yyyy-MM-dd')
      })

  // Calculate stats for employee
  const calculateStats = () => {
    if (!isEmployee || !allAttendance.length) return null

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const weekRecords = Array.isArray(allAttendance) ? allAttendance.filter(a => {
      try {
        const dateStr = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd')
        const recordDate = parseISO(dateStr)
        return recordDate >= weekStart && recordDate <= weekEnd
      } catch {
        return false
      }
    }) : []

    const monthRecords = Array.isArray(allAttendance) ? allAttendance.filter(a => {
      try {
        const dateStr = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd')
        const recordDate = parseISO(dateStr)
        return recordDate >= monthStart
      } catch {
        return false
      }
    }) : []

    const weeklyHours = weekRecords.reduce((sum, a) => sum + (a.workingHours || 0), 0)
    const monthlyPresent = monthRecords.filter(a => a.status === 'Present').length
    const monthlyTotal = monthRecords.length
    const attendanceRate = monthlyTotal > 0 ? (monthlyPresent / monthlyTotal * 100).toFixed(1) : 0

    return {
      weeklyHours: weeklyHours.toFixed(1),
      monthlyPresent,
      monthlyTotal,
      attendanceRate
    }
  }

  const stats = calculateStats()

  // Get weekly calendar data
  const getWeeklyCalendar = () => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(today, { weekStartsOn: 1 }) })
    
    return weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRecord = Array.isArray(allAttendance) ? allAttendance.find(a => {
        const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
        return recordDate === dayStr
      }) : null
      
      return {
        date: day,
        dateStr: dayStr,
        dayName: format(day, 'EEE'),
        dayNumber: format(day, 'd'),
        isToday: isSameDay(day, today),
        record: dayRecord,
        status: dayRecord?.status || 'Not Marked'
      }
    })
  }

  const weeklyCalendar = isEmployee ? getWeeklyCalendar() : []

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-600">
            {isEmployee ? 'My Attendance' : 'Attendance Management'}
          </h2>
          <p className="text-gray-600 mt-1 font-medium">
            {isEmployee ? 'View and manage your attendance' : 'Track and manage employee attendance with IP address tracking'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none outline-none text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Employee View - Modern Card Design */}
      {isEmployee && employeeId && employees.length > 0 && (
        <>
          {/* Check In/Out Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Today's Attendance</h3>
                <p className="text-gray-500 text-xs">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div className={`p-2 rounded-full ${todayRecord?.status === 'Present' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {todayRecord?.status === 'Present' ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <Clock size={20} className="text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Check In</p>
                <p className="text-lg font-bold text-gray-800">
                  {todayRecord?.checkIn || '--:--'}
                </p>
                {todayRecord?.checkInMethod && (
                  <div className="flex items-center gap-1 mt-1">
                    {todayRecord.checkInMethod === 'MOBILE' ? (
                      <Smartphone size={12} className="text-green-500" />
                    ) : (
                      <Monitor size={12} className="text-blue-500" />
                    )}
                    <span className="text-xs text-gray-500">{todayRecord.checkInMethod}</span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Check Out</p>
                <p className="text-lg font-bold text-gray-800">
                  {todayRecord?.checkOut || '--:--'}
                </p>
                {todayRecord?.checkOutMethod && (
                  <div className="flex items-center gap-1 mt-1">
                    {todayRecord.checkOutMethod === 'MOBILE' ? (
                      <Smartphone size={12} className="text-green-500" />
                    ) : (
                      <Monitor size={12} className="text-blue-500" />
                    )}
                    <span className="text-xs text-gray-500">{todayRecord.checkOutMethod}</span>
                  </div>
                )}
              </div>
            {todayRecord?.workingHours && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-blue-600 text-xs mb-1">Hours</p>
                  <p className="text-lg font-bold text-gray-800">{todayRecord.workingHours.toFixed(2)}h</p>
              </div>
            )}
            </div>

            <div className="flex gap-2">
              {!todayRecord?.checkIn ? (
                <button
                  onClick={() => handleCheckIn(employeeId)}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle size={16} />
                  Check In
                </button>
              ) : !todayRecord?.checkOut ? (
                <button
                  onClick={() => handleCheckOut(employeeId)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <XCircle size={16} />
                  Check Out
                </button>
              ) : (
                <div className="flex-1 bg-green-500 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 size={16} />
                  Completed
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.weeklyHours}h</h3>
                <p className="text-sm text-gray-500">Weekly Hours</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.monthlyPresent}/{stats.monthlyTotal}</h3>
                <p className="text-sm text-gray-500">Monthly Attendance</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.attendanceRate}%</h3>
                <p className="text-sm text-gray-500">Attendance Rate</p>
              </div>
            </div>
          )}

          {/* Weekly Calendar */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarDays size={20} className="text-gray-600" />
              This Week
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {weeklyCalendar.map((day, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all ${
                    day.isToday
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : day.record?.status === 'Present'
                      ? 'border-gray-200 bg-gray-50'
                      : day.record?.status === 'Absent'
                      ? 'border-gray-200 bg-gray-100'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className="text-xs text-gray-500 mb-1 font-medium">{day.dayName}</p>
                  <p className={`text-lg font-bold mb-2 ${day.isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                    {day.dayNumber}
                  </p>
                  <div className="flex flex-col gap-1">
                    {day.record?.checkIn && (
                      <span className="text-xs text-gray-600 font-medium">{day.record.checkIn}</span>
                    )}
                    {day.record?.checkOut && (
                      <span className="text-xs text-gray-600 font-medium">{day.record.checkOut}</span>
                    )}
                    <span className={`text-xs font-semibold mt-1 ${
                      day.record?.status === 'Present' ? 'text-green-600' :
                      day.record?.status === 'Absent' ? 'text-red-600' :
                      'text-gray-400'
                    }`}>
                      {day.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attendance History */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Recent Attendance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {allAttendance
                    .sort((a, b) => {
                      const dateA = typeof a.date === 'string' ? a.date : a.date
                      const dateB = typeof b.date === 'string' ? b.date : b.date
                      return dateB.localeCompare(dateA)
                    })
                    .slice(0, 10)
                    .map((record) => {
                      const recordDate = typeof record.date === 'string' ? record.date.split('T')[0] : format(new Date(record.date), 'yyyy-MM-dd')
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {format(parseISO(recordDate), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.checkIn ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{record.checkIn}</span>
                                {record.checkInMethod === 'MOBILE' ? (
                                  <Smartphone className="text-green-500" size={16} />
                                ) : (
                                  <Monitor className="text-blue-500" size={16} />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.checkOut ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{record.checkOut}</span>
                                {record.checkOutMethod === 'MOBILE' ? (
                                  <Smartphone className="text-green-500" size={16} />
                                ) : (
                                  <Monitor className="text-blue-500" size={16} />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                            {record.workingHours ? `${record.workingHours.toFixed(2)}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.status === 'Present' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Admin View - Enhanced with full functionality */}
      {!isEmployee && (
        <>
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
                placeholder="Search by employee name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Not Marked">Not Marked</option>
            </select>
            {isAdmin && (
              <button
                onClick={handleExportAttendance}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                title="Export Attendance"
              >
                <Download size={18} />
                Export
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          )}


          {/* Attendance Table */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    const record = getAttendanceStatus(employee.id)
                    const isCurrentUser = employee.id.toString() === currentUserId

                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                              {employee.name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record?.checkIn ? (
                            <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{record.checkIn}</span>
                              {record.checkInMethod === 'MOBILE' ? (
                                <Smartphone className="text-green-500" size={16} />
                              ) : (
                                <Monitor className="text-blue-500" size={16} />
                              )}
                              </div>
                              {record.checkInIpAddress && (
                                <span className="text-xs text-gray-500" title="IP Address">
                                  IP: {record.checkInIpAddress}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record?.checkOut ? (
                            <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{record.checkOut}</span>
                              {record.checkOutMethod === 'MOBILE' ? (
                                <Smartphone className="text-green-500" size={16} />
                              ) : (
                                <Monitor className="text-blue-500" size={16} />
                              )}
                              </div>
                              {record.checkOutIpAddress && (
                                <span className="text-xs text-gray-500" title="IP Address">
                                  IP: {record.checkOutIpAddress}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record?.workingHours ? (
                            <div className="text-sm">
                              <span className="text-gray-900">{record.workingHours.toFixed(2)}h</span>
                              {record.overtimeHours > 0 && (
                                <span className="text-green-600 ml-2">+{record.overtimeHours.toFixed(2)}h OT</span>
                              )}
                              {record.undertimeHours > 0 && (
                                <span className="text-red-600 ml-2">-{record.undertimeHours.toFixed(2)}h UT</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Marked
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                            {isCurrentUser && (
                              <>
                              {!record?.checkIn ? (
                                <button
                                  onClick={() => handleCheckIn(employee.id)}
                                  disabled={loading}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                                >
                                  Check In
                                </button>
                              ) : !record?.checkOut ? (
                                <button
                                  onClick={() => handleCheckOut(employee.id)}
                                  disabled={loading}
                                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                                >
                                  Check Out
                                </button>
                              ) : (
                                  <span className="text-gray-500 text-xs">Completed</span>
                                )}
                              </>
                            )}
                            {isAdmin && (
                              <>
                                {record ? (
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(record)
                                      setMarkFormData({
                                        status: record.status || 'Present',
                                        checkIn: record.checkIn || '',
                                        checkOut: record.checkOut || ''
                                      })
                                      setShowEditModal(true)
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="Edit Attendance"
                                  >
                                    <Edit size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedEmployee(employee)
                                      setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
                                      setShowMarkModal(true)
                                    }}
                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                                    title="Mark Attendance"
                                  >
                                    Mark
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredEmployees.length === 0 && employees.length > 0 && (
              <div className="p-8 text-center">
                <Search className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500 font-medium mb-1">
                  {searchTerm || statusFilter !== 'All' 
                    ? 'No employees match your search criteria' 
                    : 'No employees found'}
                </p>
                {(searchTerm || statusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('All')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
            {employees.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No employees found. Please add employees first.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mark Attendance Modal (Admin) */}
      {showMarkModal && isAdmin && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-600">Mark Attendance</h3>
              <button
                onClick={() => {
                  setShowMarkModal(false)
                  setSelectedEmployee(null)
                  setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <input
                  type="text"
                  value={selectedEmployee.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={markFormData.status}
                  onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                <input
                  type="time"
                  value={markFormData.checkIn}
                  onChange={(e) => setMarkFormData({ ...markFormData, checkIn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
                <input
                  type="time"
                  value={markFormData.checkOut}
                  onChange={(e) => setMarkFormData({ ...markFormData, checkOut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkModal(false)
                    setSelectedEmployee(null)
                    setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal (Admin) */}
      {showEditModal && isAdmin && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-600">Edit Attendance</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRecord(null)
                  setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <input
                  type="text"
                  value={employees.find(emp => emp.id === selectedRecord.employeeId)?.name || 'Unknown'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={typeof selectedRecord.date === 'string' ? selectedRecord.date.split('T')[0] : format(new Date(selectedRecord.date), 'yyyy-MM-dd')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={markFormData.status}
                  onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                <input
                  type="time"
                  value={markFormData.checkIn}
                  onChange={(e) => setMarkFormData({ ...markFormData, checkIn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
                <input
                  type="time"
                  value={markFormData.checkOut}
                  onChange={(e) => setMarkFormData({ ...markFormData, checkOut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedRecord(null)
                    setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance

