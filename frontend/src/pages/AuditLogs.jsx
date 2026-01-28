import { useState, useEffect } from 'react'
import { 
  FileText, Search, Filter, Download, Calendar, User, 
  Building, Activity, Clock, X, ChevronDown, ChevronUp 
} from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(50)
  const [totalPages, setTotalPages] = useState(0)
  
  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Entity types for filter
  const entityTypes = [
    'all', 'PAYROLL', 'SALARY_STRUCTURE', 'LEAVE', 'ATTENDANCE', 
    'EMPLOYEE', 'AUTH', 'SHIFT', 'HR_TICKET'
  ]
  
  // Actions for filter
  const actions = [
    'all', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 
    'FINALIZE', 'LOGIN', 'LOGOUT', 'SUBMIT', 'ASSIGN'
  ]

  useEffect(() => {
    loadAuditLogs()
  }, [page, size, entityTypeFilter, actionFilter, startDate, endDate])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        page,
        size
      }
      
      if (entityTypeFilter !== 'all') {
        filters.entityType = entityTypeFilter
      }
      
      if (actionFilter !== 'all') {
        filters.action = actionFilter
      }
      
      if (startDate) {
        filters.startDate = new Date(startDate).toISOString()
      }
      
      if (endDate) {
        // Set to end of day
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        filters.endDate = endDateTime.toISOString()
      }
      
      const response = await api.getAuditLogsComprehensive(filters)
      setLogs(response.logs || [])
      setTotal(response.total || 0)
      setTotalPages(response.totalPages || 0)
    } catch (err) {
      console.error('Error loading audit logs:', err)
      setError(err.message || 'Failed to load audit logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (exportFormat = 'csv') => {
    try {
      setLoading(true)
      const filters = {}
      
      if (entityTypeFilter !== 'all') {
        filters.entityType = entityTypeFilter
      }
      
      if (startDate) {
        filters.startDate = new Date(startDate).toISOString()
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        filters.endDate = endDateTime.toISOString()
      }
      
      const data = await api.exportAuditLogs(filters, exportFormat)
      
      // For now, we'll create a simple CSV export on the frontend
      // In production, you'd want the backend to generate PDF/Excel
      const csvContent = convertToCSV(data.logs || [])
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error exporting audit logs:', err)
      setError(err.message || 'Failed to export audit logs')
    } finally {
      setLoading(false)
    }
  }

  const convertToCSV = (logs) => {
    const headers = ['Timestamp', 'Entity Type', 'Action', 'User', 'Role', 'Employee', 'Description', 'IP Address']
    const rows = logs.map(log => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.entityType || '',
      log.action || '',
      log.userName || '',
      log.userRole || '',
      log.employeeName || '',
      log.description || '',
      log.ipAddress || ''
    ])
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const getActionBadgeColor = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800 border-green-200',
      'UPDATE': 'bg-blue-100 text-blue-800 border-blue-200',
      'DELETE': 'bg-red-100 text-red-800 border-red-200',
      'APPROVE': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'REJECT': 'bg-orange-100 text-orange-800 border-orange-200',
      'FINALIZE': 'bg-purple-100 text-purple-800 border-purple-200',
      'LOGIN': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'LOGOUT': 'bg-gray-100 text-gray-800 border-gray-200',
      'SUBMIT': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'ASSIGN': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEntityTypeIcon = (entityType) => {
    const icons = {
      'PAYROLL': FileText,
      'SALARY_STRUCTURE': FileText,
      'LEAVE': Calendar,
      'ATTENDANCE': Clock,
      'EMPLOYEE': User,
      'AUTH': Activity,
      'SHIFT': Clock,
      'HR_TICKET': FileText
    }
    return icons[entityType] || FileText
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      (log.userName && log.userName.toLowerCase().includes(searchLower)) ||
      (log.employeeName && log.employeeName.toLowerCase().includes(searchLower)) ||
      (log.description && log.description.toLowerCase().includes(searchLower)) ||
      (log.entityType && log.entityType.toLowerCase().includes(searchLower)) ||
      (log.action && log.action.toLowerCase().includes(searchLower))
    )
  })

  const clearFilters = () => {
    setEntityTypeFilter('all')
    setActionFilter('all')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  const hasActiveFilters = entityTypeFilter !== 'all' || actionFilter !== 'all' || searchTerm || startDate || endDate

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Audit Logs</h2>
                <p className="text-sm text-gray-600 mt-0.5">Track all system activities and changes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                disabled={loading}
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Filter size={18} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex-1 max-w-md ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by user, employee, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value)
                  setPage(0)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setPage(0)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {actions.map(action => (
                  <option key={action} value={action}>
                    {action === 'all' ? 'All Actions' : action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(0)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(0)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Showing</p>
          <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Page</p>
          <p className="text-2xl font-bold text-gray-900">{page + 1} / {totalPages || 1}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Page Size</p>
          <select
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value))
              setPage(0)
            }}
            className="text-2xl font-bold text-gray-900 border-0 focus:outline-none focus:ring-0"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-600">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="text-gray-400 mx-auto mb-3" size={48} />
            <p className="text-gray-600 font-medium">No audit logs found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const EntityIcon = getEntityTypeIcon(log.entityType)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <EntityIcon className="text-gray-400" size={16} />
                          <span className="text-sm text-gray-900">{log.entityType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                          {log.action || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.userName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{log.userRole || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.employeeName || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-md truncate" title={log.description}>
                          {log.description || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{log.ipAddress || '-'}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {page * size + 1} to {Math.min((page + 1) * size, total)} of {total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogs
