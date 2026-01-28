import { useState, useEffect } from 'react'
import { FileText, Download, TrendingUp, Users, AlertCircle, CheckCircle, X, Shield } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Compliance = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Report generation filters
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employees, setEmployees] = useState([])

  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'FINANCE'

  useEffect(() => {
    if (isAdmin) {
      loadEmployees()
    }
  }, [isAdmin])

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees()
      // Filter out SUPER_ADMIN from the employees list
      const filteredEmployees = Array.isArray(data) 
        ? data.filter(emp => {
            const role = (emp.role || emp.designation || '').toUpperCase()
            return role !== 'SUPER_ADMIN'
          })
        : []
      setEmployees(filteredEmployees)
    } catch (error) {
      console.error('Error loading employees:', error)
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

  const clearReportFilters = () => {
    setReportYear(new Date().getFullYear())
    setReportMonth(new Date().getMonth() + 1)
    setSelectedEmployeeId('')
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Compliance</h1>
        <p className="text-gray-600">Generate statutory reports for compliance readiness</p>
      </div>

      {/* Success/Error Messages - Fixed Top Right */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2 max-w-md">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2 max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compliance Reports View */}
      {
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
                      {emp.name}
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
      }
    </div>
  )
}

export default Compliance

