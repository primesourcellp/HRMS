import { useState, useEffect } from 'react'
import { DollarSign, Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, Download, Filter, FileText, Send, Users, TrendingUp, Clock, Search, X, FileDown, PlayCircle } from 'lucide-react'
import api from '../services/api'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [showBulkProcessModal, setShowBulkProcessModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState(null)
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

  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

  useEffect(() => {
    loadData()
  }, [selectedMonth, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      if (isEmployee && userId) {
        const [payrollsData, employeesData] = await Promise.all([
          api.getEmployeePayrolls(parseInt(userId)),
          api.getEmployees()
        ])
        setPayrolls(Array.isArray(payrollsData) ? payrollsData : [])
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      } else if (isAdmin) {
        const [payrollsData, employeesData] = await Promise.all([
          api.getPayrolls(),
          api.getEmployees()
        ])
        setPayrolls(Array.isArray(payrollsData) ? payrollsData : [])
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
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
        alert(`Payroll processed successfully for ${result.count || 0} employees`)
        await loadData()
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
      const blob = await api.downloadPayslip(payrollId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslip_${payrollId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error downloading payslip: ' + error.message)
    }
  }

  const handleExportCSV = () => {
    const csvData = filteredPayrolls.map(p => {
      const employee = employees.find(emp => emp.id === p.employeeId || emp.id === parseInt(p.employeeId))
      const employeeName = employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : 'N/A'
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
    const matchesMonth = !selectedMonth || payroll.month === selectedMonth
    const matchesSearch = !searchTerm || 
      (isAdmin && (() => {
        const emp = employees.find(emp => emp.id === payroll.employeeId || emp.id === parseInt(payroll.employeeId))
        if (!emp) return false
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase()
        return fullName.includes(searchTerm.toLowerCase()) || 
               emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      })()) ||
      payroll.month?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.status?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesMonth && matchesSearch
  })

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
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 bg-gray-50 p-2 sm:p-3 md:p-4 max-w-full overflow-x-hidden">
      {/* Statistics Cards */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Total</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
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
          {isAdmin && (
            <>
              <div className="flex-1">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                onClick={() => handleOpenPayrollModal()}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
              >
                <Plus size={20} />
                Create Payroll
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
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
            <DollarSign size={24} className="text-blue-600" />
            Payroll Records ({filteredPayrolls.length})
          </h3>
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
                  const employeeName = employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : 'N/A'
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
                          <button
                            onClick={() => handleDownloadPayslip(payroll.id)}
                            className="text-blue-600 hover:text-blue-800 p-1 sm:p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Download Payslip"
                          >
                            <Download size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              {payroll.status === 'DRAFT' && (
                                <>
                                  <button
                                    onClick={() => handleOpenPayrollModal(payroll)}
                                    className="text-green-600 hover:text-green-800 p-1 sm:p-2 rounded-lg hover:bg-green-50 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleSubmitForApproval(payroll.id)}
                                    className="text-yellow-600 hover:text-yellow-800 p-1 sm:p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                                    title="Submit for Approval"
                                  >
                                    <Send size={16} />
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
                              {(payroll.status === 'DRAFT' || payroll.status === 'PENDING_APPROVAL') && (
                                <button
                                  onClick={() => handleDeletePayroll(payroll.id)}
                                  className="text-red-600 hover:text-red-800 p-1 sm:p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
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

      {/* Create/Edit Payroll Modal - Redesigned */}
      {showPayrollModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-full border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <DollarSign size={28} className="text-blue-600" />
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
                        const employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unnamed Employee'
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
    </div>
  )
}

export default Payroll
