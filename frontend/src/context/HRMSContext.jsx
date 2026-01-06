import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { verifyToken } from '../utils/auth'

const HRMSContext = createContext()

export const useHRMS = () => {
  const context = useContext(HRMSContext)
  if (!context) {
    throw new Error('useHRMS must be used within HRMSProvider')
  }
  return context
}

export const HRMSProvider = ({ children }) => {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  // Load initial data only after authentication is verified
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First verify authentication
        const isAuth = localStorage.getItem('isAuthenticated') === 'true'
        if (!isAuth) {
          setLoading(false)
          return
        }

        // Verify token with backend to ensure it's valid
        const tokenValid = await verifyToken()
        if (!tokenValid) {
          setLoading(false)
          return
        }

        // Token is valid, now load data
        await loadAllData()
      } catch (error) {
        console.error('Error initializing data:', error)
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [empData, attData, leaveData, payrollData, perfData] = await Promise.allSettled([
        api.getEmployees(),
        api.getAttendance(),
        api.getLeaves(),
        api.getPayrolls(),
        api.getPerformance()
      ])
      
      // Safely handle each response, defaulting to empty array if failed
      setEmployees(Array.isArray(empData.value) ? empData.value : (empData.status === 'fulfilled' ? [] : []))
      setAttendance(Array.isArray(attData.value) ? attData.value : (attData.status === 'fulfilled' ? [] : []))
      setLeaves(Array.isArray(leaveData.value) ? leaveData.value : (leaveData.status === 'fulfilled' ? [] : []))
      setPayrolls(Array.isArray(payrollData.value) ? payrollData.value : (payrollData.status === 'fulfilled' ? [] : []))
      setPerformance(Array.isArray(perfData.value) ? perfData.value : (perfData.status === 'fulfilled' ? [] : []))
      
      // Log any errors
      if (empData.status === 'rejected') console.error('Error loading employees:', empData.reason)
      if (attData.status === 'rejected') console.error('Error loading attendance:', attData.reason)
      if (leaveData.status === 'rejected') console.error('Error loading leaves:', leaveData.reason)
      if (payrollData.status === 'rejected') console.error('Error loading payrolls:', payrollData.reason)
      if (perfData.status === 'rejected') console.error('Error loading performance:', perfData.reason)
    } catch (error) {
      console.error('Error loading data:', error)
      // Ensure arrays are set even on error
      setEmployees([])
      setAttendance([])
      setLeaves([])
      setPayrolls([])
      setPerformance([])
    } finally {
      setLoading(false)
    }
  }

  const addEmployee = async (employee) => {
    try {
      const userRole = localStorage.getItem('userRole')
      const newEmployee = await api.createEmployee(employee, userRole)
      setEmployees([...employees, newEmployee])
      return newEmployee
    } catch (error) {
      console.error('Error adding employee:', error)
      throw error
    }
  }

  const updateEmployee = async (id, updatedData) => {
    try {
      const userRole = localStorage.getItem('userRole')
      const updated = await api.updateEmployee(id, updatedData, userRole)
      setEmployees(employees.map(emp => emp.id === id ? updated : emp))
      return updated
    } catch (error) {
      console.error('Error updating employee:', error)
      throw error
    }
  }

  const deleteEmployee = async (id) => {
    try {
      const userRole = localStorage.getItem('userRole')
      await api.deleteEmployee(id, userRole)
      setEmployees(employees.filter(emp => emp.id !== id))
    } catch (error) {
      console.error('Error deleting employee:', error)
      throw error
    }
  }

  const markAttendance = async (employeeId, date, status, checkIn, checkOut) => {
    try {
      const data = {
        employeeId,
        date,
        status,
        checkIn: checkIn || null,
        checkOut: checkOut || null
      }
      const updated = await api.markAttendance(data)
      const existing = attendance.find(a => a.employeeId === employeeId && a.date === date)
      if (existing) {
        setAttendance(attendance.map(a => 
          a.id === updated.id ? updated : a
        ))
      } else {
        setAttendance([...attendance, updated])
      }
      return updated
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  const addLeave = async (leave) => {
    try {
      const newLeave = await api.createLeave(leave)
      setLeaves([...leaves, newLeave])
      return newLeave
    } catch (error) {
      console.error('Error adding leave:', error)
      throw error
    }
  }

  const updateLeave = async (id, status) => {
    try {
      const updated = await api.updateLeaveStatus(id, status)
      setLeaves(leaves.map(leave => leave.id === id ? updated : leave))
      return updated
    } catch (error) {
      console.error('Error updating leave:', error)
      throw error
    }
  }

  const addPayroll = async (payroll) => {
    try {
      const newPayroll = await api.createPayroll(payroll)
      setPayrolls([...payrolls, newPayroll])
      return newPayroll
    } catch (error) {
      console.error('Error adding payroll:', error)
      throw error
    }
  }

  const addPerformance = async (review) => {
    try {
      const newReview = await api.createPerformance(review)
      setPerformance([...performance, newReview])
      return newReview
    } catch (error) {
      console.error('Error adding performance:', error)
      throw error
    }
  }

  const refreshData = () => {
    loadAllData()
  }

  const value = {
    employees,
    attendance,
    leaves,
    payrolls,
    performance,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    markAttendance,
    addLeave,
    updateLeave,
    addPayroll,
    addPerformance,
    refreshData
  }

  return <HRMSContext.Provider value={value}>{children}</HRMSContext.Provider>
}

