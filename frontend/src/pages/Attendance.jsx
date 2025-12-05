import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Calendar, Search, MapPin, Smartphone, Monitor, TrendingUp, CalendarDays, Timer, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'

const Attendance = () => {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([]) // All attendance records for employee
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
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
    getCurrentLocation()
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
        const currentEmployee = empData.find(emp => emp.id === userEmployeeId)
        setEmployees(currentEmployee ? [currentEmployee] : [])
        // Store all attendance records
        setAllAttendance(attData)
        // Filter attendance for selected date
        const dateAttendance = attData.filter(a => {
          const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
          return recordDate === selectedDate
        })
        setAttendance(dateAttendance)
        setShifts(shiftsData)
      } else {
        // For admins, load all data
      const [empData, attData, shiftsData] = await Promise.all([
        api.getEmployees(),
        api.getAttendanceByDate(selectedDate),
        api.getActiveShifts()
      ])
      setEmployees(empData)
      setAttendance(attData)
      setShifts(shiftsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
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
    try {
      const checkInData = {
        employeeId,
        date: selectedDate,
        checkInTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        shiftId: null,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        location: userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'Office',
        method: userLocation ? 'MOBILE' : 'WEB'
      }
      await api.checkIn(checkInData)
      await loadData()
      alert('Check-in successful')
    } catch (error) {
      alert('Error checking in: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (employeeId) => {
    setLoading(true)
    try {
      const checkOutData = {
        employeeId,
        date: selectedDate,
        checkOutTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        location: userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'Office',
        method: userLocation ? 'MOBILE' : 'WEB'
      }
      await api.checkOut(checkOutData)
      await loadData()
      alert('Check-out successful')
    } catch (error) {
      alert('Error checking out: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get today's attendance record
  const todayRecord = isEmployee && employeeId 
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

    const weekRecords = allAttendance.filter(a => {
      try {
        const dateStr = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd')
        const recordDate = parseISO(dateStr)
        return recordDate >= weekStart && recordDate <= weekEnd
      } catch {
        return false
      }
    })

    const monthRecords = allAttendance.filter(a => {
      try {
        const dateStr = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd')
        const recordDate = parseISO(dateStr)
        return recordDate >= monthStart
      } catch {
        return false
      }
    })

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
      const dayRecord = allAttendance.find(a => {
        const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date
        return recordDate === dayStr
      })
      
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
            {isEmployee ? 'View and manage your attendance' : 'Track and manage employee attendance with GPS'}
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
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">Today's Attendance</h3>
                <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div className={`p-3 rounded-full ${todayRecord?.status === 'Present' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {todayRecord?.status === 'Present' ? (
                  <CheckCircle2 size={32} className="text-green-600" />
                ) : (
                  <Clock size={32} className="text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-500 text-sm mb-1 font-medium">Check In</p>
                <p className="text-2xl font-bold text-gray-800">
                  {todayRecord?.checkIn || '--:--'}
                </p>
                {todayRecord?.checkInMethod && (
                  <div className="flex items-center gap-1 mt-2">
                    {todayRecord.checkInMethod === 'MOBILE' ? (
                      <Smartphone size={14} className="text-green-500" />
                    ) : (
                      <Monitor size={14} className="text-blue-500" />
                    )}
                    <span className="text-xs text-gray-500">{todayRecord.checkInMethod}</span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-500 text-sm mb-1 font-medium">Check Out</p>
                <p className="text-2xl font-bold text-gray-800">
                  {todayRecord?.checkOut || '--:--'}
                </p>
                {todayRecord?.checkOutMethod && (
                  <div className="flex items-center gap-1 mt-2">
                    {todayRecord.checkOutMethod === 'MOBILE' ? (
                      <Smartphone size={14} className="text-green-500" />
                    ) : (
                      <Monitor size={14} className="text-blue-500" />
                    )}
                    <span className="text-xs text-gray-500">{todayRecord.checkOutMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {todayRecord?.workingHours && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-blue-600 text-sm mb-1 font-medium">Working Hours</p>
                <p className="text-2xl font-bold text-gray-800">{todayRecord.workingHours.toFixed(2)}h</p>
              </div>
            )}

            <div className="flex gap-3">
              {!todayRecord?.checkIn ? (
                <button
                  onClick={() => handleCheckIn(employeeId)}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle size={20} />
                  Check In
                </button>
              ) : !todayRecord?.checkOut ? (
                <button
                  onClick={() => handleCheckOut(employeeId)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  <XCircle size={20} />
                  Check Out
                </button>
              ) : (
                <div className="flex-1 bg-green-500 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-sm">
                  <CheckCircle2 size={20} />
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

      {/* Admin View - Keep existing table design */}
      {!isEmployee && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
              <MapPin className="text-blue-600" size={20} />
              <span className="text-sm text-gray-700">GPS Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</span>
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{record.checkIn}</span>
                              {record.checkInMethod === 'MOBILE' ? (
                                <Smartphone className="text-green-500" size={16} />
                              ) : (
                                <Monitor className="text-blue-500" size={16} />
                              )}
                              {record.checkInLocation && (
                                <MapPin className="text-gray-400" size={14} title={record.checkInLocation} />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record?.checkOut ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{record.checkOut}</span>
                              {record.checkOutMethod === 'MOBILE' ? (
                                <Smartphone className="text-green-500" size={16} />
                              ) : (
                                <Monitor className="text-blue-500" size={16} />
                              )}
                              {record.checkOutLocation && (
                                <MapPin className="text-gray-400" size={14} title={record.checkOutLocation} />
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
                          {isCurrentUser && (
                            <div className="flex gap-2">
                              {!record?.checkIn ? (
                                <button
                                  onClick={() => handleCheckIn(employee.id)}
                                  disabled={loading}
                                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Check In
                                </button>
                              ) : !record?.checkOut ? (
                                <button
                                  onClick={() => handleCheckOut(employee.id)}
                                  disabled={loading}
                                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                                >
                                  Check Out
                                </button>
                              ) : (
                                <span className="text-gray-500">Completed</span>
                              )}
                            </div>
                          )}
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
    </div>
  )
}

export default Attendance

