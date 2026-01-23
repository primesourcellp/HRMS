import { useState, useEffect } from 'react'
import { Ticket, Plus, Filter, CheckCircle, XCircle, Clock, Search, Edit, Trash2, User, Calendar, AlertCircle, MessageSquare, X, Eye, UserCheck, ArrowUpDown, PlusCircle, Activity } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import { useLocation } from 'react-router-dom'

const HRTickets = () => {
  const location = useLocation()
  const isMyTicketsRoute = location.pathname === '/my-tickets'
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
    ticketType: 'PAYROLL',
    subCategory: '',
    subject: '',
    description: '',
    priority: 'MEDIUM',
    employeeId: '',
    assignedTo: '',
    assignedRole: '',
    ticketId: ''
  })
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution: '',
    assignedTo: '',
    priority: ''
  })
  const [editData, setEditData] = useState({
    subject: '',
    description: '',
    ticketType: '',
    subCategory: '',
    priority: ''
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [timelineData, setTimelineData] = useState([])
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [similarTickets, setSimilarTickets] = useState([])
  const userRole = localStorage.getItem('userRole')
  const currentUserId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN'
  const isManager = userRole === 'MANAGER'
  const isFinance = userRole === 'FINANCE'
  // Check if employee: userType === 'employee' OR userRole === 'EMPLOYEE'
  const isEmployee = userType === 'employee' || userRole === 'EMPLOYEE'
  // Users who can manage tickets (all non-employee roles)
  const canManageTickets = isAdmin || isManager || isFinance

  // Ticket Categories and Sub-categories
  const ticketCategories = {
    'PAYROLL': ['Salary Delay', 'Payslip Issue', 'Tax Calculation', 'Bonus Issue', 'Deduction Query'],
    'LEAVE': ['Leave Balance', 'Leave Approval', 'Leave Cancellation', 'Leave Encashment', 'Compensatory Off'],
    'IT_SUPPORT': ['System Access', 'Hardware Issue', 'Software Installation', 'Network Problem', 'Password Reset'],
    'GENERAL_QUERY': ['Policy Information', 'HR Process', 'Documentation', 'Benefits Query', 'General Help'],
    'DOCUMENTS': ['Offer Letter', 'Experience Certificate', 'Salary Certificate', 'Relieving Letter', 'Other Documents']
  }

  // Priority SLA Configuration
  const prioritySLA = {
    'HIGH': '24 hours',
    'MEDIUM': '48 hours',
    'LOW': '72 hours',
    'URGENT': '4 hours'
  }

  // Generate Auto Ticket ID
  const generateTicketId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `TK-${timestamp}-${random}`
  }

  // Generate and display ticket ID when modal opens
  const [displayTicketId, setDisplayTicketId] = useState('')

  const openCreateModal = () => {
    // Finance can create tickets only from "My Tickets" page
    if (isFinance && !isMyTicketsRoute) {
      return
    }
    const newTicketId = generateTicketId()
    setDisplayTicketId(newTicketId)
    setFormData({
      ticketType: 'PAYROLL',
      subCategory: '',
      subject: '',
      description: '',
      priority: 'MEDIUM',
      // Employees always create for self. Finance creates for self only on /my-tickets.
      employeeId: (isEmployee || isMyTicketsRoute) ? currentUserId : '',
      assignedTo: '',
      assignedRole: '',
      ticketId: newTicketId
    })
    // Clear duplicate warnings when opening new ticket modal
    setDuplicateWarning(null)
    setSimilarTickets([])
    setShowModal(true)
  }

  // Helper functions to filter users by role
  const getUsersByRole = (role) => {
    if (!users || !Array.isArray(users)) return []
    
    return users.filter(user => {
      const userRole = user.role || user.userRole
      
      if (role === 'ADMIN') {
        return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
      }
      return userRole === role
    })
  }

  const getRoleLabel = (role) => {
    
    const labels = {
      'HR_EXECUTIVE': 'HR Executive',
      'PAYROLL_TEAM': 'Payroll Team',
      'ADMIN': 'Admin'
    }
    return labels[role] || role
  }

  // Timeline helper functions
  const getTimelineIcon = (type) => {
    const icons = {
      'CREATED': <PlusCircle className="text-green-600" size={16} />,
      'STATUS_CHANGE': <Activity className="text-blue-600" size={16} />,
      'ASSIGNED': <UserCheck className="text-purple-600" size={16} />,
      'UPDATED': <Edit className="text-orange-600" size={16} />,
      'RESOLVED': <CheckCircle className="text-green-600" size={16} />,
      'CLOSED': <XCircle className="text-gray-600" size={16} />
    }
    return icons[type] || <Activity className="text-gray-600" size={16} />
  }

  const getTimelineColor = (type) => {
    const colors = {
      'CREATED': 'border-green-200 bg-green-50',
      'STATUS_CHANGE': 'border-blue-200 bg-blue-50',
      'ASSIGNED': 'border-purple-200 bg-purple-50',
      'UPDATED': 'border-orange-200 bg-orange-50',
      'RESOLVED': 'border-green-200 bg-green-50',
      'CLOSED': 'border-gray-200 bg-gray-50'
    }
    return colors[type] || 'border-gray-200 bg-gray-50'
  }

  // Enhanced timeline data structure for tracking all changes
  const generateTimelineData = (ticket) => {
    const timeline = []
    
    // 1. Initial ticket creation
    if (ticket.createdAt) {
      timeline.push({
        id: 1,
        type: 'CREATED',
        title: 'Ticket Created',
        description: `Ticket "${ticket.subject}" was created`,
        user: getEmployeeName(ticket.employeeId),
        timestamp: ticket.createdAt,
        status: 'OPEN',
        changeType: 'CREATE',
        details: {
          category: getTicketTypeLabel(ticket.ticketType),
          priority: ticket.priority,
          subCategory: ticket.subCategory
        }
      })
    }

    // 2. Assignment changes
    if (ticket.assignedTo && ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
      timeline.push({
        id: 2,
        type: 'ASSIGNED',
        title: 'Ticket Assigned',
        description: `Ticket was assigned to ${getUserName(ticket.assignedTo)}`,
        user: getUserName(ticket.assignedTo) || 'System',
        timestamp: ticket.updatedAt,
        status: ticket.status,
        changeType: 'ASSIGN',
        details: {
          assignedTo: getUserName(ticket.assignedTo)
        }
      })
    }

    // 3. Status changes (track all transitions)
    if (ticket.status === 'IN_PROGRESS' && ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
      timeline.push({
        id: 3,
        type: 'STATUS_CHANGE',
        title: 'Status Changed',
        description: 'Status changed from Open to In Progress',
        user: getUserName(ticket.assignedTo) || 'System',
        timestamp: ticket.updatedAt,
        status: 'IN_PROGRESS',
        changeType: 'STATUS_UPDATE',
        details: {
          fromStatus: 'OPEN',
          toStatus: 'IN_PROGRESS'
        }
      })
    }

    // 4. Priority changes
    if (ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
      // This would be enhanced in real implementation to track actual priority changes
      timeline.push({
        id: 4,
        type: 'UPDATED',
        title: 'Ticket Updated',
        description: `Priority set to ${ticket.priority}`,
        user: getUserName(ticket.assignedTo) || 'System',
        timestamp: ticket.updatedAt,
        status: ticket.status,
        changeType: 'MODIFY',
        details: {
          field: 'priority',
          value: ticket.priority
        }
      })
    }

    // 5. Resolution
    if (ticket.resolution && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      timeline.push({
        id: 5,
        type: 'RESOLVED',
        title: 'Ticket Resolved',
        description: ticket.resolution ? `Resolution: ${ticket.resolution}` : 'Ticket was marked as resolved',
        user: getUserName(ticket.assignedTo) || 'System',
        timestamp: ticket.resolvedAt || ticket.updatedAt,
        status: 'RESOLVED',
        changeType: 'RESOLVE',
        details: {
          resolution: ticket.resolution,
          resolvedAt: ticket.resolvedAt
        }
      })
    }

    // 6. Closure
    if (ticket.status === 'CLOSED') {
      timeline.push({
        id: 6,
        type: 'CLOSED',
        title: 'Ticket Closed',
        description: 'Ticket was closed',
        user: getUserName(ticket.assignedTo) || 'System',
        timestamp: ticket.resolvedAt || ticket.updatedAt,
        status: 'CLOSED',
        changeType: 'CLOSE',
        details: {
          closedAt: ticket.resolvedAt
        }
      })
    }

    // Sort by timestamp (most recent first)
    return timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const openTimelineModal = (ticket) => {
    const timeline = generateTimelineData(ticket)
    setTimelineData(timeline)
    setShowTimeline(true)
  }

  // Duplicate ticket detection
  const checkForDuplicates = (subject, category, employeeId) => {
    if (!subject || !category) return []
    
    
    const subjectLower = subject.toLowerCase().trim()
    const similar = tickets.filter(ticket => {
      if (!ticket || !ticket.subject) return false
      
      // Check for similar subjects (ignoring case and extra spaces)
      const ticketSubject = ticket.subject.toLowerCase().trim()
      const subjectMatch = ticketSubject === subjectLower || 
                           ticketSubject.includes(subjectLower) || 
                           subjectLower.includes(ticketSubject)
      
      
      // Consider it duplicate if subject matches and ticket is not closed/resolved
      return subjectMatch && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED'
    })

    return similar // Return all similar tickets for counting
  }

  const handleSubjectChange = (e) => {
    const subject = e.target.value
    setFormData({ ...formData, subject })
    
    
    if (subject.length >= 3) { // Check after 3 characters
      const duplicates = checkForDuplicates(subject, formData.ticketType, formData.employeeId)
      setSimilarTickets(duplicates)
      
      if (duplicates.length > 0) {
        // Create a summary message with count
        const issueType = formData.ticketType ? getTicketTypeLabel(formData.ticketType) : 'this'
        const message = duplicates.length === 1 
          ? `1 person has reported this ${issueType} issue`
          : `${duplicates.length} people have reported this ${issueType} issue`
        
        setDuplicateWarning({
          message: message,
          tickets: duplicates,
          count: duplicates.length
        })
      } else {
        setDuplicateWarning(null)
        setSimilarTickets([])
      }
    } else {
      setDuplicateWarning(null)
      setSimilarTickets([])
    }
  }

  useEffect(() => {
    loadData()
  }, [filter, priorityFilter, searchTerm, sortBy, sortOrder, isMyTicketsRoute])

  useEffect(() => {
    // Load users for assignment functionality
    loadUsers()
  }, [])

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
      // Employees only see their own tickets, all other roles see all tickets
      // If on /my-tickets route, show only current user's tickets
      if ((isEmployee && currentUserId) || (isMyTicketsRoute && currentUserId)) {
        ticketsData = await api.getEmployeeTickets(parseInt(currentUserId))
      } else {
        ticketsData = await api.getTickets()
      }
      
      // Apply filters
      let filteredTickets = Array.isArray(ticketsData) ? ticketsData : []
      
      // Finance users only see PAYROLL-related tickets (unless on my-tickets route which is already filtered by user)
      if (isFinance && !isMyTicketsRoute) {
        filteredTickets = filteredTickets.filter(ticket => 
          ticket.ticketType === 'PAYROLL' || 
          (ticket.ticketType && ticket.ticketType.toUpperCase() === 'PAYROLL')
        )
      }
      
      // On my-tickets route, finance should see their own tickets across all categories (no PAYROLL-only restriction)
      
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
      
      // Load employees for all users
      const employeesData = await api.getEmployees()
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
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Use the already generated ticket ID
      const response = await api.createTicket({
        ...formData,
        ticketId: displayTicketId,
        employeeId: formData.employeeId ? parseInt(formData.employeeId) : parseInt(currentUserId),
        assignedTo: null // Remove assignment from create form
      })
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to create ticket')
      }
      
      await loadData()
      setShowModal(false)
      setDisplayTicketId('') // Clear display ticket ID
      setSuccessMessage(`Ticket ${displayTicketId} created successfully!`)
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
        ...selectedTicket
      }
      
      // For employees, only allow updating description/comments
      // For admins, managers, finance, and HR_ADMIN, allow updating status, priority, assignment, and resolution
      if (isEmployee) {
        // Employees can only add comments/updates
        if (updateData.resolution) {
          // Append to existing description or resolution as a comment
          const currentDescription = selectedTicket.description || ''
          const comment = `\n\n--- Comment added on ${format(new Date(), 'MMM dd, yyyy HH:mm')} ---\n${updateData.resolution}`
          updatePayload.description = currentDescription + comment
        }
      } else if (canManageTickets) {
        // Admins, Managers, Finance, and HR_ADMIN can update everything
        const newStatus = updateData.status || selectedTicket.status
        updatePayload.status = newStatus
        updatePayload.resolution = updateData.resolution || selectedTicket.resolution
        updatePayload.priority = updateData.priority || selectedTicket.priority
        
        // When resolving/closing ticket, set assignedTo to current user (handled by backend)
        // Keep existing assignedTo for other status changes
        if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
          // Backend will set assignedTo to current user automatically
          updatePayload.assignedTo = selectedTicket.assignedTo
        } else {
          // Keep existing assignedTo for other status changes
          updatePayload.assignedTo = selectedTicket.assignedTo
        }
        
        // Record what changed for timeline tracking
        const changes = []
        if (updateData.status && updateData.status !== selectedTicket.status) {
          changes.push({
            type: 'STATUS_CHANGE',
            from: selectedTicket.status,
            to: updateData.status
          })
        }
        if (updateData.priority && updateData.priority !== selectedTicket.priority) {
          changes.push({
            type: 'MODIFIED',
            field: 'priority',
            from: selectedTicket.priority,
            to: updateData.priority
          })
        }
        if (updateData.resolution && updateData.resolution !== selectedTicket.resolution) {
          changes.push({
            type: 'RESOLVED',
            resolution: updateData.resolution
          })
        }
        
        // Add change tracking to payload
        if (changes.length > 0) {
          updatePayload.changes = changes
          updatePayload.changedBy = currentUserId
          updatePayload.changedAt = new Date().toISOString()
        }
      }
      
      const response = await api.updateTicket(selectedTicket.id, updatePayload)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update ticket')
      }
      
      await loadData()
      setSelectedTicket(null)
      setUpdateData({ status: '', resolution: '', assignedTo: '', priority: '' })
      setSuccessMessage(isEmployee ? 'Comment added successfully! HR will be notified.' : 'Ticket updated successfully!')
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

  const openEditModal = (ticket) => {
    // Check if employee can edit (only their own OPEN tickets)
    // Managers, Finance, HR_ADMIN, and Admins can edit any ticket
    if (isEmployee && (ticket.employeeId?.toString() !== currentUserId || ticket.status !== 'OPEN')) {
      setError('You can only edit your own open tickets')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    // Non-employees can edit any ticket, but check if it's closed
    if (!isEmployee && ticket.status === 'CLOSED') {
      setError('Cannot edit closed tickets')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    setSelectedTicket(ticket)
    setEditData({
      subject: ticket.subject || '',
      description: ticket.description || '',
      ticketType: ticket.ticketType || 'PAYROLL',
      subCategory: ticket.subCategory || '',
      priority: ticket.priority || 'MEDIUM'
    })
    setShowEditModal(true)
  }

  const handleEditTicket = async () => {
    if (!selectedTicket) return
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Validate required fields
      if (!editData.subject || !editData.description || !editData.subCategory) {
        throw new Error('Please fill in all required fields')
      }
      
      const updatePayload = {
        ...selectedTicket,
        subject: editData.subject,
        description: editData.description,
        ticketType: editData.ticketType,
        subCategory: editData.subCategory,
        priority: editData.priority
      }
      
      // Record edit change
      updatePayload.changedBy = currentUserId
      updatePayload.changedAt = new Date().toISOString()
      
      const response = await api.updateTicket(selectedTicket.id, updatePayload)
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update ticket')
      }
      
      await loadData()
      setShowEditModal(false)
      setSelectedTicket(null)
      setEditData({ subject: '', description: '', ticketType: '', subCategory: '', priority: '' })
      setSuccessMessage('Ticket updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error updating ticket')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const openViewModal = (ticket) => {
    setSelectedTicket(ticket)
    setShowViewModal(true)
  }

  const getEmployeeName = (employeeId) => {
    try {
      const employee = employees.find(emp => emp && emp.id === employeeId)
      if (employee) {
        return employee.name || 'Unknown'
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
      'PAYROLL': 'Payroll',
      'LEAVE': 'Leave',
      'IT_SUPPORT': 'IT Support',
      'GENERAL_QUERY': 'General Query',
      'DOCUMENTS': 'Documents'
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
    return colors[priority] || colors['MEDIUM']
  }

  const getStatusText = (status) => {
    const statusMap = {
      'OPEN': 'Open',
      'IN_PROGRESS': 'In Progress',
      'RESOLVED': 'Resolved',
      'CLOSED': 'Closed'
    }
    return statusMap[status] || status
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
    <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Toast Notifications (Top Right) */}
      {(successMessage || error) && (
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {successMessage && (
            <div className="flex items-start gap-3 bg-green-50 text-green-800 border border-green-200 rounded-xl px-5 py-4 shadow-lg min-w-[320px] max-w-[480px]">
              <CheckCircle size={24} className="mt-0.5 text-green-600 shrink-0" />
              <div className="flex-1 text-lg font-semibold">{successMessage}</div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-700/70 hover:text-green-800"
                aria-label="Close success message"
              >
                <X size={18} />
              </button>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 text-red-800 border border-red-200 rounded-xl px-5 py-4 shadow-lg min-w-[320px] max-w-[480px]">
              <XCircle size={24} className="mt-0.5 text-red-600 shrink-0" />
              <div className="flex-1 text-lg font-semibold">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-700/70 hover:text-red-800"
                aria-label="Close error message"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Open</div>
          <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Resolved</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Closed</div>
          <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={18} />
              </button>
            </div>
            {(!isFinance || isMyTicketsRoute) && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold whitespace-nowrap"
              >
                <Plus size={20} />
                Create Ticket
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">S.NO</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tickets.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Ticket className="text-gray-300" size={36} />
                      <div className="font-medium">No tickets found</div>
                      {searchTerm && <div className="text-sm text-gray-400">Try adjusting your search or filters</div>}
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket, idx) => {
                  if (!ticket || !ticket.id) return null
                  const canEdit =
                    (isEmployee && ticket.employeeId?.toString() === currentUserId && ticket.status === 'OPEN') ||
                    (isFinance && isMyTicketsRoute && ticket.employeeId?.toString() === currentUserId && ticket.status === 'OPEN')
                  const canUpdate = !canEdit && canManageTickets && ticket.status !== 'CLOSED'
                  const canDelete = (!isEmployee || (isEmployee && ticket.status === 'OPEN' && ticket.employeeId?.toString() === currentUserId))

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {getEmployeeName(ticket.employeeId)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {getTicketTypeLabel(ticket.ticketType || '')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="font-semibold">{ticket.subject || 'No Subject'}</div>
                        {ticket.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                          {ticket.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status || 'OPEN')}`}>
                          {ticket.status || 'OPEN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(ticket)}
                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View"
                            aria-label="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openTimelineModal(ticket)}
                            className="bg-purple-50 text-purple-600 p-2 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Timeline"
                            aria-label="Timeline"
                          >
                            <Clock size={16} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(ticket)}
                              className="bg-yellow-50 text-yellow-600 p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canUpdate && (
                            <button
                              onClick={() => openUpdateModal(ticket)}
                              className="bg-yellow-50 text-yellow-600 p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                              title="Update"
                              aria-label="Update"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {(!isFinance || isMyTicketsRoute) && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowModal(false)
          setDisplayTicketId('')
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Ticket size={28} className="text-blue-600" />
                Create New Ticket
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setDisplayTicketId('')
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Auto-generated Ticket ID Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-blue-800">Ticket ID:</span>
                    <span className="ml-2 text-lg font-bold text-blue-600">{displayTicketId}</span>
                  </div>
                  <span className="text-xs text-blue-600">Auto-generated</span>
                </div>
              </div>

              {(isEmployee || isMyTicketsRoute) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                  <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {getEmployeeName(parseInt(currentUserId)) || 'Current User'}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name *</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id.toString()}>
                        {employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  {isFinance && !isMyTicketsRoute ? (
                    <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      Payroll
                    </div>
                  ) : (
                    <select
                      value={formData.ticketType}
                      onChange={(e) => setFormData({ ...formData, ticketType: e.target.value, subCategory: '' })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="PAYROLL">Payroll</option>
                      <option value="LEAVE">Leave</option>
                      <option value="IT_SUPPORT">IT Support</option>
                      <option value="GENERAL_QUERY">General Query</option>
                      <option value="DOCUMENTS">Documents</option>
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub-category *</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Sub-category</option>
                    {ticketCategories[formData.ticketType]?.map((subCat) => (
                      <option key={subCat} value={subCat}>
                        {subCat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="URGENT">Urgent (4 hours)</option>
                    <option value="HIGH">High (24 hours)</option>
                    <option value="MEDIUM">Medium (48 hours)</option>
                    <option value="LOW">Low (72 hours)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">SLA: {prioritySLA[formData.priority]}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={handleSubjectChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ticket subject"
                    required
                  />
                  
                  {/* Duplicate Warning */}
                  {duplicateWarning && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="text-yellow-600 mt-0.5" size={16} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800">{duplicateWarning.message}</p>
                          <p className="text-xs text-yellow-600 mt-1">
                            Consider checking existing tickets before creating a new one
                          </p>
                          
                          {/* Show a few examples (max 3) */}
                          {duplicateWarning.tickets.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-medium text-yellow-700">Recent similar tickets:</p>
                              {duplicateWarning.tickets.slice(0, 3).map((ticket, index) => (
                                <div key={ticket.id} className="flex items-center justify-between text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                                  <span>
                                    <span className="font-medium">{ticket.ticketId || `TK-${ticket.id}`}</span>
                                    {ticket.subject && ` - ${ticket.subject}`}
                                  </span>
                                  <span className="text-yellow-600">{getStatusText(ticket.status)}</span>
                                  <button
                                    type="button"
                                    onClick={() => openViewModal(ticket)}
                                    className="ml-2 text-yellow-600 hover:text-yellow-800 underline"
                                  >
                                    View
                                  </button>
                                </div>
                              ))}
                              {duplicateWarning.tickets.length > 3 && (
                                <p className="text-xs text-yellow-600 italic">
                                  ...and {duplicateWarning.tickets.length - 3} more similar tickets
                                </p>
                              )}
                            </div>
                          )}
                          
         
                          {/* Debug info */}
                          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                            <p className="text-yellow-600">Debug: Found {duplicateWarning.tickets.length} similar tickets</p>
                            <button 
                              type="button"
                              onClick={() => console.log('Test duplicate detection with "software installation"')}
                              className="mt-1 text-yellow-700 underline text-xs"
                            >
                              Test with "software installation"
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                                  </div>
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
                  onClick={() => {
                    setShowModal(false)
                    setDisplayTicketId('')
                  }}
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
            <div className="space-y-6">
              {/* Ticket Header Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Ticket ID</p>
                    <p className="text-lg font-bold text-blue-800">{selectedTicket.ticketId || `TK-${selectedTicket.id}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Subject</p>
                  <p className="text-xl font-bold text-gray-800">{selectedTicket.subject}</p>
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
                  <p className="text-base font-medium text-gray-800">{getTicketTypeLabel(selectedTicket.ticketType)}</p>
                  {selectedTicket.subCategory && (
                    <p className="text-sm text-gray-600 mt-1">{selectedTicket.subCategory}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</label>
                  <p className="text-base font-medium text-gray-800">{getEmployeeName(selectedTicket.employeeId)}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</label>
                  <p className="text-sm text-gray-800">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                {selectedTicket.updatedAt && selectedTicket.updatedAt !== selectedTicket.createdAt && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</label>
                    <p className="text-sm text-gray-800">{formatDate(selectedTicket.updatedAt)}</p>
                  </div>
                )}
                {selectedTicket.resolvedAt && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved</label>
                    <p className="text-sm text-gray-800">{formatDate(selectedTicket.resolvedAt)}</p>
                  </div>
                )}
                {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved By</label>
                    <p className="text-base font-medium text-gray-800">
                      {selectedTicket.assignedTo ? getUserName(selectedTicket.assignedTo) : 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedTicket.description || 'No description'}</p>
                </div>
              </div>

              {/* Resolution */}
              {selectedTicket.resolution && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolution</label>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedTicket.resolution}</p>
                  </div>
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

      {/* Edit Ticket Modal - For Employees */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowEditModal(false)
          setSelectedTicket(null)
          setEditData({ subject: '', description: '', ticketType: '', subCategory: '', priority: '' })
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Edit size={28} className="text-blue-600" />
                Edit Ticket
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedTicket(null)
                  setEditData({ subject: '', description: '', ticketType: '', subCategory: '', priority: '' })
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Ticket ID: {selectedTicket.ticketId || `TK-${selectedTicket.id}`}</p>
                <p className="text-xs text-blue-600">You can edit ticket details below</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={editData.ticketType}
                    onChange={(e) => setEditData({ ...editData, ticketType: e.target.value, subCategory: '' })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="PAYROLL">Payroll</option>
                    <option value="LEAVE">Leave</option>
                    <option value="IT_SUPPORT">IT Support</option>
                    <option value="GENERAL_QUERY">General Query</option>
                    <option value="DOCUMENTS">Documents</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub-category *</label>
                  <select
                    value={editData.subCategory}
                    onChange={(e) => setEditData({ ...editData, subCategory: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Sub-category</option>
                    {ticketCategories[editData.ticketType]?.map((subCat) => (
                      <option key={subCat} value={subCat}>
                        {subCat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="URGENT">Urgent (4 hours)</option>
                    <option value="HIGH">High (24 hours)</option>
                    <option value="MEDIUM">Medium (48 hours)</option>
                    <option value="LOW">Low (72 hours)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">SLA: {prioritySLA[editData.priority]}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={editData.subject}
                  onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ticket subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  placeholder="Enter ticket description"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedTicket(null)
                    setEditData({ subject: '', description: '', ticketType: '', subCategory: '', priority: '' })
                  }}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTicket}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Ticket Modal */}
      {selectedTicket && !showViewModal && !showEditModal && (
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
              {canManageTickets ? (
                <>
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
                </>
              ) : isEmployee ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Comment/Update</label>
                  <textarea
                    value={updateData.resolution || ''}
                    onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={5}
                    placeholder="Add a comment or provide additional information about this ticket..."
                  />
                  <p className="text-xs text-gray-500 mt-1">You can add comments or request updates. Only HR/Admin can change status or priority.</p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>Current Status:</strong> {selectedTicket.status}
                    </p>
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>Priority:</strong> {selectedTicket.priority}
                    </p>
                    {selectedTicket.assignedTo && (
                      <p className="text-xs text-blue-800">
                        <strong>Assigned To:</strong> {getUserName(selectedTicket.assignedTo)}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
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

      {/* Timeline Modal */}
      {showTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowTimeline(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-purple-600 flex items-center gap-3">
                <Clock size={28} className="text-purple-600" />
                Status Change History
              </h3>
              <button
                onClick={() => setShowTimeline(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {timelineData.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline line */}
                  {index < timelineData.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-300"></div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Timeline dot with icon */}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getTimelineColor(item.type)}`}>
                      {getTimelineIcon(item.type)}
                    </div>
                    
                    {/* Timeline content */}
                    <div className={`flex-1 p-4 rounded-lg border-2 ${getTimelineColor(item.type)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          
                          {/* Show additional details based on change type */}
                          {item.changeType === 'CREATE' && item.details && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                              <span className="font-medium text-green-800">Initial Details:</span>
                              <div className="mt-1 text-green-700">
                                Category: {item.details.category} | Priority: {item.details.priority}
                                {item.details.subCategory && ` | Sub-category: ${item.details.subCategory}`}
                              </div>
                            </div>
                          )}
                          
                          {item.changeType === 'ASSIGN' && item.details && (
                            <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                              <span className="font-medium text-purple-800">Assignment:</span>
                              <div className="mt-1 text-purple-700">
                                Assigned to: {item.details.assignedTo}
                              </div>
                            </div>
                          )}
                          
                          {item.changeType === 'STATUS_UPDATE' && item.details && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                              <span className="font-medium text-blue-800">Status Transition:</span>
                              <div className="mt-1 text-blue-700">
                                {item.details.fromStatus} → {item.details.toStatus}
                              </div>
                            </div>
                          )}
                          
                          {item.changeType === 'MODIFY' && item.details && (
                            <div className="mt-2 p-2 bg-orange-50 rounded text-xs">
                              <span className="font-medium text-orange-800">Field Modified:</span>
                              <div className="mt-1 text-orange-700">
                                {item.details.field}: {item.details.value}
                              </div>
                            </div>
                          )}
                          
                          {item.changeType === 'RESOLVE' && item.details && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                              <span className="font-medium text-green-800">Resolution Details:</span>
                              <div className="mt-1 text-green-700">
                                {item.details.resolution}
                                {item.details.resolvedAt && (
                                  <div className="mt-1">Resolved at: {formatDate(item.details.resolvedAt)}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500">{formatDate(item.timestamp)}</p>
                          {item.status && (
                            <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {item.user && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <User size={14} />
                          <span>By: {item.user}</span>
                          <span className="text-xs text-gray-400">({item.changeType})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {timelineData.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 text-lg">No timeline history available</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowTimeline(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}           
    </div>
  )
}

export default HRTickets
