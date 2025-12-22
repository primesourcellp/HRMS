import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Edit, Trash2, Star, Calendar, Target, Award, AlertCircle, X, Search, Eye, Filter, ArrowUpDown, BarChart3, LineChart, Download } from 'lucide-react'
import api from '../services/api'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts'

const Performance = () => {
  const [performances, setPerformances] = useState([])
  const [allPerformances, setAllPerformances] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPerformance, setEditingPerformance] = useState(null)
  const [selectedPerformance, setSelectedPerformance] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('All')
  const [ratingFilter, setRatingFilter] = useState('All')
  const [periodFilter, setPeriodFilter] = useState('All')
  const [sortBy, setSortBy] = useState('reviewDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
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

  useEffect(() => {
    filterAndSortPerformances()
  }, [searchTerm, employeeFilter, ratingFilter, periodFilter, sortBy, sortOrder, allPerformances])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let performanceData
      if (isEmployee && userId) {
        performanceData = await api.getPerformanceByEmployee(parseInt(userId))
      } else {
        performanceData = await api.getPerformance()
      }
      
      setAllPerformances(Array.isArray(performanceData) ? performanceData : [])
      
      if (isAdmin) {
        const employeesData = await api.getEmployees()
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      } else {
        const employeesData = await api.getEmployees()
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.message || 'Failed to load performance data')
      setAllPerformances([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPerformances = () => {
    let filtered = [...allPerformances]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.period?.toLowerCase().includes(searchLower) ||
        p.goals?.toLowerCase().includes(searchLower) ||
        p.achievements?.toLowerCase().includes(searchLower) ||
        p.feedback?.toLowerCase().includes(searchLower) ||
        getEmployeeName(p.employeeId)?.toLowerCase().includes(searchLower)
      )
    }

    // Apply employee filter
    if (employeeFilter !== 'All') {
      filtered = filtered.filter(p => p.employeeId === parseInt(employeeFilter))
    }

    // Apply rating filter
    if (ratingFilter !== 'All') {
      filtered = filtered.filter(p => p.rating === parseInt(ratingFilter))
    }

    // Apply period filter
    if (periodFilter !== 'All') {
      filtered = filtered.filter(p => p.period === periodFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'reviewDate':
          aValue = new Date(a.reviewDate || 0)
          bValue = new Date(b.reviewDate || 0)
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'period':
          aValue = a.period || ''
          bValue = b.period || ''
          break
        case 'employee':
          aValue = getEmployeeName(a.employeeId) || ''
          bValue = getEmployeeName(b.employeeId) || ''
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

    setPerformances(filtered)
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
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const performanceData = {
        ...performanceFormData,
        employeeId: parseInt(performanceFormData.employeeId),
        rating: parseInt(performanceFormData.rating)
      }

      if (editingPerformance) {
        const response = await api.updatePerformance(editingPerformance.id, performanceData)
        if (response.error) {
          throw new Error(response.message || 'Failed to update performance review')
        }
        setSuccessMessage('Performance review updated successfully!')
      } else {
        const response = await api.createPerformance(performanceData)
        if (response.error) {
          throw new Error(response.message || 'Failed to create performance review')
        }
        setSuccessMessage('Performance review created successfully!')
      }
      
      await loadData()
      setShowPerformanceModal(false)
      setEditingPerformance(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error saving performance review')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePerformance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this performance review? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await api.deletePerformance(id)
      if (response.success === false) {
        throw new Error(response.message || 'Failed to delete performance review')
      }
      
      await loadData()
      setSuccessMessage('Performance review deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError(error.message || 'Error deleting performance review')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const openViewModal = (performance) => {
    setSelectedPerformance(performance)
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
      return 'Unknown'
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
    if (rating >= 4.5) return 'text-green-600 bg-green-50 border-green-200'
    if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200'
    if (rating >= 3) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (rating >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      return format(date, 'MMM dd, yyyy')
    } catch (e) {
      return dateString
    }
  }

  // Calculate statistics
  const stats = {
    total: allPerformances.length,
    averageRating: allPerformances.length > 0
      ? (allPerformances.reduce((sum, p) => sum + (p.rating || 0), 0) / allPerformances.length).toFixed(1)
      : '0.0',
    topPerformers: allPerformances.filter(p => (p.rating || 0) >= 4).length,
    excellent: allPerformances.filter(p => (p.rating || 0) >= 4.5).length,
    good: allPerformances.filter(p => (p.rating || 0) >= 3 && (p.rating || 0) < 4).length,
    needsImprovement: allPerformances.filter(p => (p.rating || 0) < 3).length
  }

  // Get unique periods for filter
  const uniquePeriods = [...new Set(allPerformances.map(p => p.period).filter(Boolean))].sort().reverse()

  // Prepare chart data for rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} Star${rating > 1 ? 's' : ''}`,
    count: allPerformances.filter(p => p.rating === rating).length
  }))

  // Prepare chart data for performance trends (by period)
  const performanceTrends = uniquePeriods.slice(0, 6).map(period => {
    const periodPerformances = allPerformances.filter(p => p.period === period)
    const avgRating = periodPerformances.length > 0
      ? periodPerformances.reduce((sum, p) => sum + (p.rating || 0), 0) / periodPerformances.length
      : 0
    return {
      period,
      averageRating: parseFloat(avgRating.toFixed(1)),
      reviews: periodPerformances.length
    }
  })

  // Get top performers data
  const topPerformersData = allPerformances
    .filter(p => (p.rating || 0) >= 4)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)
    .map(p => ({
      name: getEmployeeName(p.employeeId),
      rating: p.rating || 0,
      period: p.period
    }))

  if (loading && allPerformances.length === 0) {
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
    <div className="space-y-4 sm:space-y-6 bg-gray-50 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Statistics Cards */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total Reviews</div>
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Avg Rating</div>
            <div className="text-2xl font-bold text-green-800">{stats.averageRating}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">Top Performers</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.topPerformers}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Excellent (4.5+)</div>
            <div className="text-2xl font-bold text-purple-800">{stats.excellent}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Needs Improvement</div>
            <div className="text-2xl font-bold text-orange-800">{stats.needsImprovement}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {isAdmin && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="All">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id.toString()}>
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                </option>
              ))}
            </select>
          )}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Periods</option>
            {uniquePeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          {isAdmin && (
            <button
              onClick={() => handleOpenPerformanceModal()}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Plus size={18} />
              Create Review
            </button>
          )}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="reviewDate">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="period">Sort by Period</option>
              {isAdmin && <option value="employee">Sort by Employee</option>}
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

      {/* Charts Row */}
      {allPerformances.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <BarChart3 size={24} />
              Rating Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Trends Chart */}
          {performanceTrends.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <LineChart size={24} />
                Performance Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="averageRating" stroke="#10b981" strokeWidth={2} name="Avg Rating" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Top Performers */}
      {topPerformersData.length > 0 && isAdmin && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            <Award size={24} />
            Top Performers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topPerformersData.map((performer, index) => (
              <div key={index} className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-yellow-800">#{index + 1}</span>
                  <div className="flex">{getRatingStars(performer.rating)}</div>
                </div>
                <p className="font-bold text-gray-800 truncate">{performer.name}</p>
                <p className="text-xs text-gray-600">{performer.period}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Reviews Table */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <Target size={24} className="text-blue-600" />
            Performance Reviews ({performances.length})
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
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    <Target className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-lg">No performance reviews found</p>
                    {searchTerm && (
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                    )}
                  </td>
                </tr>
              ) : (
                performances.map((performance) => {
                  const employee = employees.find(emp => emp.id === performance.employeeId)
                  
                  return (
                    <tr key={performance.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getEmployeeName(performance.employeeId)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {performance.period || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(performance.reviewDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {getRatingStars(performance.rating || 0)}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRatingColor(performance.rating || 0)}`}>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(performance)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenPerformanceModal(performance)}
                                className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
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
                            </>
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

      {/* View Performance Modal */}
      {showViewModal && selectedPerformance && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowViewModal(false)
          setSelectedPerformance(null)
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Target size={28} className="text-blue-600" />
                Performance Review Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedPerformance(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Employee</label>
                    <p className="text-lg font-semibold text-gray-800">{getEmployeeName(selectedPerformance.employeeId)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Period</label>
                  <p className="text-lg font-semibold text-gray-800">{selectedPerformance.period || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Review Date</label>
                  <p className="text-sm text-gray-800">{formatDate(selectedPerformance.reviewDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Rating</label>
                  <div className="flex items-center gap-3">
                    <div className="flex">{getRatingStars(selectedPerformance.rating || 0)}</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(selectedPerformance.rating || 0)}`}>
                      {selectedPerformance.rating || 0}/5
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Goals</label>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {selectedPerformance.goals || 'No goals specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Achievements</label>
                <p className="text-gray-800 bg-green-50 p-4 rounded-lg border border-green-200 whitespace-pre-wrap">
                  {selectedPerformance.achievements || 'No achievements recorded'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Feedback</label>
                <p className="text-gray-800 bg-blue-50 p-4 rounded-lg border border-blue-200 whitespace-pre-wrap">
                  {selectedPerformance.feedback || 'No feedback provided'}
                </p>
              </div>
              {selectedPerformance.areasForImprovement && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Areas for Improvement</label>
                  <p className="text-gray-800 bg-yellow-50 p-4 rounded-lg border border-yellow-200 whitespace-pre-wrap">
                    {selectedPerformance.areasForImprovement}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedPerformance(null)
                }}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleOpenPerformanceModal(selectedPerformance)
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Edit Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Performance Modal */}
      {showPerformanceModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowPerformanceModal(false)
          setEditingPerformance(null)
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Target size={28} className="text-blue-600" />
                {editingPerformance ? 'Edit Performance Review' : 'Create Performance Review'}
              </h3>
              <button
                onClick={() => {
                  setShowPerformanceModal(false)
                  setEditingPerformance(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePerformanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                <select
                  value={performanceFormData.employeeId}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingPerformance}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Date *</label>
                  <input
                    type="date"
                    value={performanceFormData.reviewDate}
                    onChange={(e) => setPerformanceFormData({ ...performanceFormData, reviewDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period *</label>
                  <input
                    type="text"
                    value={performanceFormData.period}
                    onChange={(e) => setPerformanceFormData({ ...performanceFormData, period: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Q1 2024, Q2 2024, Jan-Mar 2024"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating * (1-5)</label>
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
                    <span className="text-lg font-bold text-gray-900 w-12 text-center">{performanceFormData.rating}/5</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
                <textarea
                  value={performanceFormData.goals}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, goals: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Performance goals and objectives..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Achievements</label>
                <textarea
                  value={performanceFormData.achievements}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, achievements: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Key achievements and accomplishments..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={performanceFormData.feedback}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, feedback: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Manager feedback and comments..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
                <textarea
                  value={performanceFormData.areasForImprovement}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, areasForImprovement: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Areas that need improvement..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPerformanceModal(false)
                    setEditingPerformance(null)
                  }}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
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
