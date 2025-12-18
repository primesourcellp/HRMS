import { useState, useEffect } from 'react'
import { DollarSign, Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, Download, Filter, FileText } from 'lucide-react'
import api from '../services/api'
import { format, parseISO } from 'date-fns'

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [statusFilter, setStatusFilter] = useState('All')
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState(null)
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
        await api.updatePayroll(editingPayroll.id, payrollData)
      } else {
        await api.createPayroll(payrollData)
      }
      await loadData()
      setShowPayrollModal(false)
      setEditingPayroll(null)
      alert(editingPayroll ? 'Payroll updated successfully' : 'Payroll created successfully')
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
    return matchesStatus && matchesMonth
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
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">
              {isEmployee ? 'My Payroll' : 'Payroll Management'}
            </h2>
            <p className="text-gray-600 font-medium">
              {isEmployee ? 'View your payroll history and payslips' : 'Manage employee payrolls and process payments'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenPayrollModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Plus size={20} />
              Create Payroll
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
        <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <DollarSign size={24} className="text-blue-600" />
            Payroll Records
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Month/Year</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Base Salary</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Allowances</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Bonus</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    No payroll records found
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const employee = employees.find(emp => emp.id === payroll.employeeId)
                  const netSalary = (payroll.netSalary || payroll.amount || 0).toFixed(2)
                  
                  return (
                    <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee?.name || 'N/A'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payroll.month && payroll.year 
                          ? `${payroll.month}/${payroll.year}`
                          : payroll.month || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payroll.baseSalary?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +₹{payroll.allowances?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -₹{payroll.deductions?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +₹{payroll.bonus?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{netSalary}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payroll.status)}`}>
                          {payroll.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadPayslip(payroll.id)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Download Payslip"
                          >
                            <Download size={18} />
                          </button>
                          {isAdmin && (
                            <>
                              {payroll.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleOpenPayrollModal(payroll)}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                              )}
                              {payroll.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApprovePayroll(payroll.id)}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              {payroll.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleFinalizePayroll(payroll.id)}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Finalize"
                                >
                                  <FileText size={18} />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeletePayroll(payroll.id)}
                                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete Payroll"
                                >
                                  <Trash2 size={18} />
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

      {/* Create/Edit Payroll Modal */}
      {showPayrollModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600">
                {editingPayroll ? 'Edit Payroll' : 'Create Payroll'}
              </h3>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handlePayrollSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={payrollFormData.employeeId}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingPayroll}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || emp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <input
                    type="month"
                    value={payrollFormData.month}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <input
                    type="number"
                    value={payrollFormData.year}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary *</label>
                <input
                  type="number"
                  step="0.01"
                  value={payrollFormData.baseSalary}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, baseSalary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payrollFormData.allowances}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, allowances: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payrollFormData.deductions}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, deductions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
                <input
                  type="number"
                  step="0.01"
                  value={payrollFormData.bonus}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, bonus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary</label>
                <input
                  type="text"
                  value={`₹${calculateNetSalary().toFixed(2)}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={payrollFormData.status}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={payrollFormData.notes}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? 'Saving...' : editingPayroll ? 'Update Payroll' : 'Create Payroll'}
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

