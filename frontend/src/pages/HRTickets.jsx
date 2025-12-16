import { useState, useEffect } from 'react'
import { Ticket, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../services/api'

const HRTickets = () => {
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    ticketType: 'SALARY_ISSUE',
    subject: '',
    description: '',
    priority: 'MEDIUM'
  })
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution: ''
  })
  const userRole = localStorage.getItem('userRole')
  const currentUserId = localStorage.getItem('userId')
<<<<<<< HEAD
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
=======
  const userType = localStorage.getItem('userType')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
<<<<<<< HEAD
      const [ticketsData, employeesData] = await Promise.all([
        filter === 'All' ? api.getTickets() : api.getTicketsByStatus(filter),
        api.getEmployees()
      ])
      setTickets(Array.isArray(ticketsData) ? ticketsData : [])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
=======
      
      // Employees see only their own tickets, HR/Admin see all tickets
      let ticketsData
      if (isEmployee && currentUserId) {
        // Employee: get only their tickets
        ticketsData = await api.getEmployeeTickets(parseInt(currentUserId))
        // Filter by status if needed (client-side filtering for employees)
        if (filter !== 'All') {
          ticketsData = Array.isArray(ticketsData) ? ticketsData.filter(t => t.status === filter) : []
        }
      } else {
        // Admin/HR: get all tickets or filter by status
        ticketsData = filter === 'All' ? api.getTickets() : api.getTicketsByStatus(filter)
      }
      
      // Only load employees list for admin/HR (to display employee names)
      const employeesData = isAdmin ? api.getEmployees() : Promise.resolve([])
      
      const [tickets, employees] = await Promise.all([
        Promise.resolve(ticketsData),
        employeesData
      ])
      
      setTickets(Array.isArray(tickets) ? tickets : [])
      setEmployees(Array.isArray(employees) ? employees : [])
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
    try {
      await api.createTicket({
        ...formData,
        employeeId: parseInt(currentUserId)
      })
      await loadData()
      setShowModal(false)
      setFormData({
        ticketType: 'SALARY_ISSUE',
        subject: '',
        description: '',
        priority: 'MEDIUM'
      })
      alert('Ticket created successfully')
    } catch (error) {
      alert('Error creating ticket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async (ticketId) => {
    setLoading(true)
    try {
      await api.updateTicket(ticketId, {
        ...selectedTicket,
        ...updateData
      })
      await loadData()
      setSelectedTicket(null)
      setUpdateData({ status: '', resolution: '' })
      alert('Ticket updated successfully')
    } catch (error) {
      alert('Error updating ticket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId) => {
    try {
      const employee = employees.find(emp => emp && emp.id === employeeId)
      return employee?.name || 'Unknown'
    } catch (err) {
      console.error('Error getting employee name:', err)
      return 'Unknown'
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
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
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
<<<<<<< HEAD
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">HR Ticketing System</h2>
            <p className="text-gray-600 font-medium">Manage employee requests and tickets</p>
          </div>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
            >
              <option value="All">All Tickets</option>
=======
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">HR Ticketing System</h2>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              {isEmployee 
                ? 'Raise queries or issues directly to the HR department' 
                : 'Manage employee requests and tickets'}
            </p>
          </div>
          <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium text-sm md:text-base"
            >
              <option value="All">{isEmployee ? 'All My Tickets' : 'All Tickets'}</option>
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Plus size={20} />
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
            <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No tickets found</p>
          </div>
        )}
        {tickets.map((ticket) => {
          if (!ticket || !ticket.id) return null
          return (
            <div key={ticket.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Ticket className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">{ticket.subject || 'No Subject'}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                      {ticket.priority || 'MEDIUM'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status || 'OPEN')}`}>
                      {ticket.status || 'OPEN'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
<<<<<<< HEAD
                    <strong>Type:</strong> {getTicketTypeLabel(ticket.ticketType || 'SALARY_ISSUE')} | 
                    <strong> Employee:</strong> {getEmployeeName(ticket.employeeId)}
=======
                    <strong>Type:</strong> {getTicketTypeLabel(ticket.ticketType || 'SALARY_ISSUE')}
                    {isAdmin && (
                      <> | <strong> Employee:</strong> {getEmployeeName(ticket.employeeId)}</>
                    )}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                  </p>
                  <p className="text-gray-700">{ticket.description || 'No description'}</p>
                  {ticket.resolution && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Resolution:</p>
                      <p className="text-sm text-green-700">{ticket.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                {ticket.resolvedAt && (
                  <span className="ml-4">Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}</span>
                )}
              </div>
              {isAdmin && ticket.status !== 'CLOSED' && (
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
                >
                  Update
                </button>
              )}
            </div>
          </div>
          )
        })}
      </div>

      {/* Create Ticket Modal - Redesigned */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={24} className="text-blue-600" />
                Create New Ticket
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
                  <select
                    value={formData.ticketType}
                    onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Ticket Modal - Redesigned */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={24} className="text-blue-600" />
                Update Ticket
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={updateData.status || selectedTicket.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <textarea
                  value={updateData.resolution}
                  onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Enter resolution details..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSelectedTicket(null)
                    setUpdateData({ status: '', resolution: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateTicket(selectedTicket.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
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


import { useState, useEffect } from 'react'
import { Ticket, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../services/api'

const HRTickets = () => {
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    ticketType: 'SALARY_ISSUE',
    subject: '',
    description: '',
    priority: 'MEDIUM'
  })
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution: ''
  })
  const userRole = localStorage.getItem('userRole')
  const currentUserId = localStorage.getItem('userId')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ticketsData, employeesData] = await Promise.all([
        filter === 'All' ? api.getTickets() : api.getTicketsByStatus(filter),
        api.getEmployees()
      ])
      setTickets(Array.isArray(ticketsData) ? ticketsData : [])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
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
    try {
      await api.createTicket({
        ...formData,
        employeeId: parseInt(currentUserId)
      })
      await loadData()
      setShowModal(false)
      setFormData({
        ticketType: 'SALARY_ISSUE',
        subject: '',
        description: '',
        priority: 'MEDIUM'
      })
      alert('Ticket created successfully')
    } catch (error) {
      alert('Error creating ticket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async (ticketId) => {
    setLoading(true)
    try {
      await api.updateTicket(ticketId, {
        ...selectedTicket,
        ...updateData
      })
      await loadData()
      setSelectedTicket(null)
      setUpdateData({ status: '', resolution: '' })
      alert('Ticket updated successfully')
    } catch (error) {
      alert('Error updating ticket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId) => {
    try {
      const employee = employees.find(emp => emp && emp.id === employeeId)
      return employee?.name || 'Unknown'
    } catch (err) {
      console.error('Error getting employee name:', err)
      return 'Unknown'
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
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
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
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">HR Ticketing System</h2>
            <p className="text-gray-600 font-medium">Manage employee requests and tickets</p>
          </div>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
            >
              <option value="All">All Tickets</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Plus size={20} />
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
            <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No tickets found</p>
          </div>
        )}
        {tickets.map((ticket) => {
          if (!ticket || !ticket.id) return null
          return (
            <div key={ticket.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Ticket className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">{ticket.subject || 'No Subject'}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                      {ticket.priority || 'MEDIUM'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status || 'OPEN')}`}>
                      {ticket.status || 'OPEN'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Type:</strong> {getTicketTypeLabel(ticket.ticketType || 'SALARY_ISSUE')} | 
                    <strong> Employee:</strong> {getEmployeeName(ticket.employeeId)}
                  </p>
                  <p className="text-gray-700">{ticket.description || 'No description'}</p>
                  {ticket.resolution && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Resolution:</p>
                      <p className="text-sm text-green-700">{ticket.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                {ticket.resolvedAt && (
                  <span className="ml-4">Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}</span>
                )}
              </div>
              {isAdmin && ticket.status !== 'CLOSED' && (
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
                >
                  Update
                </button>
              )}
            </div>
          </div>
          )
        })}
      </div>

      {/* Create Ticket Modal - Redesigned */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={24} className="text-blue-600" />
                Create New Ticket
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
                  <select
                    value={formData.ticketType}
                    onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Ticket Modal - Redesigned */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={24} className="text-blue-600" />
                Update Ticket
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={updateData.status || selectedTicket.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <textarea
                  value={updateData.resolution}
                  onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Enter resolution details..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSelectedTicket(null)
                    setUpdateData({ status: '', resolution: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateTicket(selectedTicket.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
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

