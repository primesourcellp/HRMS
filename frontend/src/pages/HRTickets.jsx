import { useState, useEffect } from 'react'
import { Ticket, Plus, Filter, CheckCircle, XCircle, Clock, Search, Edit, Trash2, User, Calendar, AlertCircle, MessageSquare, X, Eye, UserCheck, ArrowUpDown } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const HRTickets = () => {
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filter, setFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [formData, setFormData] = useState({
    ticketType: 'SALARY_ISSUE',
    subject: '',
    description: '',
    priority: 'MEDIUM'
  })
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution: '',
    assignedTo: '',
    priority: ''
  })
  const userRole = localStorage.getItem('userRole')
  const currentUserId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

  useEffect(() => {
    loadData()
  }, [filter, priorityFilter, searchTerm, sortBy, sortOrder])

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const usersData = await api.getUsers()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let ticketsData
      if (isEmployee && currentUserId) {
        ticketsData = await api.getEmployeeTickets(parseInt(currentUserId))
      } else {
        ticketsData = await api.getTickets()
      }
      
      // Apply filters
      let filteredTickets = Array.isArray(ticketsData) ? ticketsData : []
      
      if (filter !== 'All') {
        filteredTickets = filteredTickets.filter(t => t.status === filter)
      }
      
      if (priorityFilter !== 'All') {
        filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter)
      }
      
      // Apply search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filteredTickets = filteredTickets.filter(t => 
          t.subject?.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.ticketType?.toLowerCase().includes(searchLower)
        )
      }
      
      // Sort tickets
      filteredTickets.sort((a, b) => {
        let aValue, bValue
        
        switch (sortBy) {
          case 'createdAt':
            aValue = new Date(a.createdAt || 0)
            bValue = new Date(b.createdAt || 0)
            break
          case 'priority':
            const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
            aValue = priorityOrder[a.priority] || 0
            bValue = priorityOrder[b.priority] || 0
            break
          case 'status':
            const statusOrder = { 'OPEN': 1, 'IN_PROGRESS': 2, 'RESOLVED': 3, 'CLOSED': 4 }
            aValue = statusOrder[a.status] || 0
            bValue = statusOrder[b.status] || 0
            break
          default:
            aValue = a[sortBy] || ''
            bValue = b[sortBy] || ''
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
      
      setTickets(filteredTickets)
      
      // Load employees for admin view
      if (isAdmin) {
        const employeesData = await api.getEmployees()
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.message || 'Failed to load tickets')
      setTickets([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await api.createTicket({
        ...formData,
        employeeId: parseInt(currentUserId)
      })
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to create ticket')
      }
      
      await loadData()
      setShowModal(false)
      setFormData({
        ticketType: 'SALARY_ISSUE',
        subject: '',
        description: '',
        priority: 'MEDIUM'
      })
      setSuccessMessage('Ticket created successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error creating ticket')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const updatePayload = {
        ...selectedTicket,
        status: updateData.status || selectedTicket.status,
        resolution: updateData.resolution || selectedTicket.resolution,
        priority: updateData.priority || selectedTicket.priority,
        assignedTo: updateData.assignedTo ? parseInt(updateData.assignedTo) : selectedTicket.assignedTo
      }
      
      const response = await api.updateTicket(selectedTicket.id, updatePayload)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update ticket')
      }
      
      await loadData()
      setSelectedTicket(null)
      setUpdateData({ status: '', resolution: '', assignedTo: '', priority: '' })
      setSuccessMessage('Ticket updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error updating ticket')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await api.deleteTicket(ticketId)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to delete ticket')
      }
      
      await loadData()
      setSuccessMessage('Ticket deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error deleting ticket')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const openUpdateModal = (ticket) => {
    setSelectedTicket(ticket)
    setUpdateData({
      status: ticket.status || '',
      resolution: ticket.resolution || '',
      assignedTo: ticket.assignedTo ? ticket.assignedTo.toString() : '',
      priority: ticket.priority || ''
    })
  }

  const openViewModal = (ticket) => {
    setSelectedTicket(ticket)
    setShowViewModal(true)
  }

  const getEmployeeName = (employeeId) => {
    try {
      const employee = employees.find(emp => emp && emp.id === employeeId)
      if (employee) {
        return employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown'
      }
      return 'Unknown'
    } catch (err) {
      console.error('Error getting employee name:', err)
      return 'Unknown'
    }
  }

  const getUserName = (userId) => {
    try {
      const user = users.find(u => u && u.id === userId)
      return user ? (user.name || user.email || 'Unknown') : 'Unassigned'
    } catch (err) {
      return 'Unassigned'
    }
  }

  const getTicketTypeLabel = (type) => {
    const labels = {
      'SALARY_ISSUE': 'Salary Issue',
      'LEAVE_CORRECTION': 'Leave Correction',
      'ATTENDANCE_CORRECTION': 'Attendance Correction',
      'SYSTEM_ACCESS': 'System Access',
      'HARDWARE_REQUEST': 'Hardware Request'
    }
    return labels[type] || type
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800 border-blue-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
      'URGENT': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-blue-100 text-blue-800 border-blue-200',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'RESOLVED': 'bg-green-100 text-green-800 border-green-200',
      'CLOSED': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return format(date, 'MMM dd, yyyy HH:mm')
    } catch (e) {
      return dateString
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-2 flex items-center gap-2 sm:gap-3">
              <Ticket className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              <span className="break-words">HR Ticketing System</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              {isEmployee 
                ? 'Raise queries or issues directly to the HR department' 
                : 'Manage employee requests and tickets'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-sm sm:text-base w-full md:w-auto"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Ticket</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total</div>
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Open</div>
            <div className="text-2xl font-bold text-blue-800">{stats.open}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">In Progress</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Resolved</div>
            <div className="text-2xl font-bold text-green-800">{stats.resolved}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Closed</div>
            <div className="text-2xl font-bold text-gray-800">{stats.closed}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
            <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No tickets found</p>
            {searchTerm && (
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
            )}
          </div>
        )}
        {tickets.map((ticket) => {
          if (!ticket || !ticket.id) return null
          return (
            <div key={ticket.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Ticket className="text-blue-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-800">{ticket.subject || 'No Subject'}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                      {ticket.priority || 'MEDIUM'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status || 'OPEN')}`}>
                      {ticket.status || 'OPEN'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <AlertCircle size={16} />
                      <strong>Type:</strong> {getTicketTypeLabel(ticket.ticketType || 'SALARY_ISSUE')}
                    </span>
                    {isAdmin && (
                      <span className="flex items-center gap-1">
                        <User size={16} />
                        <strong>Employee:</strong> {getEmployeeName(ticket.employeeId)}
                      </span>
                    )}
                    {isAdmin && ticket.assignedTo && (
                      <span className="flex items-center gap-1">
                        <UserCheck size={16} />
                        <strong>Assigned to:</strong> {getUserName(ticket.assignedTo)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-2">{ticket.description || 'No description'}</p>
                  {ticket.resolution && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-green-800 mb-1">Resolution:</p>
                      <p className="text-sm text-green-700">{ticket.resolution}</p>
                      {ticket.resolvedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Resolved on: {formatDate(ticket.resolvedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                    <span>Last updated: {formatDate(ticket.updatedAt)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openViewModal(ticket)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  {isAdmin && ticket.status !== 'CLOSED' && (
                    <button
                      onClick={() => openUpdateModal(ticket)}
                      className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-100 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Edit size={16} />
                      Update
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={28} className="text-blue-600" />
                Create New Ticket
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type *</label>
                  <select
                    value={formData.ticketType}
                    onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="SALARY_ISSUE">Salary Issue</option>
                    <option value="LEAVE_CORRECTION">Leave Correction</option>
                    <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
                    <option value="SYSTEM_ACCESS">System Access</option>
                    <option value="HARDWARE_REQUEST">Hardware Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ticket subject"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={5}
                  placeholder="Describe your issue or request in detail..."
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowViewModal(false)
          setSelectedTicket(null)
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={28} className="text-blue-600" />
                Ticket Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedTicket(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
                  <p className="text-lg font-semibold text-gray-800">{selectedTicket.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                  <p className="text-lg font-semibold text-gray-800">{getTicketTypeLabel(selectedTicket.ticketType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                {isAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Employee</label>
                      <p className="text-lg font-semibold text-gray-800">{getEmployeeName(selectedTicket.employeeId)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Assigned To</label>
                      <p className="text-lg font-semibold text-gray-800">{getUserName(selectedTicket.assignedTo) || 'Unassigned'}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                  <p className="text-sm text-gray-800">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                {selectedTicket.updatedAt && selectedTicket.updatedAt !== selectedTicket.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Last Updated</label>
                    <p className="text-sm text-gray-800">{formatDate(selectedTicket.updatedAt)}</p>
                  </div>
                )}
                {selectedTicket.resolvedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Resolved</label>
                    <p className="text-sm text-gray-800">{formatDate(selectedTicket.resolvedAt)}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">{selectedTicket.description || 'No description'}</p>
              </div>
              {selectedTicket.resolution && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Resolution</label>
                  <p className="text-gray-800 bg-green-50 p-4 rounded-lg border border-green-200">{selectedTicket.resolution}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedTicket(null)
                }}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Ticket Modal */}
      {selectedTicket && !showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={28} className="text-blue-600" />
                Update Ticket
              </h3>
              <button
                onClick={() => {
                  setSelectedTicket(null)
                  setUpdateData({ status: '', resolution: '', assignedTo: '', priority: '' })
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Ticket: {selectedTicket.subject}</p>
                <p className="text-xs text-blue-600">Type: {getTicketTypeLabel(selectedTicket.ticketType)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={updateData.status || selectedTicket.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={updateData.priority || selectedTicket.priority}
                    onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <select
                    value={updateData.assignedTo || (selectedTicket.assignedTo ? selectedTicket.assignedTo.toString() : '')}
                    onChange={(e) => setUpdateData({ ...updateData, assignedTo: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                <textarea
                  value={updateData.resolution}
                  onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={5}
                  placeholder="Enter resolution details..."
                />
                <p className="text-xs text-gray-500 mt-1">Required when status is Resolved or Closed</p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setSelectedTicket(null)
                    setUpdateData({ status: '', resolution: '', assignedTo: '', priority: '' })
                  }}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTicket}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRTickets
