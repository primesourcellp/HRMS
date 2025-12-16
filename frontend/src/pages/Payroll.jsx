import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { DollarSign, Download, FileText, Calendar, CheckCircle, XCircle, Clock, Play, CheckSquare, FileCheck, Banknote, Edit, Eye, Search, Filter, X, Save, TrendingUp, TrendingDown, FileSpreadsheet } from 'lucide-react'
=======
import { DollarSign, Download, FileText, Calendar, CheckCircle, XCircle, Clock, Play, CheckSquare, FileCheck, Banknote, Edit, Eye, Search, Filter, X, Save, TrendingUp, TrendingDown, FileSpreadsheet, Trash2 } from 'lucide-react'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
import api from '../services/api'
import { format } from 'date-fns'

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([])
  const [salaryStructures, setSalaryStructures] = useState({})
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [payrollPeriod, setPayrollPeriod] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  })
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewPayrolls, setReviewPayrolls] = useState([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const currentUserId = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Admins should see all payrolls, employees should see only their own
      const [payrollData, employeesData] = await Promise.all([
        isAdmin ? api.getPayrolls() : (currentUserId ? api.getEmployeePayrolls(currentUserId) : []),
        api.getEmployees()
      ])
      setPayrolls(Array.isArray(payrollData) ? payrollData : [])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])

      // Load salary structures (404 is expected for employees without salary structures - this is normal)
      // Load them in parallel to avoid blocking, and silently handle 404s
      const salaryStructurePromises = (payrollData || []).map(async (payroll) => {
        try {
          const structure = await api.getCurrentSalaryStructure(payroll.employeeId)
          if (structure) {
            setSalaryStructures(prev => ({ ...prev, [payroll.employeeId]: structure }))
          }
          // 404 is expected and handled silently - employee may not have salary structure yet
        } catch (error) {
          // Silently ignore errors - salary structure is optional
        }
      })
      // Don't await - let it load in background
      Promise.all(salaryStructurePromises).catch(() => {
        // Silently handle any errors
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayroll = async () => {
    if (!window.confirm(`Process payroll for all employees from ${payrollPeriod.startDate} to ${payrollPeriod.endDate}?`)) {
      return
    }
    setProcessing(true)
    try {
      const result = await api.processPayrollForAll(payrollPeriod.startDate, payrollPeriod.endDate)
      if (result.success) {
        // Update selectedMonth to match the processed payroll period
        const startDateObj = new Date(payrollPeriod.startDate)
        const monthStr = format(startDateObj, 'yyyy-MM')
        setSelectedMonth(monthStr)
        
        alert(`Payroll processed successfully for ${result.count || 0} employees`)
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to process payroll'))
      }
    } catch (error) {
      alert('Error processing payroll: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleApprovePayroll = async (payrollId) => {
    if (!window.confirm('Approve this payroll?')) return
    try {
      const result = await api.approvePayroll(payrollId)
      if (result.success) {
        alert('Payroll approved successfully')
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to approve payroll'))
      }
    } catch (error) {
      alert('Error approving payroll: ' + error.message)
    }
  }

  const handleFinalizePayroll = async (payrollId) => {
    if (!window.confirm('Finalize this payroll? This will generate payslips.')) return
    try {
      const result = await api.finalizePayroll(payrollId)
      if (result.success) {
        alert('Payroll finalized successfully')
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to finalize payroll'))
      }
    } catch (error) {
      alert('Error finalizing payroll: ' + error.message)
    }
  }

  const handleFinalizeAll = async () => {
    const [month, year] = selectedMonth.split('-')
    if (!window.confirm(`Finalize all approved payrolls for ${month} ${year}?`)) return
    try {
      const result = await api.finalizeAllPayrolls(month, parseInt(year))
      if (result.success) {
        alert(`Finalized ${result.count || 0} payrolls successfully`)
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to finalize payrolls'))
      }
    } catch (error) {
      alert('Error finalizing payrolls: ' + error.message)
    }
  }

  const handleReviewPayrolls = () => {
    const [month, year] = selectedMonth.split('-')
    const filtered = payrolls.filter(p => {
      // Handle both month formats
      if (p.month && p.month.includes('-')) {
        return p.month === selectedMonth && p.status === 'PENDING_APPROVAL'
      } else {
        return p.month === month && p.year === parseInt(year) && p.status === 'PENDING_APPROVAL'
      }
    })
    setReviewPayrolls(filtered)
    setShowReviewModal(true)
  }

  const handleApproveAll = async () => {
    if (reviewPayrolls.length === 0) return
    if (!window.confirm(`Approve all ${reviewPayrolls.length} pending payrolls?`)) return
    
    try {
      let successCount = 0
      let failCount = 0
      
      for (const payroll of reviewPayrolls) {
        try {
          const result = await api.approvePayroll(payroll.id)
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
          console.error(`Error approving payroll ${payroll.id}:`, error)
        }
      }
      
      if (successCount > 0) {
        alert(`Successfully approved ${successCount} payroll(s)${failCount > 0 ? `. ${failCount} failed.` : '.'}`)
        setShowReviewModal(false)
        await loadData()
      } else {
        alert('Failed to approve payrolls. Please try again.')
      }
    } catch (error) {
      alert('Error approving payrolls: ' + error.message)
    }
  }

  const handleDownloadPayslip = async (payrollId, openInNewTab = false) => {
    try {
      const blob = await api.downloadPayslip(payrollId)
      
      // Check if response is a blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format. Expected PDF blob.')
      }
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('Payslip PDF is empty. Please ensure payroll is finalized and salary structure exists.')
      }
      
      // Create blob URL
      const url = window.URL.createObjectURL(blob)
      
      if (openInNewTab) {
        // Open in new tab
        const newWindow = window.open(url, '_blank')
        if (!newWindow) {
          alert('Popup blocked. Please allow popups for this site to view the payslip.')
          // Fallback to download
          const a = document.createElement('a')
          a.href = url
          a.download = `payslip_${payrollId}.pdf`
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
        // Clean up URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } else {
        // Download directly
        const a = document.createElement('a')
        a.href = url
        a.download = `payslip_${payrollId}.pdf`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        // Clean up URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100)
      }
    } catch (error) {
      console.error('Error downloading payslip:', error)
      alert('Error downloading payslip: ' + (error.message || 'Unknown error. Please check if payroll is finalized and salary structure exists.'))
    }
  }

  const handleDownloadForm16 = async (employeeId, year) => {
    try {
      const blob = await api.downloadForm16(employeeId, year)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `form16_${employeeId}_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Error downloading Form 16: ' + error.message)
    }
  }

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll)
    setShowDetailModal(true)
  }

  const handleEditPayroll = (payroll) => {
    setEditingPayroll({ ...payroll })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingPayroll) return
    
    // Validate base salary
    if (!editingPayroll.baseSalary || editingPayroll.baseSalary <= 0) {
      alert('Please enter a valid base salary')
      return
    }
    
    try {
      // Calculate amount and net salary before sending
      const amount = (editingPayroll.baseSalary || 0) + (editingPayroll.allowances || 0) + (editingPayroll.bonus || 0) - (editingPayroll.deductions || 0)
      const payrollData = {
        ...editingPayroll,
        amount: amount,
        netSalary: amount // Net salary is same as amount for now
      }
      
      const result = await api.updatePayroll(editingPayroll.id, payrollData)
      if (result.success || result.id) {
        alert('Payroll updated successfully')
        setShowEditModal(false)
        setEditingPayroll(null)
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to update payroll'))
      }
    } catch (error) {
      alert('Error updating payroll: ' + error.message)
    }
  }

  const handleMarkAsPaid = async (payrollId) => {
    if (!window.confirm('Mark this payroll as paid?')) return
    try {
      const result = await api.markPayrollAsPaid(payrollId)
      if (result.success) {
        alert('Payroll marked as paid successfully')
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to mark payroll as paid'))
      }
    } catch (error) {
      alert('Error marking payroll as paid: ' + error.message)
    }
  }

  const handleSubmitForApproval = async (payrollId) => {
    if (!window.confirm('Submit this payroll for approval? It will move from DRAFT to PENDING_APPROVAL status.')) return
    try {
      const result = await api.submitPayrollForApproval(payrollId)
      if (result.success) {
        alert('Payroll submitted for approval successfully')
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to submit payroll for approval'))
      }
    } catch (error) {
      alert('Error submitting payroll for approval: ' + error.message)
    }
  }

<<<<<<< HEAD
=======
  const handleDeletePayroll = async (payrollId) => {
    if (!window.confirm('Are you sure you want to delete this payroll? This action cannot be undone.')) return
    try {
      const result = await api.deletePayroll(payrollId)
      if (result.success) {
        alert('Payroll deleted successfully')
        await loadData()
      } else {
        alert('Error: ' + (result.message || 'Failed to delete payroll'))
      }
    } catch (error) {
      alert('Error deleting payroll: ' + error.message)
    }
  }

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
  const handleExportPayroll = () => {
    const filtered = getFilteredPayrolls()
    const csvContent = [
      ['Employee', 'Period', 'Gross Salary', 'Deductions', 'Net Salary', 'Status', 'Start Date', 'End Date'].join(','),
      ...filtered.map(p => {
        const employee = employees.find(e => e.id === p.employeeId)
        const name = employee?.name || 'Unknown'
        const period = p.startDate && p.endDate 
          ? `${format(new Date(p.startDate), 'MMM dd')} - ${format(new Date(p.endDate), 'MMM dd, yyyy')}`
          : `${p.month} ${p.year}`
        const structure = getSalaryStructure(p.employeeId)
        const gross = structure?.grossSalary || p.baseSalary || 0
        const deductions = structure ? (structure.grossSalary - structure.netSalary) : p.deductions || 0
        const net = p.netSalary || p.amount || 0
        return [name, period, gross, deductions, net, p.status, p.startDate || '', p.endDate || ''].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll_${selectedMonth}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.name || 'Unknown'
  }

  const getSalaryStructure = (employeeId) => {
    return salaryStructures[employeeId]
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: FileText },
      'PENDING_APPROVAL': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: Clock },
      'APPROVED': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: CheckCircle },
      'FINALIZED': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: FileCheck },
      'PAID': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: Banknote }
    }
    const config = statusConfig[status] || statusConfig['DRAFT']
    const Icon = config.icon
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm inline-flex items-center gap-1.5 ${config.bg} ${config.text} ${config.border} border`}>
        <Icon size={14} />
        {status || 'DRAFT'}
      </span>
    )
  }

  const getFilteredPayrolls = () => {
    let filtered = payrolls.filter(p => {
      // Backend stores month as "yyyy-MM" format, so compare the full month string
      if (p.month && p.month.includes('-')) {
        // If month is in "yyyy-MM" format, compare directly
        return p.month === selectedMonth
      } else {
        // If month is stored as just month number, compare separately
        const [month, year] = selectedMonth.split('-')
        return p.month === month && p.year === parseInt(year)
      }
    })

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId)
        const name = employee?.name || ''
        return name.toLowerCase().includes(term) || 
               (p.employeeId && p.employeeId.toString().includes(term))
      })
    }

    return filtered
  }

  const filteredPayrolls = getFilteredPayrolls()

  const pendingApprovalCount = filteredPayrolls.filter(p => p.status === 'PENDING_APPROVAL').length
  const approvedCount = filteredPayrolls.filter(p => p.status === 'APPROVED').length
  const finalizedCount = filteredPayrolls.filter(p => p.status === 'FINALIZED').length

  return (
<<<<<<< HEAD
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Payroll Management</h2>
            <p className="text-gray-600 font-medium">
              {isAdmin ? 'Process and manage employee payrolls' : 'View your payroll history and payslips'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
=======
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">Payroll Management</h2>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              {isAdmin ? 'Process and manage employee payrolls' : 'View your payroll history and payslips'}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full sm:w-auto">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
<<<<<<< HEAD
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
=======
              className="flex-1 sm:flex-none px-3 md:px-5 py-2 md:py-2.5 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            />
            {filteredPayrolls.length > 0 && (
              <button
                onClick={handleExportPayroll}
<<<<<<< HEAD
                className="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                title="Export to CSV"
              >
                <FileSpreadsheet size={18} />
                Export
=======
                className="bg-green-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold text-sm md:text-base"
                title="Export to CSV"
              >
                <FileSpreadsheet size={16} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">Export</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              </button>
            )}
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
<<<<<<< HEAD
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
=======
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payroll Period Start Date</label>
                <input
                  type="date"
                  value={payrollPeriod.startDate}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payroll Period End Date</label>
                <input
                  type="date"
                  value={payrollPeriod.endDate}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
            </div>
<<<<<<< HEAD
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleProcessPayroll}
                disabled={processing}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={20} />
                {processing ? 'Processing...' : 'Process Payroll for All Employees'}
=======
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full sm:w-auto">
              <button
                onClick={handleProcessPayroll}
                disabled={processing}
                className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <Play size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">{processing ? 'Processing...' : 'Process Payroll for All Employees'}</span>
                <span className="sm:hidden">{processing ? 'Processing...' : 'Process Payroll'}</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              </button>
              {pendingApprovalCount > 0 && (
                <button
                  onClick={handleReviewPayrolls}
<<<<<<< HEAD
                  className="bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <CheckSquare size={20} />
                  Review & Approve ({pendingApprovalCount})
=======
                  className="bg-yellow-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-yellow-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-sm md:text-base"
                >
                  <CheckSquare size={18} className="md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Review & Approve ({pendingApprovalCount})</span>
                  <span className="sm:hidden">Review ({pendingApprovalCount})</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                </button>
              )}
              {approvedCount > 0 && (
                <button
                  onClick={handleFinalizeAll}
<<<<<<< HEAD
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <FileCheck size={20} />
                  Finalize All Approved ({approvedCount})
=======
                  className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-sm md:text-base"
                >
                  <FileCheck size={18} className="md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Finalize All Approved ({approvedCount})</span>
                  <span className="sm:hidden">Finalize ({approvedCount})</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Summary Cards */}
      {isAdmin && filteredPayrolls.length > 0 && (
<<<<<<< HEAD
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
=======
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Payrolls</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredPayrolls.length}</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingApprovalCount}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{approvedCount}</p>
              </div>
              <CheckCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Finalized</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{finalizedCount}</p>
              </div>
              <FileCheck className="text-green-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
<<<<<<< HEAD
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
=======
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
<<<<<<< HEAD
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
=======
                className="w-full pl-9 md:pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
<<<<<<< HEAD
            <Filter size={18} className="text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
=======
            <Filter size={16} className="text-gray-600 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="FINALIZED">Finalized</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
              }}
