import { useState, useEffect } from 'react'
import { Building2, Users, Eye, Search, Loader2, MoreVertical, Receipt, Plus, Edit, Trash2, CheckCircle, XCircle, FileText, X, Info } from 'lucide-react'
import api from '../services/api'

const ClientManagement = () => {
  const [activeTab, setActiveTab] = useState('clients') // 'clients' or 'ctcTemplates'
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
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  
  // CTC Templates State
  const userRole = localStorage.getItem('userRole')
  const userRoleUpper = userRole ? userRole.toUpperCase() : ''
  const isSuperAdmin = userRoleUpper === 'SUPER_ADMIN'
  const isHRAdmin = userRoleUpper === 'HR_ADMIN'
  const canAccessCTCTemplates = isSuperAdmin || isHRAdmin
  const [ctcTemplates, setCtcTemplates] = useState([])
  const [loadingCtcTemplates, setLoadingCtcTemplates] = useState(false)
  const [ctcTemplateSearchTerm, setCtcTemplateSearchTerm] = useState('')
  const [ctcTemplateClientFilter, setCtcTemplateClientFilter] = useState('All')
  const [showCtcTemplateModal, setShowCtcTemplateModal] = useState(false)
  const [editingCtcTemplate, setEditingCtcTemplate] = useState(null)
  const [ctcTemplateClients, setCtcTemplateClients] = useState([])
  const [openCtcTemplateDropdownId, setOpenCtcTemplateDropdownId] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({})
  const [viewingCtcTemplate, setViewingCtcTemplate] = useState(null)
  const [showViewCtcTemplateModal, setShowViewCtcTemplateModal] = useState(false)
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

  useEffect(() => {
    loadClientCounts()
  }, [])

  useEffect(() => {
    if (canAccessCTCTemplates && activeTab === 'ctcTemplates') {
      loadCtcTemplates()
      loadCtcClients()
    }
  }, [canAccessCTCTemplates, activeTab])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenDropdownId(null)
      }
      if (openCtcTemplateDropdownId && !event.target.closest('.dropdown-menu-container')) {
        setOpenCtcTemplateDropdownId(null)
      }
    }
    if (openDropdownId !== null || openCtcTemplateDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId, openCtcTemplateDropdownId])
  
  const loadCtcTemplates = async () => {
    try {
      setLoadingCtcTemplates(true)
      setError(null)
      console.log('Loading CTC templates...')
      const templates = await api.getCTCTemplates(null, false)
      console.log('Loaded CTC templates:', templates)
      if (Array.isArray(templates)) {
        setCtcTemplates(templates)
        if (templates.length === 0) {
          console.log('No CTC templates found in the database')
        }
      } else {
        console.warn('Unexpected templates format:', templates)
        setCtcTemplates([])
      }
    } catch (error) {
      console.error('Error loading CTC templates:', error)
      const errorMessage = error.message || 'Unknown error'
      setError('Failed to load CTC templates: ' + errorMessage)
      setCtcTemplates([])
      // Show alert for access denied errors
      if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
        alert('Access Denied: ' + errorMessage)
      }
    } finally {
      setLoadingCtcTemplates(false)
    }
  }
  
  const loadCtcClients = async () => {
    try {
      const clients = await api.getClients()
      setCtcTemplateClients(Array.isArray(clients) ? clients : [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }
  
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
      setLoadingCtcTemplates(true)
      const submitData = {
        ...ctcTemplateFormData,
        basicSalaryPercentage: ctcTemplateFormData.basicSalaryPercentage === '' || ctcTemplateFormData.basicSalaryPercentage === null ? 0 : parseFloat(ctcTemplateFormData.basicSalaryPercentage) || 0,
        hraPercentage: ctcTemplateFormData.hraPercentage === '' || ctcTemplateFormData.hraPercentage === null ? 0 : parseFloat(ctcTemplateFormData.hraPercentage) || 0,
        pfPercentage: ctcTemplateFormData.pfPercentage === '' || ctcTemplateFormData.pfPercentage === null ? 0 : parseFloat(ctcTemplateFormData.pfPercentage) || 0,
        esiPercentage: ctcTemplateFormData.esiPercentage === '' || ctcTemplateFormData.esiPercentage === null ? null : parseFloat(ctcTemplateFormData.esiPercentage) || null,
        esiApplicableThreshold: ctcTemplateFormData.esiApplicableThreshold === '' || ctcTemplateFormData.esiApplicableThreshold === null ? null : parseFloat(ctcTemplateFormData.esiApplicableThreshold) || null
      }
      
      if (editingCtcTemplate) {
        await api.updateCTCTemplate(editingCtcTemplate.id, submitData)
        alert('CTC Template updated successfully!')
      } else {
        await api.createCTCTemplate(submitData)
        alert('CTC Template created successfully!')
      }
      await loadCtcTemplates()
      setShowCtcTemplateModal(false)
      setEditingCtcTemplate(null)
    } catch (error) {
      console.error('Error saving CTC template:', error)
      alert('Error saving template: ' + (error.message || 'Failed to save'))
    } finally {
      setLoadingCtcTemplates(false)
    }
  }
  
  const handleViewCtcTemplate = (template) => {
    setViewingCtcTemplate(template)
    setShowViewCtcTemplateModal(true)
  }
  
  const handleDeleteCtcTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    try {
      setLoadingCtcTemplates(true)
      await api.deleteCTCTemplate(id)
      alert('Template deleted successfully!')
      await loadCtcTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template: ' + (error.message || 'Failed to delete'))
    } finally {
      setLoadingCtcTemplates(false)
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
      <div className="bg-white rounded-xl shadow-md p-4">
        <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
        <p className="text-gray-600 mt-1">Manage clients, employees, and CTC templates</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building2 size={18} />
            Clients
          </button>
          {canAccessCTCTemplates && (
            <button
              onClick={() => setActiveTab('ctcTemplates')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'ctcTemplates'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Receipt size={18} />
              CTC Templates
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Clients Tab Content */}
      {activeTab === 'clients' && (
        <>

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateClientModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              Create Client
            </button>
            <div className="relative flex-1 max-w-md">
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
                            const button = e.currentTarget
                            const rect = button.getBoundingClientRect()
                            const dropdownHeight = 60
                            const spaceBelow = window.innerHeight - rect.bottom
                            const spaceAbove = rect.top
                            const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

                            setDropdownPosition(prev => ({
                              ...prev,
                              [`client-${client}`]: {
                                showAbove,
                                top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                right: window.innerWidth - rect.right
                              }
                            }))

                            setOpenDropdownId(openDropdownId === client ? null : client)
                          }}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDropdownId === client && dropdownPosition[`client-${client}`] && (
                          <div
                            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56"
                            style={{
                              zIndex: 9999,
                              top: `${dropdownPosition[`client-${client}`].top}px`,
                              right: `${dropdownPosition[`client-${client}`].right}px`
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
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
                      const button = e.currentTarget
                      const rect = button.getBoundingClientRect()
                      const dropdownHeight = 60
                      const spaceBelow = window.innerHeight - rect.bottom
                      const spaceAbove = rect.top
                      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

                      setDropdownPosition(prev => ({
                        ...prev,
                        [`client-unassigned`]: {
                          showAbove,
                          top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                          right: window.innerWidth - rect.right
                        }
                      }))

                      setOpenDropdownId(openDropdownId === 'unassigned' ? null : 'unassigned')
                    }}
                    className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Actions"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {openDropdownId === 'unassigned' && dropdownPosition[`client-unassigned`] && (
                    <div
                      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56"
                      style={{
                        zIndex: 9999,
                        top: `${dropdownPosition[`client-unassigned`].top}px`,
                        right: `${dropdownPosition[`client-unassigned`].right}px`
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
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
      </>
      )}

      {/* CTC Templates Tab Content */}
      {canAccessCTCTemplates && activeTab === 'ctcTemplates' && (
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
            {loadingCtcTemplates && filteredCtcTemplates.length === 0 ? (
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
                        <td className="px-4 py-3 text-right pr-8">
                          <div className="relative inline-block dropdown-menu-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const button = e.currentTarget
                                const rect = button.getBoundingClientRect()
                                const spaceBelow = window.innerHeight - rect.bottom
                                const spaceAbove = rect.top
                                const dropdownHeight = 120
                                
                                const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
                                
                                setDropdownPosition(prev => ({
                                  ...prev,
                                  [`ctc-${template.id}`]: {
                                    showAbove,
                                    top: showAbove ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                    right: window.innerWidth - rect.right
                                  }
                                }))
                                setOpenCtcTemplateDropdownId(openCtcTemplateDropdownId === template.id ? null : template.id)
                              }}
                              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Actions"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {openCtcTemplateDropdownId === template.id && dropdownPosition[`ctc-${template.id}`] && (
                              <div 
                                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48"
                                style={{ 
                                  zIndex: 9999,
                                  top: `${dropdownPosition[`ctc-${template.id}`].top}px`,
                                  right: `${dropdownPosition[`ctc-${template.id}`].right}px`
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewCtcTemplate(template)
                                    setOpenCtcTemplateDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Eye size={16} className="text-green-600" />
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenCtcTemplateModal(template)
                                    setOpenCtcTemplateDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Edit size={16} className="text-blue-600" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCtcTemplate(template.id)
                                    setOpenCtcTemplateDropdownId(null)
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* CTC Template Modal */}
      {showCtcTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCtcTemplate ? 'Edit CTC Template' : 'Create CTC Template'}
              </h2>
              <button
                onClick={() => {
                  setShowCtcTemplateModal(false)
                  setEditingCtcTemplate(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCtcTemplateSubmit} className="space-y-5 p-6">
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
                      value={ctcTemplateFormData.basicSalaryPercentage === 0 || ctcTemplateFormData.basicSalaryPercentage === '0' ? '' : ctcTemplateFormData.basicSalaryPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, basicSalaryPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
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
                      value={ctcTemplateFormData.hraPercentage === 0 || ctcTemplateFormData.hraPercentage === '0' ? '' : ctcTemplateFormData.hraPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, hraPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
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
                      value={ctcTemplateFormData.pfPercentage === 0 || ctcTemplateFormData.pfPercentage === '0' ? '' : ctcTemplateFormData.pfPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, pfPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
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
                      value={ctcTemplateFormData.esiPercentage === 0 || ctcTemplateFormData.esiPercentage === '0' ? '' : ctcTemplateFormData.esiPercentage}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
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
                      value={ctcTemplateFormData.esiApplicableThreshold === 0 || ctcTemplateFormData.esiApplicableThreshold === '0' ? '' : ctcTemplateFormData.esiApplicableThreshold}
                      onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, esiApplicableThreshold: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
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

              {/* Status */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={ctcTemplateFormData.active}
                    onChange={(e) => setCtcTemplateFormData({ ...ctcTemplateFormData, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm font-semibold text-gray-700">
                    Active Template
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCtcTemplateModal(false)
                    setEditingCtcTemplate(null)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingCtcTemplates}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingCtcTemplates ? 'Saving...' : editingCtcTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View CTC Template Modal */}
      {showViewCtcTemplateModal && viewingCtcTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-800">CTC Template Details</h2>
              <button
                onClick={() => {
                  setShowViewCtcTemplateModal(false)
                  setViewingCtcTemplate(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Template Name</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.templateName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Client Name</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.clientName || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Description</label>
                    <p className="text-gray-800">{viewingCtcTemplate.description || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Status</label>
                    <p className="text-gray-800">
                      {viewingCtcTemplate.active ? (
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
                    </p>
                  </div>
                </div>
              </div>

              {/* Salary Components */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Salary Components</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Basic Salary %</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.basicSalaryPercentage}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">HRA % (of Basic)</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.hraPercentage}%</p>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Deductions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">PF % (of Basic)</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.pfPercentage}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">ESI % (of Gross)</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.esiPercentage || 'N/A'}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">ESI Threshold</label>
                    <p className="text-gray-800 font-medium">₹{viewingCtcTemplate.esiApplicableThreshold || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Professional Tax</label>
                    <p className="text-gray-800 font-medium">₹{viewingCtcTemplate.professionalTaxAmount || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">TDS % (of Gross)</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.tdsPercentage || 'N/A'}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Other Deductions %</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.otherDeductionsPercentage || 'N/A'}%</p>
                  </div>
                </div>
              </div>

              {/* Allowances */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Allowances</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Transport Allowance</label>
                    <p className="text-gray-800 font-medium">
                      {viewingCtcTemplate.transportAllowanceFixed 
                        ? `₹${viewingCtcTemplate.transportAllowanceFixed}` 
                        : viewingCtcTemplate.transportAllowancePercentage 
                        ? `${viewingCtcTemplate.transportAllowancePercentage}%` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Medical Allowance</label>
                    <p className="text-gray-800 font-medium">
                      {viewingCtcTemplate.medicalAllowanceFixed 
                        ? `₹${viewingCtcTemplate.medicalAllowanceFixed}` 
                        : viewingCtcTemplate.medicalAllowancePercentage 
                        ? `${viewingCtcTemplate.medicalAllowancePercentage}%` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Special Allowance</label>
                    <p className="text-gray-800 font-medium">
                      {viewingCtcTemplate.specialAllowanceFixed 
                        ? `₹${viewingCtcTemplate.specialAllowanceFixed}` 
                        : viewingCtcTemplate.specialAllowancePercentage 
                        ? `${viewingCtcTemplate.specialAllowancePercentage}%` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Other Allowances</label>
                    <p className="text-gray-800 font-medium">{viewingCtcTemplate.otherAllowancesPercentage || 'N/A'}%</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewCtcTemplateModal(false)
                    setViewingCtcTemplate(null)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewCtcTemplateModal(false)
                    handleOpenCtcTemplateModal(viewingCtcTemplate)
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Create New Client</h2>
              <button
                onClick={() => {
                  setShowCreateClientModal(false)
                  setNewClientName('')
                  setError(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newClientName.trim()) {
                  setError('Client name is required')
                  return
                }

                try {
                  setCreatingClient(true)
                  setError(null)
                  const response = await api.createClient(newClientName.trim())
                  
                  if (response.success) {
                    alert('Client created successfully! You can now assign employees to this client.')
                    setShowCreateClientModal(false)
                    setNewClientName('')
                    await loadClientCounts()
                    if (canAccessCTCTemplates) {
                      await loadCtcClients()
                    }
                  } else {
                    setError(response.message || 'Failed to create client')
                  }
                } catch (err) {
                  console.error('Error creating client:', err)
                  setError(err.message || 'Failed to create client')
                } finally {
                  setCreatingClient(false)
                }
              }}
              className="p-6 space-y-4"
            >
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => {
                    setNewClientName(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter client name"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Note: The client will appear in the list once you assign an employee to it.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateClientModal(false)
                    setNewClientName('')
                    setError(null)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={creatingClient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClient || !newClientName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingClient ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientManagement

