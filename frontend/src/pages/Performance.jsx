import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Edit, Trash2, Star, Calendar, Target, Award, AlertCircle, XCircle } from 'lucide-react'
import api from '../services/api'
import { format, parseISO } from 'date-fns'

const Performance = () => {
  const [performances, setPerformances] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [editingPerformance, setEditingPerformance] = useState(null)
  const [performanceFormData, setPerformanceFormData] = useState({
    employeeId: '',
    reviewDate: format(new Date(), 'yyyy-MM-dd'),
    period: '',
    rating: 3,
    goals: '',
    achievements: '',
    feedback: '',
    areasForImprovement: ''
  })

  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      if (isEmployee && userId) {
        const [performanceData, employeesData] = await Promise.all([
          api.getPerformanceByEmployee(parseInt(userId)),
          api.getEmployees()
        ])
        setPerformances(Array.isArray(performanceData) ? performanceData : [])
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      } else if (isAdmin) {
        const [performanceData, employeesData] = await Promise.all([
          api.getPerformance(),
          api.getEmployees()
        ])
        setPerformances(Array.isArray(performanceData) ? performanceData : [])
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPerformanceModal = (performance = null) => {
    if (performance) {
      setEditingPerformance(performance)
      setPerformanceFormData({
        employeeId: performance.employeeId?.toString() || '',
        reviewDate: performance.reviewDate ? format(parseISO(performance.reviewDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        period: performance.period || '',
        rating: performance.rating || 3,
        goals: performance.goals || '',
        achievements: performance.achievements || '',
        feedback: performance.feedback || '',
        areasForImprovement: performance.areasForImprovement || ''
      })
    } else {
      setEditingPerformance(null)
      setPerformanceFormData({
        employeeId: '',
        reviewDate: format(new Date(), 'yyyy-MM-dd'),
        period: '',
        rating: 3,
        goals: '',
        achievements: '',
        feedback: '',
        areasForImprovement: ''
      })
    }
    setShowPerformanceModal(true)
  }

  const handlePerformanceSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const performanceData = {
        ...performanceFormData,
        employeeId: parseInt(performanceFormData.employeeId),
        rating: parseInt(performanceFormData.rating)
      }

      if (editingPerformance) {
        await api.updatePerformance(editingPerformance.id, performanceData)
      } else {
        await api.createPerformance(performanceData)
      }
      await loadData()
      setShowPerformanceModal(false)
      setEditingPerformance(null)
      alert(editingPerformance ? 'Performance review updated successfully' : 'Performance review created successfully')
    } catch (error) {
      alert('Error saving performance review: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePerformance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this performance review?')) return
    
    try {
      setLoading(true)
      await api.deletePerformance(id)
      await loadData()
      alert('Performance review deleted successfully')
    } catch (error) {
      alert('Error deleting performance review: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ))
  }

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-50'
    if (rating >= 3) return 'text-blue-600 bg-blue-50'
    if (rating >= 2) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">
              {isEmployee ? 'My Performance' : 'Performance Management'}
            </h2>
            <p className="text-gray-600 font-medium">
              {isEmployee ? 'View your performance reviews and ratings' : 'Manage employee performance reviews and evaluations'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenPerformanceModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Plus size={20} />
              Create Review
            </button>
          )}
        </div>
      </div>

      {/* Performance Reviews */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
        <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp size={24} className="text-blue-600" />
            Performance Reviews
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Review Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Goals</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Achievements</th>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                    No performance reviews found
                  </td>
                </tr>
              ) : (
                performances.map((performance) => {
                  const employee = employees.find(emp => emp.id === performance.employeeId)
                  
                  return (
                    <tr key={performance.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee?.name || 'N/A'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {performance.period || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {performance.reviewDate ? format(parseISO(performance.reviewDate), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {getRatingStars(performance.rating || 0)}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRatingColor(performance.rating || 0)}`}>
                            {performance.rating || 0}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {performance.goals || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {performance.achievements || 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenPerformanceModal(performance)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeletePerformance(performance.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Stats Cards */}
      {performances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {performances.length > 0 
                ? (performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.length).toFixed(1)
                : '0.0'}
            </h3>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-600 p-3 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {performances.filter(p => (p.rating || 0) >= 4).length}
            </h3>
            <p className="text-sm text-gray-500">Top Performers</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-600 p-3 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {performances.length}
            </h3>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </div>
        </div>
      )}

      {/* Create/Edit Performance Modal */}
      {showPerformanceModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600">
                {editingPerformance ? 'Edit Performance Review' : 'Create Performance Review'}
              </h3>
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handlePerformanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={performanceFormData.employeeId}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingPerformance}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || emp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Date *</label>
                  <input
                    type="date"
                    value={performanceFormData.reviewDate}
                    onChange={(e) => setPerformanceFormData({ ...performanceFormData, reviewDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                  <input
                    type="text"
                    value={performanceFormData.period}
                    onChange={(e) => setPerformanceFormData({ ...performanceFormData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Q1 2024, Q2 2024"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating * (1-5)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={performanceFormData.rating}
                    onChange={(e) => setPerformanceFormData({ ...performanceFormData, rating: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {getRatingStars(performanceFormData.rating)}
                    </div>
                    <span className="text-lg font-bold text-gray-900">{performanceFormData.rating}/5</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goals</label>
                <textarea
                  value={performanceFormData.goals}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, goals: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Performance goals and objectives..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievements</label>
                <textarea
                  value={performanceFormData.achievements}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, achievements: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Key achievements and accomplishments..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea
                  value={performanceFormData.feedback}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Manager feedback and comments..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                <textarea
                  value={performanceFormData.areasForImprovement}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, areasForImprovement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Areas that need improvement..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPerformanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? 'Saving...' : editingPerformance ? 'Update Review' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Performance

