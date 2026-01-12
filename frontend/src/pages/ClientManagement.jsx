import { useState, useEffect } from 'react'
import { Building2, Users, Eye, Search, Loader2, MoreVertical } from 'lucide-react'
import api from '../services/api'

const ClientManagement = () => {
  const [clientCounts, setClientCounts] = useState({})
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientEmployees, setClientEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState(null)

  useEffect(() => {
    loadClientCounts()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenDropdownId(null)
      }
    }
    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  const loadClientCounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getEmployeeCountsByClient()
      if (data.error) {
        setError(data.message || 'Failed to load client data')
        return
      }
      setClientCounts(data.clientCounts || {})
      setUnassignedCount(data.unassignedCount || 0)
      setTotalClients(data.totalClients || 0)
      setTotalEmployees(data.totalEmployees || 0)
    } catch (err) {
      console.error('Error loading client counts:', err)
      setError('Failed to load client employee counts')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeesByClient = async (clientName) => {
    setLoadingEmployees(true)
    setSelectedClient(clientName)
    try {
      const employees = await api.getEmployeesByClient(clientName)
      setClientEmployees(employees || [])
    } catch (err) {
      console.error('Error loading employees by client:', err)
      setError('Failed to load employees for this client')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const filteredClientCounts = Object.entries(clientCounts).filter(([client]) =>
    client.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEmployees = clientEmployees.filter(emp => {
    const name = (emp.name || '').toLowerCase()
    const email = (emp.email || '').toLowerCase()
    const employeeId = (emp.employeeId || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || email.includes(search) || employeeId.includes(search)
  })

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-blue-600" size={24} />
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalClients}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-green-600" size={24} />
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalEmployees}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-purple-600" size={24} />
            <div className="text-sm text-gray-600">Assigned Employees</div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalEmployees - unassignedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-orange-600" size={24} />
            <div className="text-sm text-gray-600">Unassigned</div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{unassignedCount}</div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Client Employee Counts</h3>
          <div className="relative flex-1 max-w-md ml-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
            <p className="mt-2 text-gray-600">Loading client data...</p>
          </div>
        ) : filteredClientCounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No clients found matching your search' : 'No clients found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Client Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Employee Count</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientCounts.map(([client, count]) => (
                  <tr key={client} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-blue-600" size={20} />
                        <span className="text-sm font-medium text-gray-900">{client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="text-green-600" size={18} />
                        <span className="text-sm font-bold text-gray-800">{count}</span>
                        <span className="text-xs text-gray-500">employee{count !== 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right pr-8">
                      <div className="relative dropdown-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdownId(openDropdownId === client ? null : client)
                          }}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDropdownId === client && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                loadEmployeesByClient(client)
                                setOpenDropdownId(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye size={16} className="text-blue-600" />
                              View Employees
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Unassigned Employees Row */}
        {unassignedCount > 0 && (
          <div className="mt-4 border-t-2 border-gray-200 pt-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="text-orange-600" size={20} />
                <span className="text-sm font-medium text-gray-900">Unassigned Employees</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-800">{unassignedCount} employee{unassignedCount !== 1 ? 's' : ''}</span>
                <div className="relative dropdown-menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdownId(openDropdownId === 'unassigned' ? null : 'unassigned')
                    }}
                    className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Actions"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {openDropdownId === 'unassigned' && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClient('Unassigned')
                          setClientEmployees([])
                          // Load unassigned employees (excluding SUPER_ADMIN)
                          api.getEmployees().then(employees => {
                            const unassigned = employees.filter(emp => {
                              const role = (emp.role || '').toUpperCase()
                              return role !== 'SUPER_ADMIN' && (!emp.client || emp.client.trim() === '')
                            })
                            setClientEmployees(unassigned)
                          })
                          setOpenDropdownId(null)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Eye size={16} className="text-orange-600" />
                        View Employees
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee List Modal/Section */}
      {selectedClient && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Employees for: <span className="text-blue-600">{selectedClient}</span>
            </h3>
            <button
              onClick={() => {
                setSelectedClient(null)
                setClientEmployees([])
                setSearchTerm('')
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loadingEmployees ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
              <p className="mt-2 text-gray-600">Loading employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No employees found matching your search' : 'No employees found for this client'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.employeeId || `ID: ${emp.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {emp.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {emp.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {emp.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (emp.employeeStatus === 'Active' || emp.status === 'Active' || emp.active === true)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {emp.employeeStatus || emp.status || (emp.active ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClientManagement

