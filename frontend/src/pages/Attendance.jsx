import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { Clock, CheckCircle, XCircle, Calendar, Search, Smartphone, Monitor, TrendingUp, CalendarDays, Timer, CheckCircle2, Edit, X, Download, Filter, Network } from 'lucide-react'
=======
import { Clock, CheckCircle, Calendar, Search, TrendingUp, CalendarDays, Timer, CheckCircle2, Edit, X, Download, Filter, Monitor, Smartphone, XCircle } from 'lucide-react'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
        setShifts(Array.isArray(shiftsData) ? shiftsData : [])
=======
        setShifts(Array.isArray(shiftsData) ? shiftsData : [])  
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
      const checkInData = {
        employeeId,
        date: selectedDate,
        checkInTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        shiftId: null,
        method: 'WEB' // Laptops use WEB method, IP address captured automatically by backend
      }
=======
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkInData = {
        employeeId,
        date: today,
        checkInTime: currentTime,
        shiftId: null,
        method: 'WEB'
      }
      
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
      const response = await api.checkIn(checkInData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-in failed')
      }
<<<<<<< HEAD
=======
      
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
      await loadData()
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
      successMsg.style.opacity = '1'
<<<<<<< HEAD
      successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Check-in successful! Login time and IP address recorded.</span>'
=======
      successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Check-in successful!</span>'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
      const checkOutData = {
        employeeId,
        date: selectedDate,
        checkOutTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        method: 'WEB' // Laptops use WEB method, IP address captured automatically by backend
      }
=======
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkOutData = {
        employeeId,
        date: today,
        checkOutTime: currentTime,
        method: 'WEB'
      }
      
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
      const response = await api.checkOut(checkOutData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-out failed')
      }
