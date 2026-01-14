import { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter, Calendar, Shield, TrendingUp, Users, AlertCircle, CheckCircle, XCircle, Eye, X } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Compliance = () => {
  const [activeView, setActiveView] = useState('reports') // 'reports' or 'auditLogs'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Report generation filters
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employees, setEmployees] = useState([])
  
  // Audit logs
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilters, setAuditFilters] = useState({
    entityType: '',
    employeeId: '',
    startDate: format(new Date().setMonth(new Date().getMonth() - 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })

  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'FINANCE'

  useEffect(() => {
    if (isAdmin) {
      loadEmployees()
      if (activeView === 'auditLogs') {
        loadAuditLogs()
      }
    }
  }, [isAdmin, activeView])

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (auditFilters.entityType) params.append('entityType', auditFilters.entityType)
      if (auditFilters.employeeId) params.append('employeeId', auditFilters.employeeId)
      if (auditFilters.startDate) params.append('startDate', auditFilters.startDate)
      if (auditFilters.endDate) params.append('endDate', auditFilters.endDate)

      const response = await api.getAuditLogs(params.toString())
      if (response.success) {
        setAuditLogs(response.auditLogs || [])
      } else {
        setError(response.message || 'Failed to load audit logs')
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setError('Failed to load audit logs: ' + error.message)
    } finally {
      setAuditLoading(false)
    }
  }

  const handleGenerateReport = async (reportType) => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const params = new URLSearchParams()
      params.append('year', reportYear.toString())
      if (reportMonth) params.append('month', reportMonth.toString())
      if (selectedEmployeeId) params.append('employeeId', selectedEmployeeId)

      const blob = await api.generateComplianceReport(reportType, params.toString())
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}_Report_${reportYear}${reportMonth ? '_' + String(reportMonth).padStart(2, '0') : ''}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMessage(`${reportType} report generated and downloaded successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error)
      setError(`Failed to generate ${reportType} report: ` + (error.message || 'Unknown error'))
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePayrollRegister = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const params = new URLSearchParams()
      params.append('year', reportYear.toString())
      if (reportMonth) params.append('month', reportMonth.toString())
      if (selectedEmployeeId) params.append('employeeId', selectedEmployeeId)

      const blob = await api.generatePayrollRegister(params.toString())
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Payroll_Register_${reportYear}${reportMonth ? '_' + String(reportMonth).padStart(2, '0') : ''}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMessage('Payroll register generated and downloaded successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error generating payroll register:', error)
      setError('Failed to generate payroll register: ' + (error.message || 'Unknown error'))
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = new Date(timestamp)
      return format(date, 'MMM dd, yyyy HH:mm:ss')
    } catch (e) {
      return timestamp
    }
  }

  const getActionIcon = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return CheckCircle
    if (action.includes('REJECT') || action.includes('DELETE')) return XCircle
    return AlertCircle
  }

  const getActionColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'text-green-600'
    if (action.includes('REJECT') || action.includes('DELETE')) return 'text-red-600'
    return 'text-blue-600'
  }

  const clearReportFilters = () => {
    setReportYear(new Date().getFullYear())
    setReportMonth(new Date().getMonth() + 1)
    setSelectedEmployeeId('')
  }

  const clearAuditFilters = async () => {
    const defaultFilters = {
      entityType: '',
      employeeId: '',
      startDate: format(new Date().setMonth(new Date().getMonth() - 3), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    }
    setAuditFilters(defaultFilters)
    
    // Reload audit logs with cleared filters
    try {
      setAuditLoading(true)
      setError(null)
      const params = new URLSearchParams()
      // Only add non-empty filter values
      if (defaultFilters.startDate) params.append('startDate', defaultFilters.startDate)
      if (defaultFilters.endDate) params.append('endDate', defaultFilters.endDate)

      const response = await api.getAuditLogs(params.toString())
      if (response.success) {
        setAuditLogs(response.auditLogs || [])
      } else {
        setError(response.message || 'Failed to load audit logs')
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setError('Failed to load audit logs: ' + error.message)
    } finally {
      setAuditLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Access Denied. You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Compliance & Audit</h1>
        <p className="text-gray-600">Generate statutory reports and view audit logs for compliance readiness</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 flex-wrap">
          <button
            onClick={() => setActiveView('reports')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'reports'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText size={18} />
            Compliance Reports
          </button>
          <button
            onClick={() => {
              setActiveView('auditLogs')
              loadAuditLogs()
            }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'auditLogs'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield size={18} />
            Audit Logs
          </button>
        </div>
      </div>

      {/* Compliance Reports View */}
      {activeView === 'reports' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
    
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="2020"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month (Optional)</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {format(new Date(2024, month - 1), 'MMMM')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee (Optional)</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || emp.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={clearReportFilters}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <X size={18} />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Report Generation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PF Report */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">PF Report</h3>
                  <p className="text-sm text-gray-600">Provident Fund</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate Provident Fund contribution report for the selected period.</p>
              <button
                onClick={() => handleGenerateReport('pf')}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} />
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            {/* ESI Report */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">ESI Report</h3>
                  <p className="text-sm text-gray-600">Employee State Insurance</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate Employee State Insurance contribution report.</p>
              <button
                onClick={() => handleGenerateReport('esi')}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} />
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            {/* PT Report */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">PT Report</h3>
                  <p className="text-sm text-gray-600">Professional Tax</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate Professional Tax deduction report.</p>
              <button
                onClick={() => handleGenerateReport('pt')}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} />
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            {/* TDS Report */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileText className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">TDS Report</h3>
                  <p className="text-sm text-gray-600">Tax Deducted at Source</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate Tax Deducted at Source report with PAN details.</p>
              <button
                onClick={() => handleGenerateReport('tds')}
                disabled={loading}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} />
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            {/* Payroll Register */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Users className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Payroll Register</h3>
                  <p className="text-sm text-gray-600">Historical Payroll Data</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate historical payroll register for the selected period.</p>
              <button
                onClick={handleGeneratePayrollRegister}
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} />
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs View */}
      {activeView === 'auditLogs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
       
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <select
                  value={auditFilters.entityType}
                  onChange={(e) => setAuditFilters({ ...auditFilters, entityType: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="PAYROLL">Payroll</option>
                  <option value="SALARY_STRUCTURE">Salary Structure</option>
                  <option value="LEAVE">Leave</option>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={auditFilters.employeeId}
                  onChange={(e) => setAuditFilters({ ...auditFilters, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || emp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={auditFilters.startDate}
                  onChange={(e) => setAuditFilters({ ...auditFilters, startDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={auditFilters.endDate}
                  onChange={(e) => setAuditFilters({ ...auditFilters, endDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={loadAuditLogs}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Search size={18} />
                Search Audit Logs
              </button>
              <button
                onClick={clearAuditFilters}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <X size={18} />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Shield size={20} />
                Audit Logs ({auditLogs.length})
              </h2>
            </div>
            {auditLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Shield size={48} className="mx-auto mb-2 opacity-50" />
                <p>No audit logs found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => {
                      const ActionIcon = getActionIcon(log.action)
                      const actionColor = getActionColor(log.action)
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {log.entityType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`flex items-center gap-1 font-medium ${actionColor}`}>
                              <ActionIcon size={16} />
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{log.userName || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{log.userRole || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.employeeName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={log.description}>
                              {log.description || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ipAddress || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Compliance

