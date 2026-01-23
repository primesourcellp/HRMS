import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, Download, Filter, FileText, Send, Users, TrendingUp, Clock, Search, X, FileDown, PlayCircle, Eye, Loader2, Settings, Info, AlertCircle, Building2, MoreVertical, Receipt, Gift } from 'lucide-react'
import api from '../services/api'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([])
  const [salaryStructures, setSalaryStructures] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  // For employees and managers, default to empty (show all months), for admins default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const userType = localStorage.getItem('userType')
    const userRole = localStorage.getItem('userRole')
    return (userType === 'employee' || userRole === 'EMPLOYEE' || userRole === 'MANAGER') ? '' : format(new Date(), 'yyyy-MM')
  })
  const [selectedAnnualCtcYear, setSelectedAnnualCtcYear] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  // Set default view based on user type
  const [activeView, setActiveView] = useState(() => {
    const userType = localStorage.getItem('userType')
    const userRole = localStorage.getItem('userRole')
    // Employees and managers see Processed Payrolls by default
    return (userType === 'employee' || userRole === 'EMPLOYEE' || userRole === 'MANAGER') ? 'processedPayrolls' : 'salaryDetails'
  }) // 'salaryDetails', 'processedPayrolls', 'ctcTemplates', 'gratuity', or 'annualCTC'
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showBulkProcessModal, setShowBulkProcessModal] = useState(false)
  const [showIndividualProcessModal, setShowIndividualProcessModal] = useState(false)
  const [processingIndividual, setProcessingIndividual] = useState(false)
  const [individualProcessError, setIndividualProcessError] = useState(null)
  const [individualProcessData, setIndividualProcessData] = useState({
    employeeId: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingPayroll, setViewingPayroll] = useState(null)
  const [showViewSalaryModal, setShowViewSalaryModal] = useState(false)
  const [viewingSalary, setViewingSalary] = useState(null)
  const [showViewCtcTemplateModal, setShowViewCtcTemplateModal] = useState(false)
  const [viewingCtcTemplate, setViewingCtcTemplate] = useState(null)
  const [showESSPayslipModal, setShowESSPayslipModal] = useState(false)
  const [viewingESSPayslip, setViewingESSPayslip] = useState(null)
  const [payslipDetails, setPayslipDetails] = useState(null)
  const [isPayslipFromAnnualCTC, setIsPayslipFromAnnualCTC] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState(null)
  const [editingSalary, setEditingSalary] = useState(null)
  const [openSalaryDropdownId, setOpenSalaryDropdownId] = useState(null)
  const [openPayrollDropdownId, setOpenPayrollDropdownId] = useState(null)
  const [openCtcTemplateDropdownId, setOpenCtcTemplateDropdownId] = useState(null)
  const [openGratuityDropdownId, setOpenGratuityDropdownId] = useState(null)
  const [openAnnualCtcDropdownId, setOpenAnnualCtcDropdownId] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({})
  const [processingBulk, setProcessingBulk] = useState(false)
  const [bulkProcessData, setBulkProcessData] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [showIndividualAnnualCtcModal, setShowIndividualAnnualCtcModal] = useState(false)
  const [showBulkAnnualCtcModal, setShowBulkAnnualCtcModal] = useState(false)
  const [processingIndividualAnnualCtc, setProcessingIndividualAnnualCtc] = useState(false)
  const [processingBulkAnnualCtc, setProcessingBulkAnnualCtc] = useState(false)
  const [individualAnnualCtcError, setIndividualAnnualCtcError] = useState(null)
  const [individualAnnualCtcData, setIndividualAnnualCtcData] = useState({
    employeeId: '',
    year: ''
  })
  const [bulkAnnualCtcData, setBulkAnnualCtcData] = useState({
    year: ''
  })
  const [payrollFormData, setPayrollFormData] = useState({
    employeeId: '',
    month: format(new Date(), 'yyyy-MM'),
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    bonus: 0,
    notes: '',
    status: 'DRAFT'
  })
  const [salaryFormData, setSalaryFormData] = useState({
    employeeId: '',
    basicSalary: '',
    hra: '',
    transportAllowance: '',
    medicalAllowance: '',
    specialAllowance: '',
    otherAllowances: '',
    pf: '',
    esi: '',
    tds: '',
    professionalTax: '',
    otherDeductions: '',
    effectiveFrom: format(new Date(), 'yyyy-MM-dd')
  })
  const [ctcTemplates, setCtcTemplates] = useState([])
  const [ctcConversionData, setCtcConversionData] = useState({
    annualCtc: '',
    templateId: '',
    client: ''
  })
  const [showCtcConverter, setShowCtcConverter] = useState(false)
  // CTC Template Management State
  const [ctcTemplateSearchTerm, setCtcTemplateSearchTerm] = useState('')
  const [ctcTemplateClientFilter, setCtcTemplateClientFilter] = useState('All')
  const [showCtcTemplateModal, setShowCtcTemplateModal] = useState(false)
  const [editingCtcTemplate, setEditingCtcTemplate] = useState(null)
  const [ctcTemplateClients, setCtcTemplateClients] = useState([])
  const [ctcTemplateFormData, setCtcTemplateFormData] = useState({
    templateName: '',
    clientName: '',
    description: '',
    basicSalaryPercentage: '',
    hraPercentage: '',
    transportAllowancePercentage: null,
    transportAllowanceFixed: null,
    medicalAllowancePercentage: null,
    medicalAllowanceFixed: null,
    specialAllowancePercentage: null,
    specialAllowanceFixed: null,
    otherAllowancesPercentage: null,
    pfPercentage: '',
    esiPercentage: '',
    esiApplicableThreshold: '',
    professionalTaxAmount: null,
    tdsPercentage: null,
    otherDeductionsPercentage: null,
    active: true
  })
  // Gratuity Management State
  const [gratuities, setGratuities] = useState([])
  const [gratuitySearchTerm, setGratuitySearchTerm] = useState('')
  const [gratuityStatusFilter, setGratuityStatusFilter] = useState('All')
  const [showGratuityModal, setShowGratuityModal] = useState(false)
  const [editingGratuity, setEditingGratuity] = useState(null)
  const [gratuityFormData, setGratuityFormData] = useState({
    employeeId: '',
    exitDate: format(new Date(), 'yyyy-MM-dd'),
    lastDrawnSalary: 0,
    yearsOfService: 0,
    notes: ''
  })
  const [calculatingGratuity, setCalculatingGratuity] = useState(false)

  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType')
  const isManager = userRole === 'MANAGER'
  const isFinance = userRole === 'FINANCE'
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'FINANCE'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isHRAdmin = userRole === 'HR_ADMIN'
  const canAccessCTCTemplates = isSuperAdmin || isHRAdmin
  const canApprovePayroll = userRole === 'ADMIN' || userRole === 'HR_ADMIN' || isSuperAdmin
  const canSubmitPayrollForApproval = isFinance
  // Check if employee: userType === 'employee' OR userRole === 'EMPLOYEE' OR not admin
  const isEmployee = userType === 'employee' || userRole === 'EMPLOYEE' || (!isAdmin && !isManager && userType !== 'admin')

  useEffect(() => {
    loadData()
  }, [selectedMonth, statusFilter, activeView])

  // Close dropdown when clicking outside (for Salary Details)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openSalaryDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenSalaryDropdownId(null)
      }
    }
    if (openSalaryDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openSalaryDropdownId])

  // Close dropdown when clicking outside (for Processed Payrolls)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openPayrollDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenPayrollDropdownId(null)
      }
    }
    if (openPayrollDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openPayrollDropdownId])

  // Close dropdown when clicking outside (for CTC Templates)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openCtcTemplateDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenCtcTemplateDropdownId(null)
      }
    }
    if (openCtcTemplateDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openCtcTemplateDropdownId])

  // Close dropdown when clicking outside (for Gratuity)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openGratuityDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenGratuityDropdownId(null)
      }
    }
    if (openGratuityDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openGratuityDropdownId])

  // Close dropdown when clicking outside (for Annual CTC)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openAnnualCtcDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenAnnualCtcDropdownId(null)
      }
    }
    if (openAnnualCtcDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openAnnualCtcDropdownId])

  // Helper function to show success message
  const showSuccessMessage = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      // Load only own data for employees and managers
      if ((isEmployee || isManager) && userId) {
        console.log('Loading payroll data for userId:', userId, 'role:', userRole)
        try {
        const [payrollsData, employeesData, salaryStructuresData] = await Promise.all([
          api.getEmployeePayrolls(parseInt(userId)),
          api.getEmployees(),
          api.getSalaryStructures().then(structures => {
            // Filter to show only manager's/employee's own salary structures
            const structuresArray = Array.isArray(structures) ? structures : []
            return structuresArray.filter(s => {
              const empId = typeof s.employeeId === 'string' ? parseInt(s.employeeId) : s.employeeId
              return empId === parseInt(userId)
            })
          }).catch(err => {
            console.warn('Failed to load salary structures:', err)
            return []
          })
        ])
          const payrollsArray = Array.isArray(payrollsData) ? payrollsData : []
          setPayrolls(payrollsArray)
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
        setSalaryStructures(Array.isArray(salaryStructuresData) ? salaryStructuresData : [])
          
          // Debug: Log to help diagnose
          console.log('Employee payroll data loaded:', {
            userId,
            payrollsCount: payrollsArray.length,
            payrolls: payrollsArray,
            selectedMonth,
            statusFilter,
            isEmployee,
            activeView
          })
          
          if (payrollsArray.length === 0) {
            console.warn('No payroll records found for employee. This could mean:')
            console.warn('1. No payroll records exist for this employee')
            console.warn('2. Payroll records exist but are filtered out')
            console.warn('3. API endpoint returned empty array')
          }
          
          // Pre-fetch attendance data for all payrolls with startDate/endDate
          if (Array.isArray(payrollsArray)) {
            payrollsArray.forEach(payroll => {
              if (payroll.startDate && payroll.endDate) {
                fetchAttendanceDataForPayroll(payroll)
              }
            })
          }
        } catch (apiError) {
          console.error('Error fetching employee payroll data:', apiError)
          setPayrolls([])
          setEmployees([])
        }
      } else if (isAdmin) {
          // Load all templates if viewing CTC Templates tab, otherwise load only active ones
          const shouldLoadAllTemplates = activeView === 'ctcTemplates'
          const shouldLoadGratuities = activeView === 'gratuity'
          // SUPER_ADMIN, HR_ADMIN, and FINANCE can access CTC Templates (read-only for FINANCE)
          const canAccessCTCTemplates = isSuperAdmin || isHRAdmin || userRole === 'FINANCE'
          console.log('Loading admin data:', { userRole, isAdmin, activeView, canAccessCTCTemplates })
          
          // Load CTC templates if user has permission (read access for finance, full access for super admin/hr admin)
          const ctcTemplatesPromise = canAccessCTCTemplates 
            ? api.getCTCTemplates(null, !shouldLoadAllTemplates).catch(err => {
                console.warn('Failed to load CTC templates:', err)
                return []
              })
            : Promise.resolve([])
          
          const [payrollsData, employeesData, salaryStructuresData, ctcTemplatesData, clientsData, gratuitiesData] = await Promise.all([
          api.getPayrolls(),
            api.getEmployees(),
            api.getSalaryStructures(),
            ctcTemplatesPromise,
            api.getClients().catch(err => {
              console.warn('Failed to load clients:', err)
              return []
            }),
            shouldLoadGratuities ? api.getGratuities().catch(err => {
              console.warn('Failed to load gratuities:', err)
              return []
            }) : Promise.resolve([])
        ])
        setPayrolls(Array.isArray(payrollsData) ? payrollsData : [])
        const employeesArray = Array.isArray(employeesData) ? employeesData : []
        setEmployees(employeesArray)
        console.log('Employees loaded:', { count: employeesArray.length, employees: employeesArray })
          setSalaryStructures(Array.isArray(salaryStructuresData) ? salaryStructuresData : [])
          const templates = Array.isArray(ctcTemplatesData) ? ctcTemplatesData : []
          setCtcTemplates(templates)
          setCtcTemplateClients(Array.isArray(clientsData) ? clientsData : [])
          // Always set gratuities (empty array if not loading)
          setGratuities(shouldLoadGratuities ? (Array.isArray(gratuitiesData) ? gratuitiesData : []) : [])
          
          // Pre-fetch attendance data for all payrolls with startDate/endDate
          if (Array.isArray(payrollsData)) {
            payrollsData.forEach(payroll => {
              if (payroll.startDate && payroll.endDate) {
                fetchAttendanceDataForPayroll(payroll)
              }
            })
          }
          // Debug: Log to help diagnose
          if (shouldLoadGratuities) {
            console.log('Gratuity data loaded:', {
              gratuitiesCount: gratuitiesData.length,
              gratuities: gratuitiesData,
              activeView
            })
          }
          // Debug: Log templates to help diagnose
          if (templates.length === 0) {
            console.warn('No CTC templates found. Please create templates first.')
          } else {
            console.log('Loaded CTC templates:', templates.length, templates)
          }
      } else {
        // For other roles (shouldn't happen, but fallback)
        console.warn('User role not recognized, loading basic data')
        const [payrollsData, employeesData] = await Promise.all([
          api.getPayrolls(),
          api.getEmployees()
        ])
        setPayrolls(Array.isArray(payrollsData) ? payrollsData : [])
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      // Set empty arrays on error to prevent undefined issues
      setPayrolls([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = {
    total: payrolls.length,
    draft: payrolls.filter(p => p.status === 'DRAFT').length,
    pending: payrolls.filter(p => p.status === 'PENDING_APPROVAL').length,
    approved: payrolls.filter(p => p.status === 'APPROVED').length,
    finalized: payrolls.filter(p => p.status === 'FINALIZED').length,
    paid: payrolls.filter(p => p.status === 'PAID').length,
    totalAmount: payrolls.reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0),
    pendingAmount: payrolls.filter(p => p.status === 'PENDING_APPROVAL' || p.status === 'APPROVED')
      .reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0)
  }

  const handleOpenPayrollModal = (payroll = null) => {
    if (payroll) {
      setEditingPayroll(payroll)
      setPayrollFormData({
        employeeId: payroll.employeeId?.toString() || '',
        month: payroll.month || format(new Date(), 'yyyy-MM'),
        year: payroll.year || new Date().getFullYear(),
        baseSalary: payroll.baseSalary || 0,
        allowances: payroll.allowances || 0,
        deductions: payroll.deductions || 0,
        bonus: payroll.bonus || 0,
        notes: payroll.notes || '',
        status: payroll.status || 'DRAFT'
      })
    } else {
      setEditingPayroll(null)
      setPayrollFormData({
        employeeId: '',
        month: format(new Date(), 'yyyy-MM'),
        year: new Date().getFullYear(),
        baseSalary: 0,
        allowances: 0,
        deductions: 0,
        bonus: 0,
        notes: '',
        status: 'DRAFT'
      })
    }
    setShowPayrollModal(true)
  }

  const handlePayrollSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payrollData = {
        ...payrollFormData,
        employeeId: parseInt(payrollFormData.employeeId),
        baseSalary: parseFloat(payrollFormData.baseSalary),
        allowances: parseFloat(payrollFormData.allowances),
        deductions: parseFloat(payrollFormData.deductions),
        bonus: parseFloat(payrollFormData.bonus),
        year: parseInt(payrollFormData.year)
      }

      if (editingPayroll) {
        const result = await api.updatePayroll(editingPayroll.id, payrollData)
        if (result.success) {
          showSuccessMessage('Payroll updated successfully')
        } else {
          alert('Error updating payroll: ' + (result.message || 'Failed to update'))
        }
      } else {
        const result = await api.createPayroll(payrollData)
        if (result.success) {
          showSuccessMessage('Payroll created successfully')
        } else {
          alert('Error creating payroll: ' + (result.message || 'Failed to create'))
        }
      }
      await loadData()
      setShowPayrollModal(false)
      setEditingPayroll(null)
    } catch (error) {
      alert('Error saving payroll: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayroll = async (payrollId) => {
    try {
      setLoading(true)
      const payroll = await api.getPayrollById(payrollId)
      setViewingPayroll(payroll)
      setShowViewModal(true)
    } catch (error) {
      alert('Error loading payroll details: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mask bank account number (show only last 4 digits)
  const maskBankAccount = (accountNumber) => {
    if (!accountNumber) return 'N/A'
    const str = String(accountNumber)
    if (str.length <= 4) return '****'
    return '****' + str.slice(-4)
  }

  // Calculate working days, present days, and leave/LOP days
  // State to cache attendance and leave data
  const [attendanceCache, setAttendanceCache] = useState({})
  const [leaveCache, setLeaveCache] = useState({})
  const [attendanceLoading, setAttendanceLoading] = useState({})

  // Fetch attendance and leave data for a payroll period
  const fetchAttendanceDataForPayroll = async (payroll) => {
    if (!payroll.startDate || !payroll.endDate) return
    
    const employeeId = payroll.employeeId || parseInt(payroll.employeeId)
    const startDateStr = format(parseISO(payroll.startDate), 'yyyy-MM-dd')
    const endDateStr = format(parseISO(payroll.endDate), 'yyyy-MM-dd')
    const cacheKey = `${employeeId}_${startDateStr}_${endDateStr}`
    
    // Skip if already cached or loading
    if (attendanceCache[cacheKey] || attendanceLoading[cacheKey]) return
    
    setAttendanceLoading(prev => ({ ...prev, [cacheKey]: true }))
    
    try {
      // Fetch attendance and leaves in parallel
      const [attendanceRecords, allLeaves] = await Promise.all([
        api.getAttendanceByEmployeeDateRange(employeeId, startDateStr, endDateStr),
        api.getLeavesByEmployee(employeeId)
      ])
      
      // Filter leaves that overlap with payroll period
      const start = parseISO(payroll.startDate)
      const end = parseISO(payroll.endDate)
      const leaves = allLeaves.filter(leave => {
        if (leave.status !== 'APPROVED') return false
        const leaveStart = parseISO(leave.startDate)
        const leaveEnd = parseISO(leave.endDate)
        return !(leaveEnd < start || leaveStart > end)
      })
      
      setAttendanceCache(prev => ({ ...prev, [cacheKey]: attendanceRecords }))
      setLeaveCache(prev => ({ ...prev, [cacheKey]: leaves }))
    } catch (error) {
      console.error('Error fetching attendance/leave data:', error)
    } finally {
      setAttendanceLoading(prev => {
        const newState = { ...prev }
        delete newState[cacheKey]
        return newState
      })
    }
  }

  // Calculate attendance details from payroll data using cached attendance records
  const calculateAttendanceDetails = (payroll) => {
    let totalDays = 0
    let presentDays = 0
    let leaveDays = 0
    let payableDays = 0
    let prorationFactor = 1.0
    
    // If payroll has startDate and endDate, it was processed with attendance
    if (payroll.startDate && payroll.endDate) {
      const start = parseISO(payroll.startDate)
      const end = parseISO(payroll.endDate)
      // Calculate total days correctly (inclusive of both start and end dates)
      totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
      
      const employeeId = payroll.employeeId || parseInt(payroll.employeeId)
      const startDateStr = format(start, 'yyyy-MM-dd')
      const endDateStr = format(end, 'yyyy-MM-dd')
      const cacheKey = `${employeeId}_${startDateStr}_${endDateStr}`
      
      // Use cached attendance data if available
      const attendanceRecords = attendanceCache[cacheKey]
      const leaves = leaveCache[cacheKey]
      
      if (attendanceRecords && leaves) {
        // Calculate present days from actual attendance records
        presentDays = attendanceRecords.filter(att => att.status === 'Present').length
        
        // Calculate leave days (only approved leaves within period)
        leaveDays = leaves.reduce((total, leave) => {
          const leaveStart = parseISO(leave.startDate)
          const leaveEnd = parseISO(leave.endDate)
          const periodStart = leaveStart < start ? start : leaveStart
          const periodEnd = leaveEnd > end ? end : leaveEnd
          
          if (leave.halfDay) {
            return total + 0.5
          }
          const days = Math.floor((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1
          return total + days
        }, 0)
        
        // Payable days = present days + approved leave days
        payableDays = presentDays + leaveDays
        if (payableDays > totalDays) payableDays = totalDays
        
        // Calculate proration factor
        prorationFactor = totalDays > 0 ? payableDays / totalDays : 0.0
        prorationFactor = Math.max(0, Math.min(1, prorationFactor))
      } else {
        // Fallback: calculate from netSalary if attendance data not yet loaded
        const baseSalary = parseFloat(payroll.baseSalary) || 0
        const allowances = parseFloat(payroll.allowances) || 0
        const deductions = parseFloat(payroll.deductions) || 0
        const bonus = parseFloat(payroll.bonus) || 0
        const fullNetSalaryWithoutBonus = baseSalary + allowances - deductions
        const backendNetSalary = parseFloat(payroll.netSalary) || 0
        
        if (fullNetSalaryWithoutBonus > 0) {
          const proratedBase = Math.max(0, backendNetSalary - bonus)
          prorationFactor = Math.max(0, Math.min(1, proratedBase / fullNetSalaryWithoutBonus))
          payableDays = Math.min(totalDays, Math.round(totalDays * prorationFactor))
          presentDays = Math.floor(payableDays * 0.8)
          leaveDays = Math.max(0, payableDays - presentDays)
        } else {
          payableDays = totalDays
          presentDays = totalDays
          leaveDays = 0
          prorationFactor = 1.0
        }
        
        // Trigger async fetch for next render
        fetchAttendanceDataForPayroll(payroll)
      }
    } else {
      // Fallback: calculate from month
    const month = payroll.month || format(new Date(), 'yyyy-MM')
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0)
      totalDays = endDate.getDate()
      payableDays = totalDays
      presentDays = totalDays
      leaveDays = 0
      prorationFactor = 1.0
    }
    
    return {
      totalDays,
      presentDays: Math.round(presentDays),
      leaveDays: Math.round(leaveDays * 10) / 10, // Round to 1 decimal for half-days
      payableDays: Math.round(payableDays * 10) / 10,
      prorationFactor: prorationFactor.toFixed(4)
    }
  }

  const calculateAttendanceDays = (payroll) => {
    const details = calculateAttendanceDetails(payroll)
    return {
      totalDays: details.totalDays,
      workingDays: details.totalDays,
      presentDays: details.presentDays,
      leaveDays: details.leaveDays,
      payableDays: details.payableDays
    }
    const leaveDays = payroll.leaveDays || 0
    const lopDays = workingDays - presentDays - leaveDays
    
    return { workingDays, presentDays, leaveDays, lopDays: Math.max(0, lopDays) }
  }

  // Helper function to calculate employer and employee contributions
  const calculateContributions = (payroll, salaryStructure) => {
    if (!salaryStructure) {
      return { 
        employeeContribution: 0, 
        employerContribution: 0,
        pfEmployee: 0,
        esiEmployee: 0,
        pfEmployer: 0,
        esiEmployer: 0
      }
    }

    const basicSalary = parseFloat(salaryStructure.basicSalary) || 0
    const grossSalary = parseFloat(salaryStructure.grossSalary) || 0
    const pfEmployee = parseFloat(salaryStructure.pf) || 0
    const esiEmployee = parseFloat(salaryStructure.esi) || 0

    // Employee Contribution = PF + ESI (these are already deducted from employee salary)
    const employeeContribution = pfEmployee + esiEmployee

    // Employer Contribution calculations:
    // PF Employer = Employee PF (typically 12% of basic, same as employee)
    const pfEmployer = pfEmployee

    // ESI Employer calculation:
    // Standard rates in India:
    // - Employee ESI = 0.75% of gross salary
    // - Employer ESI = 3.25% of gross salary
    // Calculate employer ESI directly from gross salary for accuracy
    // If employee ESI exists, calculate employer ESI as (3.25 / 0.75) = 4.33 times employee ESI
    // But to be safe, calculate directly from gross: 3.25% of gross
    const esiEmployer = esiEmployee > 0 ? (grossSalary * 0.0325) : 0

    const employerContribution = pfEmployer + esiEmployer

    return {
      employeeContribution: employeeContribution.toFixed(2),
      employerContribution: employerContribution.toFixed(2),
      pfEmployee: pfEmployee.toFixed(2),
      esiEmployee: esiEmployee.toFixed(2),
      pfEmployer: pfEmployer.toFixed(2),
      esiEmployer: esiEmployer.toFixed(2)
    }
  }

  const handleViewESSPayslip = async (payrollId, fromAnnualCTC = false) => {
    try {
      setLoading(true)
      setIsPayslipFromAnnualCTC(fromAnnualCTC)
      const payroll = await api.getPayrollById(payrollId)
      const employee = employees.find(emp => emp.id === payroll.employeeId)
      
      // Get salary structure for employer contributions
      let salaryStructure = null
      if (isAdmin || (isEmployee && employee)) {
        try {
          const structures = await api.getSalaryStructures()
          salaryStructure = Array.isArray(structures) 
            ? structures.find(s => s.employeeId === payroll.employeeId && s.active)
            : null
        } catch (err) {
          console.error('Error fetching salary structure:', err)
        }
      }
      
      // Map payroll fields to ESS payslip format
      // Payroll uses baseSalary, but ESS view expects basicSalary
      const essPayrollData = {
        ...payroll,
        basicSalary: payroll.baseSalary || salaryStructure?.basicSalary || 0,
        hra: payroll.hra || salaryStructure?.hra || 0
      }
      
      setViewingESSPayslip(essPayrollData)
      setPayslipDetails({
        employee,
        salaryStructure,
        attendanceDays: calculateAttendanceDays(payroll)
      })
      setShowESSPayslipModal(true)
    } catch (error) {
      alert('Error loading payslip details: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayroll = async (payrollId) => {
    if (!window.confirm('Are you sure you want to delete this payroll?')) return
    
    try {
      setLoading(true)
        const result = await api.deletePayroll(payrollId)
        if (result.success) {
          showSuccessMessage('Payroll deleted successfully')
          await loadData()
        } else {
          alert('Error deleting payroll: ' + (result.message || 'Failed to delete payroll'))
        }
    } catch (error) {
      alert('Error deleting payroll: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = async (payrollId) => {
    if (!canSubmitPayrollForApproval) {
      alert('Only Finance can submit payrolls for approval.')
      return
    }
    if (window.confirm('Submit this payroll for approval?')) {
      try {
        const result = await api.submitPayrollForApproval(payrollId)
        if (result.success) {
          showSuccessMessage('Payroll submitted for approval successfully')
          await loadData()
        } else {
          alert('Error submitting payroll: ' + (result.message || 'Failed to submit'))
        }
      } catch (error) {
        alert('Error submitting payroll: ' + error.message)
      }
    }
  }

  // SUPER_ADMIN: approve directly from DRAFT by submitting then approving
  const handleApproveFromDraft = async (payrollId) => {
    if (!isSuperAdmin) return
    if (!window.confirm('Approve this payroll directly? (This will submit and approve in one step)')) return

    try {
      setLoading(true)

      const submitResult = await api.submitPayrollForApproval(payrollId)
      if (!submitResult?.success) {
        throw new Error(submitResult?.message || 'Failed to submit payroll for approval')
      }

      const approveResult = await api.approvePayroll(payrollId)
      if (!approveResult?.success) {
        throw new Error(approveResult?.message || 'Failed to approve payroll')
      }

      showSuccessMessage('Payroll approved successfully')
      await loadData()
    } catch (error) {
      alert('Error approving payroll: ' + (error.message || 'Failed to approve payroll'))
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayroll = async (payrollId) => {
    if (!canApprovePayroll) {
      alert('Only Admin / HR Admin / Super Admin can approve payrolls.')
      return
    }
    if (window.confirm('Approve this payroll?')) {
      try {
        const result = await api.approvePayroll(payrollId)
        if (result.success) {
          showSuccessMessage('Payroll approved successfully')
          await loadData()
        } else {
          alert('Error approving payroll: ' + (result.message || 'Failed to approve'))
        }
      } catch (error) {
        alert('Error approving payroll: ' + error.message)
      }
    }
  }

  const handleFinalizePayroll = async (payrollId) => {
    if (window.confirm('Finalize this payroll? This action cannot be undone.')) {
      try {
        const result = await api.finalizePayroll(payrollId)
        if (result.success) {
          showSuccessMessage('Payroll finalized successfully')
          await loadData()
        } else {
          alert('Error finalizing payroll: ' + (result.message || 'Failed to finalize'))
        }
      } catch (error) {
        alert('Error finalizing payroll: ' + error.message)
      }
    }
  }

  const handleMarkAsPaid = async (payrollId) => {
    if (window.confirm('Mark this payroll as paid?')) {
      try {
        const result = await api.markPayrollAsPaid(payrollId)
        if (result.success) {
          showSuccessMessage('Payroll marked as paid successfully')
          await loadData()
        } else {
          alert('Error marking payroll as paid: ' + (result.message || 'Failed to mark as paid'))
        }
      } catch (error) {
        alert('Error marking payroll as paid: ' + error.message)
      }
    }
  }

  const handleBulkProcess = async () => {
    if (!window.confirm(`Process payroll for all employees from ${bulkProcessData.startDate} to ${bulkProcessData.endDate}?`)) return
    
    try {
      setProcessingBulk(true)
      const result = await api.processPayrollForAll(bulkProcessData.startDate, bulkProcessData.endDate)
      if (result.success) {
        // Extract month from start date for filtering
        const startDateObj = new Date(bulkProcessData.startDate + 'T00:00:00') // Ensure correct timezone handling
        const processedMonth = format(startDateObj, 'yyyy-MM')
        
        // Switch to Processed Payrolls view and set appropriate filters FIRST
        setActiveView('processedPayrolls')
        setSelectedMonth(processedMonth)
        setStatusFilter('All') // Show all statuses to see the newly processed payrolls
        setSearchTerm('') // Clear search to show all results
        
        // Small delay to ensure state updates before reloading
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Reload data to get the newly processed payrolls
        await loadData()
        
        // Debug: Log to help diagnose
        console.log('Bulk process completed:', {
          processedMonth,
          resultCount: result.count,
          payrollsCount: payrolls.length,
          filteredCount: payrolls.filter(p => p.month === processedMonth).length
        })
        
        showSuccessMessage(`Payroll processed successfully for ${result.count || 0} employees. Viewing Processed Payrolls for ${processedMonth}.`)
        setShowBulkProcessModal(false)
      } else {
        alert('Error processing payroll: ' + (result.message || 'Failed to process'))
      }
    } catch (error) {
      alert('Error processing payroll: ' + error.message)
    } finally {
      setProcessingBulk(false)
    }
  }

  const handleIndividualProcess = async () => {
    if (!individualProcessData.employeeId) {
      alert('Please select an employee')
      return
    }
    
    if (!individualProcessData.startDate || !individualProcessData.endDate) {
      alert('Please select both start and end dates')
      return
    }
    
    const employee = employees.find(e => e.id === parseInt(individualProcessData.employeeId))
    const employeeName = employee?.name || `Employee ID: ${individualProcessData.employeeId}`
    
    // Extract month from start date (format: yyyy-MM)
    const startDateObj = new Date(individualProcessData.startDate + 'T00:00:00')
    const processedMonth = format(startDateObj, 'yyyy-MM')
    const employeeId = parseInt(individualProcessData.employeeId)
    
    // Check if payroll already exists for this employee and month
    const existingPayroll = payrolls.find(p => {
      const pEmployeeId = typeof p.employeeId === 'string' ? parseInt(p.employeeId) : p.employeeId
      const pMonth = p.month || (p.year && p.month ? `${p.year}-${String(p.month).padStart(2, '0')}` : null)
      
      // Match by employee ID and month
      if (pEmployeeId === employeeId) {
        // Check if month matches (format: yyyy-MM)
        if (pMonth === processedMonth) {
          return true
        }
        // Also check if payroll has startDate that falls in the same month
        if (p.startDate) {
          const pStartDate = new Date(p.startDate + 'T00:00:00')
          const pStartMonth = format(pStartDate, 'yyyy-MM')
          if (pStartMonth === processedMonth) {
            return true
          }
        }
      }
      return false
    })
    
    if (existingPayroll) {
      const existingStatus = existingPayroll.status || 'Unknown'
      const existingMonthYear = existingPayroll.month || (existingPayroll.startDate ? format(new Date(existingPayroll.startDate + 'T00:00:00'), 'MMM yyyy') : 'N/A')
      setIndividualProcessError(`Payroll for ${employeeName} already exists for ${existingMonthYear} (Status: ${existingStatus}). Please delete the existing payroll first if you need to reprocess it.`)
      return
    }
    
    // Clear any previous errors
    setIndividualProcessError(null)
    
    if (!window.confirm(`Process payroll for ${employeeName} from ${individualProcessData.startDate} to ${individualProcessData.endDate}?`)) return
    
    try {
      setProcessingIndividual(true)
      const result = await api.processPayrollForEmployee(
        employeeId,
        individualProcessData.startDate,
        individualProcessData.endDate
      )
      if (result.success) {
        // Use the processedMonth already calculated above
        
        // Switch to Processed Payrolls view and set appropriate filters
        setActiveView('processedPayrolls')
        setSelectedMonth(processedMonth)
        setStatusFilter('All')
        setSearchTerm('')
        
        // Small delay to ensure state updates before reloading
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Reload data to get the newly processed payroll
        await loadData()
        
        showSuccessMessage(`Payroll processed successfully for ${employeeName}. Viewing Processed Payrolls for ${processedMonth}.`)
        setShowIndividualProcessModal(false)
        setIndividualProcessData({
          employeeId: '',
          startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        })
        setIndividualProcessError(null)
      } else {
        alert('Error processing payroll: ' + (result.message || 'Failed to process'))
      }
    } catch (error) {
      alert('Error processing payroll: ' + error.message)
    } finally {
      setProcessingIndividual(false)
    }
  }

  const handleFinalizeAll = async () => {
    const month = selectedMonth || format(new Date(), 'yyyy-MM')
    const year = parseInt(month.split('-')[0])
    const monthOnly = month.split('-')[1]
    
    if (!window.confirm(`Finalize all approved payrolls for ${month}?`)) return
    
    try {
      setLoading(true)
      const result = await api.finalizeAllPayrolls(month, year)
      if (result.success) {
        showSuccessMessage(`Finalized ${result.count || 0} payrolls successfully`)
        await loadData()
      } else {
        alert('Error finalizing payrolls: ' + (result.message || 'Failed to finalize'))
      }
    } catch (error) {
      alert('Error finalizing payrolls: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPayslip = async (payrollId) => {
    try {
      // If opened from Annual CTC view, download Annual CTC PDF instead
      if (isPayslipFromAnnualCTC) {
        const payroll = payrolls.find(p => p.id === payrollId) || viewingESSPayslip
        if (payroll) {
          await handleDownloadAnnualCTC(payroll)
        }
        return
      }
      
      // Get employee ID for password protection (regular payslip download)
      const payroll = payrolls.find(p => p.id === payrollId) || viewingESSPayslip
      const employee = employees.find(emp => emp.id === payroll?.employeeId)
      const employeeId = employee?.employeeId || employee?.id || userId || 'EMP001'
      
      const blob = await api.downloadPayslip(payrollId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslip_${payrollId}_${format(new Date(), 'yyyy-MM')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Show password information
      showSuccessMessage(`Payslip downloaded successfully! Password: ${employeeId}`)
    } catch (error) {
      alert('Error downloading payslip: ' + error.message)
    }
  }

  const handleDownloadAnnualCTC = async (payroll) => {
    try {
      setLoading(true)
      const employee = employees.find(emp => emp.id === payroll.employeeId || emp.id === parseInt(payroll.employeeId))
      const employeeName = employee?.name || `Employee ID: ${payroll.employeeId}`
      
      const blob = await api.downloadAnnualCTC(payroll.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Annual_CTC_${employeeName.replace(/\s+/g, '_')}_${payroll.year || new Date().getFullYear()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showSuccessMessage('Annual CTC PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading Annual CTC PDF:', error)
      alert('Error downloading Annual CTC PDF: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleIndividualAnnualCTC = async () => {
    if (!individualAnnualCtcData.employeeId) {
      setIndividualAnnualCtcError('Please select an employee')
      return
    }
    
    if (!individualAnnualCtcData.year) {
      setIndividualAnnualCtcError('Please select a year')
      return
    }
    
    const employee = employees.find(e => e.id === parseInt(individualAnnualCtcData.employeeId))
    const employeeName = employee?.name || `Employee ID: ${individualAnnualCtcData.employeeId}`
    const employeeId = parseInt(individualAnnualCtcData.employeeId)
    const year = parseInt(individualAnnualCtcData.year)
    
    // Check if Annual CTC already exists for this employee and year
    const existingAnnualCTC = payrolls.find(p => {
      const pEmployeeId = typeof p.employeeId === 'string' ? parseInt(p.employeeId) : p.employeeId
      
      // Match by employee ID
      if (pEmployeeId === employeeId) {
        // Check year - payroll.year (Integer) or extract from payroll.month (String "yyyy-MM")
        let payrollYear = null
        if (p.year != null && p.year !== undefined) {
          payrollYear = typeof p.year === 'string' ? parseInt(p.year) : p.year
        } else if (p.month && typeof p.month === 'string') {
          const monthParts = p.month.split('-')
          if (monthParts.length > 0) {
            payrollYear = parseInt(monthParts[0])
          }
        }
        
        // Match by year
        if (payrollYear === year) {
          return true
        }
      }
      return false
    })
    
    if (existingAnnualCTC) {
      const existingYear = existingAnnualCTC.year || (existingAnnualCTC.month ? existingAnnualCTC.month.split('-')[0] : 'N/A')
      setIndividualAnnualCtcError(`Annual CTC for ${employeeName} already exists for year ${existingYear}. Please delete the existing record first if you need to recalculate it.`)
      return
    }
    
    // Clear any previous errors
    setIndividualAnnualCtcError(null)
    
    if (!window.confirm(`Calculate Annual CTC for ${employeeName} for year ${individualAnnualCtcData.year}?`)) return
    
    try {
      setProcessingIndividualAnnualCtc(true)
      // Filter to show only this employee's payroll for the selected year
      setSearchTerm(employeeName)
      // Set year filter for Annual CTC view
      setSelectedAnnualCtcYear(individualAnnualCtcData.year)
      
      // Reload data to ensure we have the latest payroll records
      await loadData()
      
      showSuccessMessage(`Annual CTC calculation view filtered for ${employeeName} - Year ${individualAnnualCtcData.year}`)
      setShowIndividualAnnualCtcModal(false)
      setIndividualAnnualCtcData({ employeeId: '', year: '' })
      setIndividualAnnualCtcError(null)
    } catch (error) {
      setIndividualAnnualCtcError('Error calculating Annual CTC: ' + (error.message || 'Unknown error occurred'))
    } finally {
      setProcessingIndividualAnnualCtc(false)
    }
  }

  const handleBulkAnnualCTC = async () => {
    if (!bulkAnnualCtcData.year) {
      alert('Please select a year')
      return
    }
    
    if (!window.confirm(`Calculate Annual CTC for all employees for year ${bulkAnnualCtcData.year}?`)) return
    
    try {
      setProcessingBulkAnnualCtc(true)
      // Clear search to show all employees
      setSearchTerm('')
      // Set year filter for Annual CTC view
      setSelectedAnnualCtcYear(bulkAnnualCtcData.year)
      
      // Reload data to ensure we have the latest payroll records
      await loadData()
      
      showSuccessMessage(`Annual CTC calculation view filtered for all employees - Year ${bulkAnnualCtcData.year}`)
      setShowBulkAnnualCtcModal(false)
      setBulkAnnualCtcData({ year: '' })
    } catch (error) {
      alert('Error calculating Annual CTC: ' + error.message)
    } finally {
      setProcessingBulkAnnualCtc(false)
    }
  }

  // Salary Structure Handlers
  const handleViewSalary = (salary) => {
    setViewingSalary(salary)
    setShowViewSalaryModal(true)
  }

  const handleOpenSalaryModal = (salary = null) => {
    if (salary) {
      setEditingSalary(salary)
      // Helper function to format default fields (basicSalary, hra, pf) - return 0 if null/undefined
      const formatDefaultValue = (value) => {
        if (value === null || value === undefined) return 0
        const num = Math.round((parseFloat(value) || 0) * 100) / 100
        return isNaN(num) ? 0 : num
      }
      
      // Helper function to format optional value (return empty string if 0 or null, otherwise the value)
      const formatOptionalValue = (value) => {
        if (value === null || value === undefined || value === 0 || value === '0') return ''
        const num = Math.round((parseFloat(value) || 0) * 100) / 100
        return num === 0 ? '' : num.toString()
      }
      
      setSalaryFormData({
        employeeId: salary.employeeId?.toString() || '',
        basicSalary: formatDefaultValue(salary.basicSalary),
        hra: formatDefaultValue(salary.hra),
        transportAllowance: formatOptionalValue(salary.transportAllowance),
        medicalAllowance: formatOptionalValue(salary.medicalAllowance),
        specialAllowance: formatOptionalValue(salary.specialAllowance),
        otherAllowances: formatOptionalValue(salary.otherAllowances),
        pf: formatDefaultValue(salary.pf),
        esi: formatOptionalValue(salary.esi),
        tds: formatOptionalValue(salary.tds),
        professionalTax: formatOptionalValue(salary.professionalTax),
        otherDeductions: formatOptionalValue(salary.otherDeductions),
        effectiveFrom: salary.effectiveFrom ? format(parseISO(salary.effectiveFrom), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      })
      setShowCtcConverter(false)
    } else {
      setEditingSalary(null)
      setSalaryFormData({
        employeeId: '',
        basicSalary: 0,
        hra: 0,
        transportAllowance: '',
        medicalAllowance: '',
        specialAllowance: '',
        otherAllowances: '',
        pf: 0,
        esi: '',
        tds: '',
        professionalTax: '',
        otherDeductions: '',
        effectiveFrom: format(new Date(), 'yyyy-MM-dd')
      })
      setCtcConversionData({ annualCtc: '', templateId: '', client: '' })
      setShowCtcConverter(false)
    }
    setShowSalaryModal(true)
  }

  // Handle employee selection change - auto-filter templates by client
  const handleEmployeeChangeForCTC = (employeeId) => {
    const employee = employees.find(emp => emp.id === parseInt(employeeId))
    if (employee && employee.client) {
      setCtcConversionData({ ...ctcConversionData, client: employee.client })
    }
    setSalaryFormData({ ...salaryFormData, employeeId })
  }

  // Convert CTC to Salary Structure
  const handleConvertCTC = async () => {
    if (!ctcConversionData.annualCtc || !ctcConversionData.templateId) {
      alert('Please enter Annual CTC and select a CTC Template')
      return
    }

    try {
      setLoading(true)
      const result = await api.convertCTCToSalaryStructure(
        parseFloat(ctcConversionData.annualCtc),
        parseInt(ctcConversionData.templateId)
      )

      // Helper function to format value (return empty string if 0, otherwise the value)
      const formatValue = (value) => {
        if (value === null || value === undefined || value === 0 || value === '0') return ''
        const num = Math.round((parseFloat(value) || 0) * 100) / 100
        return num === 0 ? '' : num.toString()
      }

      // Populate salary form with converted values (rounded to 2 decimal places, empty if 0)
      setSalaryFormData({
        ...salaryFormData,
        basicSalary: formatValue(result.basicSalary),
        hra: formatValue(result.hra),
        transportAllowance: formatValue(result.transportAllowance),
        medicalAllowance: formatValue(result.medicalAllowance),
        specialAllowance: formatValue(result.specialAllowance),
        otherAllowances: formatValue(result.otherAllowances),
        pf: formatValue(result.pf),
        esi: formatValue(result.esi),
        tds: formatValue(result.tds),
        professionalTax: formatValue(result.professionalTax),
        otherDeductions: formatValue(result.otherDeductions)
      })

      showSuccessMessage('CTC converted to salary structure successfully! Review and edit the values before saving.')
      setShowCtcConverter(false)
    } catch (error) {
      console.error('Error converting CTC:', error)
      alert('Error converting CTC: ' + (error.message || 'Failed to convert'))
    } finally {
      setLoading(false)
    }
  }

  const handleSalarySubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const salaryData = {
        ...salaryFormData,
        employeeId: parseInt(salaryFormData.employeeId),
        basicSalary: parseFloat(salaryFormData.basicSalary) || 0,
        hra: parseFloat(salaryFormData.hra) || 0,
        transportAllowance: parseFloat(salaryFormData.transportAllowance) || 0,
        medicalAllowance: parseFloat(salaryFormData.medicalAllowance) || 0,
        specialAllowance: parseFloat(salaryFormData.specialAllowance) || 0,
        otherAllowances: parseFloat(salaryFormData.otherAllowances) || 0,
        pf: parseFloat(salaryFormData.pf) || 0,
        esi: parseFloat(salaryFormData.esi) || 0,
        tds: parseFloat(salaryFormData.tds) || 0,
        professionalTax: parseFloat(salaryFormData.professionalTax) || 0,
        otherDeductions: parseFloat(salaryFormData.otherDeductions) || 0,
        effectiveFrom: salaryFormData.effectiveFrom
      }

      if (editingSalary) {
        const result = await api.updateSalaryStructure(editingSalary.id, salaryData)
        if (result.success) {
          showSuccessMessage('Salary structure updated successfully')
        } else {
          alert('Error updating salary structure: ' + (result.message || 'Failed to update'))
        }
      } else {
        const result = await api.createSalaryStructure(salaryData)
        if (result.success) {
          showSuccessMessage('Salary structure created successfully')
        } else {
          alert('Error creating salary structure: ' + (result.message || 'Failed to create'))
        }
      }
      await loadData()
      setShowSalaryModal(false)
      setEditingSalary(null)
    } catch (error) {
      alert('Error saving salary structure: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary structure?')) return
    
    try {
      setLoading(true)
      const result = await api.deleteSalaryStructure(salaryId)
      if (result.success) {
        showSuccessMessage('Salary structure deleted successfully')
        await loadData()
      } else {
        alert('Error deleting salary structure: ' + (result.message || 'Failed to delete'))
      }
    } catch (error) {
      alert('Error deleting salary structure: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // CTC Template Management Handlers
  const handleOpenCtcTemplateModal = (template = null) => {
    if (template) {
      setEditingCtcTemplate(template)
      setCtcTemplateFormData({
        templateName: template.templateName || '',
        clientName: template.clientName || '',
        description: template.description || '',
        basicSalaryPercentage: (template.basicSalaryPercentage === 0 || template.basicSalaryPercentage === null || template.basicSalaryPercentage === undefined) ? '' : template.basicSalaryPercentage,
        hraPercentage: (template.hraPercentage === 0 || template.hraPercentage === null || template.hraPercentage === undefined) ? '' : template.hraPercentage,
        transportAllowancePercentage: template.transportAllowancePercentage || null,
        transportAllowanceFixed: template.transportAllowanceFixed || null,
        medicalAllowancePercentage: template.medicalAllowancePercentage || null,
        medicalAllowanceFixed: template.medicalAllowanceFixed || null,
        specialAllowancePercentage: template.specialAllowancePercentage || null,
        specialAllowanceFixed: template.specialAllowanceFixed || null,
        otherAllowancesPercentage: template.otherAllowancesPercentage || null,
        pfPercentage: (template.pfPercentage === 0 || template.pfPercentage === null || template.pfPercentage === undefined) ? '' : template.pfPercentage,
        esiPercentage: (template.esiPercentage === 0 || template.esiPercentage === null || template.esiPercentage === undefined) ? '' : template.esiPercentage,
        esiApplicableThreshold: (template.esiApplicableThreshold === 0 || template.esiApplicableThreshold === null || template.esiApplicableThreshold === undefined) ? '' : template.esiApplicableThreshold,
        professionalTaxAmount: template.professionalTaxAmount || null,
        tdsPercentage: template.tdsPercentage || null,
        otherDeductionsPercentage: template.otherDeductionsPercentage || null,
        active: template.active !== undefined ? template.active : true
      })
    } else {
      setEditingCtcTemplate(null)
      setCtcTemplateFormData({
        templateName: '',
        clientName: '',
        description: '',
        basicSalaryPercentage: '',
        hraPercentage: '',
        transportAllowancePercentage: null,
        transportAllowanceFixed: null,
        medicalAllowancePercentage: null,
        medicalAllowanceFixed: null,
        specialAllowancePercentage: null,
        specialAllowanceFixed: null,
        otherAllowancesPercentage: null,
        pfPercentage: '',
        esiPercentage: '',
        esiApplicableThreshold: '',
        professionalTaxAmount: null,
        tdsPercentage: null,
        otherDeductionsPercentage: null,
        active: true
      })
    }
    setShowCtcTemplateModal(true)
  }

  const handleCtcTemplateSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      // Convert empty strings to 0 for required fields, null for optional fields
      const submitData = {
        ...ctcTemplateFormData,
        basicSalaryPercentage: ctcTemplateFormData.basicSalaryPercentage === '' || ctcTemplateFormData.basicSalaryPercentage === null ? 0 : parseFloat(ctcTemplateFormData.basicSalaryPercentage) || 0,
        hraPercentage: ctcTemplateFormData.hraPercentage === '' || ctcTemplateFormData.hraPercentage === null ? 0 : parseFloat(ctcTemplateFormData.hraPercentage) || 0,
        pfPercentage: ctcTemplateFormData.pfPercentage === '' || ctcTemplateFormData.pfPercentage === null ? 0 : parseFloat(ctcTemplateFormData.pfPercentage) || 0,
        esiPercentage: ctcTemplateFormData.esiPercentage === '' || ctcTemplateFormData.esiPercentage === null ? null : parseFloat(ctcTemplateFormData.esiPercentage) || null,
        esiApplicableThreshold: ctcTemplateFormData.esiApplicableThreshold === '' || ctcTemplateFormData.esiApplicableThreshold === null ? null : parseFloat(ctcTemplateFormData.esiApplicableThreshold) || null
      }
      
      if (editingCtcTemplate) {
        await api.updateCTCTemplate(editingCtcTemplate.id, submitData)
        showSuccessMessage('CTC Template updated successfully!')
      } else {
        await api.createCTCTemplate(submitData)
        showSuccessMessage('CTC Template created successfully!')
      }
      await loadData()
      setShowCtcTemplateModal(false)
      setEditingCtcTemplate(null)
    } catch (error) {
      console.error('Error saving CTC template:', error)
      alert('Error saving template: ' + (error.message || 'Failed to save'))
    } finally {
      setLoading(false)
    }
  }

  const handleViewCtcTemplate = (template) => {
    setViewingCtcTemplate(template)
    setShowViewCtcTemplateModal(true)
  }

  const handleDeleteCtcTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    try {
      setLoading(true)
      await api.deleteCTCTemplate(id)
      showSuccessMessage('Template deleted successfully!')
      await loadData()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template: ' + (error.message || 'Failed to delete'))
    } finally {
      setLoading(false)
    }
  }

  const filteredCtcTemplates = ctcTemplates.filter(t => {
    const matchesSearch = !ctcTemplateSearchTerm || 
      t.templateName?.toLowerCase().includes(ctcTemplateSearchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(ctcTemplateSearchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(ctcTemplateSearchTerm.toLowerCase())
    const matchesClient = ctcTemplateClientFilter === 'All' || t.clientName === ctcTemplateClientFilter
    return matchesSearch && matchesClient
  })

  const handleExportCSV = () => {
    const csvData = filteredPayrolls.map(p => {
      const employee = employees.find(emp => emp.id === p.employeeId || emp.id === parseInt(p.employeeId))
      const employeeName = employee ? (employee.name || 'N/A') : 'N/A'
      return {
        Employee: employeeName,
        'Month/Year': p.month && p.year ? `${p.month}/${p.year}` : p.month || 'N/A',
        'Base Salary': p.baseSalary || 0,
        Allowances: p.allowances || 0,
        Deductions: p.deductions || 0,
        Bonus: p.bonus || 0,
        'Net Salary': p.netSalary || p.amount || 0,
        Status: p.status || 'DRAFT'
      }
    })

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payroll_${selectedMonth || 'all'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExportAnnualCTCCSV = () => {
    const csvData = filteredPayrolls.map(p => {
      const employee = employees.find(emp => emp.id === p.employeeId || emp.id === parseInt(p.employeeId))
      const employeeName = employee ? (employee.name || 'N/A') : 'N/A'
      
      const baseSalary = parseFloat(p.baseSalary) || 0
      const allowances = parseFloat(p.allowances) || 0
      const monthlyGross = baseSalary + allowances
      
      const salaryStructure = salaryStructures.find(s => 
        (s.employeeId === p.employeeId || s.employeeId === parseInt(p.employeeId)) && s.active
      )
      const contributions = calculateContributions(p, salaryStructure)
      const monthlyEmployerContribution = parseFloat(contributions.employerContribution) || 0
      const monthlyCTC = monthlyGross + monthlyEmployerContribution
      const annualCTC = monthlyCTC * 12
      
      return {
        Employee: employeeName,
        'Employee ID': employee?.employeeId || employee?.id || 'N/A',
        'Month/Year': p.month && p.year ? `${p.month}/${p.year}` : p.month || 'N/A',
        'Monthly Gross Salary': monthlyGross.toFixed(2),
        'Employer Contribution': monthlyEmployerContribution.toFixed(2),
        'Monthly CTC': monthlyCTC.toFixed(2),
        'Annual CTC': annualCTC.toFixed(2),
        'Base Salary': baseSalary.toFixed(2),
        Allowances: allowances.toFixed(2),
        'Bonus': (parseFloat(p.bonus) || 0).toFixed(2),
        'Deductions': (parseFloat(p.deductions) || 0).toFixed(2),
        'Net Salary': (parseFloat(p.netSalary) || parseFloat(p.amount) || 0).toFixed(2),
        Status: p.status || 'DRAFT'
      }
    })

    if (csvData.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `annual_ctc_${selectedAnnualCtcYear || 'all'}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const calculateNetSalary = () => {
    const base = parseFloat(payrollFormData.baseSalary) || 0
    const allowances = parseFloat(payrollFormData.allowances) || 0
    const deductions = parseFloat(payrollFormData.deductions) || 0
    const bonus = parseFloat(payrollFormData.bonus) || 0
    return base + allowances + bonus - deductions
  }

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesStatus = statusFilter === 'All' || payroll.status === statusFilter
    // Use different month filter based on active view
    // For Annual CTC view, filter by year; otherwise filter by month
    let matchesMonth = true
    if (activeView === 'annualCTC') {
      // Match year from payroll.month (format: yyyy-MM) or payroll.year
      if (selectedAnnualCtcYear && selectedAnnualCtcYear.trim() !== '') {
        // Get year from payroll - handle both number and string types
        // Priority: payroll.year (Integer) > payroll.month (String "yyyy-MM")
        let payrollYear = null
        if (payroll.year != null && payroll.year !== undefined) {
          // payroll.year is an Integer, convert to string
          payrollYear = String(payroll.year)
        } else if (payroll.month && typeof payroll.month === 'string') {
          // Extract year from month string (format: "yyyy-MM")
          const monthParts = payroll.month.split('-')
          if (monthParts.length > 0) {
            payrollYear = monthParts[0]
          }
        }
        // Compare as strings, ensuring both are normalized and trimmed
        const selectedYear = String(selectedAnnualCtcYear).trim()
        matchesMonth = payrollYear && payrollYear.trim() === selectedYear
      } else {
        // If no year selected, show all records
        matchesMonth = true
      }
    } else {
      // Match month exactly (format: yyyy-MM)
      // For employees: if selectedMonth is empty or not set, show all months
      const monthFilter = selectedMonth
      if (isEmployee) {
        // Employees see all months when no filter is selected
        matchesMonth = !monthFilter || monthFilter === '' || (payroll.month && payroll.month === monthFilter)
      } else {
        // Admins: filter by selected month or show all if no filter
        matchesMonth = !monthFilter || (payroll.month && payroll.month === monthFilter)
      }
    }
    const matchesSearch = !searchTerm || 
      (isAdmin && (() => {
        const emp = employees.find(emp => emp.id === payroll.employeeId || emp.id === parseInt(payroll.employeeId))
        if (!emp) return false
        const fullName = (emp.name || '').toLowerCase()
        return fullName.includes(searchTerm.toLowerCase()) || 
               emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      })()) ||
      payroll.month?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.status?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesMonth && matchesSearch
  })
  
  // Debug: Log filtered results for employees
  if (isEmployee) {
    console.log('Employee payroll filtering:', {
      totalPayrolls: payrolls.length,
      filteredCount: filteredPayrolls.length,
      selectedMonth,
      statusFilter,
      searchTerm,
      activeView,
      payrolls: payrolls,
      filteredPayrolls: filteredPayrolls
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'FINALIZED':
        return 'bg-blue-100 text-blue-800'
      case 'PAID':
        return 'bg-purple-100 text-purple-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING_APPROVAL':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle size={16} className="text-purple-600" />
      case 'FINALIZED':
        return <CheckCircle size={16} className="text-blue-600" />
      case 'APPROVED':
        return <CheckCircle size={16} className="text-green-600" />
      case 'PENDING_APPROVAL':
      case 'PENDING':
        return <Clock size={16} className="text-yellow-600" />
      case 'REJECTED':
        return <XCircle size={16} className="text-red-600" />
      case 'DRAFT':
      default:
        return <FileText size={16} className="text-gray-600" />
    }
  }

  // Gratuity Management Handlers
  const handleOpenGratuityModal = (gratuity = null) => {
    if (gratuity) {
      setEditingGratuity(gratuity)
      setGratuityFormData({
        employeeId: gratuity.employeeId?.toString() || '',
        exitDate: gratuity.exitDate || format(new Date(), 'yyyy-MM-dd'),
        lastDrawnSalary: gratuity.lastDrawnSalary || 0,
        yearsOfService: gratuity.yearsOfService ? parseFloat(parseFloat(gratuity.yearsOfService).toFixed(1)) : 0,
        notes: gratuity.notes || ''
      })
    } else {
      setEditingGratuity(null)
      setGratuityFormData({
        employeeId: '',
        exitDate: format(new Date(), 'yyyy-MM-dd'),
        lastDrawnSalary: 0,
        yearsOfService: 0,
        notes: ''
      })
    }
    setShowGratuityModal(true)
  }

  const handleCalculateGratuity = async () => {
    if (!gratuityFormData.employeeId || !gratuityFormData.exitDate) {
      alert('Please select an employee and exit date')
      return
    }

    try {
      setCalculatingGratuity(true)
      const result = await api.calculateGratuity(
        parseInt(gratuityFormData.employeeId),
        gratuityFormData.exitDate
      )
      if (result.success) {
        const gratuity = result.gratuity
        setGratuityFormData({
          ...gratuityFormData,
          lastDrawnSalary: gratuity.lastDrawnSalary || 0,
          yearsOfService: gratuity.yearsOfService ? parseFloat(parseFloat(gratuity.yearsOfService).toFixed(1)) : 0
        })
        alert(`Gratuity calculated: ₹${gratuity.finalAmount?.toFixed(2) || 0} (Years of Service: ${gratuity.yearsOfService?.toFixed(2) || 0})`)
      } else {
        alert('Error calculating gratuity: ' + (result.message || 'Failed to calculate'))
      }
    } catch (error) {
      alert('Error calculating gratuity: ' + error.message)
    } finally {
      setCalculatingGratuity(false)
    }
  }

  const handleGratuitySubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!gratuityFormData.employeeId || !gratuityFormData.exitDate || !gratuityFormData.yearsOfService || parseFloat(gratuityFormData.yearsOfService) <= 0) {
      alert('Please fill in all required fields including Years of Service (must be greater than 0)')
      return
    }
    
    try {
      setLoading(true)
      
      // Calculate gratuity amount based on manually entered years of service
      const yearsOfService = parseFloat(gratuityFormData.yearsOfService) || 0
      const lastDrawnSalary = parseFloat(gratuityFormData.lastDrawnSalary) || 0
      const calculatedAmount = (lastDrawnSalary * 15.0 / 26.0) * yearsOfService
      const finalAmount = Math.min(calculatedAmount, 2000000.0) // ₹20 lakhs cap
      
      const gratuityData = {
        employeeId: parseInt(gratuityFormData.employeeId),
        exitDate: gratuityFormData.exitDate,
        lastDrawnSalary: lastDrawnSalary,
        yearsOfService: yearsOfService,
        calculatedAmount: calculatedAmount,
        finalAmount: finalAmount,
        notes: gratuityFormData.notes
      }

      let result
      if (editingGratuity) {
        result = await api.updateGratuity(editingGratuity.id, gratuityData)
      } else {
        result = await api.createGratuity(gratuityData)
      }

      if (result.success) {
        showSuccessMessage(editingGratuity ? 'Gratuity updated successfully' : 'Gratuity created successfully')
        await loadData()
        setShowGratuityModal(false)
        setEditingGratuity(null)
      } else {
        alert('Error saving gratuity: ' + (result.message || 'Failed to save'))
      }
    } catch (error) {
      alert('Error saving gratuity: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGratuity = async (gratuityId) => {
    const gratuity = gratuities.find(g => g.id === gratuityId)
    const employee = gratuity ? employees.find(emp => emp.id === gratuity.employeeId || emp.id === parseInt(gratuity.employeeId)) : null
    const employeeName = employee ? employee.name : 'this employee'
    
    const confirmMessage = gratuity?.status === 'PAID' 
      ? `Are you sure you want to delete this PAID gratuity record for ${employeeName}? This action cannot be undone.`
      : `Are you sure you want to delete this gratuity record for ${employeeName}?`
    
    if (!window.confirm(confirmMessage)) return
    
    try {
      setLoading(true)
      const result = await api.deleteGratuity(gratuityId)
      if (result.success) {
        showSuccessMessage('Gratuity deleted successfully')
        await loadData()
      } else {
        alert('Error deleting gratuity: ' + (result.message || 'Failed to delete'))
      }
    } catch (error) {
      alert('Error deleting gratuity: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveGratuity = async (gratuityId) => {
    if (!window.confirm('Approve this gratuity?')) return
    
    try {
      const userId = localStorage.getItem('userId')
      const result = await api.approveGratuity(gratuityId, userId ? parseInt(userId) : null)
      if (result.success) {
        showSuccessMessage('Gratuity approved successfully')
        await loadData()
      } else {
        alert('Error approving gratuity: ' + (result.message || 'Failed to approve'))
      }
    } catch (error) {
      alert('Error approving gratuity: ' + error.message)
    }
  }

  const handleMarkGratuityAsPaid = async (gratuityId) => {
    const paymentDate = prompt('Enter payment date (YYYY-MM-DD) or leave empty for today:', format(new Date(), 'yyyy-MM-dd'))
    if (paymentDate === null) return
    
    try {
      const userId = localStorage.getItem('userId')
      const result = await api.markGratuityAsPaid(gratuityId, paymentDate || undefined, userId ? parseInt(userId) : null)
      if (result.success) {
        showSuccessMessage('Gratuity marked as paid successfully')
        await loadData()
      } else {
        alert('Error marking gratuity as paid: ' + (result.message || 'Failed to mark as paid'))
      }
    } catch (error) {
      alert('Error marking gratuity as paid: ' + error.message)
    }
  }

  const handleRejectGratuity = async (gratuityId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      const result = await api.rejectGratuity(gratuityId, reason)
      if (result.success) {
        showSuccessMessage('Gratuity rejected successfully')
        await loadData()
      } else {
        alert('Error rejecting gratuity: ' + (result.message || 'Failed to reject'))
      }
    } catch (error) {
      alert('Error rejecting gratuity: ' + error.message)
    }
  }

  // Filter gratuities
  const filteredGratuities = gratuities.filter(gratuity => {
    const matchesStatus = gratuityStatusFilter === 'All' || gratuity.status === gratuityStatusFilter
    const matchesSearch = !gratuitySearchTerm || 
      (() => {
        const emp = employees.find(emp => emp.id === gratuity.employeeId || emp.id === parseInt(gratuity.employeeId))
        if (!emp) return false
        const fullName = (emp.name || `Employee ${emp.id}`).toLowerCase()
        return fullName.includes(gratuitySearchTerm.toLowerCase()) || 
               emp.employeeId?.toLowerCase().includes(gratuitySearchTerm.toLowerCase()) ||
               emp.email?.toLowerCase().includes(gratuitySearchTerm.toLowerCase())
      })() ||
      gratuity.status?.toLowerCase().includes(gratuitySearchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })
  
  // Debug: Log filtered results for gratuities
  if (activeView === 'gratuity') {
    console.log('Gratuity filtering:', {
      totalGratuities: gratuities.length,
      filteredCount: filteredGratuities.length,
      statusFilter: gratuityStatusFilter,
      searchTerm: gratuitySearchTerm,
      gratuities: gratuities,
      filteredGratuities: filteredGratuities
    })
  }

  // If editing/adding salary details, show full page view (like employee page)
  if (showSalaryModal && isAdmin) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                  {editingSalary ? (
                    <>
                      <Edit size={28} className="text-blue-600" />
                      Edit Salary Details
                    </>
                  ) : (
                    <>
                      <Plus size={28} className="text-blue-600" />
                      Add Salary Details
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowSalaryModal(false)
                    setEditingSalary(null)
                    setShowCtcConverter(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSalarySubmit} className="space-y-5">
                {/* Employee Information */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                      <select
                        value={salaryFormData.employeeId}
                        onChange={(e) => handleEmployeeChangeForCTC(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees
                          .filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN')
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name || `Employee ${emp.id}`} {emp.employeeId ? `(${emp.employeeId})` : ''} {emp.client ? `- ${emp.client}` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Effective From *</label>
                      <input
                        type="date"
                        value={salaryFormData.effectiveFrom}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, effectiveFrom: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  {!editingSalary && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowCtcConverter(!showCtcConverter)}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        {showCtcConverter ? (
                          <>
                            <X size={20} />
                            Hide CTC Converter
                          </>
                        ) : (
                          <>
                            <span className="font-bold">₹</span>
                            Convert CTC to Salary Structure
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* CTC Converter Section */}
                {showCtcConverter && !editingSalary && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-5 border-2 border-purple-200">
                    <h4 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <span className="text-purple-600 font-bold text-xl">₹</span>
                      CTC to Salary Structure Converter
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter employee's Annual CTC and select a client-specific template. The system will auto-generate all salary components.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Annual CTC (₹) *</label>
                        <input
                          type="number"
                          value={ctcConversionData.annualCtc}
                          onChange={(e) => setCtcConversionData({ ...ctcConversionData, annualCtc: e.target.value })}
                          placeholder="Enter Annual CTC"
                          className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CTC Template *</label>
                        <select
                          value={ctcConversionData.templateId}
                          onChange={(e) => setCtcConversionData({ ...ctcConversionData, templateId: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          disabled={ctcTemplates.length === 0}
                        >
                          <option value="">
                            {ctcTemplates.length === 0 
                              ? 'No templates available - Please create CTC templates first' 
                              : 'Select Template'}
                          </option>
                          {ctcTemplates
                            .filter(t => {
                              if (ctcConversionData.client) {
                                return !t.clientName || t.clientName === ctcConversionData.client
                              }
                              return true
                            })
                            .map(template => (
                              <option key={template.id} value={template.id}>
                                {template.templateName} {template.clientName ? `(${template.clientName})` : ''}
                              </option>
                            ))}
                        </select>
                        {ctcTemplates.length === 0 && (
                          <p className="mt-2 text-sm text-amber-600">
                            ⚠️ No CTC templates found. Please create templates in the CTC Template Management section first.
                          </p>
                        )}
                      </div>
                    </div>
                    {ctcConversionData.annualCtc && ctcConversionData.templateId && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600">
                          <strong>Monthly CTC:</strong> ₹{((parseFloat(ctcConversionData.annualCtc) || 0) / 12).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleConvertCTC}
                      disabled={!ctcConversionData.annualCtc || !ctcConversionData.templateId || loading}
                      className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <span className="font-bold">₹</span>
                          Convert & Auto-Fill Salary Structure
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Salary Components */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Components</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Basic Salary *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.basicSalary}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, basicSalary: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">HRA (House Rent Allowance)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.hra}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, hra: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.transportAllowance === 0 || salaryFormData.transportAllowance === '0' ? '' : salaryFormData.transportAllowance}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, transportAllowance: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.medicalAllowance === 0 || salaryFormData.medicalAllowance === '0' ? '' : salaryFormData.medicalAllowance}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, medicalAllowance: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.specialAllowance === 0 || salaryFormData.specialAllowance === '0' ? '' : salaryFormData.specialAllowance}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, specialAllowance: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.otherAllowances === 0 || salaryFormData.otherAllowances === '0' ? '' : salaryFormData.otherAllowances}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, otherAllowances: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Deductions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PF (Provident Fund)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.pf}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, pf: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ESI (Employee State Insurance)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.esi === 0 || salaryFormData.esi === '0' ? '' : salaryFormData.esi}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, esi: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">TDS (Tax Deducted at Source)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.tds === 0 || salaryFormData.tds === '0' ? '' : salaryFormData.tds}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, tds: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.professionalTax === 0 || salaryFormData.professionalTax === '0' ? '' : salaryFormData.professionalTax}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, professionalTax: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salaryFormData.otherDeductions === 0 || salaryFormData.otherDeductions === '0' ? '' : salaryFormData.otherDeductions}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, otherDeductions: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSalaryModal(false)
                      setEditingSalary(null)
                      setShowCtcConverter(false)
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
                    {loading ? 'Saving...' : editingSalary ? 'Update Salary Details' : 'Create Salary Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }

  // If editing/adding CTC Template, show full page view (like employee page)
  if (showCtcTemplateModal && isAdmin) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                  {editingCtcTemplate ? (
                    <>
                      <Edit size={28} className="text-blue-600" />
                      Edit CTC Template
                    </>
                  ) : (
                    <>
                      <Plus size={28} className="text-blue-600" />
                      Create CTC Template
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowCtcTemplateModal(false)
                    setEditingCtcTemplate(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCtcTemplateSubmit} className="space-y-5">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name *</label>
                      <input
                        type="text"
                        value={ctcTemplateFormData.templateName}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, templateName: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name *</label>
                      <select
                        value={ctcTemplateFormData.clientName}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, clientName: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">Select Client</option>
                        {ctcTemplateClients.map(client => (
                          <option key={client} value={client}>{client}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={ctcTemplateFormData.description}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, description: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Salary Components */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Salary Components (Percentages of CTC)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Basic Salary % *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.basicSalaryPercentage === 0 || ctcTemplateFormData.basicSalaryPercentage === '0' ? '' : ctcTemplateFormData.basicSalaryPercentage}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, basicSalaryPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">HRA % (of Basic) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.hraPercentage === 0 || ctcTemplateFormData.hraPercentage === '0' ? '' : ctcTemplateFormData.hraPercentage}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, hraPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Deductions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PF % (of Basic) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.pfPercentage === 0 || ctcTemplateFormData.pfPercentage === '0' ? '' : ctcTemplateFormData.pfPercentage}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, pfPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ESI % (of Gross)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.esiPercentage === 0 || ctcTemplateFormData.esiPercentage === '0' ? '' : ctcTemplateFormData.esiPercentage}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ESI Applicable Threshold (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.esiApplicableThreshold === 0 || ctcTemplateFormData.esiApplicableThreshold === '0' ? '' : ctcTemplateFormData.esiApplicableThreshold}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiApplicableThreshold: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax (Fixed ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.professionalTaxAmount || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, professionalTaxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">TDS % (of Gross)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.tdsPercentage || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, tdsPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions % (of Gross)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.otherDeductionsPercentage || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, otherDeductionsPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Allowances */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Allowances</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance (% of CTC)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctcTemplateFormData.transportAllowancePercentage || ''}
                          onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, transportAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance (Fixed ₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctcTemplateFormData.transportAllowanceFixed || ''}
                          onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, transportAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Info size={14} />
                      <span>Note: Fixed amount takes precedence over percentage. Leave both empty if not applicable.</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance (% of CTC)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctcTemplateFormData.medicalAllowancePercentage || ''}
                          onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, medicalAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance (Fixed ₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctcTemplateFormData.medicalAllowanceFixed || ''}
                          onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, medicalAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance (% of CTC)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctcTemplateFormData.specialAllowancePercentage || ''}
                          onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, specialAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance (Fixed ₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctcTemplateFormData.specialAllowanceFixed || ''}
                          onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, specialAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances (% of CTC)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.otherAllowancesPercentage || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, otherAllowancesPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={ctcTemplateFormData.active}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, active: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active (Template will be available for use)</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCtcTemplateModal(false)
                      setEditingCtcTemplate(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        {editingCtcTemplate ? 'Update Template' : 'Create Template'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }

  // If viewing CTC Template, show full page view (like employee page)
  if (showViewCtcTemplateModal && viewingCtcTemplate) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Receipt size={28} className="text-blue-600" />
                      <span>CTC Template Details</span>
                    </div>
                    <span className="text-sm font-normal text-gray-500">
                      {viewingCtcTemplate.templateName}
                    </span>
                  </div>
                </h3>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowViewCtcTemplateModal(false)
                        handleOpenCtcTemplateModal(viewingCtcTemplate)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Edit size={18} />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowViewCtcTemplateModal(false)
                      setViewingCtcTemplate(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.templateName || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.clientName || 'N/A'}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <div className="text-base text-gray-900 font-medium bg-white p-3 rounded-lg border border-gray-200 min-h-[80px]">
                        {viewingCtcTemplate.description || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary Components */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Components (Percentages of CTC)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Basic Salary %</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.basicSalaryPercentage || 0}%
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">HRA % (of Basic)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.hraPercentage || 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Deductions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PF % (of Basic)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.pfPercentage || 0}%
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ESI % (of Gross)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.esiPercentage ? `${viewingCtcTemplate.esiPercentage}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ESI Applicable Threshold (₹)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.esiApplicableThreshold ? `₹${viewingCtcTemplate.esiApplicableThreshold}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax (Fixed ₹)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.professionalTaxAmount ? `₹${viewingCtcTemplate.professionalTaxAmount}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">TDS % (of Gross)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.tdsPercentage ? `${viewingCtcTemplate.tdsPercentage}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions % (of Gross)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.otherDeductionsPercentage ? `${viewingCtcTemplate.otherDeductionsPercentage}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allowances */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Allowances</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance (% of CTC)</label>
                        <div className="text-base text-gray-900 font-medium">
                          {viewingCtcTemplate.transportAllowancePercentage ? `${viewingCtcTemplate.transportAllowancePercentage}%` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance (Fixed ₹)</label>
                        <div className="text-base text-gray-900 font-medium">
                          {viewingCtcTemplate.transportAllowanceFixed ? `₹${viewingCtcTemplate.transportAllowanceFixed}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance (% of CTC)</label>
                        <div className="text-base text-gray-900 font-medium">
                          {viewingCtcTemplate.medicalAllowancePercentage ? `${viewingCtcTemplate.medicalAllowancePercentage}%` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance (Fixed ₹)</label>
                        <div className="text-base text-gray-900 font-medium">
                          {viewingCtcTemplate.medicalAllowanceFixed ? `₹${viewingCtcTemplate.medicalAllowanceFixed}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance (% of CTC)</label>
                        <div className="text-base text-gray-900 font-medium">
                          {viewingCtcTemplate.specialAllowancePercentage ? `${viewingCtcTemplate.specialAllowancePercentage}%` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance (Fixed ₹)</label>
                        <div className="text-base text-gray-900 font-medium">
                          {viewingCtcTemplate.specialAllowanceFixed ? `₹${viewingCtcTemplate.specialAllowanceFixed}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances (% of CTC)</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingCtcTemplate.otherAllowancesPercentage ? `${viewingCtcTemplate.otherAllowancesPercentage}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <div className="flex items-center gap-3">
                    {viewingCtcTemplate.active ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle size={16} className="mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <XCircle size={16} className="mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewCtcTemplateModal(false)
                      setViewingCtcTemplate(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // If viewing payroll details, show full page view (like employee page)
  if (showViewModal && viewingPayroll) {
    const employee = employees.find(e => e.id === viewingPayroll.employeeId)
    const employeeName = employee?.name || `Employee ID: ${viewingPayroll.employeeId}`
    const baseSalary = parseFloat(viewingPayroll.baseSalary) || 0
    const allowances = parseFloat(viewingPayroll.allowances) || 0
    const bonus = parseFloat(viewingPayroll.bonus) || 0
    const deductions = parseFloat(viewingPayroll.deductions) || 0
    
    // Get attendance details for proration and display
    const attendanceDetails = calculateAttendanceDetails(viewingPayroll)
    const prorationFactor = parseFloat(attendanceDetails.prorationFactor) || 1.0
    
    // Calculate full net salary (before proration)
    const fullNetSalary = baseSalary + allowances + bonus - deductions
    
    // If payroll has startDate/endDate, it was processed with attendance - use prorated value
    let finalNetSalary
    if (viewingPayroll.startDate && viewingPayroll.endDate && viewingPayroll.netSalary != null) {
      // Use backend's prorated netSalary and add bonus (bonus is typically not prorated)
      const proratedBase = (baseSalary + allowances - deductions) * prorationFactor
      finalNetSalary = Math.max(0, proratedBase + bonus)
    } else {
      // No attendance data - use full calculation
      finalNetSalary = Math.max(0, fullNetSalary)
    }
    
    // Get salary structure for contributions
    const salaryStructure = salaryStructures.find(s => 
      (s.employeeId === viewingPayroll.employeeId || s.employeeId === parseInt(viewingPayroll.employeeId)) && s.active
    )
    const contributions = calculateContributions(viewingPayroll, salaryStructure)

    return (
      <>
        <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold text-2xl">₹</span>
                      <span>Payroll Details</span>
                    </div>
                    <span className="text-sm font-normal text-gray-500">
                      {employeeName} - {viewingPayroll.month || 'N/A'}/{viewingPayroll.year || 'N/A'}
                    </span>
                  </div>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setViewingPayroll(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Employee Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                      <div className="text-base text-gray-900 font-medium">
                        {employeeName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingPayroll.month || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingPayroll.year || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Details */}
                {viewingPayroll.startDate && viewingPayroll.endDate && (() => {
                  const lopDays = Math.max(0, attendanceDetails.totalDays - attendanceDetails.payableDays)
                  return (
                    <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                      <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={24} className="text-blue-600" />
                        Attendance & Payroll Calculation
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Total Working Days</label>
                          <div className="text-lg font-bold text-gray-900">
                            {attendanceDetails.totalDays} days
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Days in period</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Present Days</label>
                          <div className="text-lg font-bold text-green-600">
                            {attendanceDetails.presentDays} days
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Actual attendance</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-yellow-100">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Approved Leave Days</label>
                          <div className="text-lg font-bold text-yellow-600">
                            {attendanceDetails.leaveDays} days
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Manager approved</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Payable Days</label>
                          <div className="text-lg font-bold text-blue-600">
                            {attendanceDetails.payableDays} days
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Present + Leave</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-red-100">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">LOP Days</label>
                          <div className="text-lg font-bold text-red-600">
                            {lopDays.toFixed(1)} days
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Loss of Pay</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Proration Factor</label>
                          <div className="text-lg font-bold text-purple-600">
                            {(parseFloat(attendanceDetails.prorationFactor) * 100).toFixed(2)}%
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Payable/Total</p>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Calculation:</strong> Payable Days = Present Days ({attendanceDetails.presentDays}) + Approved Leave Days ({attendanceDetails.leaveDays}) = {attendanceDetails.payableDays} days
                        </p>
                        {lopDays > 0 && (
                          <p className="text-sm text-red-700 mt-2">
                            <strong>LOP:</strong> Total Working Days ({attendanceDetails.totalDays}) - Payable Days ({attendanceDetails.payableDays}) = {lopDays.toFixed(1)} days (Loss of Pay)
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Salary Impact:</strong> Net Salary is calculated as (Base Salary + Allowances - Deductions) × Proration Factor ({attendanceDetails.prorationFactor}) + Bonus
                        </p>
                      </div>
                      {viewingPayroll.startDate && viewingPayroll.endDate && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-semibold">Period:</span> {format(parseISO(viewingPayroll.startDate), 'MMM dd, yyyy')} - {format(parseISO(viewingPayroll.endDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Salary Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Base Salary</label>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{viewingPayroll.baseSalary?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Allowances</label>
                      <div className="text-lg font-bold text-green-600">
                        +₹{viewingPayroll.allowances?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bonus</label>
                      <div className="text-lg font-bold text-green-600">
                        +₹{viewingPayroll.bonus?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Deductions</label>
                      <div className="text-lg font-bold text-red-600">
                        -₹{viewingPayroll.deductions?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    {viewingPayroll.startDate && viewingPayroll.endDate && (
                      <div className="md:col-span-2 bg-yellow-50 rounded-lg p-3 border-2 border-yellow-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Net Salary (Before Proration)</label>
                        <div className="text-lg font-semibold text-gray-700">
                          ₹{(baseSalary + allowances + bonus - deductions).toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">This is the full salary before attendance-based proration</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {viewingPayroll.startDate && viewingPayroll.endDate ? 'Net Salary (After Proration)' : 'Net Salary'}
                      </label>
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{finalNetSalary.toFixed(2)}
                      </div>
                      {viewingPayroll.startDate && viewingPayroll.endDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Prorated by {attendanceDetails.payableDays} payable days out of {attendanceDetails.totalDays} total days
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contributions Section */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Contributions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Contribution</label>
                      <div className="text-lg font-bold text-orange-600 mb-3">
                        ₹{contributions.employeeContribution}
                      </div>
                      <div className="space-y-2 border-t border-orange-100 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">PF (Provident Fund)</span>
                          <span className="text-sm font-semibold text-gray-800">₹{contributions.pfEmployee}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">ESI (Employee State Insurance)</span>
                          <span className="text-sm font-semibold text-gray-800">₹{contributions.esiEmployee}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-orange-100">
                          <span className="text-xs font-semibold text-gray-700">Total</span>
                          <span className="text-sm font-bold text-orange-600">₹{contributions.employeeContribution}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Deducted from salary</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employer Contribution</label>
                      <div className="text-lg font-bold text-blue-600 mb-3">
                        ₹{contributions.employerContribution}
                      </div>
                      <div className="space-y-2 border-t border-blue-100 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">PF (Provident Fund)</span>
                          <span className="text-sm font-semibold text-gray-800">₹{contributions.pfEmployer}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">ESI (Employee State Insurance)</span>
                          <span className="text-sm font-semibold text-gray-800">₹{contributions.esiEmployer}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                          <span className="text-xs font-semibold text-gray-700">Total</span>
                          <span className="text-sm font-bold text-blue-600">₹{contributions.employerContribution}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Employer's share</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          viewingPayroll.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          viewingPayroll.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                          viewingPayroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          viewingPayroll.status === 'FINALIZED' ? 'bg-green-100 text-green-800' :
                          viewingPayroll.status === 'PAID' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {viewingPayroll.status || 'DRAFT'}
                        </span>
                      </div>
                    </div>
                    {viewingPayroll.notes && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <div className="text-base text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {viewingPayroll.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  {isAdmin && (viewingPayroll.status === 'DRAFT' || viewingPayroll.status === 'PENDING_APPROVAL') && (
                    <>
                      <button
                        onClick={() => {
                          setShowViewModal(false)
                          handleOpenPayrollModal(viewingPayroll)
                        }}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                      >
                        <Edit size={20} />
                        Edit Payroll
                      </button>
                      <button
                        onClick={() => {
                          setShowViewModal(false)
                          handleDeletePayroll(viewingPayroll.id)
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                      >
                        <Trash2 size={20} />
                        Delete Payroll
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setViewingPayroll(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // If viewing salary details, show full page view (like employee page)
  if (showViewSalaryModal && viewingSalary) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold text-2xl">₹</span>
                      <span>Salary Details</span>
                    </div>
                    <span className="text-sm font-normal text-gray-500">
                      {employees.find(e => e.id === viewingSalary.employeeId)?.name || 
                       `Employee ID: ${viewingSalary.employeeId}`}
                    </span>
                  </div>
                </h3>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowViewSalaryModal(false)
                        handleOpenSalaryModal(viewingSalary)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Edit size={18} />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowViewSalaryModal(false)
                      setViewingSalary(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="space-y-5">
                {/* Employee Information */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                      <div className="text-base text-gray-900 font-medium">
                        {employees.find(e => e.id === viewingSalary.employeeId)?.name || 
                         `Employee ID: ${viewingSalary.employeeId}`}
                      </div>
                      {employees.find(e => e.id === viewingSalary.employeeId)?.employeeId && (
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {employees.find(e => e.id === viewingSalary.employeeId)?.employeeId}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Effective From</label>
                      <div className="text-base text-gray-900 font-medium">
                        {viewingSalary.effectiveFrom ? format(parseISO(viewingSalary.effectiveFrom), 'dd MMM yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          viewingSalary.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {viewingSalary.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Salary */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Basic Salary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Basic Salary</label>
                      <div className="text-xl font-bold text-gray-900">
                        ₹{viewingSalary.basicSalary?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">HRA</label>
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{viewingSalary.hra?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allowances */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Allowances</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.transportAllowance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.medicalAllowance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.specialAllowance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.otherAllowances?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="md:col-span-2 border-t-2 border-gray-200 pt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Allowances</label>
                      <div className="text-xl font-bold text-gray-900">
                        ₹{((viewingSalary.transportAllowance || 0) + 
                            (viewingSalary.medicalAllowance || 0) + 
                            (viewingSalary.specialAllowance || 0) + 
                            (viewingSalary.otherAllowances || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Deductions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PF</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.pf?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ESI</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.esi?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">TDS</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.tds?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.professionalTax?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions</label>
                      <div className="text-base text-gray-900 font-medium">
                        ₹{viewingSalary.otherDeductions?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="md:col-span-2 border-t-2 border-gray-200 pt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Deductions</label>
                      <div className="text-xl font-bold text-gray-900">
                        ₹{((viewingSalary.pf || 0) + 
                            (viewingSalary.esi || 0) + 
                            (viewingSalary.tds || 0) + 
                            (viewingSalary.professionalTax || 0) + 
                            (viewingSalary.otherDeductions || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gross Salary</label>
                      <div className="text-xl font-bold text-gray-900">
                        ₹{viewingSalary.grossSalary?.toFixed(2) || 
                          ((viewingSalary.basicSalary || 0) + 
                           (viewingSalary.transportAllowance || 0) + 
                           (viewingSalary.medicalAllowance || 0) + 
                           (viewingSalary.specialAllowance || 0) + 
                           (viewingSalary.otherAllowances || 0)).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Deductions</label>
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{((viewingSalary.pf || 0) + 
                            (viewingSalary.esi || 0) + 
                            (viewingSalary.tds || 0) + 
                            (viewingSalary.professionalTax || 0) + 
                            (viewingSalary.otherDeductions || 0)).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Net Salary</label>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{viewingSalary.netSalary?.toFixed(2) || 
                          (((viewingSalary.basicSalary || 0) + 
                            (viewingSalary.transportAllowance || 0) + 
                            (viewingSalary.medicalAllowance || 0) + 
                            (viewingSalary.specialAllowance || 0) + 
                            (viewingSalary.otherAllowances || 0)) - 
                           ((viewingSalary.pf || 0) + 
                            (viewingSalary.esi || 0) + 
                            (viewingSalary.tds || 0) + 
                            (viewingSalary.professionalTax || 0) + 
                            (viewingSalary.otherDeductions || 0))).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewSalaryModal(false)
                      setViewingSalary(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 bg-gray-50 p-2 sm:p-3 md:p-4 max-w-full overflow-x-hidden">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 space-y-3">
          <div className="flex items-start gap-3 bg-green-50 text-green-800 border border-green-200 rounded-xl px-5 py-4 shadow-lg min-w-[320px] max-w-[480px]">
            <CheckCircle size={24} className="mt-0.5 text-green-600 shrink-0" />
            <div className="flex-1 text-lg font-semibold">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700/70 hover:text-green-800"
              aria-label="Close success message"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      {/* Toggle Buttons for Salary Details, Processed Payrolls, CTC Templates, Gratuity, and Annual CTC - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 flex-wrap">
            <button
              onClick={() => setActiveView('salaryDetails')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'salaryDetails'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-base font-bold">₹</span>
              Salary Details
            </button>
            <button
              onClick={() => setActiveView('processedPayrolls')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'processedPayrolls'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              Processed Payrolls
            </button>
            <button
              onClick={() => setActiveView('gratuity')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'gratuity'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Gift size={18} />
              Gratuity
            </button>
            <button
              onClick={() => setActiveView('annualCTC')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'annualCTC'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp size={18} />
              Annual CTC Calculation
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards - Only for Processed Payrolls view */}
      {(isAdmin || isManager) && activeView === 'processedPayrolls' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Total</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <span className="text-blue-600 font-bold text-sm sm:text-base md:text-lg">₹</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Draft</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">{stats.draft}</div>
              </div>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Pending</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </div>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Approved</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.approved}</div>
              </div>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Finalized</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.finalized}</div>
              </div>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Paid</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{stats.paid}</div>
              </div>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Total Amount</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">₹{stats.totalAmount.toFixed(0)}</div>
              </div>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Salary Details View */}
      {(isAdmin || isManager) && activeView === 'salaryDetails' && (
        <>
          {/* Filters and Actions for Salary Details */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by employee name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {!isManager && (
                  <button
                    onClick={() => handleOpenSalaryModal()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                  >
                    <Plus size={20} />
                    Add Salary Details
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Salary Details Table */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-xl">₹</span>
                Salary Details ({salaryStructures.filter(s => {
                  // For managers, only show their own salary structures
                  if (isManager && userId) {
                    const empId = typeof s.employeeId === 'string' ? parseInt(s.employeeId) : s.employeeId
                    if (empId !== parseInt(userId)) return false
                  }
                  // Apply search filter if search term exists
                  if (!searchTerm) return true
                  const emp = employees.find(e => e.id === s.employeeId)
                  if (!emp) return false
                  const fullName = (emp.name || '').toLowerCase()
                  return fullName.includes(searchTerm.toLowerCase()) || 
                         emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
                }).length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Basic Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">HRA</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Allowances</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Gross Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Effective From</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                    {!isManager && (
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider pr-8">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryStructures.filter(s => {
                    // For managers, only show their own salary structures
                    if (isManager && userId) {
                      const empId = typeof s.employeeId === 'string' ? parseInt(s.employeeId) : s.employeeId
                      if (empId !== parseInt(userId)) return false
                    }
                    // Apply search filter if search term exists
                    if (!searchTerm) return true
                    const emp = employees.find(e => e.id === s.employeeId)
                    if (!emp) return false
                    const fullName = (emp.name || '').toLowerCase()
                    return fullName.includes(searchTerm.toLowerCase()) || 
                           emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
                  }).map((salary, index) => {
                    const employee = employees.find(emp => emp.id === salary.employeeId)
                    const employeeName = employee ? (employee.name || `Employee ${salary.employeeId}`) : `Employee ${salary.employeeId}`
                    const totalAllowances = (salary.transportAllowance || 0) + (salary.medicalAllowance || 0) + (salary.specialAllowance || 0) + (salary.otherAllowances || 0)
                    const totalDeductions = (salary.pf || 0) + (salary.esi || 0) + (salary.tds || 0) + (salary.professionalTax || 0) + (salary.otherDeductions || 0)
                    return (
                      <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{employeeName}</div>
                          {employee?.employeeId && (
                            <div className="text-xs text-gray-500">ID: {employee.employeeId}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{salary.basicSalary?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{salary.hra?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">₹{totalAllowances.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">₹{totalDeductions.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">₹{salary.grossSalary?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{salary.netSalary?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.effectiveFrom ? format(parseISO(salary.effectiveFrom), 'dd MMM yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            salary.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {salary.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {!isManager && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                            <div className="relative inline-block dropdown-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const button = e.currentTarget
                                  const rect = button.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const spaceAbove = rect.top
                                  const dropdownHeight = 120
                                  
                                  // Determine position: show below if enough space, otherwise above
                                  const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                  
                                  setDropdownPosition(prev => ({
                                    ...prev,
                                    [`salary-${salary.id}`]: {
                                      showAbove,
                                      top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                      right: window.innerWidth - rect.right
                                    }
                                  }))
                                  setOpenSalaryDropdownId(openSalaryDropdownId === salary.id ? null : salary.id)
                                }}
                                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {openSalaryDropdownId === salary.id && dropdownPosition[`salary-${salary.id}`] && (
                                <div 
                                  className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                  style={{ 
                                    zIndex: 9999,
                                    top: `${dropdownPosition[`salary-${salary.id}`].top}px`,
                                    right: `${dropdownPosition[`salary-${salary.id}`].right}px`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewSalary(salary)
                                      setOpenSalaryDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Eye size={16} className="text-green-600" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenSalaryModal(salary)
                                      setOpenSalaryDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Edit size={16} className="text-blue-600" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSalary(salary.id)
                                      setOpenSalaryDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Processed Payrolls View - For Admin, Employees, and Managers */}
      {(activeView === 'processedPayrolls' || isEmployee || isManager) && (
        <>
      {/* Page Title for Employees */}
      {/* {isEmployee && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-blue-600 font-bold text-2xl">₹</span>
            My Payroll
          </h1>
        </div>
      )} */}
      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search payrolls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {/* Month filter - Show for both admin and employees */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="All Months"
                />
                {isEmployee && selectedMonth && (
                  <button
                    onClick={() => setSelectedMonth('')}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1 whitespace-nowrap"
                    title="Clear month filter to show all months"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>
          {isAdmin && (
            <>
              <div className="flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="FINALIZED">Finalized</option>
                  <option value="PAID">Paid</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <button
                onClick={() => setShowIndividualProcessModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
              >
                <Users size={20} />
                Process Individual
              </button>
              <button
                onClick={() => setShowBulkProcessModal(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
              >
                <PlayCircle size={20} />
                Bulk Process
              </button>
              {stats.approved > 0 && (
                <button
                  onClick={handleFinalizeAll}
                  className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                >
                  <CheckCircle size={20} />
                  Finalize All
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="bg-gray-600 text-white px-6 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
              >
                <FileDown size={20} />
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
        <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-blue-600 font-bold text-xl">₹</span>
            Payroll Records ({filteredPayrolls.length})
          </h3>
            {isAdmin && filteredPayrolls.length > 0 && (
              <p className="text-xs text-gray-500">
                Note: If values look incorrect, delete and use "Bulk Process" to recalculate from salary details
              </p>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                {isAdmin && (
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                )}
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Month/Year</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Base Salary</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Allowances</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Deductions</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Bonus</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Employee Contribution</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Employer Contribution</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Working Days</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Net Salary</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 12 : 11} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 12 : 11} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-gray-500 font-medium">No payroll records found</p>
                      {isEmployee && payrolls.length > 0 && (
                        <p className="text-sm text-gray-400">
                          {payrolls.length} record(s) exist but are filtered out. Try clearing filters.
                        </p>
                      )}
                      {isEmployee && payrolls.length === 0 && (
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>No payroll records exist for your account.</p>
                          <p>Please contact HR to process your payroll.</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const employee = employees.find(emp => emp.id === payroll.employeeId || emp.id === parseInt(payroll.employeeId))
                  const employeeName = employee ? (employee.name || 'N/A') : 'N/A'
                  // Calculate net salary with attendance-based proration
                  const baseSalary = parseFloat(payroll.baseSalary) || 0
                  const allowances = parseFloat(payroll.allowances) || 0
                  const bonus = parseFloat(payroll.bonus) || 0
                  const deductions = parseFloat(payroll.deductions) || 0
                  
                  // Get attendance details
                  const attendanceDetails = calculateAttendanceDetails(payroll)
                  const prorationFactor = parseFloat(attendanceDetails.prorationFactor) || 1.0
                  
                  // Calculate full net salary (before proration)
                  const fullNetSalary = baseSalary + allowances + bonus - deductions
                  
                  // If payroll has startDate/endDate, it was processed with attendance - use prorated value
                  // Otherwise, use full calculation
                  let netSalary
                  if (payroll.startDate && payroll.endDate && payroll.netSalary != null) {
                    // Use backend's prorated netSalary and add bonus (bonus is typically not prorated)
                    const proratedBase = (baseSalary + allowances - deductions) * prorationFactor
                    netSalary = (proratedBase + bonus).toFixed(2)
                  } else {
                    // No attendance data - use full calculation
                    netSalary = Math.max(0, fullNetSalary).toFixed(2)
                  }
                  
                  // Get salary structure for this employee to calculate contributions
                  const salaryStructure = salaryStructures.find(s => 
                    (s.employeeId === payroll.employeeId || s.employeeId === parseInt(payroll.employeeId)) && s.active
                  )
                  const contributions = calculateContributions(payroll, salaryStructure)
                  
                  return (
                    <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employeeName}
                        </td>
                      )}
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {payroll.month && payroll.year 
                          ? `${payroll.month}/${payroll.year}`
                          : payroll.month || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payroll.baseSalary?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-green-600">
                        +₹{payroll.allowances?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-red-600">
                        -₹{payroll.deductions?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-green-600">
                        +₹{payroll.bonus?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        ₹{contributions.employeeContribution}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        ₹{contributions.employerContribution}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{attendanceDetails.payableDays}/{attendanceDetails.totalDays}</span>
                          {attendanceDetails.prorationFactor !== '1.0000' && (
                            <span className="text-xs text-gray-500">({(parseFloat(attendanceDetails.prorationFactor) * 100).toFixed(1)}%)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{netSalary}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payroll.status)}`}>
                          {payroll.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                        <div className="relative inline-block dropdown-menu-container flex items-center justify-end gap-2">
                          {getStatusIcon(payroll.status || 'DRAFT')}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const button = e.currentTarget
                              const rect = button.getBoundingClientRect()
                              const spaceBelow = window.innerHeight - rect.bottom
                              const spaceAbove = rect.top
                              const dropdownHeight = 280
                              
                              // Determine position: show below if enough space, otherwise above
                              const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                              
                              setDropdownPosition(prev => ({
                                ...prev,
                                [`payroll-${payroll.id}`]: {
                                  showAbove,
                                  top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                  right: window.innerWidth - rect.right
                                }
                              }))
                              setOpenPayrollDropdownId(openPayrollDropdownId === payroll.id ? null : payroll.id)
                            }}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {openPayrollDropdownId === payroll.id && dropdownPosition[`payroll-${payroll.id}`] && (
                              <div 
                                className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
                                style={{ 
                                  zIndex: 9999,
                                  top: `${dropdownPosition[`payroll-${payroll.id}`].top}px`,
                                  right: `${dropdownPosition[`payroll-${payroll.id}`].right}px`
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                              {/* View Payslip Button - Available for all users (ESS) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewESSPayslip(payroll.id)
                                  setOpenPayrollDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye size={16} className="text-indigo-600" />
                                View Payslip (ESS)
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadPayslip(payroll.id)
                                  setOpenPayrollDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Download size={16} className="text-blue-600" />
                                Download PDF
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewPayroll(payroll.id)
                                      setOpenPayrollDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Eye size={16} className="text-green-600" />
                                    View Details
                                  </button>
                                  {(payroll.status === 'DRAFT' || payroll.status === 'PENDING_APPROVAL') && (
                                <>
                                  <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenPayrollModal(payroll)
                                          setOpenPayrollDropdownId(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <Edit size={16} className="text-green-600" />
                                        Edit
                                  </button>
                                      {payroll.status === 'DRAFT' && (
                                        <>
                                          {isSuperAdmin ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleApproveFromDraft(payroll.id)
                                                setOpenPayrollDropdownId(null)
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                              <CheckCircle size={16} className="text-green-600" />
                                              Approve (Direct)
                                            </button>
                                          ) : canSubmitPayrollForApproval ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleSubmitForApproval(payroll.id)
                                                setOpenPayrollDropdownId(null)
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                              <Send size={16} className="text-yellow-600" />
                                              Submit for Approval
                                            </button>
                                          ) : null}
                                        </>
                                      )}
                                      {payroll.status === 'PENDING_APPROVAL' && canApprovePayroll && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleApprovePayroll(payroll.id)
                                            setOpenPayrollDropdownId(null)
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <CheckCircle size={16} className="text-green-600" />
                                          Approve
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeletePayroll(payroll.id)
                                          setOpenPayrollDropdownId(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      >
                                        <Trash2 size={16} />
                                        Delete
                                  </button>
                                </>
                              )}
                              {payroll.status === 'APPROVED' && (
                                <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleFinalizePayroll(payroll.id)
                                        setOpenPayrollDropdownId(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <FileText size={16} className="text-blue-600" />
                                      Finalize
                                </button>
                              )}
                              {payroll.status === 'FINALIZED' && (
                                <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkAsPaid(payroll.id)
                                        setOpenPayrollDropdownId(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <CheckCircle size={16} className="text-purple-600" />
                                      Mark as Paid
                                </button>
                              )}
                                </>
                              )}
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}


      {/* Create/Edit Payroll Modal - Redesigned */}
      {showPayrollModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-full border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-2xl">₹</span>
                {editingPayroll ? 'Edit Payroll' : 'Create Payroll'}
              </h3>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePayrollSubmit} className="space-y-5" autoComplete="off">
              {/* Employee Information Section */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                <select
                  value={payrollFormData.employeeId}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, employeeId: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                  disabled={!!editingPayroll}
                >
                  <option value="">Select Employee</option>
                      {employees
                        .filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN')
                        .map((emp) => {
                          const employeeName = emp.name || 'Unnamed Employee'
                    return (
                      <option key={emp.id} value={emp.id}>
                        {employeeName} {emp.employeeId ? `(${emp.employeeId})` : `(ID: ${emp.id})`}
                      </option>
                    )
                  })}
                </select>
              </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Month *</label>
                  <input
                    type="month"
                    value={payrollFormData.month}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, month: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                  <input
                    type="number"
                    value={payrollFormData.year}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                      min="2020"
                      max="2100"
                  />
                </div>
              </div>
              </div>

              {/* Salary Details Section */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Base Salary *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={payrollFormData.baseSalary}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, baseSalary: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                  required
                        min="0"
                />
              </div>
                  </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bonus</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">+₹</span>
                  <input
                    type="number"
                    step="0.01"
                        value={payrollFormData.bonus}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, bonus: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Allowances</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">+₹</span>
                  <input
                    type="number"
                    step="0.01"
                        value={payrollFormData.allowances}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, allowances: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                  />
                </div>
              </div>
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deductions</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-600 font-semibold">-₹</span>
                <input
                  type="number"
                  step="0.01"
                        value={payrollFormData.deductions}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, deductions: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                />
              </div>
              </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={payrollFormData.status}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={payrollFormData.notes}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, notes: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="3"
                      placeholder="Additional notes or remarks..."
                />
              </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {loading ? 'Saving...' : editingPayroll ? 'Update Payroll' : 'Create Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Process Modal */}
      {showIndividualProcessModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Users size={28} className="text-blue-600" />
                Process Individual Payroll
              </h3>
              <button
                onClick={() => {
                  setShowIndividualProcessModal(false)
                  setIndividualProcessData({
                    employeeId: '',
                    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                  })
                  setIndividualProcessError(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-5">
              {/* Error Message Display */}
              {individualProcessError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">{individualProcessError}</p>
                  </div>
                  <button
                    onClick={() => setIndividualProcessError(null)}
                    className="text-red-600 hover:text-red-800 shrink-0"
                    aria-label="Close error"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              {/* Date Selection - First */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={individualProcessData.startDate}
                  onChange={(e) => {
                    // Clear employee selection and error when dates change
                    setIndividualProcessData({ 
                      ...individualProcessData, 
                      startDate: e.target.value,
                      employeeId: '',
                      endDate: e.target.value > individualProcessData.endDate ? '' : individualProcessData.endDate
                    })
                    setIndividualProcessError(null)
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  value={individualProcessData.endDate}
                  onChange={(e) => {
                    // Clear employee selection and error when dates change
                    setIndividualProcessData({ 
                      ...individualProcessData, 
                      endDate: e.target.value,
                      employeeId: ''
                    })
                    setIndividualProcessError(null)
                  }}
                  min={individualProcessData.startDate || undefined}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Employee Selection - After Dates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Employee *</label>
                  <span className="text-xs text-gray-500 font-medium">
                    {individualProcessData.startDate && individualProcessData.endDate
                      ? `${employees.filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN').length} available`
                      : 'Select dates first'
                    }
                  </span>
                </div>
                <select
                  value={individualProcessData.employeeId}
                  onChange={(e) => {
                    setIndividualProcessData({ ...individualProcessData, employeeId: e.target.value })
                    setIndividualProcessError(null)
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                  disabled={!individualProcessData.startDate || !individualProcessData.endDate}
                >
                  <option value="">
                    {!individualProcessData.startDate || !individualProcessData.endDate
                      ? 'Please select dates first'
                      : 'Select Employee'
                    }
                  </option>
                  {employees
                    .filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN')
                    .map((emp) => {
                      const employeeName = emp.name || 'Unnamed Employee'
                      return (
                        <option key={emp.id} value={emp.id}>
                          {employeeName} {emp.employeeId ? `(${emp.employeeId})` : `(ID: ${emp.id})`}
                        </option>
                      )
                    })}
                </select>
                {(!individualProcessData.startDate || !individualProcessData.endDate) && (
                  <p className="text-xs text-gray-500 mt-1">Please select start and end dates to proceed</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowIndividualProcessModal(false)
                    setIndividualProcessData({
                      employeeId: '',
                      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                    })
                    setIndividualProcessError(null)
                  }}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIndividualProcess}
                  disabled={processingIndividual || !individualProcessData.employeeId}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingIndividual ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlayCircle size={18} />
                      Process Payroll
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Process Modal */}
      {showBulkProcessModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-green-600">Bulk Process Payroll</h3>
              <button
                onClick={() => setShowBulkProcessModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={bulkProcessData.startDate}
                  onChange={(e) => setBulkProcessData({ ...bulkProcessData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={bulkProcessData.endDate}
                  onChange={(e) => setBulkProcessData({ ...bulkProcessData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <p className="text-sm text-gray-600">
                This will process payroll for all employees based on their salary structure, attendance, and approved leaves for the selected period.
              </p>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBulkProcessModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkProcess}
                  disabled={processingBulk}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {processingBulk ? 'Processing...' : 'Process Payroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Gratuity Management View */}
      {isAdmin && activeView === 'gratuity' && (
        <>
          {/* Filters and Actions for Gratuity */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search gratuities..."
                    value={gratuitySearchTerm}
                    onChange={(e) => setGratuitySearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {gratuitySearchTerm && (
                    <button
                      onClick={() => setGratuitySearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <select
                    value={gratuityStatusFilter}
                    onChange={(e) => setGratuityStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="All">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleOpenGratuityModal()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold whitespace-nowrap"
              >
                <Plus size={20} />
                Create Gratuity
              </button>
            </div>
          </div>

          {/* Gratuity Table */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200">
            <div className="p-4 border-b-2 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                <Gift size={24} className="text-blue-600" />
                Gratuity Records ({filteredGratuities.length})
              </h3>
            </div>
            {loading && filteredGratuities.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading gratuities...</p>
              </div>
            ) : filteredGratuities.length === 0 ? (
              <div className="p-8 text-center">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Gratuity Records Found</h3>
                <p className="text-gray-500 mb-4">
                  {gratuities.length === 0 
                    ? 'Create your first gratuity record to get started'
                    : 'No gratuities match your search criteria'}
                </p>
                {gratuities.length === 0 && (
                  <button
                    onClick={() => handleOpenGratuityModal()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Gratuity
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Exit Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Years of Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Drawn Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Calculated Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Final Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredGratuities.map(gratuity => {
                      const employee = employees.find(emp => emp.id === gratuity.employeeId || emp.id === parseInt(gratuity.employeeId))
                      const employeeName = employee ? (employee.name || `Employee ${gratuity.employeeId}`) : 'N/A'
                      
                      return (
                        <tr key={gratuity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{employeeName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {gratuity.exitDate ? format(parseISO(gratuity.exitDate), 'dd MMM yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{gratuity.yearsOfService ? parseFloat(gratuity.yearsOfService.toFixed(1)) : 0} years</td>
                          <td className="px-4 py-3 text-sm text-gray-600">₹{gratuity.lastDrawnSalary?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">₹{gratuity.calculatedAmount?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">₹{gratuity.finalAmount?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gratuity.status)}`}>
                              {gratuity.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative inline-block dropdown-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const button = e.currentTarget
                                  const rect = button.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const spaceAbove = rect.top
                                  const dropdownHeight = 200
                                  
                                  // Determine position: show below if enough space, otherwise above
                                  const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                  
                                  setDropdownPosition(prev => ({
                                    ...prev,
                                    [`gratuity-${gratuity.id}`]: {
                                      showAbove,
                                      top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                      right: window.innerWidth - rect.right
                                    }
                                  }))
                                  setOpenGratuityDropdownId(openGratuityDropdownId === gratuity.id ? null : gratuity.id)
                                }}
                                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {openGratuityDropdownId === gratuity.id && dropdownPosition[`gratuity-${gratuity.id}`] && (
                                <div 
                                  className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                  style={{ 
                                    zIndex: 9999,
                                    top: `${dropdownPosition[`gratuity-${gratuity.id}`].top}px`,
                                    right: `${dropdownPosition[`gratuity-${gratuity.id}`].right}px`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                              {gratuity.status === 'PENDING' && (
                                <>
                                  <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleApproveGratuity(gratuity.id)
                                          setOpenGratuityDropdownId(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                        <CheckCircle size={16} className="text-green-600" />
                                        Approve
                                  </button>
                                  <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRejectGratuity(gratuity.id)
                                          setOpenGratuityDropdownId(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                        <XCircle size={16} className="text-red-600" />
                                        Reject
                                  </button>
                                </>
                              )}
                              {gratuity.status === 'APPROVED' && (
                                <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkGratuityAsPaid(gratuity.id)
                                        setOpenGratuityDropdownId(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                      <CheckCircle size={16} className="text-purple-600" />
                                      Mark as Paid
                                </button>
                              )}
                              <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenGratuityModal(gratuity)
                                      setOpenGratuityDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                    <Edit size={16} className="text-blue-600" />
                                    Edit
                              </button>
                                <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteGratuity(gratuity.id)
                                      setOpenGratuityDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Annual CTC Calculation View */}
      {isAdmin && activeView === 'annualCTC' && (
        <>
        

          {/* Filters, Search, and Action Buttons */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by employee name, ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={selectedAnnualCtcYear}
                    onChange={(e) => setSelectedAnnualCtcYear(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Select Year"
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowIndividualAnnualCtcModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                  >
                    <Users size={20} />
                    Calculate Individual
                  </button>
                  <button
                    onClick={() => setShowBulkAnnualCtcModal(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                  >
                    <PlayCircle size={20} />
                    Calculate Bulk
                  </button>
                  {filteredPayrolls.length > 0 && (
                    <button
                      onClick={handleExportAnnualCTCCSV}
                      className="bg-gray-600 text-white px-6 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                    >
                      <FileDown size={20} />
                      Export CSV
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Annual CTC Table */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                <TrendingUp size={24} />
                Annual CTC Records ({filteredPayrolls.length})
              </h3>
            </div>
            {loading && filteredPayrolls.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading payroll records...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payroll Records Found</h3>
                <p className="text-gray-500">
                  {payrolls.length === 0 
                    ? 'No payroll records available for Annual CTC calculation'
                    : 'No records match your search criteria'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase">Employee</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase">Month/Year</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase">Monthly Gross</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase">Employer Contribution</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase">Monthly CTC</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase">Annual CTC</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-700 uppercase pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayrolls.map((payroll) => {
                      const employee = employees.find(emp => emp.id === payroll.employeeId || emp.id === parseInt(payroll.employeeId))
                      const employeeName = employee ? (employee.name || 'N/A') : 'N/A'
                      
                      const baseSalary = parseFloat(payroll.baseSalary) || 0
                      const allowances = parseFloat(payroll.allowances) || 0
                      const monthlyGross = baseSalary + allowances
                      
                      // Get salary structure for contributions
                      const salaryStructure = salaryStructures.find(s => 
                        (s.employeeId === payroll.employeeId || s.employeeId === parseInt(payroll.employeeId)) && s.active
                      )
                      const contributions = calculateContributions(payroll, salaryStructure)
                      const monthlyEmployerContribution = parseFloat(contributions.employerContribution) || 0
                      const monthlyCTC = monthlyGross + monthlyEmployerContribution
                      const annualCTC = monthlyCTC * 12
                      
                      return (
                        <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employeeName}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                            {payroll.month && payroll.year 
                              ? `${payroll.month}/${payroll.year}`
                              : payroll.month || 'N/A'}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{monthlyGross.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            ₹{monthlyEmployerContribution.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            ₹{monthlyCTC.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                            ₹{annualCTC.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                            <div className="relative inline-block dropdown-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const button = e.currentTarget
                                  const rect = button.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const spaceAbove = rect.top
                                  const dropdownHeight = 180
                                  
                                  // Determine position: show below if enough space, otherwise above
                                  const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                  
                                  setDropdownPosition(prev => ({
                                    ...prev,
                                    [`annualCtc-${payroll.id}`]: {
                                      showAbove,
                                      top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                      right: window.innerWidth - rect.right
                                    }
                                  }))
                                  setOpenAnnualCtcDropdownId(openAnnualCtcDropdownId === payroll.id ? null : payroll.id)
                                }}
                                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {openAnnualCtcDropdownId === payroll.id && dropdownPosition[`annualCtc-${payroll.id}`] && (
                                <div 
                                  className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                  style={{ 
                                    zIndex: 9999,
                                    top: `${dropdownPosition[`annualCtc-${payroll.id}`].top}px`,
                                    right: `${dropdownPosition[`annualCtc-${payroll.id}`].right}px`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadAnnualCTC(payroll)
                                      setOpenAnnualCtcDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Download size={16} className="text-blue-600" />
                                    Download PDF
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewESSPayslip(payroll.id, true)
                                      setOpenAnnualCtcDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Eye size={16} className="text-green-600" />
                                    View Payslip
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeletePayroll(payroll.id)
                                      setOpenAnnualCtcDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Gratuity Modal */}
      {showGratuityModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Gift size={24} />
                {editingGratuity ? 'Edit Gratuity' : 'Create Gratuity'}
              </h3>
              <button
                onClick={() => {
                  setShowGratuityModal(false)
                  setEditingGratuity(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleGratuitySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={gratuityFormData.employeeId}
                  onChange={(e) => setGratuityFormData({ ...gratuityFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees
                    .filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN')
                    .map(emp => {
                      const employeeName = emp.name || `Employee ${emp.id}`
                      return (
                        <option key={emp.id} value={emp.id}>
                          {employeeName} {emp.employeeId ? `(${emp.employeeId})` : `(ID: ${emp.id})`}
                        </option>
                      )
                    })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date *</label>
                <input
                  type="date"
                  value={gratuityFormData.exitDate}
                  onChange={(e) => setGratuityFormData({ ...gratuityFormData, exitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCalculateGratuity}
                  disabled={calculatingGratuity || !gratuityFormData.employeeId || !gratuityFormData.exitDate}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {calculatingGratuity ? 'Calculating...' : 'Calculate Gratuity'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Drawn Salary (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gratuityFormData.lastDrawnSalary}
                  onChange={(e) => setGratuityFormData({ ...gratuityFormData, lastDrawnSalary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Service *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={gratuityFormData.yearsOfService 
                    ? (() => {
                        const num = typeof gratuityFormData.yearsOfService === 'number' 
                          ? gratuityFormData.yearsOfService 
                          : parseFloat(gratuityFormData.yearsOfService) || 0
                        // Round to 1 decimal place and remove trailing zeros
                        return parseFloat(num.toFixed(1))
                      })()
                    : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    // Round to 1 decimal place
                    const rounded = Math.round(val * 10) / 10
                    setGratuityFormData({ ...gratuityFormData, yearsOfService: rounded })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter years of service manually (e.g., 5.5 for 5 years and 6 months)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={gratuityFormData.notes}
                  onChange={(e) => setGratuityFormData({ ...gratuityFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowGratuityModal(false)
                    setEditingGratuity(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? 'Saving...' : editingGratuity ? 'Update Gratuity' : 'Create Gratuity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Annual CTC Calculation Modal */}
      {showIndividualAnnualCtcModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Users size={28} className="text-blue-600" />
                Calculate Individual Annual CTC
              </h3>
              <button
                onClick={() => {
                  setShowIndividualAnnualCtcModal(false)
                  setIndividualAnnualCtcData({
                    employeeId: '',
                    year: ''
                  })
                  setIndividualAnnualCtcError(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-5">
              {/* Error Message Display */}
              {individualAnnualCtcError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">{individualAnnualCtcError}</p>
                  </div>
                  <button
                    onClick={() => setIndividualAnnualCtcError(null)}
                    className="text-red-600 hover:text-red-800 shrink-0"
                    aria-label="Close error"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              {/* Year Selection - First */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                <input
                  type="number"
                  value={individualAnnualCtcData.year}
                  onChange={(e) => {
                    // Clear employee selection and error when year changes
                    setIndividualAnnualCtcData({ 
                      ...individualAnnualCtcData, 
                      year: e.target.value,
                      employeeId: ''
                    })
                    setIndividualAnnualCtcError(null)
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Year (e.g., 2025)"
                  min="2000"
                  max="2100"
                  required
                />
              </div>
              
              {/* Employee Selection - After Year */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Employee *</label>
                  <span className="text-xs text-gray-500 font-medium">
                    {individualAnnualCtcData.year
                      ? `${employees.filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN').length} available`
                      : 'Select year first'
                    }
                  </span>
                </div>
                <select
                  value={individualAnnualCtcData.employeeId}
                  onChange={(e) => {
                    setIndividualAnnualCtcData({ ...individualAnnualCtcData, employeeId: e.target.value })
                    setIndividualAnnualCtcError(null)
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                  disabled={!individualAnnualCtcData.year}
                >
                  <option value="">
                    {!individualAnnualCtcData.year
                      ? 'Please select year first'
                      : 'Select Employee'
                    }
                  </option>
                  {employees
                    .filter(emp => (emp.role || '').toUpperCase() !== 'SUPER_ADMIN')
                    .map((emp) => {
                      const employeeName = emp.name || 'Unnamed Employee'
                      return (
                        <option key={emp.id} value={emp.id}>
                          {employeeName} {emp.employeeId ? `(${emp.employeeId})` : `(ID: ${emp.id})`}
                        </option>
                      )
                    })}
                </select>
                {!individualAnnualCtcData.year && (
                  <p className="text-xs text-gray-500 mt-1">Please select a year to proceed</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowIndividualAnnualCtcModal(false)
                    setIndividualAnnualCtcData({
                      employeeId: '',
                      year: ''
                    })
                    setIndividualAnnualCtcError(null)
                  }}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIndividualAnnualCTC}
                  disabled={processingIndividualAnnualCtc || !individualAnnualCtcData.employeeId || !individualAnnualCtcData.year}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingIndividualAnnualCtc ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={18} />
                      Calculate Annual CTC
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Annual CTC Calculation Modal */}
      {showBulkAnnualCtcModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-green-600 flex items-center gap-3">
                <PlayCircle size={28} className="text-green-600" />
                Calculate Bulk Annual CTC
              </h3>
              <button
                onClick={() => {
                  setShowBulkAnnualCtcModal(false)
                  setBulkAnnualCtcData({ year: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  value={bulkAnnualCtcData.year}
                  onChange={(e) => setBulkAnnualCtcData({ ...bulkAnnualCtcData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Year (e.g., 2025)"
                  min="2000"
                  max="2100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Calculate Annual CTC for all employees for this year</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBulkAnnualCtcModal(false)
                    setBulkAnnualCtcData({ year: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAnnualCTC}
                  disabled={processingBulkAnnualCtc || !bulkAnnualCtcData.year}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {processingBulkAnnualCtc ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={18} />
                      Calculate Annual CTC
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ESS Payslip View Modal - Comprehensive Employee Self-Service Payslip */}
      {showESSPayslipModal && viewingESSPayslip && payslipDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-6xl border-2 border-gray-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b-2 border-gray-200 pb-4">
              <div>
                <h3 className="text-3xl font-bold text-blue-600 flex items-center gap-3">
                  <span className="text-blue-600 font-bold text-3xl">₹</span>
                  PAYSLIP
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {payslipDetails.employee?.name || 'Employee'} - {viewingESSPayslip.month || 'N/A'} {viewingESSPayslip.year || ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPayslip(viewingESSPayslip.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                  title={isPayslipFromAnnualCTC ? "Download Annual CTC PDF" : "Download PDF"}
                >
                  <Download size={18} />
                  {isPayslipFromAnnualCTC ? "Download Annual CTC" : "Download PDF"}
                </button>
                <button
                  onClick={() => {
                    setShowESSPayslipModal(false)
                    setViewingESSPayslip(null)
                    setPayslipDetails(null)
                    setIsPayslipFromAnnualCTC(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Employee Information Header */}
              <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Employee:</span>
                    <span className="ml-2 text-gray-900">{payslipDetails.employee?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Employee ID:</span>
                    <span className="ml-2 text-gray-900">{payslipDetails.employee?.employeeId || payslipDetails.employee?.id || 'N/A'}</span>
                  </div>
                  {!isPayslipFromAnnualCTC && (
                    <>
                      <div>
                        <span className="font-semibold text-gray-700">Month:</span>
                        <span className="ml-2 text-gray-900">
                          {viewingESSPayslip.month && viewingESSPayslip.year 
                            ? (() => {
                                const monthStr = viewingESSPayslip.month.includes('-') 
                                  ? viewingESSPayslip.month.split('-')[1] 
                                  : viewingESSPayslip.month
                                try {
                                  return format(new Date(viewingESSPayslip.year, parseInt(monthStr) - 1, 1), 'MMMM yyyy')
                                } catch {
                                  return `${viewingESSPayslip.month} ${viewingESSPayslip.year}`
                                }
                              })()
                            : viewingESSPayslip.month || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Working Days:</span>
                        <span className="ml-2 text-gray-900">{payslipDetails.attendanceDays.workingDays} days</span>
                      </div>
                    </>
                  )}
                  {isPayslipFromAnnualCTC && (
                    <div>
                      <span className="font-semibold text-gray-700">Year:</span>
                      <span className="ml-2 text-gray-900">{viewingESSPayslip.year || 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information - Enhanced for ESS Transparency */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-sm p-5 border-2 border-indigo-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={24} className="text-indigo-600" />
                  Statutory & Banking Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">UAN Number</label>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      {payslipDetails.employee?.uan || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Universal Account Number</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">PF Account Number</label>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      {payslipDetails.employee?.pfAccountNumber || payslipDetails.salaryStructure?.pfAccountNumber || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Provident Fund Account</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Bank Account Number</label>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      {payslipDetails.employee?.bankAccountNumber 
                        ? maskBankAccount(payslipDetails.employee.bankAccountNumber)
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Masked for security</p>
                  </div>
                  {payslipDetails.employee?.bankName && (
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Bank Name</label>
                      <p className="text-base font-semibold text-gray-900">
                        {payslipDetails.employee.bankName}
                      </p>
                    </div>
                  )}
                  {payslipDetails.employee?.ifscCode && (
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">IFSC Code</label>
                      <p className="text-base font-bold text-gray-900 font-mono">
                        {payslipDetails.employee.ifscCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Calculate all values and render table-based payslip */}
              {(() => {
                const basicSalary = parseFloat(viewingESSPayslip.basicSalary || viewingESSPayslip.baseSalary || payslipDetails.salaryStructure?.basicSalary || 0) || 0
        const hra = parseFloat(viewingESSPayslip.hra || payslipDetails.salaryStructure?.hra || 0) || 0
        const bonus = parseFloat(viewingESSPayslip.bonus || 0) || 0
        const specialAllowance = parseFloat(payslipDetails.salaryStructure?.specialAllowance || 0) || 0
        const transportAllowance = parseFloat(payslipDetails.salaryStructure?.transportAllowance || 0) || 0
        const medicalAllowance = parseFloat(payslipDetails.salaryStructure?.medicalAllowance || 0) || 0
        const otherAllowances = parseFloat(payslipDetails.salaryStructure?.otherAllowances || 0) || 0
        
        const grossSalary = basicSalary + hra + specialAllowance + transportAllowance + medicalAllowance + otherAllowances + bonus
        
        const pfEmployee = parseFloat(payslipDetails.salaryStructure?.pf || 0) || 0
        const esiEmployee = parseFloat(payslipDetails.salaryStructure?.esi || 0) || 0
        const professionalTax = parseFloat(payslipDetails.salaryStructure?.professionalTax || 0) || 0
        const tds = parseFloat(payslipDetails.salaryStructure?.tds || 0) || 0
        const otherDeductions = parseFloat(payslipDetails.salaryStructure?.otherDeductions || 0) || 0
        const totalEmployeeDeductions = pfEmployee + esiEmployee + professionalTax + tds + otherDeductions
        
        const pfEmployer = pfEmployee // Employer PF is equal to employee PF
        // ESI Employer calculation:
        // Standard rates in India: Employee ESI = 0.75% of gross, Employer ESI = 3.25% of gross
        // Calculate directly from gross salary for accuracy: 3.25% of gross
        const esiEmployer = esiEmployee > 0 ? (grossSalary * 0.0325) : 0
        const totalEmployerContribution = pfEmployer + esiEmployer
        
        const ctc = grossSalary + totalEmployerContribution
        const takeHome = grossSalary - totalEmployeeDeductions
        
        // Calculate percentages for remarks
        const basicPercentage = ctc > 0 ? ((basicSalary / ctc) * 100).toFixed(2) : 0
        const hraPercentage = basicSalary > 0 ? ((hra / basicSalary) * 100).toFixed(2) : 0
        const specialAllowancePercentage = ctc > 0 ? ((specialAllowance / ctc) * 100).toFixed(2) : 0
        const pfBase = Math.min(basicSalary, 15000)
        
        // Calculate annual values
        const annualCTC = ctc * 12
        const annualBasic = basicSalary * 12
        const annualHRA = hra * 12
        const annualMedical = medicalAllowance * 12
        const annualTransport = transportAllowance * 12
        const annualSpecial = specialAllowance * 12
        const annualOther = otherAllowances * 12
        const annualBonus = bonus
        const annualGross = grossSalary * 12
        const annualPFEmployer = pfEmployer * 12
        const annualESIEmployer = esiEmployer * 12
        const monthlyGratuity = basicSalary * (15.0 / (26.0 * 12.0))
        const annualGratuity = monthlyGratuity * 12
        const monthlyLTA = basicSalary / 12.0
        const annualLTA = monthlyLTA * 12
        const annualEmployerContribution = (pfEmployer + esiEmployer + monthlyGratuity + monthlyLTA) * 12
        
        return (
          <>
                    {/* Annual CTC Section when from Annual CTC view, Monthly CTC otherwise */}
                    {isPayslipFromAnnualCTC ? (
                      <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                        <div className="bg-blue-100 px-4 py-3 border-b-2 border-blue-300">
                          <h4 className="text-lg font-bold text-gray-800">Annual CTC (Cost to Company) ₹{annualCTC.toFixed(2)}</h4>
                        </div>
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Particulars</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">Per Month (₹)</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">Per Annum (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Gross Salary (A)</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"></td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"></td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900 pl-6">Basic Salary</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{basicSalary.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualBasic.toFixed(2)}</td>
                            </tr>
                            {hra > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">House Rental Allowance (HRA)</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{hra.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualHRA.toFixed(2)}</td>
                              </tr>
                            )}
                            {medicalAllowance > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">Medical Allowance</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{medicalAllowance.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualMedical.toFixed(2)}</td>
                              </tr>
                            )}
                            {transportAllowance > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">Travel Allowance</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{transportAllowance.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualTransport.toFixed(2)}</td>
                              </tr>
                            )}
                            {specialAllowance > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">Special Allowance</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{specialAllowance.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualSpecial.toFixed(2)}</td>
                              </tr>
                            )}
                            {otherAllowances > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">Other Allowances</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{otherAllowances.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualOther.toFixed(2)}</td>
                              </tr>
                            )}
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Gross Salary (A) Total</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{grossSalary.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualGross.toFixed(2)}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Employer Contribution (B)</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"></td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"></td>
                            </tr>
                            {pfEmployer > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">PF (Employer)</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{pfEmployer.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualPFEmployer.toFixed(2)}</td>
                              </tr>
                            )}
                            {esiEmployer > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">ESI (Employer)</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{esiEmployer.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualESIEmployer.toFixed(2)}</td>
                              </tr>
                            )}
                            {monthlyGratuity > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">Gratuity</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{monthlyGratuity.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualGratuity.toFixed(2)}</td>
                              </tr>
                            )}
                            {monthlyLTA > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">LTA (Leave Travel Allowance)</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{monthlyLTA.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualLTA.toFixed(2)}</td>
                              </tr>
                            )}
                            {bonus > 0 && (
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-6">Bonus</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{(bonus / 12).toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualBonus.toFixed(2)}</td>
                              </tr>
                            )}
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total Employer Contribution (B)</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{(annualEmployerContribution / 12).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{annualEmployerContribution.toFixed(2)}</td>
                            </tr>
                            <tr className="bg-blue-50 border-t-2 border-blue-300">
                              <td className="px-4 py-3 text-sm font-bold text-blue-900">CTC (A+B)</td>
                              <td className="px-4 py-3 text-sm font-bold text-blue-900 text-right">₹{ctc.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-bold text-blue-900 text-right">₹{annualCTC.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <>
                        {/* Prepare the Monthly CTC Section */}
                        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                          <div className="bg-yellow-100 px-4 py-3 border-b-2 border-yellow-300">
                            <h4 className="text-lg font-bold text-gray-800">Prepare the Monthly CTC ₹{ctc.toFixed(2)}</h4>
                          </div>
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Particulars (Earnings)</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-3 text-sm text-gray-900">Basic Salary</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{basicSalary.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{basicPercentage}% of CTC</td>
                              </tr>
                              {hra > 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-900">House Rental Allowance</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{hra.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{hraPercentage}% of Basic</td>
                                </tr>
                              )}
                              {medicalAllowance > 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-900">Medical Allowance</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{medicalAllowance.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">-</td>
                                </tr>
                              )}
                              {transportAllowance > 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-900">Travel Allowance</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{transportAllowance.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">-</td>
                                </tr>
                              )}
                              {specialAllowance > 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-900">Special Allowance</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{specialAllowance.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{specialAllowancePercentage}% of CTC</td>
                                </tr>
                              )}
                              {otherAllowances > 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-900">Other Allowances</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{otherAllowances.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">-</td>
                                </tr>
                              )}
                              {bonus > 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-900">Bonus</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{bonus.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">-</td>
                                </tr>
                              )}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-3 text-sm text-gray-900">Gross Salary</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{grossSalary.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                      </>
                    )}

                    {/* Employer Contribution Section - Only for Monthly View */}
                    {!isPayslipFromAnnualCTC && (
                      <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                      <div className="bg-blue-100 px-4 py-3 border-b-2 border-blue-300">
                        <h4 className="text-lg font-bold text-gray-800">Employer Contribution</h4>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Particulars</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pfEmployer > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">PF</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{pfEmployer.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{pfBase > 0 ? `${pfBase.toFixed(0)}*12%` : '-'}</td>
                            </tr>
                          )}
                          {esiEmployer > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">ESI</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{esiEmployer.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">-</td>
                            </tr>
                          )}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-3 text-sm text-gray-900">Total Employer Contribution</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{totalEmployerContribution.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    )}

                    {/* CTC = Gross salary + Employer contribution - Only for Monthly View */}
                    {!isPayslipFromAnnualCTC && (
                      <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-1">CTC</div>
                          <div className="text-lg font-bold text-gray-900">₹{ctc.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-1">Gross salary</div>
                          <div className="text-lg font-bold text-gray-900">₹{grossSalary.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-1">Employer Contribution</div>
                          <div className="text-lg font-bold text-gray-900">₹{totalEmployerContribution.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Employee Contribution (Take home) Section - Only for Monthly View */}
                    {!isPayslipFromAnnualCTC && (
                      <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                      <div className="bg-green-100 px-4 py-3 border-b-2 border-green-300">
                        <h4 className="text-lg font-bold text-gray-800">Particulars (Take home) (Employee Contribution)</h4>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Particulars</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pfEmployee > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">Provident fund</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{pfEmployee.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{pfBase > 0 ? `${pfBase.toFixed(0)}*12%` : '-'}</td>
                            </tr>
                          )}
                          {esiEmployee > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">Esi</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{esiEmployee.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">-</td>
                            </tr>
                          )}
                          {professionalTax > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">Professional Tax</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{professionalTax.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">-</td>
                            </tr>
                          )}
                          {tds > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">TDS</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{tds.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">-</td>
                            </tr>
                          )}
                          {otherDeductions > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-900">Other Deductions</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{otherDeductions.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">-</td>
                            </tr>
                          )}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-3 text-sm text-gray-900">Total Employee Contribution</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{totalEmployeeDeductions.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    )}

                    {/* Take Home Section - Only for Monthly View */}
                    {!isPayslipFromAnnualCTC && (
                      <div className="bg-white rounded-lg border-2 border-green-300 p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-1">Gross salary</div>
                          <div className="text-lg font-bold text-gray-900">₹{grossSalary.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-1">EE contribution</div>
                          <div className="text-lg font-bold text-red-600">₹{totalEmployeeDeductions.toFixed(2)}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border-2 border-green-400">
                          <div className="text-sm font-semibold text-gray-600 mb-1">Take Home</div>
                          <div className="text-2xl font-bold text-green-600">₹{takeHome.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    )}
                  </>
                )
              })()}

              {/* Footer Note - Enhanced for ESS Transparency */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                  <div className="text-xs text-gray-700">
                    <p className="font-semibold mb-1">Employee Self-Service Portal - Payroll Transparency</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>This is a system-generated payslip. For any discrepancies, please contact HR.</li>
                      <li>Downloaded PDF payslips are password-protected for your security.</li>
                      <li>Password: Your Employee ID (e.g., {payslipDetails.employee?.employeeId || payslipDetails.employee?.id || 'EMP001'})</li>
                      <li>Keep this document confidential and secure.</li>
                      <li>All historical payslips are available in your payroll archive.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTC Template Create/Edit Modal */}
      {showCtcTemplateModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Receipt size={28} className="text-blue-600" />
                {editingCtcTemplate ? 'Edit CTC Template' : 'Create CTC Template'}
              </h3>
              <button
                onClick={() => setShowCtcTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCtcTemplateSubmit} className="space-y-5">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name *</label>
                    <input
                      type="text"
                      value={ctcTemplateFormData.templateName}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, templateName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name *</label>
                    <input
                      type="text"
                      value={ctcTemplateFormData.clientName}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, clientName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      list="ctc-clients-list"
                    />
                    <datalist id="ctc-clients-list">
                      {ctcTemplateClients.map(client => (
                        <option key={client} value={client} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={ctcTemplateFormData.description}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, description: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Components */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Salary Components (Percentages of CTC)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Basic Salary % *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.basicSalaryPercentage === 0 || ctcTemplateFormData.basicSalaryPercentage === '0' ? '' : ctcTemplateFormData.basicSalaryPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, basicSalaryPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">HRA % (of Basic) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.hraPercentage === 0 || ctcTemplateFormData.hraPercentage === '0' ? '' : ctcTemplateFormData.hraPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, hraPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Deductions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PF % (of Basic) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.pfPercentage === 0 || ctcTemplateFormData.pfPercentage === '0' ? '' : ctcTemplateFormData.pfPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, pfPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ESI % (of Gross)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.esiPercentage === 0 || ctcTemplateFormData.esiPercentage === '0' ? '' : ctcTemplateFormData.esiPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ESI Applicable Threshold (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.esiApplicableThreshold === 0 || ctcTemplateFormData.esiApplicableThreshold === '0' ? '' : ctcTemplateFormData.esiApplicableThreshold}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiApplicableThreshold: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax (Fixed ₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.professionalTaxAmount || ''}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, professionalTaxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">TDS % (of Gross)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.tdsPercentage || ''}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, tdsPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions % (of Gross)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.otherDeductionsPercentage || ''}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, otherDeductionsPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Allowances */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Allowances</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance (% of CTC)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.transportAllowancePercentage || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, transportAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance (Fixed ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.transportAllowanceFixed || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, transportAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Info size={14} />
                    <span>Note: Fixed amount takes precedence over percentage. Leave both empty if not applicable.</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance (% of CTC)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.medicalAllowancePercentage || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, medicalAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance (Fixed ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.medicalAllowanceFixed || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, medicalAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance (% of CTC)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.specialAllowancePercentage || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, specialAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance (Fixed ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ctcTemplateFormData.specialAllowanceFixed || ''}
                        onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, specialAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances (% of CTC)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.otherAllowancesPercentage || ''}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, otherAllowancesPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={ctcTemplateFormData.active}
                    onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Active (Template will be available for use)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCtcTemplateModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {editingCtcTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payroll
