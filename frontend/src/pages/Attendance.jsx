import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Calendar, Search, MapPin, Smartphone, Monitor } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Attendance = () => {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const currentUserId = localStorage.getItem('userId')

  useEffect(() => {
    loadData()
    getCurrentLocation()
  }, [selectedDate])

  const loadData = async () => {
    try {
      const [empData, attData, shiftsData] = await Promise.all([
        api.getEmployees(),
        api.getAttendanceByDate(selectedDate),
        api.getActiveShifts()
      ])
      setEmployees(empData)
      setAttendance(attData)
      setShifts(shiftsData)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
          <p className="text-gray-600 mt-1">Track and manage employee attendance with GPS</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          <span className="text-sm text-blue-800">GPS Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</span>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold mr-3">
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
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Check In
                            </button>
                          ) : !record?.checkOut ? (
                            <button
                              onClick={() => handleCheckOut(employee.id)}
                              disabled={loading}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
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
    </div>
  )
}

export default Attendance