<<<<<<< HEAD
      await loadData()
      
      // Show success message with working hours
      const workingHours = response.attendance?.workingHours || 0
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
      successMsg.style.opacity = '1'
      successMsg.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Check-out successful! Logout time and IP address recorded. Total working hours: ${workingHours.toFixed(2)}h</span>`
=======
      
      await loadData()
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2'
      successMsg.style.opacity = '1'
      successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Check-out successful!</span>'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
      document.body.appendChild(successMsg)
      
      setTimeout(() => {
        successMsg.style.opacity = '0'
        setTimeout(() => {
          if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg)
          }
        }, 300)
<<<<<<< HEAD
      }, 4000)
=======
      }, 3000)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">
            {isEmployee ? 'My Attendance' : 'Attendance Management'}
          </h2>
            <p className="text-gray-600 font-medium">
              {isEmployee ? 'View and manage your daily attendance records' : 'Track and manage employee attendance with IP address tracking'}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200">
              <Calendar size={20} className="text-blue-600" />
=======
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
            {isEmployee ? 'My Attendance' : 'Attendance Management'}
          </h2>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              {isEmployee ? 'Mark your attendance and view your attendance records' : 'View and manage employee attendance records'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-blue-50 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-blue-200 flex-1 sm:flex-none">
              <Calendar size={18} className="text-blue-600 md:w-5 md:h-5" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
<<<<<<< HEAD
                className="border-none outline-none bg-transparent text-gray-700 font-medium cursor-pointer"
=======
                className="border-none outline-none bg-transparent text-gray-700 font-medium cursor-pointer text-sm md:text-base w-full"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            />
            </div>
          </div>
        </div>
      </div>

      {/* Employee View - Modern Card Design */}
      {isEmployee && employeeId && employees.length > 0 && (
        <>
<<<<<<< HEAD
          {/* Check In/Out Card - Redesigned */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Today's Attendance</h3>
                <p className="text-gray-500 text-sm font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              {todayRecord?.checkIn && todayRecord?.checkOut && (
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <CheckCircle2 size={14} />
                  Completed
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-blue-600" />
                  <p className="text-gray-600 text-xs font-semibold uppercase">Check In</p>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  {todayRecord?.checkIn || '--:--'}
                </p>
                {todayRecord?.checkInMethod && (
                  <div className="flex items-center gap-1">
                    {todayRecord.checkInMethod === 'MOBILE' ? (
                      <Smartphone size={14} className="text-green-500" />
                    ) : (
                      <Monitor size={14} className="text-blue-500" />
                    )}
                    <span className="text-xs text-gray-500 font-medium">{todayRecord.checkInMethod}</span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={18} className="text-gray-600" />
                  <p className="text-gray-600 text-xs font-semibold uppercase">Check Out</p>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  {todayRecord?.checkOut || '--:--'}
                </p>
                {todayRecord?.checkOutMethod && (
                  <div className="flex items-center gap-1">
                    {todayRecord.checkOutMethod === 'MOBILE' ? (
                      <Smartphone size={14} className="text-green-500" />
                    ) : (
                      <Monitor size={14} className="text-blue-500" />
                    )}
                    <span className="text-xs text-gray-500 font-medium">{todayRecord.checkOutMethod}</span>
                  </div>
                )}
              </div>
              {todayRecord?.workingHours ? (
                <div className="bg-blue-600 rounded-xl p-4 border-2 border-blue-500 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer size={18} className="text-blue-100" />
                    <p className="text-blue-100 text-xs font-semibold uppercase">Hours</p>
            </div>
                  <p className="text-2xl font-bold">{todayRecord.workingHours.toFixed(2)}h</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer size={18} className="text-gray-400" />
                    <p className="text-gray-400 text-xs font-semibold uppercase">Hours</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-300">--:--</p>
              </div>
            )}
            </div>

            <div className="flex gap-3">
=======
          {/* Mark Attendance Card - Compact */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Mark Your Attendance</h3>
                  <p className="text-xs text-gray-500">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')} • {format(new Date(), 'h:mm a')}
                  </p>
                </div>
              </div>
              
              {/* Today's Status Badge */}
              {todayRecord && (
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  todayRecord.checkIn && todayRecord.checkOut 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                }`}>
                  {todayRecord.checkIn && todayRecord.checkOut ? 'Completed' : 'Checked In'}
                </div>
              )}
            </div>

            {/* Status Info Row */}
            {todayRecord && (
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Check In</p>
                  <p className="text-sm font-bold text-gray-800">{todayRecord.checkIn || '--:--'}</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Check Out</p>
                  <p className="text-sm font-bold text-gray-800">{todayRecord.checkOut || '--:--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Hours</p>
                  <p className="text-sm font-bold text-gray-800">
                    {todayRecord.workingHours ? `${todayRecord.workingHours.toFixed(2)}h` : '--'}
                  </p>
                </div>
              </div>
            )}

            {/* Check In/Out Buttons */}
            <div className="flex gap-2">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              {!todayRecord?.checkIn ? (
                <button
                  onClick={() => handleCheckIn(employeeId)}
                  disabled={loading}
<<<<<<< HEAD
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <CheckCircle size={18} />
                  Check In
=======
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span className="text-sm">Checking In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span className="text-sm">Check In</span>
                    </>
                  )}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                </button>
              ) : !todayRecord?.checkOut ? (
                <button
                  onClick={() => handleCheckOut(employeeId)}
                  disabled={loading}
<<<<<<< HEAD
                  className="flex-1 bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <XCircle size={18} />
                  Check Out
                </button>
              ) : null}
=======
                  className="flex-1 bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span className="text-sm">Checking Out...</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      <span className="text-sm">Check Out</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 px-4 rounded-lg text-sm text-center">
                  Attendance Completed
                </div>
              )}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
