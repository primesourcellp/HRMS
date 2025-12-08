import { useState, useEffect } from 'react'
import { DollarSign, Download, FileText, Calendar, CheckCircle, XCircle, Clock, Play, CheckSquare, FileCheck, Banknote } from 'lucide-react'
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
  const currentUserId = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [payrollData, employeesData] = await Promise.all([
        currentUserId ? api.getEmployeePayrolls(currentUserId) : api.getPayrolls(),
        api.getEmployees()
      ])
      setPayrolls(Array.isArray(payrollData) ? payrollData : [])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])

      // Load salary structures
      for (const payroll of payrollData || []) {
        try {
          const structure = await api.getCurrentSalaryStructure(payroll.employeeId)
          if (structure) {
            setSalaryStructures(prev => ({ ...prev, [payroll.employeeId]: structure }))
          }
        } catch (error) {
          console.error('Error loading salary structure:', error)
        }
      }
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
    const filtered = payrolls.filter(p => 
      p.month === month && p.year === parseInt(year) && p.status === 'PENDING_APPROVAL'
    )
    setReviewPayrolls(filtered)
    setShowReviewModal(true)
  }

  const handleDownloadPayslip = async (payrollId) => {
    try {
      const blob = await api.downloadPayslip(payrollId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip_${payrollId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Error downloading payslip: ' + error.message)
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

  const filteredPayrolls = payrolls.filter(p => {
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

  const pendingApprovalCount = filteredPayrolls.filter(p => p.status === 'PENDING_APPROVAL').length
  const approvedCount = filteredPayrolls.filter(p => p.status === 'APPROVED').length
  const finalizedCount = filteredPayrolls.filter(p => p.status === 'FINALIZED').length

  return (
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
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleProcessPayroll}
                disabled={processing}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={20} />
                {processing ? 'Processing...' : 'Process Payroll for All Employees'}
              </button>
              {pendingApprovalCount > 0 && (
                <button
                  onClick={handleReviewPayrolls}
                  className="bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <CheckSquare size={20} />
                  Review & Approve ({pendingApprovalCount})
                </button>
              )}
              {approvedCount > 0 && (
                <button
                  onClick={handleFinalizeAll}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <FileCheck size={20} />
                  Finalize All Approved ({approvedCount})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Summary Cards */}
      {isAdmin && filteredPayrolls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Payroll List */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                return (
                  <tr key={payroll.id} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                          {getEmployeeName(payroll.employeeId)?.charAt(0) || 'E'}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{getEmployeeName(payroll.employeeId)}</span>
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
                      <span className="text-sm text-gray-900">
                        ₹{structure?.grossSalary?.toLocaleString() || payroll.baseSalary?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ₹{structure ? (structure.grossSalary - structure.netSalary).toLocaleString() : payroll.deductions?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600">
                        ₹{payroll.netSalary?.toLocaleString() || payroll.amount?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 flex-wrap">
                        {isAdmin && payroll.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => handleApprovePayroll(payroll.id)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1.5"
                            title="Approve Payroll"
                          >
                            <CheckCircle size={18} />
                            <span className="font-semibold">Approve</span>
                          </button>
                        )}
                        {isAdmin && payroll.status === 'APPROVED' && (
                          <button
                            onClick={() => handleFinalizePayroll(payroll.id)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                            title="Finalize Payroll"
                          >
                            <FileCheck size={18} />
                            <span className="font-semibold">Finalize</span>
                          </button>
                        )}
                        {(payroll.status === 'FINALIZED' || payroll.status === 'PAID') && (
                          <>
                            <button
                              onClick={() => handleDownloadPayslip(payroll.id)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                              title="Download Payslip"
                            >
                              <Download size={18} />
                              <span className="font-semibold">Payslip</span>
                            </button>
                            <button
                              onClick={() => handleDownloadForm16(payroll.employeeId, payroll.year)}
                              className="text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                              title="Download Form 16"
                            >
                              <FileText size={18} />
                              <span className="font-semibold">Form 16</span>
                            </button>
                          </>
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

      {filteredPayrolls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-200">
          <DollarSign className="mx-auto text-gray-400" size={48} />
          <p className="mt-4 text-gray-600 font-medium">No payroll records found for the selected period</p>
        </div>
      )}

      {/* Review & Approve Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-yellow-600 flex items-center gap-3">
                <CheckSquare size={24} />
                Review & Approve Payrolls
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {reviewPayrolls.map((payroll) => {
                const structure = getSalaryStructure(payroll.employeeId)
                return (
                  <div key={payroll.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{getEmployeeName(payroll.employeeId)}</h4>
                        <p className="text-sm text-gray-600">
                          Gross: ₹{structure?.grossSalary?.toLocaleString() || '0'} | 
                          Net: ₹{payroll.netSalary?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          handleApprovePayroll(payroll.id)
                          setReviewPayrolls(prev => prev.filter(p => p.id !== payroll.id))
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {reviewPayrolls.length === 0 && (
              <p className="text-center text-gray-500 py-8">No payrolls pending approval</p>
            )}
            <div className="mt-6 flex justify-end">
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
    </div>
  )
}

export default Payroll
