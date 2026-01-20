import { useState, useEffect } from 'react'
import { Clock, CheckCircle, Calendar, Search, TrendingUp, CalendarDays, Timer, CheckCircle2, Edit, X, Download, Filter, LogIn, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, getDaysInMonth, getDay } from 'date-fns'

const Attendance = () => {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewType, setViewType] = useState('daily') // 'daily', 'weekly', 'monthly', 'calendar'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [calendarView, setCalendarView] = useState(false) // Toggle for calendar grid view
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [employeeNameFilter, setEmployeeNameFilter] = useState('')
  const [calendarAttendance, setCalendarAttendance] = useState([])
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
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isHrAdmin = userRole === 'HR_ADMIN'
  const isManager = userRole === 'MANAGER'
  // HR_ADMIN, MANAGER, FINANCE, and EMPLOYEE should see "My Attendance" (their own)
  const isEmployeeRole = userRole === 'EMPLOYEE' || userRole === 'MANAGER' || userRole === 'FINANCE' || userRole === 'HR_ADMIN'
  // For pure employee self-view, hide Employee column in the daily table
  const hideEmployeeColumnDaily = !isAdmin && !isHrAdmin && !isSuperAdmin && isEmployeeRole
  // Calendar view available for HR_ADMIN, SUPER_ADMIN, MANAGER, and EMPLOYEE
  const canViewCalendar = isSuperAdmin || isHrAdmin || isManager || isEmployee
  const currentUserId = localStorage.getItem('userId')
  const [teamMemberIds, setTeamMemberIds] = useState([])

  const formatWorkingHoursShort = (workingHours) => {
    if (workingHours === null || workingHours === undefined || workingHours === '') return '-'
    const hoursNum = typeof workingHours === 'string' ? parseFloat(workingHours) : workingHours
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) return '0h 0m'
    const h = Math.floor(hoursNum)
    const m = Math.round((hoursNum - h) * 60)
    // handle rounding case (e.g. 1.999 -> 2h 0m)
    const hh = m === 60 ? h + 1 : h
    const mm = m === 60 ? 0 : m
    return `${hh}h ${mm}m`
  }

  const formatTimeAmPm = (timeStr) => {
    if (!timeStr) return '-'
    // Accept "HH:mm" or "HH:mm:ss" (and tolerate "H:mm")
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
    const checkIn = formatTimeAmPm(record.checkIn)
    const checkOut = formatTimeAmPm(record.checkOut)
    const wh = formatWorkingHoursShort(record.workingHours)
    return `Login: ${checkIn}\nLogout: ${checkOut}\nWorking: ${wh}`
  }

  const AttendanceHoverTooltip = ({ record }) => {
    if (!record) return null
    return (
      <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 whitespace-pre-line min-w-[160px]">
          {getAttendanceTooltip(record)}
        </div>
        <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    )
  }

  // Load team member IDs for HR_ADMIN
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (isHrAdmin && currentUserId) {
        try {
          const allTeams = await api.getTeams()
          // Find teams where HR_ADMIN is a member
          const hrAdminTeams = allTeams.filter(team => {
            if (!team.members || !Array.isArray(team.members)) return false
            return team.members.some(member => 
              member.employeeId === parseInt(currentUserId) || 
              parseInt(member.employeeId) === parseInt(currentUserId)
            )
          })
          
          // Get all employee IDs from HR_ADMIN's teams
          const memberIds = new Set()
          hrAdminTeams.forEach(team => {
            if (team.members && Array.isArray(team.members)) {
              team.members.forEach(member => {
                const empId = member.employeeId ? parseInt(member.employeeId) : null
                if (empId && empId !== parseInt(currentUserId)) {
                  memberIds.add(empId)
                }
              })
            }
          })
          
          setTeamMemberIds(Array.from(memberIds))
        } catch (error) {
          console.error('Error loading team members:', error)
          setTeamMemberIds([])
        }
      }
    }
    
    loadTeamMembers()
  }, [isHrAdmin, currentUserId])

  useEffect(() => {
    // Don't load data if calendar view is active (it has its own loader)
    if (viewType === 'calendar' && canViewCalendar) {
      return
    }
    
    
    const userType = localStorage.getItem('userType')
    const userId = localStorage.getItem('userId')
    const userRoleValue = localStorage.getItem('userRole')
    // Check if user is an employee (either by userType or by role: EMPLOYEE, MANAGER, FINANCE, HR_ADMIN)
    const isEmp = userType === 'employee' || 
                  (userRoleValue && (userRoleValue === 'EMPLOYEE' || userRoleValue === 'MANAGER' || userRoleValue === 'FINANCE' || userRoleValue === 'HR_ADMIN'))
    const empId = userId ? parseInt(userId) : null
    setIsEmployee(isEmp)
    setEmployeeId(empId)
    loadData(isEmp, empId)
  }, [selectedDate, viewType, teamMemberIds])

  useEffect(() => {
    if (viewType === 'calendar' && canViewCalendar) {
      loadCalendarData()
    }
  }, [selectedMonth, selectedYear, employeeNameFilter, viewType, teamMemberIds])

  const loadData = async (isEmp = null, empId = null) => {
    try {
      setLoading(true)
      const userIsEmployee = isEmp !== null ? isEmp : isEmployee
      const userEmployeeId = empId !== null ? empId : employeeId
      const dateObj = new Date(selectedDate)
      
      let startDate, endDate
      
      if (viewType === 'daily') {
        startDate = selectedDate
        endDate = selectedDate
      } else if (viewType === 'weekly') {
        const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 }) // Monday
        const weekEnd = endOfWeek(dateObj, { weekStartsOn: 1 }) // Sunday
        startDate = format(weekStart, 'yyyy-MM-dd')
        endDate = format(weekEnd, 'yyyy-MM-dd')
      } else if (viewType === 'monthly') {
        const monthStart = startOfMonth(dateObj)
        const monthEnd = endOfMonth(dateObj)
        startDate = format(monthStart, 'yyyy-MM-dd')
        endDate = format(monthEnd, 'yyyy-MM-dd')
      } else {
        // Default to today if viewType is not recognized (e.g., 'calendar')
        startDate = selectedDate
        endDate = selectedDate
      }
      
      // Validate dates before making API calls
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined') {
        console.error('Invalid dates:', { startDate, endDate, viewType, selectedDate })
        setError('Invalid date range. Please select a valid date.')
        setTimeout(() => setError(null), 5000)
        setLoading(false)
        return
      }
      
      // Check if user is an employee role (not admin) - HR_ADMIN, MANAGER, FINANCE, EMPLOYEE should see their own attendance
      const isEmployeeUser = userIsEmployee || (!isAdmin && isEmployeeRole && userEmployeeId)
      
      // Special handling for HR_ADMIN: show MANAGER, FINANCE, and EMPLOYEE from assigned teams
      if (isHrAdmin && userEmployeeId) {
        // Load all employees and attendance
        const [allEmpData, allAttData] = await Promise.all([
          api.getEmployees(),
          viewType === 'daily'
            ? api.getAttendanceByDate(selectedDate)
            : api.getAttendanceByDateRange(startDate, endDate)
        ])
        
        // Filter to get MANAGER, FINANCE, and EMPLOYEE from HR_ADMIN's assigned teams
        const teamEmployeeData = Array.isArray(allEmpData) ? allEmpData.filter(emp => {
          const empId = emp.id || emp.employeeId
          const role = (emp.role || emp.designation || '').toUpperCase()
          const isHrAdminSelf = empId === userEmployeeId || 
                               parseInt(empId) === userEmployeeId || 
                               empId === userEmployeeId.toString() ||
                               parseInt(empId) === parseInt(userEmployeeId)
          // Exclude HR_ADMIN's own record
          if (isHrAdminSelf) return false
          
          // Only include MANAGER, FINANCE, and EMPLOYEE roles
          if (role !== 'MANAGER' && role !== 'FINANCE' && role !== 'EMPLOYEE') return false
          
          // Only show employees from assigned teams
          if (teamMemberIds.length > 0) {
            const employeeId = empId ? parseInt(empId) : null
            return employeeId && teamMemberIds.includes(employeeId)
          }
          // If no teams assigned, show nothing
          return false
        }) : []
        
        // Set only team member records
        setEmployees(teamEmployeeData)
        
        // Filter attendance to get only team members' attendance
        // Use teamMemberIds directly to ensure we match all team members' attendance
        const teamMemberIdsSet = new Set(teamMemberIds.map(id => parseInt(id)))
        const teamAttendance = Array.isArray(allAttData) ? allAttData.filter(att => {
          const attEmpId = att.employeeId ? parseInt(att.employeeId) : null
          const userEmpId = userEmployeeId ? parseInt(userEmployeeId) : null
          if (!attEmpId) return false
          // Include attendance if employee is in team members list and not HR_ADMIN's own
          return teamMemberIdsSet.has(attEmpId) && attEmpId !== userEmpId
        }) : []
        
        // Set only team members' attendance
        setAllAttendance(teamAttendance)
        
        if (viewType === 'daily') {
          const dateAttendance = teamAttendance.filter(a => {
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
          setAttendance(teamAttendance)
        }
      } else if (isEmployeeUser && userEmployeeId) {
        // For other employees (EMPLOYEE, MANAGER, FINANCE), ONLY load their own data - real-time attendance for logged-in user only
        const [empData, attData] = await Promise.all([
          api.getEmployees(),
          viewType === 'daily' 
            ? api.getAttendanceByEmployee(userEmployeeId)
            : api.getAttendanceByEmployeeDateRange(userEmployeeId, startDate, endDate)
        ])
        // Find the current employee by matching ID (handle both string and number comparisons)
        const currentEmployee = Array.isArray(empData) ? empData.find(emp => {
          const empId = emp.id || emp.employeeId
          return empId === userEmployeeId || 
                 parseInt(empId) === userEmployeeId || 
                 empId === userEmployeeId.toString() ||
                 parseInt(empId) === parseInt(userEmployeeId)
        }) : null
        // CRITICAL: Only set the current employee, not all employees
        setEmployees(currentEmployee ? [currentEmployee] : [])
        
        // Filter attendance to only include records for the logged-in employee
        const attendanceArray = Array.isArray(attData) ? attData.filter(att => {
          const attEmpId = att.employeeId
          return attEmpId === userEmployeeId || 
                 parseInt(attEmpId) === userEmployeeId || 
                 attEmpId === userEmployeeId.toString() ||
                 parseInt(attEmpId) === parseInt(userEmployeeId)
        }) : []
        setAllAttendance(attendanceArray)
        
        if (viewType === 'daily') {
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
          setAttendance(attendanceArray)
        }
      } else {
        // For admins, load all data
        const [empData, attData] = await Promise.all([
          api.getEmployees(),
          viewType === 'daily'
            ? api.getAttendanceByDate(selectedDate)
            : api.getAttendanceByDateRange(startDate, endDate)
        ])
        // For SUPER_ADMIN: show all employees except SUPER_ADMIN, for ADMIN: filter to only show MANAGER, EMPLOYEE, FINANCE roles
        const filteredEmpData = Array.isArray(empData) ? empData.filter(emp => {
          if (isSuperAdmin) {
            // SUPER_ADMIN sees all employees except other SUPER_ADMIN users
            const role = (emp.role || emp.designation || '').toUpperCase()
            return role !== 'SUPER_ADMIN'
          } else {
            // ADMIN sees only MANAGER, EMPLOYEE, FINANCE roles
            const role = (emp.role || emp.designation || '').toUpperCase()
            return role === 'MANAGER' || role === 'EMPLOYEE' || role === 'FINANCE'
          }
        }) : []
        setEmployees(filteredEmpData)
        // Filter attendance to only include records for filtered employees
        // Create a normalized set of employee IDs for matching
        const filteredEmpIds = new Set()
        const filteredEmpIdNumbers = new Set()
        filteredEmpData.forEach(emp => {
          const empId = emp.id || emp.employeeId || emp.userId
          if (empId) {
            // Add original value
            filteredEmpIds.add(empId)
            filteredEmpIds.add(empId.toString())
            // Normalize to number if possible
            const numId = typeof empId === 'string' ? parseInt(empId) : empId
            if (!isNaN(numId) && typeof numId === 'number') {
              filteredEmpIdNumbers.add(numId)
              filteredEmpIds.add(numId)
              filteredEmpIds.add(numId.toString())
            }
          }
        })
        const filteredAttData = Array.isArray(attData) ? attData.filter(att => {
          if (!att || !att.employeeId) return false
          const attEmpId = att.employeeId
          const attNumId = typeof attEmpId === 'string' ? parseInt(attEmpId) : attEmpId
          
          // Check all possible matches
          return filteredEmpIds.has(attEmpId) || 
                 filteredEmpIds.has(attEmpId.toString()) ||
                 (!isNaN(attNumId) && filteredEmpIdNumbers.has(attNumId)) ||
                 (!isNaN(attNumId) && filteredEmpIds.has(attNumId)) ||
                 (!isNaN(attNumId) && filteredEmpIds.has(attNumId.toString()))
        }) : []
        setAllAttendance(filteredAttData)
        if (viewType === 'daily') {
          const dateAttendance = filteredAttData.filter(a => {
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
          setAttendance(filteredAttData)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStatus = (employeeId, date = null) => {
    const checkDate = date || selectedDate
    if (!employeeId || !checkDate) return null
    
    // Normalize employeeId for comparison (handle both string and number)
    let normalizedEmpId
    if (typeof employeeId === 'string') {
      normalizedEmpId = parseInt(employeeId)
      if (isNaN(normalizedEmpId)) {
        normalizedEmpId = employeeId // Keep as string if not a valid number
      }
    } else {
      normalizedEmpId = employeeId
    }
    
    // Use allAttendance for weekly/monthly views, attendance for daily view
    const attendanceDataToSearch = (viewType === 'weekly' || viewType === 'monthly') ? allAttendance : attendance
    
    if (!attendanceDataToSearch || attendanceDataToSearch.length === 0) {
      return null
    }
    
    return attendanceDataToSearch.find(a => {
      if (!a || !a.employeeId) return false
      
      // Normalize attendance record's employeeId for comparison
      let attEmpId
      if (typeof a.employeeId === 'string') {
        attEmpId = parseInt(a.employeeId)
        if (isNaN(attEmpId)) {
          attEmpId = a.employeeId // Keep as string if not a valid number
        }
      } else {
        attEmpId = a.employeeId
      }
      
      // Check if employee IDs match (handle all type variations)
      // Convert both to numbers if possible, otherwise compare as strings
      const attNum = typeof attEmpId === 'number' ? attEmpId : (typeof attEmpId === 'string' && !isNaN(parseInt(attEmpId)) ? parseInt(attEmpId) : null)
      const normNum = typeof normalizedEmpId === 'number' ? normalizedEmpId : (typeof normalizedEmpId === 'string' && !isNaN(parseInt(normalizedEmpId)) ? parseInt(normalizedEmpId) : null)
      
      // If both can be converted to numbers, compare as numbers
      if (attNum !== null && normNum !== null) {
        if (attNum !== normNum) return false
      } else {
        // Otherwise compare as strings
        if (String(attEmpId) !== String(normalizedEmpId)) return false
      }
      
      // Parse and compare dates - normalize both to yyyy-MM-dd format
      let recordDate
      if (typeof a.date === 'string') {
        recordDate = a.date.split('T')[0].split(' ')[0] // Handle both ISO format and date strings
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
      
      // Normalize checkDate to ensure it's in yyyy-MM-dd format
      let normalizedCheckDate = checkDate
      if (checkDate.includes('T')) {
        normalizedCheckDate = checkDate.split('T')[0]
      }
      
      return recordDate === normalizedCheckDate
    })
  }


  const loadCalendarData = async () => {
    if (!canViewCalendar) return
    
    setLoading(true)
    try {
      // Validate month and year
      if (!selectedMonth || !selectedYear || selectedMonth < 1 || selectedMonth > 12 || !selectedYear || isNaN(selectedYear)) {
        setError('Invalid month or year selected')
        setTimeout(() => setError(null), 5000)
        setLoading(false)
        return
      }
      
      const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd')
      const endDate = format(new Date(selectedYear, selectedMonth, 0), 'yyyy-MM-dd')
      
      // Validate dates
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined' || startDate.includes('Invalid') || endDate.includes('Invalid')) {
        setError('Invalid date range. Please select a valid month and year.')
        setTimeout(() => setError(null), 5000)
        setLoading(false)
        return
      }
      
      // For employees, load only their own data
      if (isEmployee && employeeId) {
        const [empData, attData] = await Promise.all([
          api.getEmployees(),
          api.getAttendanceByEmployeeDateRange(employeeId, startDate, endDate)
        ])
        
        // Find the current employee
        const currentEmployee = Array.isArray(empData) ? empData.find(emp => {
          const empId = emp.id || emp.employeeId
          return empId === employeeId || 
                 parseInt(empId) === employeeId || 
                 empId === employeeId.toString() ||
                 parseInt(empId) === parseInt(employeeId)
        }) : null
        
        setEmployees(currentEmployee ? [currentEmployee] : [])
        setCalendarAttendance(Array.isArray(attData) ? attData : [])
      } else {
        const [empData, attData] = await Promise.all([
          api.getEmployees(),
          api.getAttendanceByDateRange(startDate, endDate)
        ])
        
        // Filter employees based on role
        let filteredEmpData = Array.isArray(empData) ? empData : []
        if (isSuperAdmin) {
          filteredEmpData = filteredEmpData.filter(emp => {
            const role = (emp.role || emp.designation || '').toUpperCase()
            return role !== 'SUPER_ADMIN'
          })
        } else if (isHrAdmin) {
          const hrAdminId = employeeId ? parseInt(employeeId) : null
          filteredEmpData = filteredEmpData.filter(emp => {
            const empId = emp.id || emp.employeeId
            const role = (emp.role || emp.designation || '').toUpperCase()
            // Exclude HR_ADMIN's own record
            const isHrAdminSelf = empId === hrAdminId || 
                                 parseInt(empId) === hrAdminId || 
                                 empId === hrAdminId?.toString() ||
                                 parseInt(empId) === parseInt(hrAdminId)
            if (isHrAdminSelf) return false
            
            // Only include MANAGER, FINANCE, and EMPLOYEE roles
            if (role !== 'MANAGER' && role !== 'FINANCE' && role !== 'EMPLOYEE') return false
            
            // Only show employees from assigned teams
            if (teamMemberIds.length > 0) {
              const employeeIdNum = empId ? parseInt(empId) : null
              return employeeIdNum && teamMemberIds.includes(employeeIdNum)
            }
            // If no teams assigned, show nothing
            return false
          })
        } else if (isManager) {
          // Manager sees only employees they manage (for now, show all EMPLOYEE role)
          filteredEmpData = filteredEmpData.filter(emp => {
            const role = (emp.role || emp.designation || '').toUpperCase()
            return role === 'EMPLOYEE'
          })
        }
        
        // Filter by employee name if provided
        if (employeeNameFilter) {
          filteredEmpData = filteredEmpData.filter(emp => 
            (emp.name || '').toLowerCase().includes(employeeNameFilter.toLowerCase())
          )
        }
        
        setEmployees(filteredEmpData)
        // Filter attendance to exclude HR_ADMIN's own attendance
        const filteredAttData = Array.isArray(attData) ? attData.filter(att => {
          if (isHrAdmin && employeeId) {
            const attEmpId = att.employeeId
            return attEmpId !== employeeId && 
                   parseInt(attEmpId) !== employeeId &&
                   attEmpId !== employeeId.toString()
          }
          return true
        }) : []
        setCalendarAttendance(filteredAttData)
      }
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

  const getAttendanceForDay = (employeeId, day) => {
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
      return att.employeeId === employeeId && recordDate === dateStr
    })
  }


  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    if (!selectedEmployee || !selectedEmployee.id) {
      setError('Please select an employee')
      setTimeout(() => setError(null), 5000)
      return
    }
    if (!markFormData.status) {
      setError('Please select a status')
      setTimeout(() => setError(null), 5000)
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
          Employee: employee?.name || 'Unknown',
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
    // Special handling for HR_ADMIN: show MANAGER, FINANCE, and EMPLOYEE from assigned teams
    if (isHrAdmin && employeeId) {
      const empId = emp.id || emp.employeeId
      const role = (emp.role || emp.designation || '').toUpperCase()
      // Exclude HR_ADMIN's own record
      const isHrAdminSelf = empId === employeeId || 
                           parseInt(empId) === employeeId || 
                           empId === employeeId.toString() ||
                           parseInt(empId) === parseInt(employeeId)
      if (isHrAdminSelf) {
        return false // Exclude HR_ADMIN's own record
      }
      // Only include MANAGER, FINANCE, and EMPLOYEE roles
      if (role !== 'MANAGER' && role !== 'FINANCE' && role !== 'EMPLOYEE') return false
      // Only show employees from assigned teams
      if (teamMemberIds.length > 0) {
        const employeeIdNum = empId ? parseInt(empId) : null
        return employeeIdNum && teamMemberIds.includes(employeeIdNum)
      }
      // If no teams assigned, show nothing
      return false
    }
    // If logged in as other employee roles (EMPLOYEE, MANAGER, FINANCE), ONLY show their own record - strict filtering
    else if ((isEmployee || isEmployeeRole) && !isHrAdmin && employeeId) {
      const empId = emp.id || emp.employeeId
      // Strict comparison: must match the logged-in employee's ID
      const matchesEmployee = empId === employeeId || 
                              parseInt(empId) === employeeId || 
                              empId === employeeId.toString() ||
                              parseInt(empId) === parseInt(employeeId)
      if (!matchesEmployee) {
        return false // Exclude all other employees
      }
    }
    
    // For admins, filter by role: SUPER_ADMIN sees all except SUPER_ADMIN, ADMIN sees only MANAGER, EMPLOYEE, FINANCE
    if (isAdmin && !isSuperAdmin) {
      const role = (emp.role || emp.designation || '').toUpperCase()
      const matchesRole = role === 'MANAGER' || role === 'EMPLOYEE' || role === 'FINANCE'
      if (!matchesRole) return false
    }
    // SUPER_ADMIN sees all employees except SUPER_ADMIN
    if (isSuperAdmin) {
      const role = (emp.role || emp.designation || '').toUpperCase()
      if (role === 'SUPER_ADMIN') return false
    }
    
    const matchesSearch = searchTerm === '' || 
      (emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const record = getAttendanceStatus(emp.id)
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Present' && record?.status === 'Present') ||
      (statusFilter === 'Absent' && (!record || record.status === 'Absent'))
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        

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
      {canViewCalendar && (
        <button
          onClick={() => {
            setViewType('calendar')
            setSelectedMonth(new Date().getMonth() + 1)
            setSelectedYear(new Date().getFullYear())
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            viewType === 'calendar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Calendar
        </button>
      )}
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

    {(isAdmin || isHrAdmin) && (
      <>
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

        
        <button
          onClick={async () => {
            // Ensure employees are loaded before opening modal
            if (employees.length === 0) {
              try {
                const empData = await api.getEmployees()
                setEmployees(Array.isArray(empData) ? empData : [])
              } catch (error) {
                console.error('Error loading employees:', error)
                setError('Failed to load employees')
              }
            }
            setSelectedEmployee(null)
            setMarkFormData({ status: 'Present', checkIn: '', checkOut: '' })
            setShowMarkModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <CheckCircle className="w-4 h-4" />
          Mark Attendance
        </button>

        
        <button
          onClick={handleExportAttendance}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </>
    )}
  </div>
</div>

      </div>

      {/* Calendar Grid View */}
      {viewType === 'calendar' && canViewCalendar && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
          {/* Calendar Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {!isEmployee && (
              <input
                type="text"
                placeholder="Employee Name"
                value={employeeNameFilter}
                onChange={(e) => setEmployeeNameFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
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
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={loadCalendarData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
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
                    {!hideEmployeeColumnDaily && (
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 border border-gray-200 sticky left-0 bg-blue-50 z-10">
                        Employee Name
                      </th>
                    )}
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
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={getDaysInSelectedMonth().length + (hideEmployeeColumnDaily ? 0 : 1)} className="px-6 py-8 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const employeeName = employee.name || 'N/A'
                      const employeeEmail = employee.email || ''
                      return (
                        <tr key={employee.id || employee.employeeId} className="hover:bg-gray-50">
                          {!hideEmployeeColumnDaily && (
                            <td className="px-4 py-3 border border-gray-200 sticky left-0 bg-white z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                  {employeeName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                                  <div className="text-xs text-gray-500">{employeeEmail}</div>
                                </div>
                              </div>
                            </td>
                          )}
                          {getDaysInSelectedMonth().map(day => {
                            const date = new Date(selectedYear, selectedMonth - 1, day)
                            const dayOfWeek = getDay(date)
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                            const attendanceRecord = getAttendanceForDay(employee.id || employee.employeeId, day)
                            const isPresent = attendanceRecord && attendanceRecord.status === 'Present'
                            
                            return (
                              <td
                                key={day}
                                className={`px-2 py-3 text-center border border-gray-200 ${
                                  isWeekend ? 'bg-yellow-50' : ''
                                }`}
                              >
                                {isPresent ? (
                                  <div className="relative inline-flex justify-center group">
                                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                    <AttendanceHoverTooltip record={attendanceRecord} />
                                  </div>
                                ) : attendanceRecord ? (
                                  <X className="w-5 h-5 text-red-600 mx-auto" />
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attendance Table */}
      {viewType !== 'calendar' && (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[640px]">
            <thead className="bg-blue-50">
              <tr>
                {viewType === 'daily' && !hideEmployeeColumnDaily && (
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 sticky left-0 bg-blue-50 z-10">
                    Employee
                  </th>
                )}
                    {viewType === 'daily' && (
                      <>
                        {(isAdmin || isHrAdmin) && (
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 hidden sm:table-cell">Department</th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Check In</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Check Out</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Working Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                        {(isAdmin || isHrAdmin) && (
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
                        )}
                      </>
                    )}
                {(viewType === 'weekly' || viewType === 'monthly') && (
                  <>
                    {!hideEmployeeColumnDaily && (
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 sticky left-0 bg-blue-50 z-10">
                        Employee
                      </th>
                    )}
                    {(isAdmin || isHrAdmin) && (
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 hidden sm:table-cell">Department</th>
                    )}
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
                    {(isAdmin || isHrAdmin) && (
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
                    )}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={
                    viewType === 'daily' 
                      ? (isAdmin || isHrAdmin ? 8 : (hideEmployeeColumnDaily ? 5 : 6))
                      : (viewType === 'weekly' 
                          ? ((hideEmployeeColumnDaily ? 0 : 1) + ((isAdmin || isHrAdmin) ? 1 : 0) + 7 + 2 + ((isAdmin || isHrAdmin) ? 1 : 0)) // Name (if shown) + Dept + 7 days + Total + Present + Actions
                          : (viewType === 'monthly'
                              ? ((hideEmployeeColumnDaily ? 0 : 1) + ((isAdmin || isHrAdmin) ? 1 : 0) + getDaysForView().length + 2 + ((isAdmin || isHrAdmin) ? 1 : 0)) // Name (if shown) + Dept + days + Total + Present + Actions
                              : 7))
                  } className="px-6 py-8 text-center text-gray-500">
                    Loading attendance data...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={
                    viewType === 'daily' 
                      ? (isAdmin || isHrAdmin ? 8 : (hideEmployeeColumnDaily ? 5 : 6))
                      : (viewType === 'weekly' 
                          ? ((hideEmployeeColumnDaily ? 0 : 1) + ((isAdmin || isHrAdmin) ? 1 : 0) + 7 + 2 + ((isAdmin || isHrAdmin) ? 1 : 0)) // Name (if shown) + Dept + 7 days + Total + Present + Actions
                          : (viewType === 'monthly'
                              ? ((hideEmployeeColumnDaily ? 0 : 1) + ((isAdmin || isHrAdmin) ? 1 : 0) + getDaysForView().length + 2 + ((isAdmin || isHrAdmin) ? 1 : 0)) // Name (if shown) + Dept + days + Total + Present + Actions
                              : 7))
                  } className="px-6 py-8 text-center text-gray-500">
                    No attendance records found {viewType === 'daily' ? 'for this date' : viewType === 'weekly' ? 'for this week' : 'for this month'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const employeeName = employee.name || 'Unknown'
                  // Normalize employee ID (handle both id and employeeId fields)
                  // Try multiple ways to get the employee ID
                  let empId = employee.id || employee.employeeId || employee.userId
                  if (empId && typeof empId === 'string') {
                    const parsed = parseInt(empId)
                    empId = isNaN(parsed) ? empId : parsed
                  }
                  
                  // For weekly/monthly views, calculate totals
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
                        if (dayRecord.status === 'Present') {
                          presentDays++
                        }
                      }
                    })
                    
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        {!hideEmployeeColumnDaily && (
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
                        )}
                        {(isAdmin || isHrAdmin) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                            {employee.department || 'N/A'}
                          </td>
                        )}
                        {days.map((day, idx) => {
                          const dayStr = format(day, 'yyyy-MM-dd')
                          const dayRecord = empId ? getAttendanceStatus(empId, dayStr) : null
                          const isPresent = dayRecord?.status === 'Present'
                          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          
                          return (
                            <td 
                              key={idx} 
                              className={`px-2 py-3 text-center ${(isAdmin || isHrAdmin) ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}
                              onClick={(isAdmin || isHrAdmin) ? () => {
                                // Ensure we use the specific day's date, not the record's date (which might be different)
                                const recordToEdit = dayRecord ? { ...dayRecord, date: dayStr } : { employeeId: empId, date: dayStr }
                                setSelectedRecord(recordToEdit)
                                setMarkFormData({
                                  status: dayRecord?.status || 'Present',
                                  checkIn: dayRecord?.checkIn || '',
                                  checkOut: dayRecord?.checkOut || ''
                                })
                                setSelectedEmployee(employee)
                                setShowEditModal(true)
                              } : undefined}
                              title={(isAdmin || isHrAdmin) ? `Click to edit attendance for ${format(day, 'MMM dd, yyyy')}` : ''}
                            >
                              {dayRecord ? (
                                <div className="flex flex-col items-center gap-1">
                                  {isPresent ? (
                                    <div title={getAttendanceTooltip(dayRecord)} className="inline-flex">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                  ) : (
                                    <X className="w-5 h-5 text-red-600" />
                                  )}
                                  {dayRecord.workingHours && (
                                    <span className="text-xs font-semibold text-gray-700">
                                      {parseFloat(dayRecord.workingHours).toFixed(1)}h
                                    </span>
                                  )}
                                </div>
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
                        {(isAdmin || isHrAdmin) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => {
                                  // Mark attendance for today or first day of period
                                  const today = new Date()
                                  const todayStr = format(today, 'yyyy-MM-dd')
                                  const periodDays = days.map(d => format(d, 'yyyy-MM-dd'))
                                  const targetDay = periodDays.includes(todayStr) ? todayStr : format(days[0], 'yyyy-MM-dd')
                                  const targetRecord = getAttendanceStatus(empId, targetDay)
                                  setSelectedRecord(targetRecord || { employeeId: empId, date: targetDay })
                                  setMarkFormData({
                                    status: targetRecord?.status || 'Present',
                                    checkIn: targetRecord?.checkIn || '',
                                    checkOut: targetRecord?.checkOut || ''
                                  })
                                  setSelectedEmployee(employee)
                                  setShowEditModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                title="Mark/Edit attendance"
                              >
                                <Edit className="w-4 h-4" />
                                <span className="text-xs">Edit</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  }
                  
                  // Daily view
                  const record = getAttendanceStatus(empId)
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      {!hideEmployeeColumnDaily && (
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
                      )}
                      {(isAdmin || isHrAdmin) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {employee.department || 'N/A'}
                        </td>
                      )}
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
                      {(isAdmin || isHrAdmin) && (
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
      )}

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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                  <select
                    value={selectedEmployee?.id || selectedEmployee?.employeeId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value ? parseInt(e.target.value) : null
                      if (!selectedId) {
                        setSelectedEmployee(null)
                        return
                      }
                      const emp = employees.find(emp => {
                        const empId = emp.id || emp.employeeId
                        return empId === selectedId || empId === selectedId.toString() || parseInt(empId) === selectedId
                      })
                      if (emp) {
                        setSelectedEmployee(emp)
                        setError(null) // Clear any previous errors
                      } else {
                        setSelectedEmployee(null)
                        setError('Employee not found')
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.length === 0 ? (
                      <option value="" disabled>Loading employees...</option>
                    ) : (
                      employees
                        .filter(emp => emp && (emp.id || emp.employeeId)) // Filter out invalid employees
                        .map(emp => {
                          const empId = emp.id || emp.employeeId
                          const empName = emp.name || `Employee ${empId}`
                          return (
                            <option key={empId} value={empId}>
                              {empName} {emp.employeeId ? `(${emp.employeeId})` : ''}
                            </option>
                          )
                        })
                    )}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No employees found. Please ensure employees are added to the system.</p>
                  )}
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
                {selectedEmployee && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-gray-600 mb-1">Employee</div>
                    <div className="text-base font-semibold text-gray-900">{selectedEmployee.name || 'Unknown'}</div>
                  </div>
                )}
                {selectedRecord?.date && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={(() => {
                        try {
                          // Ensure date is in yyyy-MM-dd format
                          if (typeof selectedRecord.date === 'string') {
                            if (selectedRecord.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                              return selectedRecord.date
                            } else {
                              // Try to parse and format
                              const parsed = new Date(selectedRecord.date)
                              return format(parsed, 'yyyy-MM-dd')
                            }
                          } else {
                            return format(new Date(selectedRecord.date), 'yyyy-MM-dd')
                          }
                        } catch (error) {
                          console.error('Error formatting date:', error, selectedRecord.date)
                          return selectedRecord.date || format(new Date(), 'yyyy-MM-dd')
                        }
                      })()}
                      onChange={(e) => {
                        setSelectedRecord({ ...selectedRecord, date: e.target.value })
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {(() => {
                        try {
                          const dateStr = typeof selectedRecord.date === 'string' && selectedRecord.date.match(/^\d{4}-\d{2}-\d{2}$/)
                            ? selectedRecord.date
                            : format(new Date(selectedRecord.date), 'yyyy-MM-dd')
                          const [year, month, day] = dateStr.split('-')
                          const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                          return format(dateObj, 'EEEE, MMMM dd, yyyy')
                        } catch (error) {
                          return ''
                        }
                      })()}
                    </div>
                  </div>
                )}
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