<<<<<<< HEAD
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
=======
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-blue-600 p-2 md:p-3 rounded-lg">
                    <Timer className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{stats.weeklyHours}h</h3>
                <p className="text-xs md:text-sm text-gray-500">Weekly Hours</p>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-blue-600 p-2 md:p-3 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{stats.monthlyPresent}/{stats.monthlyTotal}</h3>
                <p className="text-xs md:text-sm text-gray-500">Monthly Attendance</p>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-blue-600 p-2 md:p-3 rounded-lg">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{stats.attendanceRate}%</h3>
                <p className="text-xs md:text-sm text-gray-500">Attendance Rate</p>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              </div>
            </div>
          )}

          {/* Weekly Calendar - List Design */}
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarDays size={22} className="text-blue-600" />
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <CalendarDays size={18} className="text-blue-600 md:w-6 md:h-6" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                </div>
              This Week
            </h3>
            </div>
            <div className="space-y-3">
              {weeklyCalendar.map((day, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    day.isToday
                      ? 'border-blue-400 bg-blue-50 shadow-md'
                      : day.record?.status === 'Present'
                      ? 'border-green-200 bg-green-50'
                      : day.record?.status === 'Absent'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                        day.isToday
                          ? 'bg-blue-600 text-white'
                          : day.record?.status === 'Present'
                          ? 'bg-green-500 text-white'
                          : day.record?.status === 'Absent'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        <p className="text-xs font-bold uppercase">{day.dayName}</p>
                        <p className="text-xl font-bold">{day.dayNumber}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          {day.record?.checkIn ? (
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-blue-500" />
                              <span className="text-sm font-semibold text-gray-700">Check In: {day.record.checkIn}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No check-in</span>
                          )}
                          {day.record?.checkOut ? (
                            <div className="flex items-center gap-2">
                              <XCircle size={16} className="text-gray-500" />
                              <span className="text-sm font-semibold text-gray-700">Check Out: {day.record.checkOut}</span>
                            </div>
                          ) : day.record?.checkIn ? (
                            <span className="text-sm text-gray-400">No check-out</span>
                          ) : null}
                        </div>
                        {day.record?.workingHours && (
                          <div className="flex items-center gap-2">
                            <Timer size={14} className="text-blue-500" />
                            <span className="text-xs text-gray-600 font-medium">Working Hours: {day.record.workingHours.toFixed(2)}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        day.record?.status === 'Present' ? 'bg-green-100 text-green-700' :
                        day.record?.status === 'Absent' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                      {day.status}
                    </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attendance History */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
            <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                Recent Attendance History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
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
          {/* Search and Filters - Redesigned */}
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
                  placeholder="Search by employee name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by employee name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
<<<<<<< HEAD
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <X size={18} />
=======
                    className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <X size={16} />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  </button>
                )}
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
<<<<<<< HEAD
                className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
=======
                className="px-4 md:px-5 py-2 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              >
                <option value="All">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Not Marked">Not Marked</option>
              </select>
              {isAdmin && (
                <button
                  onClick={handleExportAttendance}
<<<<<<< HEAD
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                  title="Export Attendance"
                >
                  <Download size={18} />
                  Export CSV
=======
                  className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg md:rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold text-sm md:text-base"
                  title="Export Attendance"
                >
                  <Download size={16} className="md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                </button>
              )}
            </div>
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


          {/* Attendance Table - Redesigned */}
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
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
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">
                              {employee.name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{employee.name}</div>
                              <div className="text-xs text-gray-500 font-medium">{employee.department}</div>
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
                            {isCurrentUser && !isAdmin && (
                              <>
<<<<<<< HEAD
                              {!record?.checkIn ? (
                                <button
                                  onClick={() => handleCheckIn(employee.id)}
                                  disabled={loading}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                  Check In
                                </button>
                              ) : !record?.checkOut ? (
                                <button
                                  onClick={() => handleCheckOut(employee.id)}
                                  disabled={loading}
                                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                  Check Out
                                </button>
                              ) : (
                                <span className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-lg">Completed</span>
=======
                              {!record ? (
                                <button
                                  onClick={() => handleEmployeeMarkAttendance(employee.id)}
                                  disabled={loading}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                  Mark Attendance
                                </button>
                              ) : (
                                <span className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-lg">Marked</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                              )}
                              </>
                            )}
                            {isAdmin && record && (
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
                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Attendance"
                              >
                                <Edit size={18} />
                              </button>
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

      {/* Mark Attendance Modal (Admin) - Redesigned */}
      {showMarkModal && isAdmin && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-md border-2 border-gray-200">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <CheckCircle size={24} className="text-blue-600" />
                Mark Attendance
              </h3>
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
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? 'Saving...' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal (Admin) - Redesigned */}
      {showEditModal && isAdmin && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-md border-2 border-gray-200">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <Edit size={24} className="text-blue-600" />
                Edit Attendance
              </h3>
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
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all"
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

