import { useState } from 'react'
import { useHRMS } from '../context/HRMSContext'
import { Plus, TrendingUp, Star, Target, Award, Search } from 'lucide-react'
import { format } from 'date-fns'

const Performance = () => {
  const { employees = [], performance = [], addPerformance, loading = false } = useHRMS()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    reviewDate: format(new Date(), 'yyyy-MM-dd'),
    period: 'Q1 2024',
    rating: '5',
    goals: '',
    achievements: '',
    feedback: '',
    areasForImprovement: ''
  })

  // Ensure performance is an array
  const performanceList = Array.isArray(performance) ? performance : []

  const filteredPerformance = performanceList.filter(perf => {
    try {
      const employee = employees.find(emp => emp.id === perf.employeeId)
      const matchesSearch = !searchTerm || 
        (employee && employee.name && employee.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    } catch (err) {
      console.error('Error filtering performance:', err)
      return false
    }
  })

  const handleOpenModal = () => {
    setFormData({
      employeeId: '',
      reviewDate: format(new Date(), 'yyyy-MM-dd'),
      period: 'Q1 2024',
      rating: '5',
      goals: '',
      achievements: '',
      feedback: '',
      areasForImprovement: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      await addPerformance({
        ...formData,
        employeeId: parseInt(formData.employeeId),
        rating: parseInt(formData.rating)
      })
      setShowModal(false)
    } catch (err) {
      setError(err.message || 'Failed to add performance review')
      console.error('Error submitting performance:', err)
    }
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unknown'
  }

  const getEmployeeAvatar = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.avatar : '?'
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

  const averageRating = performanceList.length > 0
    ? (performanceList.reduce((sum, p) => sum + (p.rating || 0), 0) / performanceList.length).toFixed(1)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
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
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Performance Reviews</h2>
            <p className="text-gray-600 font-medium">Track and manage employee performance</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            <Plus size={20} />
            Add Review
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-800">{performanceList.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-2xl font-bold text-blue-600">{averageRating}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Star className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 p-6 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Top Performers</p>
              <p className="text-2xl font-bold text-blue-600">
                {performanceList.filter(p => p.rating >= 4).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Redesigned */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search performance reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Performance Reviews */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPerformance.map((perf) => (
          <div key={perf.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 p-6 hover:border-blue-300 transform hover:scale-105">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                  {getEmployeeAvatar(perf.employeeId)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{getEmployeeName(perf.employeeId)}</h3>
                    <div className="flex items-center gap-1">
                      {getRatingStars(perf.rating || 0)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Period: {perf.period || 'N/A'}</span>
                    <span>Date: {perf.reviewDate ? format(new Date(perf.reviewDate), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Goals</h4>
                <p className="text-sm text-gray-600">{perf.goals || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Achievements</h4>
                <p className="text-sm text-gray-600">{perf.achievements || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Feedback</h4>
                <p className="text-sm text-gray-600">{perf.feedback || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Areas for Improvement</h4>
                <p className="text-sm text-gray-600">{perf.areasForImprovement || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPerformance.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No performance reviews found</p>
        </div>
      )}

      {/* Modal - Redesigned */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                  <Plus size={24} className="text-blue-600" />
                  Add Performance Review
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Review Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Period *</label>
                  <select
                    required
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Q1 2024">Q1 2024</option>
                    <option value="Q2 2024">Q2 2024</option>
                    <option value="Q3 2024">Q3 2024</option>
                    <option value="Q4 2024">Q4 2024</option>
                    <option value="Annual 2024">Annual 2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating (1-5) *</label>
                  <select
                    required
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Below Average</option>
                    <option value="3">3 - Average</option>
                    <option value="4">4 - Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Goals</label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter goals..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Achievements</label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter achievements..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter feedback..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Areas for Improvement</label>
                <textarea
                  value={formData.areasForImprovement}
                  onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter areas for improvement..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  Add Review
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