<<<<<<< HEAD
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <X size={18} />
              Clear Filters
=======
              className="px-3 md:px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <X size={16} />
              <span className="hidden sm:inline">Clear Filters</span>
              <span className="sm:hidden">Clear</span>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            </button>
          )}
        </div>
      </div>

      {/* Payroll List */}
<<<<<<< HEAD
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
=======
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4 p-4">
          {filteredPayrolls.map((payroll) => {
            const structure = getSalaryStructure(payroll.employeeId)
            const hasZeroValues = (!payroll.netSalary || payroll.netSalary === 0) && (!payroll.baseSalary || payroll.baseSalary === 0)
            const needsSalaryStructure = hasZeroValues && !structure
            const employee = employees.find(e => e.id === payroll.employeeId)
            return (
              <div key={payroll.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white ${needsSalaryStructure ? 'bg-yellow-50 border-yellow-300' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {getEmployeeName(payroll.employeeId)?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{getEmployeeName(payroll.employeeId)}</h4>
                      <p className="text-xs text-gray-500">{employee?.department || 'N/A'}</p>
                    </div>
                  </div>
                  {getStatusBadge(payroll.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-semibold">
                      {payroll.startDate && payroll.endDate ? (
                        `${format(new Date(payroll.startDate), 'MMM dd')} - ${format(new Date(payroll.endDate), 'MMM dd')}`
                      ) : (
                        `${payroll.month} ${payroll.year}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross:</span>
                    <span className={hasZeroValues ? 'text-gray-400' : 'text-gray-900'}>
                      ₹{structure?.grossSalary?.toLocaleString() || payroll.baseSalary?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deductions:</span>
                    <span className={hasZeroValues ? 'text-gray-400' : 'text-gray-900'}>
                      ₹{structure ? (structure.grossSalary - structure.netSalary).toLocaleString() : payroll.deductions?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">Net Salary:</span>
                    <span className={`font-bold ${hasZeroValues ? 'text-gray-400' : 'text-blue-600'}`}>
                      ₹{payroll.netSalary?.toLocaleString() || payroll.amount?.toLocaleString() || '0'}
                    </span>
                  </div>
                  {needsSalaryStructure && (
                    <p className="text-xs text-yellow-700 mt-2 flex items-center gap-1">
                      <XCircle size={12} />
                      Salary structure missing
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => handleViewDetails(payroll)}
                    className="flex-1 text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-colors text-xs font-medium"
                  >
                    View
                  </button>
                  {payroll.status === 'FINALIZED' && (
                    <button
                      onClick={() => handleDownloadPayslip(payroll.id, false)}
                      className="flex-1 text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors text-xs font-medium"
                    >
                      Payslip
                    </button>
                  )}
                  {isAdmin && payroll.status !== 'FINALIZED' && (
                    <button
                      onClick={() => handleEditPayroll(payroll)}
                      className="flex-1 text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors text-xs font-medium"
                    >
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePayroll(payroll.id)}
                      className="flex-1 text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Gross Salary</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayrolls.map((payroll) => {
                const structure = getSalaryStructure(payroll.employeeId)
                const hasZeroValues = (!payroll.netSalary || payroll.netSalary === 0) && (!payroll.baseSalary || payroll.baseSalary === 0)
                const needsSalaryStructure = hasZeroValues && !structure
                return (
                  <tr key={payroll.id} className={`hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 ${needsSalaryStructure ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                          {getEmployeeName(payroll.employeeId)?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">{getEmployeeName(payroll.employeeId)}</span>
                          {needsSalaryStructure && (
                            <span className="text-xs text-yellow-700 font-semibold flex items-center gap-1 mt-1">
                              <XCircle size={12} />
                              Salary structure missing
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.startDate && payroll.endDate ? (
                          <>
                            {format(new Date(payroll.startDate), 'MMM dd')} - {format(new Date(payroll.endDate), 'MMM dd, yyyy')}
                          </>
                        ) : (
                          `${payroll.month} ${payroll.year}`
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${hasZeroValues ? 'text-gray-400' : 'text-gray-900'}`}>
                        ₹{structure?.grossSalary?.toLocaleString() || payroll.baseSalary?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${hasZeroValues ? 'text-gray-400' : 'text-gray-900'}`}>
                        ₹{structure ? (structure.grossSalary - structure.netSalary).toLocaleString() : payroll.deductions?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${hasZeroValues ? 'text-gray-400' : 'text-blue-600'}`}>
                        ₹{payroll.netSalary?.toLocaleString() || payroll.amount?.toLocaleString() || '0'}
                      </span>
                      {needsSalaryStructure && (
                        <p className="text-xs text-yellow-700 mt-1">Setup salary structure first</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleViewDetails(payroll)}
                          className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (payroll.status === 'DRAFT' || payroll.status === 'PENDING_APPROVAL') && (
                          <button
                            onClick={() => handleEditPayroll(payroll)}
                            className="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                            title="Edit Payroll"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {isAdmin && payroll.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSubmitForApproval(payroll.id)}
                            className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                            title="Submit for Approval"
                          >
                            <CheckSquare size={18} />
                          </button>
                        )}
                        {isAdmin && payroll.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => handleApprovePayroll(payroll.id)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Approve Payroll"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {isAdmin && payroll.status === 'APPROVED' && (
                          <button
                            onClick={() => handleFinalizePayroll(payroll.id)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Finalize Payroll"
                          >
                            <FileCheck size={18} />
                          </button>
                        )}
                        {isAdmin && payroll.status === 'FINALIZED' && (
                          <button
                            onClick={() => handleMarkAsPaid(payroll.id)}
                            className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Mark as Paid"
                          >
                            <Banknote size={18} />
                          </button>
                        )}
                        {(payroll.status === 'FINALIZED' || payroll.status === 'PAID') && (
                          <button
                            onClick={() => handleDownloadPayslip(payroll.id, false)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Download Payslip"
                          >
                            <Download size={18} />
                          </button>
                        )}
<<<<<<< HEAD
=======
                        {isAdmin && (
                          <button
                            onClick={() => handleDeletePayroll(payroll.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Payroll"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayrolls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-200">
          <DollarSign className="mx-auto text-gray-400" size={48} />
          <p className="mt-4 text-gray-600 font-medium">No payroll records found for the selected period</p>
        </div>
      )}

      {/* Review & Approve Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-yellow-600 flex items-center gap-3">
                  <CheckSquare size={24} />
                  Review & Approve Payrolls
                </h3>
                <p className="text-sm text-gray-600 mt-1">
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-yellow-600 flex items-center gap-2 md:gap-3">
                  <CheckSquare size={20} className="md:w-6 md:h-6" />
                  Review & Approve Payrolls
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  {reviewPayrolls.length} payroll(s) pending approval for {selectedMonth}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            {reviewPayrolls.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleApproveAll}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  <CheckCircle size={20} />
                  Approve All ({reviewPayrolls.length})
                </button>
              </div>
            )}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {reviewPayrolls.map((payroll) => {
                const structure = getSalaryStructure(payroll.employeeId)
                const employee = employees.find(e => e.id === payroll.employeeId)
                const grossSalary = structure?.grossSalary || payroll.baseSalary || 0
                const netSalary = payroll.netSalary || payroll.amount || 0
                return (
                  <div key={payroll.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {getEmployeeName(payroll.employeeId)?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{getEmployeeName(payroll.employeeId)}</h4>
                            <p className="text-xs text-gray-500">
                              {employee?.department || 'N/A'} • {employee?.position || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-600">Period:</span>
                            <p className="font-semibold">
                              {payroll.startDate && payroll.endDate ? (
                                `${format(new Date(payroll.startDate), 'MMM dd')} - ${format(new Date(payroll.endDate), 'MMM dd, yyyy')}`
                              ) : (
                                `${payroll.month} ${payroll.year}`
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Gross Salary:</span>
                            <p className="font-semibold text-green-600">₹{grossSalary.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Deductions:</span>
                            <p className="font-semibold text-red-600">
                              ₹{structure ? (structure.grossSalary - structure.netSalary).toLocaleString() : payroll.deductions?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Net Salary:</span>
                            <p className="font-semibold text-blue-600">₹{netSalary.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            handleApprovePayroll(payroll.id)
                            setReviewPayrolls(prev => prev.filter(p => p.id !== payroll.id))
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setShowReviewModal(false)
                            handleViewDetails(payroll)
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {reviewPayrolls.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-gray-400" size={48} />
                <p className="text-gray-500 py-4 text-lg">No payrolls pending approval</p>
                <p className="text-sm text-gray-400">All payrolls for this period have been reviewed</p>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <FileText size={24} />
=======
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-blue-600 flex items-center gap-2 md:gap-3">
                <FileText size={20} className="md:w-6 md:h-6" />
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                Payroll Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedPayroll(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {(() => {
              const employee = employees.find(e => e.id === selectedPayroll.employeeId)
              const structure = getSalaryStructure(selectedPayroll.employeeId)
              const grossSalary = structure?.grossSalary || selectedPayroll.baseSalary || 0
              const totalDeductions = structure ? (structure.grossSalary - structure.netSalary) : selectedPayroll.deductions || 0
              const netSalary = selectedPayroll.netSalary || selectedPayroll.amount || 0
              
              return (
                <div className="space-y-6">
                  {/* Employee Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{employee?.name || 'Unknown Employee'}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-semibold">Employee ID:</span> {selectedPayroll.employeeId}</div>
                      <div><span className="font-semibold">Department:</span> {employee?.department || 'N/A'}</div>
                      <div><span className="font-semibold">Position:</span> {employee?.position || 'N/A'}</div>
                      <div><span className="font-semibold">Status:</span> {getStatusBadge(selectedPayroll.status)}</div>
                    </div>
                  </div>

                  {/* Period Info */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar size={20} />
                      Payroll Period
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Start Date:</span>
                        <p className="font-semibold">{selectedPayroll.startDate ? format(new Date(selectedPayroll.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">End Date:</span>
                        <p className="font-semibold">{selectedPayroll.endDate ? format(new Date(selectedPayroll.endDate), 'MMM dd, yyyy') : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Month/Year:</span>
                        <p className="font-semibold">{selectedPayroll.month} {selectedPayroll.year}</p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="text-green-600" size={20} />
                      Earnings
                    </h4>
                    <div className="space-y-2">
                      {structure && (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span>Basic Salary</span>
                            <span className="font-semibold">₹{structure.basicSalary?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>HRA</span>
                            <span className="font-semibold">₹{structure.hra?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Transport Allowance</span>
                            <span className="font-semibold">₹{structure.transportAllowance?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Medical Allowance</span>
                            <span className="font-semibold">₹{structure.medicalAllowance?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Special Allowance</span>
                            <span className="font-semibold">₹{structure.specialAllowance?.toLocaleString() || '0'}</span>
                          </div>
                          {selectedPayroll.bonus > 0 && (
                            <div className="flex justify-between py-2 border-b">
                              <span>Bonus</span>
                              <span className="font-semibold text-green-600">₹{selectedPayroll.bonus?.toLocaleString() || '0'}</span>
                            </div>
                          )}
                        </>
                      )}
                      {!structure && (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span>Base Salary</span>
                            <span className="font-semibold">₹{selectedPayroll.baseSalary?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Allowances</span>
                            <span className="font-semibold">₹{selectedPayroll.allowances?.toLocaleString() || '0'}</span>
                          </div>
                          {selectedPayroll.bonus > 0 && (
                            <div className="flex justify-between py-2 border-b">
                              <span>Bonus</span>
                              <span className="font-semibold text-green-600">₹{selectedPayroll.bonus?.toLocaleString() || '0'}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between py-2 bg-green-50 rounded-lg px-3 mt-3">
                        <span className="font-bold">Gross Salary</span>
                        <span className="font-bold text-green-700">₹{grossSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Breakdown */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingDown className="text-red-600" size={20} />
                      Deductions
                    </h4>
                    <div className="space-y-2">
                      {structure && (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span>Provident Fund (PF)</span>
                            <span className="font-semibold">₹{structure.pf?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Employee State Insurance (ESI)</span>
                            <span className="font-semibold">₹{structure.esi?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Tax Deducted at Source (TDS)</span>
                            <span className="font-semibold">₹{structure.tds?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Professional Tax</span>
                            <span className="font-semibold">₹{structure.professionalTax?.toLocaleString() || '0'}</span>
                          </div>
                          {structure.otherDeductions > 0 && (
                            <div className="flex justify-between py-2 border-b">
                              <span>Other Deductions</span>
                              <span className="font-semibold">₹{structure.otherDeductions?.toLocaleString() || '0'}</span>
                            </div>
                          )}
                        </>
                      )}
                      {!structure && (
                        <div className="flex justify-between py-2 border-b">
                          <span>Total Deductions</span>
                          <span className="font-semibold">₹{selectedPayroll.deductions?.toLocaleString() || '0'}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 bg-red-50 rounded-lg px-3 mt-3">
                        <span className="font-bold">Total Deductions</span>
                        <span className="font-bold text-red-700">₹{totalDeductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">Net Salary</span>
                      <span className="text-3xl font-bold">₹{netSalary.toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedPayroll.notes && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-yellow-50">
                      <h4 className="font-bold text-sm text-gray-700 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{selectedPayroll.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedPayroll(null)
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                    >
                      Close
                    </button>
                    {(selectedPayroll.status === 'FINALIZED' || selectedPayroll.status === 'PAID') && (
                      <button
                        onClick={() => {
                          handleDownloadPayslip(selectedPayroll.id, false)
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold flex items-center gap-2"
                      >
                        <Download size={18} />
                        Download Payslip
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      {showEditModal && editingPayroll && (() => {
<<<<<<< HEAD
        const employee = employees.find(emp => emp.id === editingPayroll.employeeId)
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        const calculatedNetSalary = (editingPayroll.baseSalary || 0) + (editingPayroll.allowances || 0) + (editingPayroll.bonus || 0) - (editingPayroll.deductions || 0)
        const calculatedGrossSalary = (editingPayroll.baseSalary || 0) + (editingPayroll.allowances || 0) + (editingPayroll.bonus || 0)
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-orange-600 flex items-center gap-3">
                  <Edit size={24} />
                  Edit Payroll
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingPayroll(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
<<<<<<< HEAD
                {/* Employee Information (Read-only) */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Employee Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Employee Name</label>
                      <p className="text-sm font-medium text-gray-800">{employee?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Employee ID</label>
                      <p className="text-sm font-medium text-gray-800">{editingPayroll.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                      <p className="text-sm font-medium text-gray-800">{employee?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Position</label>
                      <p className="text-sm font-medium text-gray-800">{employee?.position || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Pay Period Information (Read-only) */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar size={18} />
                    Pay Period
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
                      <p className="text-sm font-medium text-gray-800">{editingPayroll.month || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                      <p className="text-sm font-medium text-gray-800">{editingPayroll.year || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        editingPayroll.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        editingPayroll.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        editingPayroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        editingPayroll.status === 'FINALIZED' ? 'bg-green-100 text-green-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {editingPayroll.status || 'DRAFT'}
                      </span>
                    </div>
                  </div>
                  {(editingPayroll.startDate || editingPayroll.endDate) && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                        <p className="text-sm font-medium text-gray-800">
                          {editingPayroll.startDate ? format(new Date(editingPayroll.startDate), 'dd MMM yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                        <p className="text-sm font-medium text-gray-800">
                          {editingPayroll.endDate ? format(new Date(editingPayroll.endDate), 'dd MMM yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                {/* Editable Salary Fields */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign size={18} />
                    Salary Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Base Salary <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPayroll.baseSalary || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setEditingPayroll({ ...editingPayroll, baseSalary: value })
                          }}
                          className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Allowances</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPayroll.allowances || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setEditingPayroll({ ...editingPayroll, allowances: value })
                          }}
                          className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bonus</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPayroll.bonus || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setEditingPayroll({ ...editingPayroll, bonus: value })
                          }}
                          className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Deductions</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPayroll.deductions || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setEditingPayroll({ ...editingPayroll, deductions: value })
                          }}
                          className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Values */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Gross Salary:</span>
                        <span className="text-lg font-bold text-green-700">
                          ₹{calculatedGrossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Base + Allowances + Bonus</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Net Salary:</span>
                        <span className="text-lg font-bold text-blue-700">
                          ₹{calculatedNetSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Gross - Deductions</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editingPayroll.notes || ''}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Add any additional notes or remarks..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingPayroll(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default Payroll
