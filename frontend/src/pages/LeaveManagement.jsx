import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    halfDayType: 'FIRST_HALF'
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const userRole = localStorage.getItem('userRole')
  const currentUserId = localStorage.getItem('userId')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      const [leavesData, typesData, employeesData] = await Promise.all([
        filter === 'All' ? api.getLeaves() : api.getLeaves(filter),
        api.getActiveLeaveTypes(),
        api.getEmployees()
      ])
      setLeaves(leavesData)
      setLeaveTypes(typesData)
      setEmployees(employeesData)

      // Load leave balances for current user
      if (currentUserId) {
        const balances = await api.getLeaveBalances(currentUserId, new Date().getFullYear())
        setLeaveBalances(balances)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createLeave(formData)
      await loadData()
      setShowModal(false)
      setFormData({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        halfDay: false,
        halfDayType: 'FIRST_HALF'
      })
      alert('Leave application submitted successfully')
    } catch (error) {
      alert('Error submitting leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (leaveId) => {
    setLoading(true)
    try {
      await api.approveLeave(leaveId, parseInt(currentUserId))
      await loadData()
      setShowApprovalModal(false)
      alert('Leave approved successfully')
    } catch (error) {
      alert('Error approving leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (leaveId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    setLoading(true)
    try {
      await api.rejectLeave(leaveId, parseInt(currentUserId), rejectionReason)
      await loadData()
      setShowApprovalModal(false)
      setRejectionReason('')
      alert('Leave rejected')
    } catch (error) {
      alert('Error rejecting leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.name || 'Unknown'
  }

  const getLeaveTypeName = (leaveTypeId) => {
    const type = leaveTypes.find(t => t.id === leaveTypeId)
    return type?.name || 'Unknown'
  }

  const getLeaveBalance = (leaveTypeId) => {
    const balance = leaveBalances.find(b => b.leaveTypeId === leaveTypeId)
    return balance?.balance || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
          <p className="text-gray-600 mt-1">Manage leave applications and approvals</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Leaves</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Calendar size={20} />
            Apply Leave
          </button>
        </div>
      </div>

      {/* Leave Balances */}
      {leaveBalances.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Your Leave Balance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {leaveBalances.map((balance) => {
              const type = leaveTypes.find(t => t.id === balance.leaveTypeId)
              return (
                <div key={balance.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{type?.name || 'Unknown'}</p>
                  <p className="text-2xl font-bold text-primary-600">{balance.balance.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Used: {balance.usedDays.toFixed(1)} / {balance.totalDays.toFixed(1)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leaves List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="text-gray-400 mr-2" size={18} />
                      <span className="text-sm font-medium text-gray-900">{getEmployeeName(leave.employeeId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getLeaveTypeName(leave.leaveTypeId)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </div>
                    {leave.halfDay && (
                      <div className="text-xs text-gray-500">Half Day ({leave.halfDayType})</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{leave.totalDays} days</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{leave.reason}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isAdmin && leave.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedLeave(leave)
                            setShowApprovalModal(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Review
                        </button>
                      </div>
                    )}
                    {leave.rejectionReason && (
                      <div className="text-xs text-red-600" title={leave.rejectionReason}>
                        <AlertCircle size={16} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Apply for Leave</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} (Balance: {getLeaveBalance(type.id).toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Half Day</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.halfDay}
                        onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Half Day</span>
                    </label>
                    {formData.halfDay && (
                      <select
                        value={formData.halfDayType}
                        onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="FIRST_HALF">First Half</option>
                        <option value="SECOND_HALF">Second Half</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
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
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Review Leave Application</h3>
            <div className="space-y-3 mb-4">
              <p><strong>Employee:</strong> {getEmployeeName(selectedLeave.employeeId)}</p>
              <p><strong>Leave Type:</strong> {getLeaveTypeName(selectedLeave.leaveTypeId)}</p>
              <p><strong>Dates:</strong> {format(new Date(selectedLeave.startDate), 'MMM dd')} - {format(new Date(selectedLeave.endDate), 'MMM dd, yyyy')}</p>
              <p><strong>Days:</strong> {selectedLeave.totalDays}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedLeave.id)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedLeave.id)}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
            <button
              onClick={() => {
                setShowApprovalModal(false)
                setSelectedLeave(null)
                setRejectionReason('')
              }}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveManagement
