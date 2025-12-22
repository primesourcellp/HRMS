import { useState, useEffect } from 'react'
import { Clock, CheckCircle, Calendar, Search, TrendingUp, CalendarDays, Timer, CheckCircle2, Edit, X, Download, Filter, LogIn, LogOut } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Attendance = () => {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([])
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
  const [successMessage, setSuccessMessage] = useState(null)
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const currentUserId = localStorage.getItem('userId')

  useEffect(() => {
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
      setLoading(true)
      const userIsEmployee = isEmp !== null ? isEmp : isEmployee
      const userEmployeeId = empId !== null ? empId : employeeId
      
      if (userIsEmployee && userEmployeeId) {
        // For employees, only load their own data
        const [empData, attData] = await Promise.all([
          api.getEmployees(),
          api.getAttendanceByEmployee(userEmployeeId)
        ])
        const currentEmployee = Array.isArray(empData) ? empData.find(emp => emp.id === userEmployeeId) : null
        setEmployees(currentEmployee ? [currentEmployee] : [])
        const attendanceArray = Array.isArray(attData) ? attData : []
        setAllAttendance(attendanceArray)
        const dateAttendance = attendanceArray.filter(a => {
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
        // For admins, load all data
        const [empData, attData] = await Promise.all([
          api.getEmployees(),
          api.getAttendanceByDate(selectedDate)
        ])
        setEmployees(Array.isArray(empData) ? empData : [])
        setAttendance(Array.isArray(attData) ? attData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStatus = (employeeId) => {
    return attendance.find(a => {
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
      return a.employeeId === employeeId && recordDate === selectedDate
    })
  }

  const getTodayAttendance = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (isEmployee && employeeId) {
      return allAttendance.find(a => {
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
        return a.employeeId === employeeId && recordDate === today
      })
    }
    return null
  }

  const handleCheckIn = async (employeeId) => {
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
      
      const response = await api.checkIn(checkInData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-in failed')
      }
      
      setSuccessMessage('Check-in successful!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadData()
    } catch (error) {
      setError(error.message || 'Error checking in')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (employeeId) => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
      
      const checkOutData = {
        employeeId,
        date: today,
        checkOutTime: currentTime,
        method: 'WEB'
      }
      
      const response = await api.checkOut(checkOutData)
      if (response.success === false) {
        throw new Error(response.message || 'Check-out failed')
      }
      
      setSuccessMessage('Check-out successful!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadData()
    } catch (error) {
      setError(error.message || 'Error checking out')
      setTimeout(() => setError(null), 5000)
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
      setSuccessMessage('Attendance marked successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error marking attendance')
      setTimeout(() => setError(null), 5000)
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
      setSuccessMessage('Attendance updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error updating attendance')
      setTimeout(() => setError(null), 5000)
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
          Employee: employee?.name || employee?.firstName + ' ' + employee?.lastName || 'Unknown',
          Department: employee?.department || 'N/A',
          'Check In': record.checkIn || '-',
          'Check Out': record.checkOut || '-',
          'Working Hours': record.workingHours ? `${record.workingHours.toFixed(2)}h` : '-',
          Status: record.status || 'N/A'
        }
      })

      if (exportData.length === 0) {
        alert('No data to export')
        return
      }

      const csvContent = [
        Object.keys(exportData[0]).join(','),
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
      
      setSuccessMessage('Attendance data exported successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError('Error exporting data: ' + error.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || 
      (emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const record = getAttendanceStatus(emp.id)
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Present' && record?.status === 'Present') ||
      (statusFilter === 'Absent' && (!record || record.status === 'Absent'))
    
    return matchesSearch && matchesStatus
  })

  const todayAttendance = getTodayAttendance()
  const canCheckIn = !todayAttendance || !todayAttendance.checkIn
  const canCheckOut = todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 sm:gap-4 mb-4">
          {isAdmin && (
            <button
              onClick={handleExportAttendance}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
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

        {/* Employee Check-in/Check-out Card */}
        {isEmployee && employeeId && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 md:mb-6 border-2 border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Today's Attendance</h2>
                <p className="text-sm sm:text-base text-gray-600">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
                {todayAttendance && (
                  <div className="mt-4 space-y-2">
                    {todayAttendance.checkIn && (
                      <div className="flex items-center gap-2 text-green-600">
                        <LogIn className="w-4 h-4" />
                        <span className="font-semibold">Check-in: {todayAttendance.checkIn}</span>
                      </div>
                    )}
                    {todayAttendance.checkOut && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold">Check-out: {todayAttendance.checkOut}</span>
                      </div>
                    )}
                    {todayAttendance.workingHours && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Timer className="w-4 h-4" />
                        <span className="font-semibold">Working Hours: {todayAttendance.workingHours.toFixed(2)}h</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                {canCheckIn && (
                  <button
                    onClick={() => handleCheckIn(employeeId)}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base w-full sm:w-auto"
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    Check In
                  </button>
                )}
                {canCheckOut && (
                  <button
                    onClick={() => handleCheckOut(employeeId)}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base w-full sm:w-auto"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Today
              </button>
            </div>
            {isAdmin && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                <button
                  onClick={() => setShowMarkModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Attendance
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Working Hours</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    Loading attendance data...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found for this date
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const record = getAttendanceStatus(employee.id)
                  const employeeName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown'
                  
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                          <span className="font-semibold">{record.workingHours.toFixed(2)}h</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record?.status === 'Present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record?.status || 'Absent'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedRecord(record || { employeeId: employee.id, date: selectedDate })
                              setMarkFormData({
                                status: record?.status || 'Present',
                                checkIn: record?.checkIn || '',
                                checkOut: record?.checkOut || ''
                              })
                              setShowEditModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
              <button
                onClick={() => setShowMarkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleMarkAttendance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                  <select
                    value={selectedEmployee?.id || ''}
                    onChange={(e) => {
                      const emp = employees.find(e => e.id === parseInt(e.target.value))
                      setSelectedEmployee(emp)
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={markFormData.status}
                    onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check In (HH:MM)</label>
                  <input
                    type="time"
                    value={markFormData.checkIn}
                    onChange={(e) => setMarkFormData({ ...markFormData, checkIn: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out (HH:MM)</label>
                  <input
                    type="time"
                    value={markFormData.checkOut}
                    onChange={(e) => setMarkFormData({ ...markFormData, checkOut: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Edit Attendance</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditAttendance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={markFormData.status}
                    onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check In (HH:MM)</label>
                  <input
                    type="time"
                    value={markFormData.checkIn}
                    onChange={(e) => setMarkFormData({ ...markFormData, checkIn: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out (HH:MM)</label>
                  <input
                    type="time"
                    value={markFormData.checkOut}
                    onChange={(e) => setMarkFormData({ ...markFormData, checkOut: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
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
