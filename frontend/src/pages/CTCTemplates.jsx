import { useState, useEffect } from 'react'
import { 
  DollarSign, Plus, Edit, Trash2, Search, X, FileText, 
  Building2, Settings, CheckCircle, XCircle, Loader2,
  Info, AlertCircle
} from 'lucide-react'
import api from '../services/api'

const CTCTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientFilter, setClientFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [clients, setClients] = useState([])
  
  const [formData, setFormData] = useState({
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

  const userRole = localStorage.getItem('userRole')
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isHRAdmin = userRole === 'HR_ADMIN'
  const canAccess = isSuperAdmin || isHRAdmin

  useEffect(() => {
    if (canAccess) {
      loadData()
      loadClients()
    }
  }, [canAccess])

  const loadData = async () => {
    try {
      setLoading(true)
      const templatesData = await api.getCTCTemplates(null, false) // Get all templates
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
    } catch (error) {
      console.error('Error loading CTC templates:', error)
      alert('Error loading templates: ' + (error.message || 'Failed to load'))
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const clientsList = await api.getClients()
      setClients(Array.isArray(clientsList) ? clientsList : [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
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
      setEditingTemplate(null)
      setFormData({
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
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingTemplate) {
        await api.updateCTCTemplate(editingTemplate.id, formData)
        alert('CTC Template updated successfully!')
      } else {
        await api.createCTCTemplate(formData)
        alert('CTC Template created successfully!')
      }
      await loadData()
      setShowModal(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template: ' + (error.message || 'Failed to save'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    try {
      setLoading(true)
      await api.deleteCTCTemplate(id)
      alert('Template deleted successfully!')
      await loadData()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template: ' + (error.message || 'Failed to delete'))
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchTerm || 
      t.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClient = clientFilter === 'All' || t.clientName === clientFilter
    return matchesSearch && matchesClient
  })

  if (!canAccess) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page. Only SUPER_ADMIN and HR_ADMIN can access CTC Templates.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 bg-gray-50 p-2 sm:p-3 md:p-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <DollarSign size={28} className="text-blue-600" />
              CTC Template Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage client-specific CTC templates for automatic salary structure generation
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
          >
            <Plus size={20} />
            Create Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search templates by name, client, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Clients</option>
            {clients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading && templates.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Templates Found</h3>
            <p className="text-gray-500 mb-4">
              {templates.length === 0 
                ? 'Create your first CTC template to get started'
                : 'No templates match your search criteria'}
            </p>
            {templates.length === 0 && (
              <button
                onClick={() => handleOpenModal()}
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
                {filteredTemplates.map(template => (
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(template)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Settings size={28} className="text-blue-600" />
                {editingTemplate ? 'Edit CTC Template' : 'Create CTC Template'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name *</label>
                    <input
                      type="text"
                      value={formData.templateName}
                      onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name *</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      list="clients-list"
                    />
                    <datalist id="clients-list">
                      {clients.map(client => (
                        <option key={client} value={client} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      value={formData.basicSalaryPercentage}
                      onChange={(e) => setFormData({ ...formData, basicSalaryPercentage: parseFloat(e.target.value) || 0 })}
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
                      value={formData.hraPercentage}
                      onChange={(e) => setFormData({ ...formData, hraPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
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
                        value={formData.transportAllowancePercentage || ''}
                        onChange={(e) => setFormData({ ...formData, transportAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
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
                        value={formData.transportAllowanceFixed || ''}
                        onChange={(e) => setFormData({ ...formData, transportAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
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
                        value={formData.medicalAllowancePercentage || ''}
                        onChange={(e) => setFormData({ ...formData, medicalAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
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
                        value={formData.medicalAllowanceFixed || ''}
                        onChange={(e) => setFormData({ ...formData, medicalAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
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
                        value={formData.specialAllowancePercentage || ''}
                        onChange={(e) => setFormData({ ...formData, specialAllowancePercentage: e.target.value ? parseFloat(e.target.value) : null })}
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
                        value={formData.specialAllowanceFixed || ''}
                        onChange={(e) => setFormData({ ...formData, specialAllowanceFixed: e.target.value ? parseFloat(e.target.value) : null })}
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
                      value={formData.otherAllowancesPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, otherAllowancesPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={formData.pfPercentage}
                      onChange={(e) => setFormData({ ...formData, pfPercentage: parseFloat(e.target.value) || 0 })}
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
                      value={formData.esiPercentage}
                      onChange={(e) => setFormData({ ...formData, esiPercentage: parseFloat(e.target.value) || 0 })}
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
                      value={formData.esiApplicableThreshold}
                      onChange={(e) => setFormData({ ...formData, esiApplicableThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Tax (Fixed ₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.professionalTaxAmount || ''}
                      onChange={(e) => setFormData({ ...formData, professionalTaxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">TDS % (of Gross)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tdsPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, tdsPercentage: e.target.value ? parseFloat(e.target.value) : null })}
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
                      value={formData.otherDeductionsPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, otherDeductionsPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Active (Template will be available for use)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CTCTemplates

