import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, Download, Filter, FileText, Send, Users, TrendingUp, Clock, Search, X, FileDown, PlayCircle, Eye, Loader2, Settings, Info, AlertCircle, Building2, MoreVertical, Receipt, Gift } from 'lucide-react'
import api from '../services/api'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([])
  const [salaryStructures, setSalaryStructures] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  // For employees, default to empty (show all months), for admins default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const userType = localStorage.getItem('userType')
    return userType === 'employee' ? '' : format(new Date(), 'yyyy-MM')
  })
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState('salaryDetails') // 'salaryDetails', 'processedPayrolls', 'ctcTemplates', or 'gratuity'
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showBulkProcessModal, setShowBulkProcessModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingPayroll, setViewingPayroll] = useState(null)
  const [showViewSalaryModal, setShowViewSalaryModal] = useState(false)
  const [viewingSalary, setViewingSalary] = useState(null)
  const [showESSPayslipModal, setShowESSPayslipModal] = useState(false)
  const [viewingESSPayslip, setViewingESSPayslip] = useState(null)
  const [payslipDetails, setPayslipDetails] = useState(null)
  const [editingPayroll, setEditingPayroll] = useState(null)
  const [editingSalary, setEditingSalary] = useState(null)
  const [openSalaryDropdownId, setOpenSalaryDropdownId] = useState(null)
  const [processingBulk, setProcessingBulk] = useState(false)
  const [bulkProcessData, setBulkProcessData] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
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
    basicSalary: 0,
    hra: 0,
    transportAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    pf: 0,
    esi: 0,
    tds: 0,
    professionalTax: 0,
    otherDeductions: 0,
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
    basicSalaryPercentage: 40.0,
    hraPercentage: 50.0,
    transportAllowancePercentage: null,
    transportAllowanceFixed: null,
    medicalAllowancePercentage: null,
    medicalAllowanceFixed: null,
    specialAllowancePercentage: null,
    specialAllowanceFixed: null,
    otherAllowancesPercentage: null,
    pfPercentage: 12.0,
    esiPercentage: 0.75,
    esiApplicableThreshold: 21000.0,
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
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'MANAGER' || userRole === 'FINANCE'
  const isEmployee = userType === 'employee'

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

  const loadData = async () => {
    try {
      setLoading(true)
      if (isEmployee && userId) {
        const [payrollsData, employeesData] = await Promise.all([
          api.getEmployeePayrolls(parseInt(userId)),
          api.getEmployees()
        ])
        const payrollsArray = Array.isArray(payrollsData) ? payrollsData : []
        setPayrolls(payrollsArray)
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
        
        // Debug: Log to help diagnose
        console.log('Employee payroll data loaded:', {
          userId,
          payrollsCount: payrollsArray.length,
          payrolls: payrollsArray,
          selectedMonth,
          statusFilter
        })
        } else if (isAdmin) {
          // Load all templates if viewing CTC Templates tab, otherwise load only active ones
          const shouldLoadAllTemplates = activeView === 'ctcTemplates'
          const shouldLoadGratuities = activeView === 'gratuity'
          const [payrollsData, employeesData, salaryStructuresData, ctcTemplatesData, clientsData, gratuitiesData] = await Promise.all([
            api.getPayrolls(),
            api.getEmployees(),
            api.getSalaryStructures(),
            api.getCTCTemplates(null, !shouldLoadAllTemplates), // Get all templates if viewing CTC Templates tab, otherwise active only
            api.getClients(),
            shouldLoadGratuities ? api.getGratuities() : Promise.resolve([])
          ])
          setPayrolls(Array.isArray(payrollsData) ? payrollsData : [])
          setEmployees(Array.isArray(employeesData) ? employeesData : [])
          setSalaryStructures(Array.isArray(salaryStructuresData) ? salaryStructuresData : [])
          const templates = Array.isArray(ctcTemplatesData) ? ctcTemplatesData : []
          setCtcTemplates(templates)
          setCtcTemplateClients(Array.isArray(clientsData) ? clientsData : [])
          // Always set gratuities (empty array if not loading)
          setGratuities(shouldLoadGratuities ? (Array.isArray(gratuitiesData) ? gratuitiesData : []) : [])
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
        }
    } catch (error) {
      console.error('Error loading data:', error)
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
          alert('Payroll updated successfully')
        } else {
          alert('Error updating payroll: ' + (result.message || 'Failed to update'))
        }
      } else {
        const result = await api.createPayroll(payrollData)
        if (result.success) {
          alert('Payroll created successfully')
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
  const calculateAttendanceDays = (payroll) => {
    // These should ideally come from backend, but we'll calculate from payroll period
    const month = payroll.month || format(new Date(), 'yyyy-MM')
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0)
    
    // Total working days in month (excluding weekends - simplified)
    const totalDays = endDate.getDate()
    const workingDays = totalDays // Simplified - can be enhanced to exclude weekends/holidays
    
    // Present days and leave days should come from payroll data or be calculated
    // For now, we'll use placeholder values that should be populated from backend
    const presentDays = payroll.presentDays || Math.floor(workingDays * 0.9) // Placeholder
    const leaveDays = payroll.leaveDays || 0
    const lopDays = workingDays - presentDays - leaveDays
    
    return { workingDays, presentDays, leaveDays, lopDays: Math.max(0, lopDays) }
  }

  const handleViewESSPayslip = async (payrollId) => {
    try {
      setLoading(true)
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
        alert('Payroll deleted successfully')
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
    if (window.confirm('Submit this payroll for approval?')) {
      try {
        const result = await api.submitPayrollForApproval(payrollId)
        if (result.success) {
          alert('Payroll submitted for approval successfully')
          await loadData()
        } else {
          alert('Error submitting payroll: ' + (result.message || 'Failed to submit'))
        }
      } catch (error) {
        alert('Error submitting payroll: ' + error.message)
      }
    }
  }

  const handleApprovePayroll = async (payrollId) => {
    if (window.confirm('Approve this payroll?')) {
      try {
        const result = await api.approvePayroll(payrollId)
        if (result.success) {
          alert('Payroll approved successfully')
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
          alert('Payroll finalized successfully')
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
          alert('Payroll marked as paid successfully')
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
        
        alert(`Payroll processed successfully for ${result.count || 0} employees. Viewing Processed Payrolls for ${processedMonth}.`)
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

  const handleFinalizeAll = async () => {
    const month = selectedMonth || format(new Date(), 'yyyy-MM')
    const year = parseInt(month.split('-')[0])
    const monthOnly = month.split('-')[1]
    
    if (!window.confirm(`Finalize all approved payrolls for ${month}?`)) return
    
    try {
      setLoading(true)
      const result = await api.finalizeAllPayrolls(month, year)
      if (result.success) {
        alert(`Finalized ${result.count || 0} payrolls successfully`)
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
      // Get employee ID for password protection
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
      
      // Show password information alert
      alert(`Payslip downloaded successfully!\n\nPassword: ${employeeId}\n\nThe PDF is password-protected for your security. Use your Employee ID to open it.`)
    } catch (error) {
      alert('Error downloading payslip: ' + error.message)
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
      // Helper function to round to 2 decimal places
      const roundToTwoDecimals = (value) => {
        if (value === null || value === undefined) return 0
        return Math.round((parseFloat(value) || 0) * 100) / 100
      }
      
      setSalaryFormData({
        employeeId: salary.employeeId?.toString() || '',
        basicSalary: roundToTwoDecimals(salary.basicSalary),
        hra: roundToTwoDecimals(salary.hra),
        transportAllowance: roundToTwoDecimals(salary.transportAllowance),
        medicalAllowance: roundToTwoDecimals(salary.medicalAllowance),
        specialAllowance: roundToTwoDecimals(salary.specialAllowance),
        otherAllowances: roundToTwoDecimals(salary.otherAllowances),
        pf: roundToTwoDecimals(salary.pf),
        esi: roundToTwoDecimals(salary.esi),
        tds: roundToTwoDecimals(salary.tds),
        professionalTax: roundToTwoDecimals(salary.professionalTax),
        otherDeductions: roundToTwoDecimals(salary.otherDeductions),
        effectiveFrom: salary.effectiveFrom ? format(parseISO(salary.effectiveFrom), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      })
      setShowCtcConverter(false)
    } else {
      setEditingSalary(null)
      setSalaryFormData({
        employeeId: '',
        basicSalary: 0,
        hra: 0,
        transportAllowance: 0,
        medicalAllowance: 0,
        specialAllowance: 0,
        otherAllowances: 0,
        pf: 0,
        esi: 0,
        tds: 0,
        professionalTax: 0,
        otherDeductions: 0,
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

      // Helper function to round to 2 decimal places
      const roundToTwoDecimals = (value) => {
        if (value === null || value === undefined) return 0
        return Math.round((parseFloat(value) || 0) * 100) / 100
      }

      // Populate salary form with converted values (rounded to 2 decimal places)
      setSalaryFormData({
        ...salaryFormData,
        basicSalary: roundToTwoDecimals(result.basicSalary),
        hra: roundToTwoDecimals(result.hra),
        transportAllowance: roundToTwoDecimals(result.transportAllowance),
        medicalAllowance: roundToTwoDecimals(result.medicalAllowance),
        specialAllowance: roundToTwoDecimals(result.specialAllowance),
        otherAllowances: roundToTwoDecimals(result.otherAllowances),
        pf: roundToTwoDecimals(result.pf),
        esi: roundToTwoDecimals(result.esi),
        tds: roundToTwoDecimals(result.tds),
        professionalTax: roundToTwoDecimals(result.professionalTax),
        otherDeductions: roundToTwoDecimals(result.otherDeductions)
      })

      alert('CTC converted to salary structure successfully! Review and edit the values before saving.')
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
          alert('Salary structure updated successfully')
        } else {
          alert('Error updating salary structure: ' + (result.message || 'Failed to update'))
        }
      } else {
        const result = await api.createSalaryStructure(salaryData)
        if (result.success) {
          alert('Salary structure created successfully')
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
        alert('Salary structure deleted successfully')
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
        basicSalaryPercentage: template.basicSalaryPercentage || 40.0,
        hraPercentage: template.hraPercentage || 50.0,
        transportAllowancePercentage: template.transportAllowancePercentage || null,
        transportAllowanceFixed: template.transportAllowanceFixed || null,
        medicalAllowancePercentage: template.medicalAllowancePercentage || null,
        medicalAllowanceFixed: template.medicalAllowanceFixed || null,
        specialAllowancePercentage: template.specialAllowancePercentage || null,
        specialAllowanceFixed: template.specialAllowanceFixed || null,
        otherAllowancesPercentage: template.otherAllowancesPercentage || null,
        pfPercentage: template.pfPercentage || 12.0,
        esiPercentage: template.esiPercentage || 0.75,
        esiApplicableThreshold: template.esiApplicableThreshold || 21000.0,
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
        basicSalaryPercentage: 40.0,
        hraPercentage: 50.0,
        transportAllowancePercentage: null,
        transportAllowanceFixed: null,
        medicalAllowancePercentage: null,
        medicalAllowanceFixed: null,
        specialAllowancePercentage: null,
        specialAllowanceFixed: null,
        otherAllowancesPercentage: null,
        pfPercentage: 12.0,
        esiPercentage: 0.75,
        esiApplicableThreshold: 21000.0,
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
      if (editingCtcTemplate) {
        await api.updateCTCTemplate(editingCtcTemplate.id, ctcTemplateFormData)
        alert('CTC Template updated successfully!')
      } else {
        await api.createCTCTemplate(ctcTemplateFormData)
        alert('CTC Template created successfully!')
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

  const handleDeleteCtcTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    try {
      setLoading(true)
      await api.deleteCTCTemplate(id)
      alert('Template deleted successfully!')
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

  const calculateNetSalary = () => {
    const base = parseFloat(payrollFormData.baseSalary) || 0
    const allowances = parseFloat(payrollFormData.allowances) || 0
    const deductions = parseFloat(payrollFormData.deductions) || 0
    const bonus = parseFloat(payrollFormData.bonus) || 0
    return base + allowances + bonus - deductions
  }

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesStatus = statusFilter === 'All' || payroll.status === statusFilter
    // Match month exactly (format: yyyy-MM)
    // For employees, if no month is selected, show all payrolls
    const matchesMonth = !selectedMonth || (payroll.month && payroll.month === selectedMonth)
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
    console.log('Filtered payrolls for employee:', {
      totalPayrolls: payrolls.length,
      filteredCount: filteredPayrolls.length,
      selectedMonth,
      statusFilter,
      searchTerm,
      filteredPayrolls
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

  // Gratuity Management Handlers
  const handleOpenGratuityModal = (gratuity = null) => {
    if (gratuity) {
      setEditingGratuity(gratuity)
      setGratuityFormData({
        employeeId: gratuity.employeeId?.toString() || '',
        exitDate: gratuity.exitDate || format(new Date(), 'yyyy-MM-dd'),
        lastDrawnSalary: gratuity.lastDrawnSalary || 0,
        yearsOfService: gratuity.yearsOfService || 0,
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
          yearsOfService: gratuity.yearsOfService || 0
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
        alert(editingGratuity ? 'Gratuity updated successfully' : 'Gratuity created successfully')
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
    if (!window.confirm('Are you sure you want to delete this gratuity record?')) return
    
    try {
      setLoading(true)
      const result = await api.deleteGratuity(gratuityId)
      if (result.success) {
        alert('Gratuity deleted successfully')
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
        alert('Gratuity approved successfully')
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
        alert('Gratuity marked as paid successfully')
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
        alert('Gratuity rejected successfully')
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
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase()
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

  return (
    <div className="space-y-4 sm:space-y-5 bg-gray-50 p-2 sm:p-3 md:p-4 max-w-full overflow-x-hidden">
      {/* Toggle Buttons for Salary Details, Processed Payrolls, and CTC Templates - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setActiveView('salaryDetails')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeView === 'salaryDetails'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg font-bold">₹</span>
              Salary Details
            </button>
            <button
              onClick={() => setActiveView('processedPayrolls')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeView === 'processedPayrolls'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={20} />
              Processed Payrolls
            </button>
            <button
              onClick={() => setActiveView('ctcTemplates')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeView === 'ctcTemplates'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Receipt size={20} />
              CTC Templates
            </button>
            <button
              onClick={() => setActiveView('gratuity')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeView === 'gratuity'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Gift size={20} />
              Gratuity
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards - Only for Processed Payrolls view */}
      {isAdmin && activeView === 'processedPayrolls' && (
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
      {isAdmin && activeView === 'salaryDetails' && (
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
                <button
                  onClick={() => handleOpenSalaryModal()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add Salary Details
                </button>
              </div>
            </div>
          </div>

          {/* Salary Details Table */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-xl">₹</span>
                Salary Details ({salaryStructures.filter(s => {
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
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryStructures.filter(s => {
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                          <div className="relative dropdown-menu-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenSalaryDropdownId(openSalaryDropdownId === salary.id ? null : salary.id)
                              }}
                              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Actions"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {openSalaryDropdownId === salary.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
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
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Processed Payrolls View - For both Admin and Employees */}
      {(activeView === 'processedPayrolls' || isEmployee) && (
        <>
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
          <div className="flex-1">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="All Months"
            />
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
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Net Salary</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    No payroll records found
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const employee = employees.find(emp => emp.id === payroll.employeeId || emp.id === parseInt(payroll.employeeId))
                  const employeeName = employee ? (employee.name || 'N/A') : 'N/A'
                  const netSalary = (payroll.netSalary || payroll.amount || 0).toFixed(2)
                  
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
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{netSalary}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payroll.status)}`}>
                          {payroll.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {/* View Payslip Button - Available for all users (ESS) */}
                          <button
                            onClick={() => handleViewESSPayslip(payroll.id)}
                            className="text-indigo-600 hover:text-indigo-800 p-1 sm:p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="View Payslip (UAN, PF Account, etc.)"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(payroll.id)}
                            className="text-blue-600 hover:text-blue-800 p-1 sm:p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Download Payslip PDF"
                          >
                            <Download size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleViewPayroll(payroll.id)}
                                className="text-indigo-600 hover:text-indigo-800 p-1 sm:p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {(payroll.status === 'DRAFT' || payroll.status === 'PENDING_APPROVAL') && (
                                <>
                                  <button
                                    onClick={() => handleOpenPayrollModal(payroll)}
                                    className="text-green-600 hover:text-green-800 p-1 sm:p-2 rounded-lg hover:bg-green-50 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  {payroll.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleSubmitForApproval(payroll.id)}
                                      className="text-yellow-600 hover:text-yellow-800 p-1 sm:p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                                      title="Submit for Approval"
                                    >
                                      <Send size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeletePayroll(payroll.id)}
                                    className="text-red-600 hover:text-red-800 p-1 sm:p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                              {payroll.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApprovePayroll(payroll.id)}
                                  className="text-green-600 hover:text-green-800 p-1 sm:p-2 rounded-lg hover:bg-green-50 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {payroll.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleFinalizePayroll(payroll.id)}
                                  className="text-blue-600 hover:text-blue-800 p-1 sm:p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Finalize"
                                >
                                  <FileText size={16} />
                                </button>
                              )}
                              {payroll.status === 'FINALIZED' && (
                                <button
                                  onClick={() => handleMarkAsPaid(payroll.id)}
                                  className="text-purple-600 hover:text-purple-800 p-1 sm:p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                            </>
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

      {/* Create/Edit Salary Structure Modal */}
      {showSalaryModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-2xl">₹</span>
                {editingSalary ? 'Edit Salary Details' : 'Add Salary Details'}
              </h3>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
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
                      {employees.map(emp => (
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
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
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

              {/* CTC Converter Section - Use Case 1: Auto-generate salary breakup per client rules */}
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
                            // If client is set, show templates matching that client OR templates with no client
                            if (ctcConversionData.client) {
                              return !t.clientName || t.clientName === ctcConversionData.client
                            }
                            // If no client selected, show all templates
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
                    className="mt-4 w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
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
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, basicSalary: e.target.value })}
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
                      value={typeof salaryFormData.hra === 'number' ? salaryFormData.hra.toFixed(2) : salaryFormData.hra}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, hra: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.transportAllowance === 'number' ? salaryFormData.transportAllowance.toFixed(2) : salaryFormData.transportAllowance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, transportAllowance: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.medicalAllowance === 'number' ? salaryFormData.medicalAllowance.toFixed(2) : salaryFormData.medicalAllowance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, medicalAllowance: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Special Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.specialAllowance === 'number' ? salaryFormData.specialAllowance.toFixed(2) : salaryFormData.specialAllowance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, specialAllowance: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.otherAllowances === 'number' ? salaryFormData.otherAllowances.toFixed(2) : salaryFormData.otherAllowances}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, otherAllowances: Math.round(val * 100) / 100 })
                      }}
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
                      value={typeof salaryFormData.pf === 'number' ? salaryFormData.pf.toFixed(2) : salaryFormData.pf}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, pf: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ESI (Employee State Insurance)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.esi === 'number' ? salaryFormData.esi.toFixed(2) : salaryFormData.esi}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, esi: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">TDS (Tax Deducted at Source)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.tds === 'number' ? salaryFormData.tds.toFixed(2) : salaryFormData.tds}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, tds: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.professionalTax === 'number' ? salaryFormData.professionalTax.toFixed(2) : salaryFormData.professionalTax}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, professionalTax: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeof salaryFormData.otherDeductions === 'number' ? salaryFormData.otherDeductions.toFixed(2) : salaryFormData.otherDeductions}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setSalaryFormData({ ...salaryFormData, otherDeductions: Math.round(val * 100) / 100 })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
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
                      {employees.map((emp) => {
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

      {/* View Payroll Modal */}
      {showViewModal && viewingPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-2xl">₹</span>
                Payroll Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingPayroll(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Employee</label>
                    <p className="text-base text-gray-900">
                      {employees.find(e => e.id === viewingPayroll.employeeId)?.name || 
                       `Employee ID: ${viewingPayroll.employeeId}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Month</label>
                    <p className="text-base text-gray-900">{viewingPayroll.month || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Year</label>
                    <p className="text-base text-gray-900">{viewingPayroll.year || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Salary Details */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Base Salary</label>
                    <p className="text-lg font-bold text-gray-900">₹{viewingPayroll.baseSalary?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Allowances</label>
                    <p className="text-lg font-bold text-green-600">+₹{viewingPayroll.allowances?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Bonus</label>
                    <p className="text-lg font-bold text-green-600">+₹{viewingPayroll.bonus?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Deductions</label>
                    <p className="text-lg font-bold text-red-600">-₹{viewingPayroll.deductions?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Net Salary</label>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{(() => {
                        const baseSalary = parseFloat(viewingPayroll.baseSalary) || 0
                        const allowances = parseFloat(viewingPayroll.allowances) || 0
                        const bonus = parseFloat(viewingPayroll.bonus) || 0
                        const deductions = parseFloat(viewingPayroll.deductions) || 0
                        
                        // Calculate net salary: baseSalary + allowances + bonus - deductions
                        const calculatedNetSalary = baseSalary + allowances + bonus - deductions
                        
                        // Use stored netSalary if available, otherwise use calculated value
                        const netSalary = viewingPayroll.netSalary != null 
                          ? parseFloat(viewingPayroll.netSalary) 
                          : (viewingPayroll.amount != null ? parseFloat(viewingPayroll.amount) : calculatedNetSalary)
                        
                        return isNaN(netSalary) ? calculatedNetSalary.toFixed(2) : Math.max(0, netSalary).toFixed(2)
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
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
                  {viewingPayroll.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Notes</label>
                      <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingPayroll.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (viewingPayroll.status === 'DRAFT' || viewingPayroll.status === 'PENDING_APPROVAL') && (
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTC Templates View */}
      {isAdmin && activeView === 'ctcTemplates' && (
        <>
          {/* Filters and Actions for CTC Templates */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search templates by name, client, or description..."
                    value={ctcTemplateSearchTerm}
                    onChange={(e) => setCtcTemplateSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {ctcTemplateSearchTerm && (
                    <button
                      onClick={() => setCtcTemplateSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <select
                  value={ctcTemplateClientFilter}
                  onChange={(e) => setCtcTemplateClientFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Clients</option>
                  {ctcTemplateClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleOpenCtcTemplateModal()}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
              >
                <Plus size={20} />
                Create Template
              </button>
            </div>
          </div>

          {/* CTC Templates Table */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
            <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <Receipt size={24} className="text-blue-600" />
                CTC Templates ({filteredCtcTemplates.length})
              </h3>
            </div>
            {loading && filteredCtcTemplates.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading templates...</p>
              </div>
            ) : filteredCtcTemplates.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Templates Found</h3>
                <p className="text-gray-500 mb-4">
                  {ctcTemplates.length === 0 
                    ? 'Create your first CTC template to get started'
                    : 'No templates match your search criteria'}
                </p>
                {ctcTemplates.length === 0 && (
                  <button
                    onClick={() => handleOpenCtcTemplateModal()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Template
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Template Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Basic %</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">HRA %</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">PF %</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCtcTemplates.map(template => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{template.templateName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{template.clientName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{template.basicSalaryPercentage}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{template.hraPercentage}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{template.pfPercentage}%</td>
                        <td className="px-4 py-3">
                          {template.active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} className="mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle size={12} className="mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenCtcTemplateModal(template)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCtcTemplate(template.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
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
                      const employeeName = employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : 'N/A'
                      
                      return (
                        <tr key={gratuity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{employeeName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {gratuity.exitDate ? format(parseISO(gratuity.exitDate), 'dd MMM yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{gratuity.yearsOfService?.toFixed(2) || '0.00'} years</td>
                          <td className="px-4 py-3 text-sm text-gray-600">₹{gratuity.lastDrawnSalary?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">₹{gratuity.calculatedAmount?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">₹{gratuity.finalAmount?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gratuity.status)}`}>
                              {gratuity.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {gratuity.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveGratuity(gratuity.id)}
                                    className="text-green-600 hover:text-green-800 p-1 rounded-lg hover:bg-green-50 transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleRejectGratuity(gratuity.id)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              {gratuity.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleMarkGratuityAsPaid(gratuity.id)}
                                  className="text-purple-600 hover:text-purple-800 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenGratuityModal(gratuity)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              {gratuity.status !== 'PAID' && (
                                <button
                                  onClick={() => handleDeleteGratuity(gratuity.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
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
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId || emp.id})
                    </option>
                  ))}
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
                  step="0.01"
                  min="0"
                  value={gratuityFormData.yearsOfService}
                  onChange={(e) => setGratuityFormData({ ...gratuityFormData, yearsOfService: e.target.value })}
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

      {/* View Salary Details Modal */}
      {showViewSalaryModal && viewingSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-2xl">₹</span>
                Salary Details
              </h3>
              <button
                onClick={() => {
                  setShowViewSalaryModal(false)
                  setViewingSalary(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Employee</label>
                    <p className="text-base text-gray-900">
                      {employees.find(e => e.id === viewingSalary.employeeId)?.name || 
                       `Employee ID: ${viewingSalary.employeeId}`}
                    </p>
                    {employees.find(e => e.id === viewingSalary.employeeId)?.employeeId && (
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {employees.find(e => e.id === viewingSalary.employeeId)?.employeeId}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Effective From</label>
                    <p className="text-base text-gray-900">
                      {viewingSalary.effectiveFrom ? format(parseISO(viewingSalary.effectiveFrom), 'dd MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      viewingSalary.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingSalary.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Salary */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Basic Salary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Basic Salary</label>
                    <p className="text-2xl font-bold text-gray-900">₹{viewingSalary.basicSalary?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">HRA</label>
                    <p className="text-lg font-semibold text-gray-900">₹{viewingSalary.hra?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Allowances */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-green-600 mb-4">Allowances</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Transport Allowance</label>
                    <p className="text-lg font-semibold text-green-600">₹{viewingSalary.transportAllowance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Medical Allowance</label>
                    <p className="text-lg font-semibold text-green-600">₹{viewingSalary.medicalAllowance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Special Allowance</label>
                    <p className="text-lg font-semibold text-green-600">₹{viewingSalary.specialAllowance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Other Allowances</label>
                    <p className="text-lg font-semibold text-green-600">₹{viewingSalary.otherAllowances?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="md:col-span-2 border-t-2 border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Total Allowances</label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{((viewingSalary.transportAllowance || 0) + 
                          (viewingSalary.medicalAllowance || 0) + 
                          (viewingSalary.specialAllowance || 0) + 
                          (viewingSalary.otherAllowances || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-red-600 mb-4">Deductions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">PF</label>
                    <p className="text-lg font-semibold text-red-600">₹{viewingSalary.pf?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">ESI</label>
                    <p className="text-lg font-semibold text-red-600">₹{viewingSalary.esi?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">TDS</label>
                    <p className="text-lg font-semibold text-red-600">₹{viewingSalary.tds?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Professional Tax</label>
                    <p className="text-lg font-semibold text-red-600">₹{viewingSalary.professionalTax?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Other Deductions</label>
                    <p className="text-lg font-semibold text-red-600">₹{viewingSalary.otherDeductions?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="md:col-span-2 border-t-2 border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Total Deductions</label>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{((viewingSalary.pf || 0) + 
                          (viewingSalary.esi || 0) + 
                          (viewingSalary.tds || 0) + 
                          (viewingSalary.professionalTax || 0) + 
                          (viewingSalary.otherDeductions || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-5 border-2 border-blue-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Salary Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Gross Salary</label>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{viewingSalary.grossSalary?.toFixed(2) || 
                        ((viewingSalary.basicSalary || 0) + 
                         (viewingSalary.transportAllowance || 0) + 
                         (viewingSalary.medicalAllowance || 0) + 
                         (viewingSalary.specialAllowance || 0) + 
                         (viewingSalary.otherAllowances || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Total Deductions</label>
                    <p className="text-xl font-bold text-red-600">
                      ₹{((viewingSalary.pf || 0) + 
                          (viewingSalary.esi || 0) + 
                          (viewingSalary.tds || 0) + 
                          (viewingSalary.professionalTax || 0) + 
                          (viewingSalary.otherDeductions || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Net Salary</label>
                    <p className="text-3xl font-bold text-green-600">
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
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewSalaryModal(false)
                      handleOpenSalaryModal(viewingSalary)
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    <Edit size={20} />
                    Edit Salary Details
                  </button>
                  <button
                    onClick={() => {
                      setShowViewSalaryModal(false)
                      handleDeleteSalary(viewingSalary.id)
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    <Trash2 size={20} />
                    Delete Salary Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ESS Payslip View Modal - Comprehensive Employee Self-Service Payslip */}
      {showESSPayslipModal && viewingESSPayslip && payslipDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-5xl border-2 border-gray-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b-2 border-gray-200 pb-4">
              <div>
                <h3 className="text-3xl font-bold text-blue-600 flex items-center gap-3">
                  <span className="text-blue-600 font-bold text-3xl">₹</span>
                  PAYSLIP
                </h3>
                <p className="text-sm text-gray-500 mt-1">Employee Self-Service Portal</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPayslip(viewingESSPayslip.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                  title="Download PDF"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowESSPayslipModal(false)
                    setViewingESSPayslip(null)
                    setPayslipDetails(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Employee & Company Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border-2 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Employee Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Employee Name</label>
                        <p className="text-base font-bold text-gray-900">
                          {payslipDetails.employee?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Employee ID</label>
                        <p className="text-base text-gray-900">
                          {payslipDetails.employee?.employeeId || payslipDetails.employee?.id || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label>
                        <p className="text-base text-gray-900">
                          {payslipDetails.employee?.designation || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                        <p className="text-base text-gray-900">
                          {payslipDetails.employee?.department || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Payroll Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Salary Month</label>
                        <p className="text-base font-bold text-gray-900">
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
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pay Date</label>
                        <p className="text-base text-gray-900">
                          {viewingESSPayslip.payDate 
                            ? (() => {
                                try {
                                  return format(parseISO(viewingESSPayslip.payDate), 'dd MMM yyyy')
                                } catch {
                                  return viewingESSPayslip.payDate
                                }
                              })()
                            : format(new Date(), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Working Days</label>
                        <p className="text-base text-gray-900">
                          {payslipDetails.attendanceDays.workingDays} days
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Present Days</label>
                        <p className="text-base text-green-600 font-semibold">
                          {payslipDetails.attendanceDays.presentDays} days
                        </p>
                      </div>
                      {payslipDetails.attendanceDays.leaveDays > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Leave Days</label>
                          <p className="text-base text-blue-600 font-semibold">
                            {payslipDetails.attendanceDays.leaveDays} days
                          </p>
                        </div>
                      )}
                      {payslipDetails.attendanceDays.lopDays > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">LOP Days</label>
                          <p className="text-base text-red-600 font-semibold">
                            {payslipDetails.attendanceDays.lopDays} days
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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

              {/* Earnings Section */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} />
                  EARNINGS
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Basic Salary</span>
                    <span className="text-base font-bold text-gray-900">
                      ₹{(() => {
                        // Use basicSalary from mapped data, fallback to baseSalary, then salaryStructure, then 0
                        const basicSalary = viewingESSPayslip.basicSalary || 
                                          viewingESSPayslip.baseSalary || 
                                          payslipDetails.salaryStructure?.basicSalary || 
                                          0
                        return parseFloat(basicSalary || 0).toFixed(2)
                      })()}
                    </span>
                  </div>
                  {viewingESSPayslip.hra > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">HRA (House Rent Allowance)</span>
                      <span className="text-base font-bold text-green-600">
                        ₹{viewingESSPayslip.hra?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.specialAllowance > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Special Allowance</span>
                      <span className="text-base font-bold text-green-600">
                        ₹{payslipDetails.salaryStructure.specialAllowance.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.transportAllowance > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Transport Allowance</span>
                      <span className="text-base font-bold text-green-600">
                        ₹{payslipDetails.salaryStructure.transportAllowance.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.medicalAllowance > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Medical Allowance</span>
                      <span className="text-base font-bold text-green-600">
                        ₹{payslipDetails.salaryStructure.medicalAllowance.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.otherAllowances > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Other Allowances</span>
                      <span className="text-base font-bold text-green-600">
                        ₹{payslipDetails.salaryStructure.otherAllowances.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {viewingESSPayslip.bonus > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Bonus</span>
                      <span className="text-base font-bold text-green-600">
                        ₹{viewingESSPayslip.bonus?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
                    <span className="text-lg font-bold text-gray-800">Total Earnings</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{(() => {
                        // Get basicSalary with fallbacks
                        const basicSalary = parseFloat(viewingESSPayslip.basicSalary || viewingESSPayslip.baseSalary || payslipDetails.salaryStructure?.basicSalary || 0) || 0
                        const hra = parseFloat(viewingESSPayslip.hra || payslipDetails.salaryStructure?.hra || 0) || 0
                        const bonus = parseFloat(viewingESSPayslip.bonus) || 0
                        const specialAllowance = parseFloat(payslipDetails.salaryStructure?.specialAllowance) || 0
                        const transportAllowance = parseFloat(payslipDetails.salaryStructure?.transportAllowance) || 0
                        const medicalAllowance = parseFloat(payslipDetails.salaryStructure?.medicalAllowance) || 0
                        const otherAllowances = parseFloat(payslipDetails.salaryStructure?.otherAllowances) || 0
                        const allowances = parseFloat(viewingESSPayslip.allowances) || 0
                        
                        // Calculate total earnings from all components
                        const totalEarnings = basicSalary + hra + bonus + specialAllowance + transportAllowance + medicalAllowance + otherAllowances + allowances
                        return isNaN(totalEarnings) ? '0.00' : totalEarnings.toFixed(2)
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} className="rotate-180" />
                  DEDUCTIONS
                </h4>
                <div className="space-y-3">
                  {payslipDetails.salaryStructure?.pf > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Provident Fund (Employee Share)</span>
                      <span className="text-base font-bold text-red-600">
                        ₹{payslipDetails.salaryStructure.pf.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.esi > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">ESI (Employee State Insurance)</span>
                      <span className="text-base font-bold text-red-600">
                        ₹{payslipDetails.salaryStructure.esi.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.professionalTax > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Professional Tax</span>
                      <span className="text-base font-bold text-red-600">
                        ₹{payslipDetails.salaryStructure.professionalTax.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.tds > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">TDS (Tax Deducted at Source)</span>
                      <span className="text-base font-bold text-red-600">
                        ₹{payslipDetails.salaryStructure.tds.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payslipDetails.salaryStructure?.otherDeductions > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Other Deductions</span>
                      <span className="text-base font-bold text-red-600">
                        ₹{payslipDetails.salaryStructure.otherDeductions.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
                    <span className="text-lg font-bold text-gray-800">Total Deductions</span>
                    <span className="text-xl font-bold text-red-600">
                      ₹{viewingESSPayslip.deductions?.toFixed(2) || 
                        ((payslipDetails.salaryStructure?.pf || 0) + 
                         (payslipDetails.salaryStructure?.esi || 0) + 
                         (payslipDetails.salaryStructure?.professionalTax || 0) + 
                         (payslipDetails.salaryStructure?.tds || 0) + 
                         (payslipDetails.salaryStructure?.otherDeductions || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employer Contributions Section */}
              {payslipDetails.salaryStructure && (
                <div className="bg-blue-50 rounded-xl shadow-sm p-5 border-2 border-blue-200">
                  <h4 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                    <Users size={24} />
                    EMPLOYER CONTRIBUTIONS
                  </h4>
                  <div className="space-y-3">
                    {payslipDetails.salaryStructure.pf > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="text-sm font-semibold text-gray-700">PF Employer Share</span>
                        <span className="text-base font-bold text-blue-600">
                          ₹{payslipDetails.salaryStructure.pf.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500">(Equal to employee contribution)</p>
                      </div>
                    )}
                    {payslipDetails.salaryStructure.esi > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="text-sm font-semibold text-gray-700">ESI Employer Share</span>
                        <span className="text-base font-bold text-blue-600">
                          ₹{(payslipDetails.salaryStructure.esi * 1.75).toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500">(1.75% of gross salary)</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-t-2 border-blue-300 mt-2">
                      <span className="text-lg font-bold text-gray-800">Total Employer Contributions</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₹{((payslipDetails.salaryStructure.pf || 0) + 
                            ((payslipDetails.salaryStructure.esi || 0) * 1.75)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Payable Amount */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-2">Net Payable Amount</h4>
                    <p className="text-sm text-gray-600">Amount credited to your bank account</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-green-600">
                      ₹{(() => {
                        // Get basicSalary with fallbacks
                        const basicSalary = parseFloat(viewingESSPayslip.basicSalary || viewingESSPayslip.baseSalary || payslipDetails.salaryStructure?.basicSalary || 0) || 0
                        const hra = parseFloat(viewingESSPayslip.hra || payslipDetails.salaryStructure?.hra || 0) || 0
                        const bonus = parseFloat(viewingESSPayslip.bonus || 0) || 0
                        const allowances = parseFloat(viewingESSPayslip.allowances || 0) || 0
                        const specialAllowance = parseFloat(payslipDetails.salaryStructure?.specialAllowance || 0) || 0
                        const transportAllowance = parseFloat(payslipDetails.salaryStructure?.transportAllowance || 0) || 0
                        const medicalAllowance = parseFloat(payslipDetails.salaryStructure?.medicalAllowance || 0) || 0
                        const otherAllowances = parseFloat(payslipDetails.salaryStructure?.otherAllowances || 0) || 0
                        
                        // Calculate total earnings - sum all components
                        const totalEarnings = basicSalary + hra + bonus + allowances + specialAllowance + transportAllowance + medicalAllowance + otherAllowances
                        
                        // Calculate total deductions - sum all individual deductions
                        const pf = parseFloat(payslipDetails.salaryStructure?.pf || 0) || 0
                        const esi = parseFloat(payslipDetails.salaryStructure?.esi || 0) || 0
                        const professionalTax = parseFloat(payslipDetails.salaryStructure?.professionalTax || 0) || 0
                        const tds = parseFloat(payslipDetails.salaryStructure?.tds || 0) || 0
                        const otherDeductions = parseFloat(payslipDetails.salaryStructure?.otherDeductions || 0) || 0
                        const payrollDeductions = parseFloat(viewingESSPayslip.deductions || 0) || 0
                        
                        // Use payroll deductions if it's greater than 0, otherwise sum individual deductions
                        const totalDeductions = payrollDeductions > 0 
                          ? payrollDeductions 
                          : (pf + esi + professionalTax + tds + otherDeductions)
                        
                        // Calculate net salary: Total Earnings - Total Deductions
                        const calculatedNetSalary = totalEarnings - totalDeductions
                        
                        // Use stored netSalary if available and greater than 0, otherwise use calculated value
                        // If stored value is 0 but we have earnings, use calculated value instead
                        const storedNetSalary = viewingESSPayslip.netSalary != null ? parseFloat(viewingESSPayslip.netSalary) : null
                        const storedAmount = viewingESSPayslip.amount != null ? parseFloat(viewingESSPayslip.amount) : null
                        
                        let netSalary = calculatedNetSalary
                        
                        // Only use stored values if they're greater than 0 AND we have earnings
                        // This handles cases where proration might have set netSalary to 0
                        if (totalEarnings > 0) {
                          if (storedNetSalary != null && storedNetSalary > 0) {
                            // Use stored net salary (may be prorated)
                            netSalary = storedNetSalary
                          } else {
                            // If stored netSalary is 0 or null, use calculated value
                            // This ensures we show the correct net salary even if proration set it to 0
                            netSalary = calculatedNetSalary
                          }
                        } else {
                          // No earnings, use stored value or 0
                          netSalary = (storedNetSalary != null && storedNetSalary > 0) ? storedNetSalary : 0
                        }
                        
                        // Ensure net salary is never negative
                        netSalary = Math.max(0, netSalary)
                        
                        return isNaN(netSalary) ? '0.00' : netSalary.toFixed(2)
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {viewingESSPayslip.status || 'DRAFT'}
                    </p>
                  </div>
                </div>
              </div>

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
                      value={ctcTemplateFormData.basicSalaryPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, basicSalaryPercentage: parseFloat(e.target.value) || 0 })}
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
                      value={ctcTemplateFormData.hraPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, hraPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
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

              {/* Deductions */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Deductions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PF % (of Basic) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ctcTemplateFormData.pfPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, pfPercentage: parseFloat(e.target.value) || 0 })}
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
                      value={ctcTemplateFormData.esiPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiPercentage: parseFloat(e.target.value) || 0 })}
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
                      value={ctcTemplateFormData.esiApplicableThreshold}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiApplicableThreshold: parseFloat(e.target.value) || 0 })}
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
