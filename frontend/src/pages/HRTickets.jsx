import { useState, useEffect } from 'react'
import { Ticket, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../services/api'

const HRTickets = () => {
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(false)
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
      const [ticketsData, employeesData] = await Promise.all([
        filter === 'All' ? api.getTickets() : api.getTicketsByStatus(filter),
        api.getEmployees()
      ])
      setTickets(ticketsData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading data:', error)
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
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.name || 'Unknown'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">HR Ticketing System</h2>
          <p className="text-gray-600 mt-1">Manage employee requests and tickets</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Tickets</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Ticket className="text-primary-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">{ticket.subject}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Type:</strong> {getTicketTypeLabel(ticket.ticketType)} | 
                  <strong> Employee:</strong> {getEmployeeName(ticket.employeeId)}
                </p>
                <p className="text-gray-700">{ticket.description}</p>
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
                Created: {new Date(ticket.createdAt).toLocaleDateString()}
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
        ))}
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Create New Ticket</h3>
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

      {/* Update Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Update Ticket</h3>
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

