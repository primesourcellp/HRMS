import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, CheckCircle, LogOut, X, LogIn, Timer, ChevronLeft, ChevronRight, Search, FileText, Eye } from 'lucide-react'
import api from '../services/api'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, getDaysInMonth, getDay, differenceInDays, parseISO, isAfter, isBefore, startOfToday } from 'date-fns'

const MyAttendance = () => {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [calendarSummary, setCalendarSummary] = useState({ workedDays: 0, leaveDays: 0, totalWorkingHours: 0 })
  
  // View toggle: 'attendance' or 'myLeaves' (for HR_ADMIN)
  // Initialize from URL parameter to persist on refresh
  const getInitialActiveView = () => {
    const urlParams = new URLSearchParams(location.search)
    const viewParam = urlParams.get('view')
    if (viewParam === 'leaves' || viewParam === 'myLeaves') {
      return 'myLeaves'
    }
    return 'attendance'
  }
  const [activeView, setActiveView] = useState(getInitialActiveView())
  
  // Leave application modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [myLeaves, setMyLeaves] = useState([])
  const [leaveFilter, setLeaveFilter] = useState('All')
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [users, setUsers] = useState([])
  const [leaveFormData, setLeaveFormData] = useState({
    leaveTypeId: '',
    leaveDate: '',
    reason: '',
    halfDay: false,
    halfDayType: 'FIRST_HALF'
  })
  const [showLeaveDetailsModal, setShowLeaveDetailsModal] = useState(false)
  const [selectedMyLeave, setSelectedMyLeave] = useState(null)
  const [detailsOnlyMode, setDetailsOnlyMode] = useState(false)
  const [openingLeaveFromNotification, setOpeningLeaveFromNotification] = useState(false)
  const [calculatedDays, setCalculatedDays] = useState(0)
  const [validationError, setValidationError] = useState('')
  
  const employeeId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
  const userRole = localStorage.getItem('userRole')
  const isHrAdmin = userRole === 'HR_ADMIN'
  const currentUserId = localStorage.getItem('userId')

  // Sync activeView with URL parameter on mount and URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const viewParam = urlParams.get('view')
    if (viewParam === 'leaves' || viewParam === 'myLeaves') {
      if (activeView !== 'myLeaves') {
        setActiveView('myLeaves')
      }
    } else if (viewParam === null && activeView === 'myLeaves') {
      // If no view param but we're on myLeaves, sync to attendance
      setActiveView('attendance')
    }
  }, [location.search])

  useEffect(() => {
    const allowedRoles = ['HR_ADMIN', 'FINANCE']
    if (!allowedRoles.includes(userRole) || !employeeId) {
      setError('Access denied. This page is only for HR Administrators and Finance users.')
      return
    }
    
    // Load data based on activeView
    if (activeView === 'myLeaves') {
      // Load leave data when on myLeaves view
      loadLeaveData()
      loadMyLeaves()
    } else {
      // Load attendance data when on attendance view
      loadTodayAttendance()
      if (viewType === 'calendar') {
        loadCalendarData()
      } else {
        loadMyAttendance()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, selectedDate, viewType, activeView])

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
      
      const [attendanceData, leavesData] = await Promise.all([
        api.getAttendanceByEmployeeDateRange(employeeId, startDate, endDate),
        api.getLeavesByEmployee(parseInt(employeeId)).catch(() => [])
      ])
      const attList = Array.isArray(attendanceData) ? attendanceData : []
      setCalendarAttendance(attList)

      // Summary: worked days + total working hours (month)
      const workedDays = attList.filter(r => {
        const status = (r?.status || '').toString().toLowerCase()
        if (status === 'absent') return false
        return status === 'present' || r?.checkIn || r?.checkInTime
      }).length

      const totalWorkingHours = attList.reduce((sum, r) => {
        const status = (r?.status || '').toString().toLowerCase()
        if (status === 'absent') return sum
        const wh = r?.workingHours
        const whNum = typeof wh === 'string' ? parseFloat(wh) : wh
        if (Number.isFinite(whNum)) return sum + whNum
        // Fallback compute from checkIn/checkOut if available
        const inT = r?.checkIn || r?.checkInTime
        const outT = r?.checkOut || r?.checkOutTime
        if (inT && outT) {
          const diffMs = new Date(`2000-01-01 ${outT}`) - new Date(`2000-01-01 ${inT}`)
          if (Number.isFinite(diffMs) && diffMs > 0) return sum + (diffMs / (1000 * 60 * 60))
        }
        return sum
      }, 0)

      // Summary: leave taken days (approved leaves overlapping month)
      const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
      const monthEnd = new Date(selectedYear, selectedMonth, 0)
      const leavesList = Array.isArray(leavesData) ? leavesData : []
      const leaveDays = leavesList
        .filter(l => (l?.status || '').toString().toUpperCase() === 'APPROVED')
        .reduce((sum, l) => {
          try {
            const ls = new Date(l.startDate)
            const le = new Date(l.endDate)
            const start = ls > monthStart ? ls : monthStart
            const end = le < monthEnd ? le : monthEnd
            if (end < start) return sum
            if (l.halfDay) return sum + 0.5
            return sum + (differenceInDays(end, start) + 1)
          } catch {
            return sum
          }
        }, 0)

      setCalendarSummary({ workedDays, leaveDays, totalWorkingHours })
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
    if (status === 'absent') return 'Absent'
    const checkIn = formatTimeAmPm(record.checkIn || record.checkInTime)
    const checkOut = formatTimeAmPm(record.checkOut || record.checkOutTime)
    const wh = record.workingHours ? formatWorkingHours(record.workingHours) : '-'
    const hasAnyTime = (record.checkIn || record.checkInTime || record.checkOut || record.checkOutTime || record.workingHours)
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

  // Load leave data (types and balances)
  const loadLeaveData = async () => {
    if (!currentUserId) return
    
    try {
      const [types, balances, usersData] = await Promise.all([
        api.getActiveLeaveTypes(),
        api.getLeaveBalances(parseInt(currentUserId), new Date().getFullYear()),
        api.getUsers().catch(() => [])
      ])
      
      setLeaveTypes(Array.isArray(types) ? types : [])
      setLeaveBalances(Array.isArray(balances) ? balances : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Error loading leave data:', error)
      setLeaveTypes([])
      setLeaveBalances([])
      setUsers([])
    }
  }

  // Get leave balance for a specific leave type
  const getLeaveBalance = (leaveTypeId) => {
    if (!leaveTypeId) return 0
    const balance = leaveBalances.find(b => {
      const balanceTypeId = typeof b.leaveTypeId === 'string' ? parseInt(b.leaveTypeId) : b.leaveTypeId
      const typeId = typeof leaveTypeId === 'string' ? parseInt(leaveTypeId) : leaveTypeId
      return balanceTypeId === typeId
    })
    return balance?.balance || 0
  }

  // Calculate total leave days
  const calculateLeaveDays = () => {
    if (!leaveFormData.leaveDate) {
      setCalculatedDays(0)
      return
    }

    if (leaveFormData.halfDay) {
      setCalculatedDays(0.5)
    } else {
      setCalculatedDays(1)
    }
  }

  // Validate leave form
  const validateLeaveForm = () => {
    setValidationError('')

    if (!leaveFormData.leaveTypeId) {
      setValidationError('Please select a leave type')
      return false
    }

    if (!leaveFormData.leaveDate) {
      setValidationError('Please select a date')
      return false
    }

    const selectedDate = parseISO(leaveFormData.leaveDate)
    const today = startOfToday()

    if (isBefore(selectedDate, today)) {
      setValidationError('Date cannot be in the past')
      return false
    }

    // Check leave balance
    const balance = getLeaveBalance(parseInt(leaveFormData.leaveTypeId))
    const requiredDays = leaveFormData.halfDay ? 0.5 : 1

    if (balance < requiredDays) {
      const selectedType = leaveTypes.find(t => t.id === parseInt(leaveFormData.leaveTypeId))
      const maxDays = selectedType?.maxDays || 0
      
      if (balance === 0) {
        if (maxDays > 0) {
          setValidationError(`Leave balance not assigned. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days. This leave type allows up to ${maxDays} days. Please contact your administrator to assign leave balance.`)
        } else {
          setValidationError(`Leave balance not assigned. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days. Please contact your administrator to assign leave balance for this leave type.`)
        }
      } else {
        setValidationError(`Insufficient leave balance. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days. Please contact HR for additional leave.`)
      }
      return false
    }

    // Check max days for leave type
    const selectedType = leaveTypes.find(t => t.id === parseInt(leaveFormData.leaveTypeId))
    if (selectedType && selectedType.maxDays && requiredDays > selectedType.maxDays) {
      setValidationError(`Leave duration exceeds maximum allowed days (${selectedType.maxDays} days)`)
      return false
    }

    return true
  }

  // Handle leave form submission
  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateLeaveForm()) {
      return
    }

    setLoading(true)
    setValidationError('')
    
    try {
      const leaveData = {
        employeeId: parseInt(currentUserId),
        leaveTypeId: parseInt(leaveFormData.leaveTypeId),
        startDate: leaveFormData.leaveDate,
        endDate: leaveFormData.leaveDate,
        reason: leaveFormData.reason,
        halfDay: leaveFormData.halfDay,
        halfDayType: leaveFormData.halfDay ? leaveFormData.halfDayType : null
      }

      await api.createLeave(leaveData)
      setSuccessMessage('Leave application submitted successfully!')
      setTimeout(() => setSuccessMessage(null), 5000)
      
      // Reset form and close modal
      resetLeaveForm()
      setShowLeaveModal(false)
      
      // Reload leave balances and my leaves
      await loadLeaveData()
      await loadMyLeaves()
    } catch (error) {
      console.error('Error submitting leave application:', error)
      setValidationError(error.message || 'Failed to submit leave application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset leave form
  const resetLeaveForm = () => {
    setLeaveFormData({
      leaveTypeId: '',
      leaveDate: '',
      reason: '',
      halfDay: false,
      halfDayType: 'FIRST_HALF'
    })
    setCalculatedDays(0)
    setValidationError('')
  }

  // Load My Leaves data
  const loadMyLeaves = async () => {
    if (!currentUserId) return
    try {
      const leavesData = await api.getLeavesByEmployee(parseInt(currentUserId))
      const list = Array.isArray(leavesData) ? leavesData : []
      setMyLeaves(list)
      return list
    } catch (error) {
      console.error('Error loading my leaves:', error)
      setMyLeaves([])
      return []
    }
  }

  // Handle Apply Leave button click - Switch to My Leaves view
  const handleApplyLeave = async () => {
    try {
      setActiveView('myLeaves')
      // Update URL to persist view on refresh
      navigate('/my-attendance?view=leaves', { replace: true })
      // Load data in parallel for better performance
      await Promise.all([
        loadLeaveData(),
        loadMyLeaves()
      ])
    } catch (error) {
      console.error('Error loading leave data:', error)
      setError('Failed to load leave data. Please try again.')
    }
  }

  // Calculate days when date or half day changes
  useEffect(() => {
    if (leaveFormData.leaveDate) {
      calculateLeaveDays()
    } else {
      setCalculatedDays(0)
    }
  }, [leaveFormData.leaveDate, leaveFormData.halfDay])

  // Get leave type name
  const getLeaveTypeName = (leaveTypeId) => {
    const type = leaveTypes.find(t => t.id === parseInt(leaveTypeId))
    return type ? type.name : 'Unknown'
  }

  const getApproverName = (userId) => {
    if (!userId) return 'N/A'
    const u = users.find(x => {
      const id = typeof x.id === 'string' ? parseInt(x.id) : x.id
      return id === userId
    })
    return u?.name || `User ${userId}`
  }

  const openMyLeaveDetails = (leave) => {
    setSelectedMyLeave(leave)
    setShowLeaveDetailsModal(true)
  }

  // Auto-open My Leave Details from notifications (HR_ADMIN own leave approved/rejected)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const leaveIdFromUrl = urlParams.get('leaveId')
    const leaveIdFromStorage = sessionStorage.getItem('viewMyLeaveId')
    const leaveId = leaveIdFromUrl || leaveIdFromStorage

    if (!leaveId) return

    const open = async () => {
      try {
        setOpeningLeaveFromNotification(true)
        setActiveView('myLeaves')
        // Update URL to include view parameter
        navigate('/my-attendance?view=leaves&leaveId=' + leaveId, { replace: true })
        const [, leavesList] = await Promise.all([loadLeaveData(), loadMyLeaves()])

        const found = (Array.isArray(leavesList) ? leavesList : []).find(l => l?.id === parseInt(leaveId))
        if (found) {
          // details-only: hide list/balances behind the modal ONLY after we have data
          setDetailsOnlyMode(true)
          openMyLeaveDetails(found)
        } else {
          setDetailsOnlyMode(false)
          setError('Leave details not found.')
        }
        sessionStorage.removeItem('viewMyLeaveId')
        if (leaveIdFromUrl) {
          // Keep view parameter when removing leaveId
          navigate('/my-attendance?view=leaves', { replace: true })
        }
      } catch (e) {
        console.error('Failed to auto-open my leave details:', e)
        setDetailsOnlyMode(false)
        setError('Failed to open leave details.')
      } finally {
        setOpeningLeaveFromNotification(false)
      }
    }

    open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // Filter leaves
  const filteredMyLeaves = myLeaves.filter(leave => {
    if (leaveFilter === 'All') return true
    return leave.status?.toUpperCase() === leaveFilter.toUpperCase()
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          {activeView === 'myLeaves' ? 'My Leaves' : 'My Attendance'}
        </h1>
        <div className="flex items-center gap-2">
          {activeView === 'myLeaves' && (
            <button
              onClick={() => {
                setActiveView('attendance')
                navigate('/my-attendance', { replace: true })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Back to Attendance
            </button>
          )}
          {isHrAdmin && (
            <button
              onClick={activeView === 'myLeaves' ? () => setShowLeaveModal(true) : handleApplyLeave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              {activeView === 'myLeaves' ? 'Apply Leave' : 'My Leaves'}
            </button>
          )}
        </div>
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

      {/* My Leaves View */}
      {activeView === 'myLeaves' && (
        <div className="space-y-4">
          {/* When opened from notification, show ONLY the details modal (no list/balances behind) */}
          {openingLeaveFromNotification ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
              Loading leave details...
            </div>
          ) : detailsOnlyMode ? null : (
            <>
          {/* Leave Balances */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Your Leave Balance</h2>
                <p className="text-sm text-gray-600">Year {new Date().getFullYear()}</p>
              </div>
              <button
                onClick={loadLeaveData}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Refresh Leave Balances"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveTypes.filter(lt => lt.active).map(type => {
                const balance = getLeaveBalance(type.id)
                const used = leaveBalances.find(b => b.leaveTypeId === type.id)?.used || 0
                const total = leaveBalances.find(b => b.leaveTypeId === type.id)?.totalDays || type.maxDays || 0
                const percentage = total > 0 ? (used / total) * 100 : 0
                
                return (
                  <div key={type.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{type.name}</h3>
                        <p className="text-xs text-gray-500">ID: {type.code}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{balance.toFixed(1)} days</div>
                        <p className="text-xs text-gray-500">AVAILABLE BALANCE</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Used: {used.toFixed(1)} / {total.toFixed(1)} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leave List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">My Leave Applications</h2>
              <select
                value={leaveFilter}
                onChange={(e) => setLeaveFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Leaves</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              {filteredMyLeaves.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No leave applications found</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700">View</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMyLeaves.map((leave, index) => (
                      <tr
                        key={leave.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openMyLeaveDetails(leave)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getLeaveTypeName(leave.leaveTypeId)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(leave.startDate), 'MMM dd, yyyy')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.totalDays} days</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{leave.reason || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            leave.status === 'APPROVED' || leave.status === 'Approved' 
                              ? 'bg-green-100 text-green-800'
                              : leave.status === 'REJECTED' || leave.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openMyLeaveDetails(leave)
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* My Leave Details Modal */}
      {showLeaveDetailsModal && selectedMyLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                Leave Details
              </h3>
              <button
                onClick={() => {
                  setShowLeaveDetailsModal(false)
                  setSelectedMyLeave(null)
                  if (detailsOnlyMode) {
                    setDetailsOnlyMode(false)
                    setActiveView('myLeaves')
                    navigate('/my-attendance?view=leaves', { replace: true })
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">Leave Type</p>
                <p className="font-semibold text-gray-900">{getLeaveTypeName(selectedMyLeave.leaveTypeId)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedMyLeave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  selectedMyLeave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  selectedMyLeave.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedMyLeave.status}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold text-gray-900">{format(new Date(selectedMyLeave.startDate), 'MMM dd, yyyy')}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-semibold text-gray-900">{format(new Date(selectedMyLeave.endDate), 'MMM dd, yyyy')}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="font-semibold text-gray-900">{selectedMyLeave.totalDays} {selectedMyLeave.totalDays === 1 ? 'day' : 'days'}</p>
              </div>
              {selectedMyLeave.appliedDate && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">Applied Date</p>
                  <p className="font-semibold text-gray-900">{format(new Date(selectedMyLeave.appliedDate), 'MMM dd, yyyy')}</p>
                </div>
              )}
              {selectedMyLeave.approvedBy && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">Action By</p>
                  <p className="font-semibold text-gray-900">{getApproverName(selectedMyLeave.approvedBy)}</p>
                </div>
              )}
              {selectedMyLeave.approvedDate && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">Action Date</p>
                  <p className="font-semibold text-gray-900">{format(new Date(selectedMyLeave.approvedDate), 'MMM dd, yyyy')}</p>
                </div>
              )}
              {selectedMyLeave.halfDay && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">Half Day</p>
                  <p className="font-semibold text-gray-900">{selectedMyLeave.halfDayType || 'Yes'}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Reason</p>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-200">
                {selectedMyLeave.reason || '-'}
              </p>
            </div>

            {selectedMyLeave.rejectionReason && (
              <div className="mb-4">
                <p className="text-sm text-red-700 mb-2 font-semibold">Rejection Reason</p>
                <p className="text-red-900 bg-red-50 p-4 rounded-xl border border-red-200">
                  {selectedMyLeave.rejectionReason}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveDetailsModal(false)
                  setSelectedMyLeave(null)
                  if (detailsOnlyMode) {
                    setDetailsOnlyMode(false)
                    setActiveView('myLeaves')
                    navigate('/my-attendance?view=leaves', { replace: true })
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance View */}
      {activeView === 'attendance' && (
        <>
      {/* Filters and Today's Attendance Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* View Type Toggle and Date Navigation */}
        <div className="bg-white rounded-xl shadow-md p-3 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              onClick={() => setViewType('daily')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'daily'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewType('weekly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'weekly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewType('monthly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                viewType === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
          </div>

          {/* Date Navigation */}
          {viewType !== 'calendar' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              <button
                onClick={() => handleDateChange('next')}
                className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Today
              </button>
              {viewType === 'weekly' && (
                <button
                  onClick={goToThisWeek}
                  className="px-5 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  This Week
                </button>
              )}
              {viewType === 'monthly' && (
                <button
                  onClick={goToThisMonth}
                  className="px-5 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12)
                    setSelectedYear(prev => prev - 1)
                  } else {
                    setSelectedMonth(prev => prev - 1)
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                title="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1)
                    setSelectedYear(prev => prev + 1)
                  } else {
                    setSelectedMonth(prev => prev + 1)
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                title="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setSelectedMonth(now.getMonth() + 1)
                  setSelectedYear(now.getFullYear())
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={loadCalendarData}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading calendar data...</div>
            </div>
          ) : (
            <>
              {/* Month Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="text-xs text-blue-700 font-semibold">TOTAL WORKING HOURS</div>
                  <div className="text-lg font-bold text-blue-900">{calendarSummary.totalWorkingHours.toFixed(1)} hrs</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="text-xs text-green-700 font-semibold">WORKED DAYS</div>
                  <div className="text-lg font-bold text-green-900">{calendarSummary.workedDays}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="text-xs text-amber-700 font-semibold">LEAVE TAKEN DAYS</div>
                  <div className="text-lg font-bold text-amber-900">{calendarSummary.leaveDays.toFixed(1)}</div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-gray-600 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center py-1">{d}</div>
                ))}
              </div>

              {(() => {
                const firstDayIndex = getDay(new Date(selectedYear, selectedMonth - 1, 1)) // 0=Sun
                const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
                const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7
                const todayStr = format(new Date(), 'yyyy-MM-dd')

                return (
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: totalCells }, (_, i) => {
                      const dayNum = i - firstDayIndex + 1
                      const isValidDay = dayNum >= 1 && dayNum <= daysInMonth

                      if (!isValidDay) {
                        return <div key={i} className="h-14 sm:h-16 rounded-lg bg-gray-50" />
                      }

                      const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum)
                      const dateStr = format(dateObj, 'yyyy-MM-dd')
                      const attendanceRecord = getAttendanceForDay(dayNum)
                      const statusLower = (attendanceRecord?.status || '').toString().toLowerCase()
                      const isExplicitAbsent = statusLower === 'absent'
                      // If SUPER_ADMIN marked Absent but old time still exists, Absent must win.
                      const isPresent =
                        !!attendanceRecord &&
                        !isExplicitAbsent &&
                        (
                          statusLower === 'present' ||
                          attendanceRecord.checkIn ||
                          attendanceRecord.checkInTime
                        )
                      const isSunday = getDay(dateObj) === 0
                      const isPast = isBefore(dateObj, startOfToday())
                      // Absent if: past date, not Sunday, and no record OR record explicitly not present
                      const isAbsent = (!isSunday && isPast && !attendanceRecord) || (!!attendanceRecord && !isPresent && !isSunday)
                      const isToday = dateStr === todayStr

                      return (
                        <div
                          key={i}
                          className={`relative group h-14 sm:h-16 rounded-lg border px-2 py-1 flex flex-col justify-between transition-colors ${
                            isPresent
                              ? 'bg-green-50 border-green-200'
                              : isAbsent
                                ? 'bg-red-50 border-red-200'
                                : isSunday
                                  ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-white border-gray-200'
                          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <AttendanceHoverTooltip record={attendanceRecord} />
                          <div className="text-sm font-semibold text-gray-800">{dayNum}</div>
                          <div className="flex items-center justify-center pb-1">
                            {(isPresent || isAbsent || isSunday) ? (
                              <div className="inline-flex justify-center">
                                {isPresent && <span className="w-3.5 h-3.5 rounded-full bg-green-600 shadow-sm ring-2 ring-white" />}
                                {isAbsent && <span className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-sm ring-2 ring-white" />}
                                {isSunday && !isPresent && !isAbsent && <span className="text-[10px] font-bold text-yellow-700">H</span>}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  Present
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  Absent
                </div>
              </div>
            </>
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
        </>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={leaveFormData.leaveDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      // Check if user has enough balance for this date
                      if (leaveFormData.leaveTypeId) {
                        const balance = getLeaveBalance(parseInt(leaveFormData.leaveTypeId))
                        const requiredDays = leaveFormData.halfDay ? 0.5 : 1
                        if (balance < requiredDays) {
                          setValidationError(`Insufficient leave balance. Available: ${balance.toFixed(1)} days, Required: ${requiredDays} days.`)
                          return
                        }
                      }
                      setLeaveFormData({ ...leaveFormData, leaveDate: selectedDate })
                      setValidationError('')
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                  {leaveFormData.leaveTypeId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available balance: {getLeaveBalance(parseInt(leaveFormData.leaveTypeId)).toFixed(1)} days
                    </p>
                  )}
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

