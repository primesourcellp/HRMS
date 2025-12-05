import { useState, useEffect } from 'react'
import { DollarSign, Download, FileText, Calendar } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([])
  const [salaryStructures, setSalaryStructures] = useState({})
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const currentUserId = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [payrollData, employeesData] = await Promise.all([
        currentUserId ? api.getEmployeePayrolls(currentUserId) : api.getPayrolls(),
        api.getEmployees()
      ])
      setPayrolls(payrollData)
      setEmployees(employeesData)

      // Load salary structures
      for (const payroll of payrollData) {
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
    }
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

  const handleGeneratePayroll = async (employeeId) => {
    if (!window.confirm('Generate payroll for this employee?')) return
    setLoading(true)
    try {
      const [month, year] = selectedMonth.split('-')
      await api.generatePayroll(employeeId, month, parseInt(year))
      await loadData()
      alert('Payroll generated successfully')
    } catch (error) {
      alert('Error generating payroll: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.name || 'Unknown'
  }

  const getSalaryStructure = (employeeId) => {
    return salaryStructures[employeeId]
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-600">Payroll Management</h2>
          <p className="text-gray-600 mt-1 font-medium">View and manage employee payrolls</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Payroll List */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Gross Salary</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll) => {
                const structure = getSalaryStructure(payroll.employeeId)
                return (
                  <tr key={payroll.id} className="hover:bg-gray-50 transition-all duration-200 border-b border-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                          {getEmployeeName(payroll.employeeId)?.charAt(0) || 'E'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{getEmployeeName(payroll.employeeId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{payroll.month} {payroll.year}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ₹{structure?.grossSalary?.toLocaleString() || payroll.baseSalary?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ₹{structure ? (structure.grossSalary - structure.netSalary).toLocaleString() : '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600">
                        ₹{payroll.netSalary?.toLocaleString() || payroll.amount?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payroll.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        payroll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payroll.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPayslip(payroll.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Download Payslip"
                        >
                          <Download size={16} />
                          Payslip
                        </button>
                        <button
                          onClick={() => handleDownloadForm16(payroll.employeeId, payroll.year)}
                          className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
                          title="Download Form 16"
                        >
                          <FileText size={16} />
                          Form 16
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {payrolls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <DollarSign className="mx-auto text-gray-400" size={48} />
          <p className="mt-4 text-gray-600">No payroll records found</p>
        </div>
      )}
    </div>
  )
}

export default Payroll
