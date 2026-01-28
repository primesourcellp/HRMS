import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TrendingUp, Plus, Edit, Trash2, Star, Calendar, Target, Award, AlertCircle, X, Search, Eye, Filter, ArrowUpDown, Download, BarChart3, RefreshCw, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'

const RechartsLineChart = LineChart

const Performance = () => {
  const [activeView, setActiveView] = useState('reviews') // 'reviews', 'kpis', 'cycles'
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
  const [sortBy, setSortBy] = useState('reviewDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' })
  const [quickFilter, setQuickFilter] = useState('all') // 'all', 'upcoming', 'overdue', 'recent'
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [kpis, setKpis] = useState([])
  const [reviewCycles, setReviewCycles] = useState([])
  const [showKpiModal, setShowKpiModal] = useState(false)
  const [editingKpi, setEditingKpi] = useState(null)
  const [kpiFormData, setKpiFormData] = useState({ name: '', description: '', target: '', weight: '', active: true })

  // Computed KPI results
  const [computedKpiResults, setComputedKpiResults] = useState([])
  const [computingKpi, setComputingKpi] = useState(false)
  const kpiCacheRef = useRef({}) // cache computed results keyed by employee_kpi_start_end
  const [showCycleModal, setShowCycleModal] = useState(false)
  const [editingCycle, setEditingCycle] = useState(null)
  const [cycleFormData, setCycleFormData] = useState({ name: '', startDate: '', endDate: '', active: true, kpiConfigId: '' })
  const [performanceFormData, setPerformanceFormData] = useState({
    employeeId: '',
    reviewDate: format(new Date(), 'yyyy-MM-dd'),
    rating: 3,
    goals: '',
    achievements: '',
    feedback: '',
    areasForImprovement: '',
    // KPI fields
    kpiConfigId: '',
    kpiResults: '', // free text or JSON-like entries
    // Evaluation fields
    managerEvaluation: ''
  })

  // Rating history and promotion history
  const [ratingHistory, setRatingHistory] = useState([])
  const [promotions, setPromotions] = useState([])
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [promotionFormData, setPromotionFormData] = useState({ employeeId: '', effectiveDate: format(new Date(), 'yyyy-MM-dd'), fromPosition: '', toPosition: '', notes: '' })

  // Appraisal-linked compensation
  const [compensations, setCompensations] = useState([])
  const [showCompensationModal, setShowCompensationModal] = useState(false)
  const [editingCompensation, setEditingCompensation] = useState(null)
  const [compensationFormData, setCompensationFormData] = useState({ performanceId: '', employeeId: '', recommendedPercentage: '', recommendedAmount: '', status: 'PENDING', effectiveDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })

  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType')
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isEmployee = userType === 'employee'

  useEffect(() => {
    loadData()
  }, [])

  // Debounced search term for better performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    filterAndSortPerformances()
  }, [debouncedSearchTerm, employeeFilter, ratingFilter, sortBy, sortOrder, allPerformances, dateRangeFilter, quickFilter])

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
      
      // Load users instead of employees for the dropdown
      if (isAdmin) {
        const usersData = await api.getUsers()
        // Filter out SUPER_ADMIN users and ensure we have valid user objects
        const filteredUsers = Array.isArray(usersData) 
          ? usersData.filter(user => {
              const role = (user.role || user.designation || '').toUpperCase()
              return role !== 'SUPER_ADMIN' && user.id
            })
          : []
        setEmployees(filteredUsers)
      } else {
        const usersData = await api.getUsers()
        // Filter out SUPER_ADMIN users and ensure we have valid user objects
        const filteredUsers = Array.isArray(usersData) 
          ? usersData.filter(user => {
              const role = (user.role || user.designation || '').toUpperCase()
              return role !== 'SUPER_ADMIN' && user.id
            })
          : []
        setEmployees(filteredUsers)
      }

      // Load KPI configurations (useful for admins and for showing KPI info in reviews)
      try {
        const kpiData = await api.getKpis()
        setKpis(Array.isArray(kpiData) ? kpiData : [])
      } catch (err) {
        // Non-fatal: if KPI endpoint is not available yet, we just keep an empty list
        console.warn('Could not load KPIs:', err)
      }

      // Load review cycles
      try {
        const cycleData = await api.getReviewCycles()
        setReviewCycles(Array.isArray(cycleData) ? cycleData : [])
      } catch (err) {
        console.warn('Could not load review cycles:', err)
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

  const filterAndSortPerformances = useCallback(() => {
    let filtered = [...allPerformances]

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.goals?.toLowerCase().includes(searchLower) ||
        p.achievements?.toLowerCase().includes(searchLower) ||
        p.feedback?.toLowerCase().includes(searchLower) ||
        getEmployeeName(p.employeeId)?.toLowerCase().includes(searchLower) ||
        p.managerEvaluation?.toLowerCase().includes(searchLower)
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

    // Apply date range filter
    if (dateRangeFilter.start) {
      filtered = filtered.filter(p => {
        const reviewDate = p.reviewDate ? new Date(p.reviewDate) : null
        if (!reviewDate) return false
        return reviewDate >= new Date(dateRangeFilter.start)
      })
    }
    if (dateRangeFilter.end) {
      filtered = filtered.filter(p => {
        const reviewDate = p.reviewDate ? new Date(p.reviewDate) : null
        if (!reviewDate) return false
        return reviewDate <= new Date(dateRangeFilter.end)
      })
    }

    // Apply quick filter
    if (quickFilter === 'upcoming') {
      const today = new Date()
      filtered = filtered.filter(p => {
        const reviewDate = p.reviewDate ? new Date(p.reviewDate) : null
        if (!reviewDate) return false
        return reviewDate >= today
      })
    } else if (quickFilter === 'overdue') {
      const today = new Date()
      filtered = filtered.filter(p => {
        const reviewDate = p.reviewDate ? new Date(p.reviewDate) : null
        if (!reviewDate) return false
        return reviewDate < today
      })
    } else if (quickFilter === 'recent') {
      const thirtyDaysAgo = subMonths(new Date(), 1)
      filtered = filtered.filter(p => {
        const reviewDate = p.reviewDate ? new Date(p.reviewDate) : null
        if (!reviewDate) return false
        return reviewDate >= thirtyDaysAgo
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'reviewDate':
          aValue = a.reviewDate ? new Date(a.reviewDate).getTime() : 0
          bValue = b.reviewDate ? new Date(b.reviewDate).getTime() : 0
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'employee':
          aValue = getEmployeeName(a.employeeId) || ''
          bValue = getEmployeeName(b.employeeId) || ''
          break
        default:
          aValue = a[sortBy] || ''
          bValue = b[sortBy] || ''
      }

      // Robust compare (return 0 when equal so toggling sort order is reliable)
      let cmp = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        cmp = aValue === bValue ? 0 : aValue > bValue ? 1 : -1
      } else {
        const aStr = String(aValue ?? '').toLowerCase()
        const bStr = String(bValue ?? '').toLowerCase()
        cmp = aStr.localeCompare(bStr)
      }

      return sortOrder === 'asc' ? cmp : -cmp
    })

    setPerformances(filtered)
  }, [debouncedSearchTerm, employeeFilter, ratingFilter, sortBy, sortOrder, allPerformances, employees])

  // Define loadEmployeeHistory and loadCompensationsForPerformance before they're used
  const loadEmployeeHistory = useCallback(async (employeeId) => {
    try {
      // Rating history from existing performances
      const history = allPerformances
        .filter(p => p.employeeId === employeeId)
        .sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate))
      setRatingHistory(history)

      // Promotion history from API
      try {
        const promos = await api.getPromotionsByEmployee(employeeId)
        setPromotions(Array.isArray(promos) ? promos : [])
      } catch (err) {
        console.warn('Could not load promotions:', err)
        setPromotions([])
      }

      // Compensation history for employee
      try {
        const comps = await api.getCompensationsByEmployee(employeeId)
        setCompensations(Array.isArray(comps) ? comps : [])
      } catch (err) {
        console.warn('Could not load compensations by employee:', err)
        setCompensations([])
      }


    } catch (err) {
      console.error('Error loading employee history:', err)
      setRatingHistory([])
      setPromotions([])
      setCompensations([])
    }
  }, [allPerformances])

  const loadCompensationsForPerformance = useCallback(async (performanceId) => {
    try {
      const comps = await api.getCompensationsByPerformance(performanceId)
      setCompensations(Array.isArray(comps) ? comps : [])
    } catch (err) {
      console.warn('Could not load compensations for performance:', err)
      setCompensations([])
    }
  }, [])

  // Goal Progress Tracking Functions - moved before handlePerformanceSubmit
  const parseGoals = (goalsText) => {
    if (!goalsText || typeof goalsText !== 'string') return []
    
    const goals = goalsText.split('\n').filter(goal => goal.trim())
    return goals.map(goal => {
      // Look for percentage patterns like "75%" or "completed 75%"
      const percentageMatch = goal.match(/(\d+)%|completed\s+(\d+)%/i)
      const percentage = percentageMatch ? parseInt(percentageMatch[1] || percentageMatch[2]) : 0
      
      // Extract goal title (before any percentage or status)
      const title = goal.replace(/\d+%|completed\s+\d+%|in-progress|completed/gi, '').trim()
      
      // Determine status based on percentage
      const status = percentage === 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started'
      
      // Assign color based on percentage
      let color = '#f59e0b' // Default yellow
      if (percentage === 100) {
        color = '#10b981' // Green for completed
      } else if (percentage === 0) {
        color = '#ef4444' // Red for not started
      }
      
      return {
        title: title || goal.trim(),
        percentage: Math.max(0, Math.min(100, percentage)),
        status,
        color
      }
    })
  }

  const calculateOverallProgress = (goals) => {
    if (!goals || goals.length === 0) return 0
    const total = goals.reduce((sum, goal) => sum + goal.percentage, 0)
    return Math.round(total / goals.length)
  }

  const handleOpenPerformanceModal = useCallback((performance = null) => {
    if (performance) {
      setEditingPerformance(performance)
      setPerformanceFormData({
        employeeId: performance.employeeId?.toString() || '',
        reviewDate: performance.reviewDate ? format(parseISO(performance.reviewDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        rating: performance.rating || 3,
        goals: performance.goals || '',
        achievements: performance.achievements || '',
        feedback: performance.feedback || '',
        areasForImprovement: performance.areasForImprovement || '',
        kpiConfigId: performance.kpiConfigId ? performance.kpiConfigId.toString() : '',
        kpiResults: performance.kpiResults || '',
        managerEvaluation: performance.managerEvaluation || '',
        reviewCycleId: performance.reviewCycleId ? performance.reviewCycleId.toString() : ''
      })

      // Prefill inline promotion/compensation forms and load history
      setPromotionFormData({ employeeId: performance.employeeId || '', effectiveDate: format(new Date(), 'yyyy-MM-dd'), fromPosition: '', toPosition: '', notes: '' })
      setCompensationFormData({ performanceId: performance.id || '', employeeId: performance.employeeId || '', recommendedPercentage: '', recommendedAmount: '', status: 'PENDING', effectiveDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })
      if (performance.employeeId) {
        loadEmployeeHistory(performance.employeeId)
      }
      if (performance.id) {
        loadCompensationsForPerformance(performance.id)
      }
    } else {
      setEditingPerformance(null)
      setPerformanceFormData({
        employeeId: '',
        reviewDate: format(new Date(), 'yyyy-MM-dd'),
        rating: 3,
        goals: '',
        achievements: '',
        feedback: '',
        areasForImprovement: '',
        kpiConfigId: '',
        kpiResults: '',
        managerEvaluation: '',
        reviewCycleId: ''
      })

      // reset inline recommendation forms
      setPromotionFormData({ employeeId: '', effectiveDate: format(new Date(), 'yyyy-MM-dd'), fromPosition: '', toPosition: '', notes: '' })
      setCompensationFormData({ performanceId: '', employeeId: '', recommendedPercentage: '', recommendedAmount: '', status: 'PENDING', effectiveDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })
    }
    setShowPerformanceModal(true)
  }, [loadEmployeeHistory, loadCompensationsForPerformance])

  const handlePerformanceSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Calculate overall progress from goals text to satisfy backend non-null constraint
      const parsedGoals = parseGoals(performanceFormData.goals)
      const overallProgress = calculateOverallProgress(parsedGoals)

      const performanceData = {
        ...performanceFormData,
        employeeId: parseInt(performanceFormData.employeeId),
        rating: parseInt(performanceFormData.rating),
        kpiConfigId: performanceFormData.kpiConfigId ? parseInt(performanceFormData.kpiConfigId) : null,
        reviewCycleId: performanceFormData.reviewCycleId ? parseInt(performanceFormData.reviewCycleId) : null,
        overallProgress: overallProgress
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
  }, [performanceFormData, editingPerformance, loadData, parseGoals, calculateOverallProgress])

  const handleDeletePerformance = useCallback(async (id) => {
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
  }, [loadData])

  // KPI management helpers
  const openKpiModal = (kpi = null) => {
    // Switch to KPIs tab if not already there
    if (activeView !== 'kpis') {
      setActiveView('kpis')
    }
    
    if (kpi) {
      setEditingKpi(kpi)
      setKpiFormData({
        name: kpi.name || '',
        description: kpi.description || '',
        target: (kpi.target !== undefined && kpi.target !== null) ? kpi.target : '',
        weight: (kpi.weight !== undefined && kpi.weight !== null) ? kpi.weight : '',
        active: kpi.active === undefined ? true : kpi.active
      })
    } else {
      setEditingKpi(null)
      setKpiFormData({ name: '', description: '', target: '', weight: '', active: true })
    }
    setShowKpiModal(true)
  }

  const openCycleModal = (cycle = null) => {
    // Switch to Cycles tab if not already there
    if (activeView !== 'cycles') {
      setActiveView('cycles')
    }
    
    if (cycle) {
      setEditingCycle(cycle)
      setCycleFormData({
        name: cycle.name || '',
        startDate: cycle.startDate || '',
        endDate: cycle.endDate || '',
        active: cycle.active === undefined ? true : cycle.active,
        kpiConfigId: cycle.kpiConfigId ? cycle.kpiConfigId.toString() : ''
      })
    } else {
      setEditingCycle(null)
      setCycleFormData({ name: '', startDate: '', endDate: '', active: true, kpiConfigId: '' })
    }
    setShowCycleModal(true)
  }

  const handleKpiSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      // Normalize empty strings to null/number types for backend
      const payload = {
        ...kpiFormData,
        weight: kpiFormData.weight === '' ? null : parseInt(kpiFormData.weight, 10),
        target: kpiFormData.target === '' ? null : (typeof kpiFormData.target === 'string' ? kpiFormData.target.trim() : kpiFormData.target)
      }

      if (editingKpi) {
        await api.updateKpi(editingKpi.id, payload)
        setSuccessMessage('KPI updated!')
      } else {
        await api.createKpi(payload)
        setSuccessMessage('KPI created!')
      }
      await loadData()
      // Close modal and reset form after successful submission
      setShowKpiModal(false)
      setEditingKpi(null)
      setKpiFormData({ name: '', description: '', target: '', weight: '', active: true })
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error saving KPI')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleCycleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const selectedKpi = kpis.find(kpi => kpi.id.toString() === cycleFormData.kpiConfigId)
      const payload = {
        ...cycleFormData,
        name: selectedKpi ? selectedKpi.name : '',
        kpiConfigId: cycleFormData.kpiConfigId ? parseInt(cycleFormData.kpiConfigId) : null
      }

      if (editingCycle) {
        await api.updateReviewCycle(editingCycle.id, payload)
        setSuccessMessage('Review cycle updated!')
      } else {
        await api.createReviewCycle(payload)
        setSuccessMessage('Review cycle created!')
      }
      await loadData()
      // Close modal and reset form after successful submission
      setShowCycleModal(false)
      setEditingCycle(null)
      setCycleFormData({ name: '', startDate: '', endDate: '', active: true, kpiConfigId: '' })
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error saving review cycle')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKpi = async (id) => {
    if (!window.confirm('Delete this KPI configuration?')) return
    setLoading(true)
    try {
      await api.deleteKpi(id)
      await loadData()
      setSuccessMessage('KPI deleted')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error deleting KPI')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCycle = async (id) => {
    if (!window.confirm('Delete this review cycle?')) return
    setLoading(true)
    try {
      await api.deleteReviewCycle(id)
      await loadData()
      setSuccessMessage('Review cycle deleted')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error deleting review cycle')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Promotions
  const handlePromotionSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const payload = {
        ...promotionFormData,
        employeeId: parseInt(promotionFormData.employeeId)
      }
      if (editingPromotion) {
        await api.updatePromotion(editingPromotion.id, payload)
        setSuccessMessage('Promotion updated')
      } else {
        await api.createPromotion(payload)
        setSuccessMessage('Promotion added')
      }
      if (selectedPerformance && selectedPerformance.employeeId) {
        await loadEmployeeHistory(selectedPerformance.employeeId)
      } else {
        await loadData()
      }
      setShowPromotionModal(false)
      setEditingPromotion(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error saving promotion')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('Delete this promotion record?')) return
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await api.deletePromotion(id)
      if (selectedPerformance && selectedPerformance.employeeId) {
        await loadEmployeeHistory(selectedPerformance.employeeId)
      } else {
        await loadData()
      }
      setSuccessMessage('Promotion deleted')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error deleting promotion')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Compensation handlers
  const handleCompensationSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const payload = {
        ...compensationFormData,
        performanceId: compensationFormData.performanceId || (selectedPerformance && selectedPerformance.id) || null,
        employeeId: parseInt(compensationFormData.employeeId || (selectedPerformance && selectedPerformance.employeeId) || 0),
        recommendedPercentage: compensationFormData.recommendedPercentage ? parseFloat(compensationFormData.recommendedPercentage) : null,
        recommendedAmount: compensationFormData.recommendedAmount ? parseFloat(compensationFormData.recommendedAmount) : null
      }

      if (editingCompensation) {
        await api.updateCompensation(editingCompensation.id, payload)
        setSuccessMessage('Compensation updated')
      } else {
        await api.createCompensation(payload)
        setSuccessMessage('Compensation added')
      }

      if (selectedPerformance && selectedPerformance.id) {
        await loadCompensationsForPerformance(selectedPerformance.id)
      } else if (payload.employeeId) {
        await loadEmployeeHistory(payload.employeeId)
      } else {
        await loadData()
      }

      setShowCompensationModal(false)
      setEditingCompensation(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error saving compensation')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompensation = async (id) => {
    if (!window.confirm('Delete this compensation record?')) return
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await api.deleteCompensation(id)
      if (selectedPerformance && selectedPerformance.id) {
        await loadCompensationsForPerformance(selectedPerformance.id)
      } else {
        await loadData()
      }
      setSuccessMessage('Compensation deleted')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error deleting compensation')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Export Functions
  const handleExportReviewsCSV = () => {
    try {
      const csvData = performances.map(p => {
        const employee = employees.find(emp => emp.id === p.employeeId)
        const cycle = reviewCycles.find(c => c.id === p.reviewCycleId)
        return {
          Employee: getEmployeeName(p.employeeId) || 'N/A',
          'Review Date': p.reviewDate ? format(parseISO(p.reviewDate), 'yyyy-MM-dd') : 'N/A',
          'Review Cycle': cycle?.name || 'N/A',
          Rating: p.rating || 0,
          Goals: (p.goals || '').replace(/\n/g, '; ').substring(0, 100),
          Achievements: (p.achievements || '').replace(/\n/g, '; ').substring(0, 100),
          Feedback: (p.feedback || '').replace(/\n/g, '; ').substring(0, 100),
          'Manager Evaluation': (p.managerEvaluation || '').replace(/\n/g, '; ').substring(0, 100)
        }
      })

      if (csvData.length === 0) {
        setError('No data to export')
        setTimeout(() => setError(null), 3000)
        return
      }

      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `performance_reviews_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage('Performance reviews exported successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError('Error exporting data: ' + error.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleExportKPIsCSV = () => {
    try {
      const csvData = kpis.map(k => ({
        Name: k.name || 'N/A',
        Description: (k.description || '').replace(/\n/g, '; '),
        Target: k.target || 'N/A',
        Weight: k.weight || 0,
        Status: k.active ? 'Active' : 'Inactive'
      }))

      if (csvData.length === 0) {
        setError('No KPI data to export')
        setTimeout(() => setError(null), 3000)
        return
      }

      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `kpi_configurations_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage('KPI configurations exported successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError('Error exporting data: ' + error.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleExportCyclesCSV = () => {
    try {
      const csvData = reviewCycles.map(c => {
        const kpi = kpis.find(k => k.id === c.kpiConfigId)
        return {
          Name: c.name || 'N/A',
          'Start Date': c.startDate ? format(parseISO(c.startDate), 'yyyy-MM-dd') : 'N/A',
          'End Date': c.endDate ? format(parseISO(c.endDate), 'yyyy-MM-dd') : 'N/A',
          'KPI Configuration': kpi?.name || 'N/A',
          Status: c.active ? 'Active' : 'Inactive'
        }
      })

      if (csvData.length === 0) {
        setError('No cycle data to export')
        setTimeout(() => setError(null), 3000)
        return
      }

      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `review_cycles_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage('Review cycles exported successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError('Error exporting data: ' + error.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  // Clear Filters Function
  const handleClearFilters = () => {
    setSearchTerm('')
    setEmployeeFilter('All')
    setRatingFilter('All')
    setDateRangeFilter({ start: '', end: '' })
    setQuickFilter('all')
    setSortBy('reviewDate')
    setSortOrder('desc')
    setSuccessMessage('Filters cleared')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const hasActiveFilters =
    employeeFilter !== 'All' ||
    ratingFilter !== 'All' ||
    quickFilter !== 'all' ||
    !!dateRangeFilter.start ||
    !!dateRangeFilter.end ||
    !!searchTerm

  const openViewModal = useCallback((performance) => {
    setSelectedPerformance(performance)
    // Load rating history, promotions and compensations for this employee
    if (performance && performance.employeeId) {
      loadEmployeeHistory(performance.employeeId)
    }
    if (performance && performance.id) {
      loadCompensationsForPerformance(performance.id)
    }
    setShowViewModal(true)
  }, [loadEmployeeHistory, loadCompensationsForPerformance])

  // KPI auto-calculation helpers (optimized)
  const parseTargetPercent = (target) => {
    if (!target && target !== 0) return null
    try {
      const t = String(target).trim()
      const m = t.match(/(\d+(?:\.\d+)?)\s*%?/) // number with optional %
      if (m) return parseFloat(m[1])
      return null
    } catch (e) {
      return null
    }
  }

  const computeAttendanceKpi = async (employeeId, startDate, endDate) => {
    const cacheKey = `${employeeId}_attendance_${startDate || ''}_${endDate || ''}`
    if (kpiCacheRef.current[cacheKey]) return kpiCacheRef.current[cacheKey]

    try {
      const att = await api.getAttendanceByEmployee(employeeId)
      if (!Array.isArray(att) || att.length === 0) return null
      const filtered = att.filter(a => {
        const d = a.date || a.attendanceDate || a.createdAt || a.recordedAt
        if (!d) return false
        const dt = new Date(d)
        if (startDate && dt < new Date(startDate)) return false
        if (endDate && dt > new Date(endDate)) return false
        return true
      })
      if (filtered.length === 0) return null
      const present = filtered.filter(a => (a.status || '').toLowerCase() === 'present').length
      const pct = (present / filtered.length) * 100
      const res = { name: 'Attendance', value: `${pct.toFixed(1)}%`, percentage: Math.round(pct), raw: { present, total: filtered.length } }
      kpiCacheRef.current[cacheKey] = res
      return res
    } catch (err) {
      console.warn('Error computing attendance KPI:', err)
      return null
    }
  }

  const computeTaskCompletionKpi = async (employeeId, startDate, endDate) => {
    const cacheKey = `${employeeId}_task_${startDate || ''}_${endDate || ''}`
    if (kpiCacheRef.current[cacheKey]) return kpiCacheRef.current[cacheKey]

    try {
      // Use tickets as proxy for assigned tasks
      const assigned = await api.getAssignedTickets(employeeId)
      const arr = Array.isArray(assigned) ? assigned : []
      const filtered = arr.filter(t => {
        const d = t.createdAt || t.createdOn
        if (!d) return false
        const dt = new Date(d)
        if (startDate && dt < new Date(startDate)) return false
        if (endDate && dt > new Date(endDate)) return false
        return true
      })
      if (filtered.length === 0) return null
      const completed = filtered.filter(t => ['resolved','closed','completed'].includes((t.status || '').toLowerCase())).length
      const pct = (completed / filtered.length) * 100
      const res = { name: 'Task Completion', value: `${pct.toFixed(1)}%`, percentage: Math.round(pct), raw: { completed, total: filtered.length } }
      kpiCacheRef.current[cacheKey] = res
      return res
    } catch (err) {
      console.warn('Error computing task completion KPI:', err)
      return null
    }
  }

  const computeKpiResultsForPerformance = async (performance) => {
    if (!performance || !performance.kpiConfigId) return []
    const kpi = kpis.find(k => k.id === performance.kpiConfigId) || null
    if (!kpi) return []

    if (!performance.employeeId) return []

    setComputingKpi(true)
    try {
      // derive date range from reviewCycle if available
      let startDate = null
      let endDate = null
      if (performance.reviewCycleId) {
        const cycle = reviewCycles.find(c => c.id === performance.reviewCycleId)
        if (cycle) {
          startDate = cycle.startDate || null
          endDate = cycle.endDate || null
        }
      }
      // fallback: use 30 days prior to reviewDate
      if (!startDate && performance.reviewDate) {
        const d = new Date(performance.reviewDate)
        const before = new Date(d)
        before.setDate(before.getDate() - 30)
        startDate = before.toISOString()
        endDate = new Date(performance.reviewDate).toISOString()
      }

      const cacheKey = `${performance.employeeId}_${kpi.id}_${startDate || ''}_${endDate || ''}`
      if (kpiCacheRef.current[cacheKey]) {
        const cached = kpiCacheRef.current[cacheKey]
        setComputedKpiResults([cached])
        return [cached]
      }

      const name = (kpi.name || '').toLowerCase()
      let result = null

      // Fast path when name clearly indicates type
      if (name.includes('attendance')) {
        result = await computeAttendanceKpi(performance.employeeId, startDate, endDate)
      } else if (name.includes('task') || name.includes('task completion') || name.includes('ticket')) {
        result = await computeTaskCompletionKpi(performance.employeeId, startDate, endDate)
      } else {
        // ambiguous: prefetch both in parallel (faster than sequential) and pick the first non-null
        const [att, task] = await Promise.allSettled([
          computeAttendanceKpi(performance.employeeId, startDate, endDate),
          computeTaskCompletionKpi(performance.employeeId, startDate, endDate)
        ])
        result = att.status === 'fulfilled' && att.value ? att.value : (task.status === 'fulfilled' && task.value ? task.value : null)
      }

      if (result) {
        const targetPct = parseTargetPercent(kpi.target)
        result.achieved = targetPct !== null ? (result.percentage >= targetPct) : null
        kpiCacheRef.current[cacheKey] = result
        setComputedKpiResults([result])
        return [result]
      } else {
        setComputedKpiResults([])
        return []
      }
    } finally {
      setComputingKpi(false)
    }
  }

  // Inline add from within create/edit review modal
  const handleAddPromotionInline = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const payload = {
        ...promotionFormData,
        employeeId: parseInt(promotionFormData.employeeId || performanceFormData.employeeId || 0)
      }
      if (!payload.employeeId) throw new Error('Select an employee before adding a promotion')
      await api.createPromotion(payload)
      setSuccessMessage('Promotion recommendation added')
      await loadEmployeeHistory(payload.employeeId)
      setPromotionFormData({ employeeId: payload.employeeId, effectiveDate: format(new Date(), 'yyyy-MM-dd'), fromPosition: '', toPosition: '', notes: '' })
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error adding promotion')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCompensationInline = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const payload = {
        ...compensationFormData,
        performanceId: compensationFormData.performanceId || (editingPerformance && editingPerformance.id) || null,
        employeeId: parseInt(compensationFormData.employeeId || performanceFormData.employeeId || 0),
        recommendedPercentage: compensationFormData.recommendedPercentage ? parseFloat(compensationFormData.recommendedPercentage) : null,
        recommendedAmount: compensationFormData.recommendedAmount ? parseFloat(compensationFormData.recommendedAmount) : null
      }
      if (!payload.employeeId) throw new Error('Select an employee before adding a compensation recommendation')
      await api.createCompensation(payload)
      setSuccessMessage('Compensation recommendation added')
      if (payload.performanceId) {
        await loadCompensationsForPerformance(payload.performanceId)
      } else {
        await loadEmployeeHistory(payload.employeeId)
      }
      setCompensationFormData({ performanceId: payload.performanceId || '', employeeId: payload.employeeId, recommendedPercentage: '', recommendedAmount: '', status: 'PENDING', effectiveDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error adding compensation')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = useCallback((employeeId) => {
    try {
      const employee = employees.find(emp => emp && emp.id === employeeId)
      if (employee) {
        return employee.name || 'Unknown'
      }
      return 'Unknown'
    } catch (err) {
      return 'Unknown'
    }
  }, [employees])

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
  // Memoized stats calculation
  // Analytics Data
  const analyticsData = useMemo(() => {
    const ratingDistribution = [0, 0, 0, 0, 0] // 1-5 stars
    const monthlyTrends = {}
    const departmentPerformance = {}
    
    allPerformances.forEach(p => {
      // Rating distribution
      const rating = p.rating || 0
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating - 1]++
      }
      
      // Monthly trends
      if (p.reviewDate) {
        const month = format(parseISO(p.reviewDate), 'yyyy-MM')
        if (!monthlyTrends[month]) {
          monthlyTrends[month] = { count: 0, totalRating: 0 }
        }
        monthlyTrends[month].count++
        monthlyTrends[month].totalRating += rating
      }
      
      // Department performance
      const employee = employees.find(emp => emp.id === p.employeeId)
      const dept = employee?.department || 'Unknown'
      if (!departmentPerformance[dept]) {
        departmentPerformance[dept] = { count: 0, totalRating: 0 }
      }
      departmentPerformance[dept].count++
      departmentPerformance[dept].totalRating += rating
    })
    
    const ratingChartData = [
      { name: '1 Star', value: ratingDistribution[0], fill: '#ef4444' },
      { name: '2 Stars', value: ratingDistribution[1], fill: '#f97316' },
      { name: '3 Stars', value: ratingDistribution[2], fill: '#f59e0b' },
      { name: '4 Stars', value: ratingDistribution[3], fill: '#3b82f6' },
      { name: '5 Stars', value: ratingDistribution[4], fill: '#10b981' }
    ]
    
    const trendChartData = Object.keys(monthlyTrends)
      .sort()
      .slice(-6) // Last 6 months
      .map(month => ({
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        reviews: monthlyTrends[month].count,
        avgRating: monthlyTrends[month].count > 0 
          ? (monthlyTrends[month].totalRating / monthlyTrends[month].count).toFixed(1)
          : 0
      }))
    
    const departmentChartData = Object.keys(departmentPerformance)
      .map(dept => ({
        department: dept,
        reviews: departmentPerformance[dept].count,
        avgRating: departmentPerformance[dept].count > 0
          ? (departmentPerformance[dept].totalRating / departmentPerformance[dept].count).toFixed(1)
          : 0
      }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 5) // Top 5 departments
    
    return {
      ratingDistribution: ratingChartData,
      trendData: trendChartData,
      departmentData: departmentChartData
    }
  }, [allPerformances, employees])

  const stats = useMemo(() => ({
    total: allPerformances.length,
    averageRating: allPerformances.length > 0
      ? (allPerformances.reduce((sum, p) => sum + (p.rating || 0), 0) / allPerformances.length).toFixed(1)
      : '0.0',
    topPerformers: allPerformances.filter(p => (p.rating || 0) >= 4).length,
    excellent: allPerformances.filter(p => (p.rating || 0) >= 4.5).length,
    good: allPerformances.filter(p => (p.rating || 0) >= 3 && (p.rating || 0) < 4).length,
    needsImprovement: allPerformances.filter(p => (p.rating || 0) < 3).length
  }), [allPerformances])


  // (Removed) Rating Distribution and Performance Trends chart data

  // Memoized top performers data
  const topPerformersData = useMemo(() => 
    allPerformances
    .filter(p => (p.rating || 0) >= 4)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)
    .map(p => ({
      name: getEmployeeName(p.employeeId),
      rating: p.rating || 0,
      })),
    [allPerformances, getEmployeeName]
  )

  // KPI parsing helpers
  const parseKpis = (kpiText) => {
    if (!kpiText || typeof kpiText !== 'string') return []
    const lines = kpiText.split('\n').filter(l => l.trim())
    return lines.map(line => {
      // expected format: "KPI Name: value (optional %%)"
      const [namePart, rest] = line.split(':').map(s => s && s.trim())
      const name = namePart || line
      let value = rest || ''
      // try to extract percentage in parentheses
      const percentMatch = value.match(/(\d+)%/)
      const percentage = percentMatch ? parseInt(percentMatch[1]) : null
      return { name, value: value.trim(), percentage }
    })
  }

  // Parse a numeric hours value from a KPI value string.
  // Supports formats like "20", "20h", "20 hrs", "20 hours", and decimals like "4.5h".
  const parseHoursFromValue = (value) => {
    if (!value || typeof value !== 'string') return null
    // Prefer an explicit hours unit followed by number; fallback to first number found
    const match = value.match(/(\d+(?:\.\d+)?)(?=\s*(h|hrs|hours)\b)/i) || value.match(/(\d+(?:\.\d+)?)/)
    if (!match) return null
    const num = parseFloat(match[1])
    return Number.isNaN(num) ? null : num
  }

  // Compute a display percentage for specific KPI names when percentage is not provided by user.
  // For "Response Time" we compute percent = (hours / 24) * 100 and clamp to 0-100.
  const computeKpiDisplayPercentage = (name, value, existingPercentage) => {
    if (existingPercentage !== null && existingPercentage !== undefined) return existingPercentage
    const lname = (name || '').toLowerCase()
    if (lname.includes('response time')) {
      const hours = parseHoursFromValue(value)
      if (hours != null) {
        const pct = Math.round((hours / 24) * 100)
        return Math.max(0, Math.min(100, pct))
      }
    }
    return null
  }

  const getKpiBadgeColor = (percentage) => {
    if (percentage === null) return 'text-gray-700 bg-gray-100 border-gray-200'
    if (percentage >= 90) return 'text-green-700 bg-green-100 border-green-200'
    if (percentage >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-200'
    return 'text-red-700 bg-red-100 border-red-200'
  }

  const getProgressColor = (percentage) => {
    if (percentage === 100) return '#10b981' // Green for completed
    return '#f59e0b' // Yellow for in progress (including 0%)
  }

  const getProgressStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getGoalProgressData = (goals) => {
    if (!goals || goals.length === 0) return []
    
    const completed = goals.filter(g => g.status === 'completed').length
    const inProgress = goals.filter(g => g.status === 'in-progress').length
    
    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' }
    ]
  }

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

  // If creating/editing performance review, show full page view (like payroll page)
  if (showPerformanceModal && isAdmin) {
  return (
      <>
        <div className="min-h-screen bg-gray-50 -m-4 md:-m-6 -mt-0">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl px-2 md:px-4 pt-2 md:pt-4 pb-4 md:pb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                  {editingPerformance ? (
                    <>
                      <Target size={28} className="text-blue-600" />
                      Edit Performance Review
                    </>
                  ) : (
                    <>
                      <Plus size={28} className="text-blue-600" />
                      Create Performance Review
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowPerformanceModal(false)
                    setEditingPerformance(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handlePerformanceSubmit} className="space-y-5">
                {/* Employee Information */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                      <select
                        value={performanceFormData.employeeId}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, employeeId: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                        disabled={!!editingPerformance}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id.toString()}>
                            {emp.name || `Employee ${emp.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Review Date *</label>
                      <input
                        type="date"
                        value={performanceFormData.reviewDate}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, reviewDate: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                {/* Rating & Performance */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Rating & Performance</h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating * (1-5)</label>
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
                </div>

                {/* Goals & KPIs */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Goals & KPIs</h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Tracking</label>
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-700 font-medium mb-1">📌 Format:</p>
                      <p className="text-xs text-blue-600">List goals, one per line. You may optionally include progress as a percentage.</p>
                    </div>
                    <textarea
                      value={performanceFormData.goals}
                      onChange={(e) => setPerformanceFormData({ ...performanceFormData, goals: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Enter goals, one per line:&#10;Improve client satisfaction&#10;Complete project management course&#10;Reduce bug resolution time"
                    />
                  </div>

                  {/* KPI selection + results */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">KPI Template (optional)</label>
                      <select
                        value={performanceFormData.kpiConfigId}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, kpiConfigId: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">No KPI</option>
                        {kpis.map(k => (
                          <option key={k.id} value={k.id.toString()}>{k.name}{k.target ? ` — ${k.target}` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Review Cycle (optional)</label>
                      <select
                        value={performanceFormData.reviewCycleId || ''}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, reviewCycleId: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">No Cycle</option>
                        {reviewCycles.map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name} {c.startDate && c.endDate ? `(${c.startDate} → ${c.endDate})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">KPI Results</label>
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-700 font-medium mb-1">📌 Format:</p>
                      <p className="text-xs text-blue-600">Enter KPI results one per line, as "KPI Name: value (optional %)", e.g. "Response Time: 18h (75%)" or "Sales: 120"</p>
                    </div>
                    <textarea
                      value={performanceFormData.kpiResults}
                      onChange={(e) => setPerformanceFormData({ ...performanceFormData, kpiResults: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter KPI results, one per line:&#10;Response Time: 18h (75%)&#10;Sales: 120"
                    />
                  </div>
                </div>

                {/* Achievements & Feedback */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Achievements & Feedback</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Achievements</label>
                      <textarea
                        value={performanceFormData.achievements}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, achievements: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Key achievements and accomplishments..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                      <textarea
                        value={performanceFormData.feedback}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, feedback: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Manager feedback and comments..."
                      />
                    </div>
                  </div>
                </div>

                {/* Manager Evaluation */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Manager Evaluation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Evaluation</label>
                      <textarea
                        value={performanceFormData.managerEvaluation}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, managerEvaluation: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows="3"
                        placeholder="Manager evaluation and summary..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Areas for Improvement</label>
                      <textarea
                        value={performanceFormData.areasForImprovement}
                        onChange={(e) => setPerformanceFormData({ ...performanceFormData, areasForImprovement: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Areas that need improvement..."
                      />
                    </div>
                  </div>
                </div>

                {/* Promotion Recommendation */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Promotion Recommendation (optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Effective Date</label>
                      <input type="date" value={promotionFormData.effectiveDate} onChange={(e) => setPromotionFormData({ ...promotionFormData, effectiveDate: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">From Position</label>
                      <input value={promotionFormData.fromPosition} onChange={(e) => setPromotionFormData({ ...promotionFormData, fromPosition: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Current position (optional)" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">To Position</label>
                      <input value={promotionFormData.toPosition} onChange={(e) => setPromotionFormData({ ...promotionFormData, toPosition: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Recommended position" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={promotionFormData.notes} onChange={(e) => setPromotionFormData({ ...promotionFormData, notes: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Rationale and context for promotion recommendation (optional)" />
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" onClick={() => setPromotionFormData({ employeeId: performanceFormData.employeeId || '', effectiveDate: format(new Date(), 'yyyy-MM-dd'), fromPosition: '', toPosition: '', notes: '' })} className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors">Clear</button>
                    <button type="button" onClick={handleAddPromotionInline} className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors shadow-md">Add Promotion</button>
                  </div>
                </div>

                {/* Compensation Recommendation */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Compensation Recommendation (optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Recommended %</label>
                      <input type="number" step="0.1" value={compensationFormData.recommendedPercentage} onChange={(e) => setCompensationFormData({ ...compensationFormData, recommendedPercentage: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Recommended Amount</label>
                      <input type="number" step="0.01" value={compensationFormData.recommendedAmount} onChange={(e) => setCompensationFormData({ ...compensationFormData, recommendedAmount: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Effective Date</label>
                      <input type="date" value={compensationFormData.effectiveDate} onChange={(e) => setCompensationFormData({ ...compensationFormData, effectiveDate: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={compensationFormData.notes} onChange={(e) => setCompensationFormData({ ...compensationFormData, notes: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Notes for compensation recommendation (optional)" />
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" onClick={() => setCompensationFormData({ performanceId: performanceFormData.id || '', employeeId: performanceFormData.employeeId || '', recommendedPercentage: '', recommendedAmount: '', status: 'PENDING', effectiveDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })} className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors">Clear</button>
                    <button type="button" onClick={handleAddCompensationInline} className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors shadow-md">Add Recommendation</button>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPerformanceModal(false)
                      setEditingPerformance(null)
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    {loading ? 'Saving...' : editingPerformance ? 'Update Performance Review' : 'Create Performance Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 bg-gray-50 max-w-full overflow-x-hidden min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Performance Management</h1>
        <p className="text-gray-600">Track and manage employee performance reviews, KPIs, and appraisals</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-2 border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 flex-wrap">
          <button
            onClick={() => {
              setActiveView('reviews')
              setShowKpiModal(false)
              setShowCycleModal(false)
            }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'reviews'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Target size={18} />
            Performance Reviews ({allPerformances.length})
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveView('kpis')
                  setShowCycleModal(false)
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeView === 'kpis'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 size={18} />
                KPI Configuration ({kpis.length})
              </button>
              <button
                onClick={() => {
                  setActiveView('cycles')
                  setShowKpiModal(false)
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeView === 'cycles'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar size={18} />
                Review Cycles ({reviewCycles.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Messages - Fixed Top Right */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2 max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 flex items-center gap-2 max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Performance Reviews Tab Content */}
      {(activeView === 'reviews' || (!isAdmin && activeView !== 'kpis' && activeView !== 'cycles')) && (
        <React.Fragment>
      {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-2 border-blue-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Total Reviews</div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-800">{stats.total}</div>
        </div>
                <Target className="text-blue-600 opacity-50" size={32} />
        </div>
        </div>
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-2 border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Avg Rating</div>
                  <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.averageRating}</div>
        </div>
                <Star className="text-green-600 opacity-50" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-2 border-yellow-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Top Performers</div>
                  <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.topPerformers}</div>
                </div>
                <Award className="text-yellow-600 opacity-50" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-2 border-purple-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Excellent (4.5+)</div>
                  <div className="text-2xl md:text-3xl font-bold text-purple-600">{stats.excellent}</div>
                </div>
                <TrendingUp className="text-purple-600 opacity-50" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-2 border-orange-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Needs Improvement</div>
                  <div className="text-2xl md:text-3xl font-bold text-orange-600">{stats.needsImprovement}</div>
                </div>
                <AlertCircle className="text-orange-600 opacity-50" size={32} />
              </div>
        </div>
      </div>

      {/* Filters (Audit Logs style) */}
      <div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
            >
              <Filter size={18} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by employee, goals, feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleExportReviewsCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
            title="Export to CSV"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Filter</label>
              <select
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="recent">Recent (30 days)</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {isAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.name || `Employee ${emp.id}`}
                    </option>
                  ))}
              </select>
              </div>
            ) : (
              <div />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="reviewDate">Review Date</option>
                <option value="rating">Rating</option>
                {isAdmin && <option value="employee">Employee</option>}
            </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
              </div>
            </div>
          )}
        </div>

      {/* (Removed) Rating Distribution and Performance Trends charts */}

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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Reviews Table */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <Target size={24} className="text-blue-600" />
              Performance Reviews ({performances.length})
            </h3>
            {isAdmin && (
                <button
                  onClick={() => handleOpenPerformanceModal()}
                className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  <Plus size={20} />
                <span className="hidden sm:inline">Create Review</span>
                <span className="sm:hidden">Create</span>
                </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                {isAdmin && (
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                )}
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">Cycle</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Review Date</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Rating</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">Goals</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">Achievements</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    <Target className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-lg font-medium">No performance reviews found</p>
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
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getEmployeeName(performance.employeeId)}
                        </td>
                      )}
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        {(reviewCycles.find(c => c.id === performance.reviewCycleId) || {}).name || '—'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(performance.reviewDate)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {getRatingStars(performance.rating || 0)}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRatingColor(performance.rating || 0)}`}>
                            {performance.rating || 0}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900 max-w-xs truncate hidden lg:table-cell">
                        {performance.goals || 'N/A'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900 max-w-xs truncate hidden lg:table-cell">
                        {performance.achievements || 'N/A'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 md:gap-2">
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
        </React.Fragment>
      )}

      {/* KPI Configuration Tab Content */}
      {activeView === 'kpis' && isAdmin && (
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <BarChart3 size={24} className="text-blue-600" />
                KPI Configuration ({kpis.length})
              </h3>
              <button
                onClick={() => openKpiModal(null)}
                className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Create KPI</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          <div className="p-0">
         
            {kpis.length === 0 ? (
              <div className="px-4 md:px-6 pb-4 md:pb-6">
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">No KPI templates yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first KPI to get started</p>
                  <button
                    onClick={() => openKpiModal(null)}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-md transition-all duration-200 font-semibold"
                  >
                    <Plus size={20} />
                    Create Your First KPI
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full table-fixed">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">Description</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Target</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Weight</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {kpis.map(k => (
                        <tr key={k.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{k.name}</div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
                            <div className="text-sm text-gray-600 max-w-xs truncate" title={k.description || ''}>
                              {k.description || '—'}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            {k.target ? (
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                {k.target}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            {k.weight !== null && k.weight !== undefined ? (
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                                {k.weight}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {k.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex items-center gap-2">
                <button
                                onClick={() => openKpiModal(k)} 
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteKpi(k.id)} 
                                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
        </div>
      )}

      {/* Review Cycles Tab Content */}
      {activeView === 'cycles' && isAdmin && (
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar size={24} className="text-blue-600" />
                Review Cycles ({reviewCycles.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCyclesCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-md"
                  title="Export Cycles to CSV"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => openCycleModal(null)}
                  className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Create Cycle</span>
                  <span className="sm:hidden">Create</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-0">
          
                  {reviewCycles.length === 0 ? (
              <div className="px-4 md:px-6 pb-4 md:pb-6">
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">No review cycles defined</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first cycle to get started</p>
                  <button
                    onClick={() => openCycleModal(null)}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-md transition-all duration-200 font-semibold"
                  >
                    <Plus size={20} />
                    Create Your First Cycle
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full table-fixed">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Cycle Name</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">KPI Configuration</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Start Date</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">End Date</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviewCycles.map(c => {
                      const associatedKpi = kpis.find(kpi => kpi.id === c.kpiConfigId)
                      return (
                          <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              {associatedKpi ? (
                                <div className="text-sm text-gray-600">
                                  <div className="font-medium">{associatedKpi.name}</div>
                                  {associatedKpi.target && (
                                    <div className="text-xs text-gray-500">Target: {associatedKpi.target}</div>
                            )}
                          </div>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{formatDate(c.startDate)}</div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{formatDate(c.endDate)}</div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {c.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => openCycleModal(c)} 
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCycle(c.id)} 
                                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                          </div>
                            </td>
                          </tr>
                      )
                      })}
                    </tbody>
                  </table>
              </div>
                  )}
                </div>
              </div>
      )}

      {/* Review Cycle Modal */}
      {showCycleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowCycleModal(false)
          setEditingCycle(null)
          setCycleFormData({ name: '', startDate: '', endDate: '', active: true, kpiConfigId: '' })
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Calendar size={28} className="text-blue-600" />
                {editingCycle ? 'Edit Review Cycle' : 'Create New Review Cycle'}
              </h3>
              <button
                onClick={() => {
                  setShowCycleModal(false)
                  setEditingCycle(null)
                  setCycleFormData({ name: '', startDate: '', endDate: '', active: true, kpiConfigId: '' })
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCycleSubmit} className="space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Cycle Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">KPI Configuration *</label>
                    <select 
                      value={cycleFormData.kpiConfigId || ''} 
                      onChange={(e) => {
                        const selectedKpi = kpis.find(kpi => kpi.id.toString() === e.target.value)
                        setCycleFormData({ 
                          ...cycleFormData, 
                          name: selectedKpi ? selectedKpi.name : '',
                          kpiConfigId: e.target.value 
                        })
                      }} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                      required
                    >
                      <option value="">Select KPI Configuration</option>
                      {kpis.map(kpi => (
                        <option key={kpi.id} value={kpi.id.toString()}>
                          {kpi.name} {kpi.target ? `(Target: ${kpi.target})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Cycle name will be set from selected KPI</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                    <input 
                      type="date" 
                      value={cycleFormData.startDate} 
                      onChange={(e) => setCycleFormData({ ...cycleFormData, startDate: e.target.value })} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                    <input 
                      type="date" 
                      value={cycleFormData.endDate} 
                      onChange={(e) => setCycleFormData({ ...cycleFormData, endDate: e.target.value })} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={cycleFormData.active} 
                      onChange={(e) => setCycleFormData({ ...cycleFormData, active: e.target.checked })} 
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-semibold text-gray-700">Active</label>
                  </div>
                  </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCycleModal(false)
                    setEditingCycle(null)
                    setCycleFormData({ name: '', startDate: '', endDate: '', active: true, kpiConfigId: '' })
                  }} 
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingCycle ? 'Update Cycle' : 'Create Cycle'}
                </button>
            </div>
            </form>
          </div>
        </div>
      )}
                     
      {/* KPI Configuration Modal */}
      {showKpiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => {
          setShowKpiModal(false)
          setEditingKpi(null)
          setKpiFormData({ name: '', description: '', target: '', weight: '', active: true })
        }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <BarChart3 size={28} className="text-blue-600" />
                {editingKpi ? 'Edit KPI' : 'Create New KPI'}
              </h3>
                <button
                onClick={() => {
                  setShowKpiModal(false)
                  setEditingKpi(null)
                  setKpiFormData({ name: '', description: '', target: '', weight: '', active: true })
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

            <form onSubmit={handleKpiSubmit} className="space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">KPI Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input 
                      value={kpiFormData.name} 
                      onChange={(e) => setKpiFormData({ ...kpiFormData, name: e.target.value })} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required 
                      placeholder="e.g., Attendance Rate, Task Completion"
                    />
            </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea 
                      value={kpiFormData.description} 
                      onChange={(e) => setKpiFormData({ ...kpiFormData, description: e.target.value })} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={4}
                      placeholder="Describe what this KPI measures..."
                    />
              </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 90% or 90" 
                      value={kpiFormData.target} 
                      onChange={(e) => setKpiFormData({ ...kpiFormData, target: e.target.value })} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter target value (percentage or number)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="0-100" 
                      value={kpiFormData.weight} 
                      onChange={(e) => setKpiFormData({ ...kpiFormData, weight: e.target.value === '' ? '' : parseInt(e.target.value, 10) })} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Weight percentage for this KPI (0-100)</p>
                  </div>
                  
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={kpiFormData.active} 
                      onChange={(e) => setKpiFormData({ ...kpiFormData, active: e.target.checked })} 
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-semibold text-gray-700">Active</label>
                  </div>
                  </div>
                  </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowKpiModal(false)
                    setEditingKpi(null)
                    setKpiFormData({ name: '', description: '', target: '', weight: '', active: true })
                  }} 
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingKpi ? 'Update KPI' : 'Create KPI'}
                </button>
                  </div>
                </form>
          </div>
        </div>
      )}

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
              {/* Review Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Review Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isAdmin && (
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                      <p className="text-base text-gray-900 font-medium">{getEmployeeName(selectedPerformance.employeeId)}</p>
                  </div>
                )}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Review Date</label>
                    <p className="text-base text-gray-900 font-medium">{formatDate(selectedPerformance.reviewDate)}</p>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                    <div className="flex items-center gap-3">
                      <div className="flex">{getRatingStars(selectedPerformance.rating || 0)}</div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(selectedPerformance.rating || 0)}`}>
                        {selectedPerformance.rating || 0}/5
                      </span>
                    </div>
                </div>
                {selectedPerformance.reviewCycleId && (() => {
                  const cycle = reviewCycles.find(c => c.id === selectedPerformance.reviewCycleId)
                  return cycle ? (
                    <>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Review Cycle</label>
                          <p className="text-base text-gray-900 font-medium">{cycle.name || '—'}</p>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Cycle Period</label>
                          <p className="text-sm text-gray-600">
                            {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
                          </p>
                      </div>
                    </>
                    ) : (
                <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Review Cycle</label>
                        <p className="text-base text-gray-900 font-medium">—</p>
                </div>
                    )
                  })()}
                  {selectedPerformance.kpiConfigId && (
                <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">KPI Template</label>
                      <p className="text-base text-gray-900 font-medium">
                        {(kpis.find(k => k.id === selectedPerformance.kpiConfigId) || {}).name || 'N/A'}
                      </p>
                  </div>
                  )}
                </div>
              </div>
              {/* Goals & Progress */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Goals & Progress</h4>
                {(() => {
                  const goals = parseGoals(selectedPerformance.goals)
                  const overallProgress = calculateOverallProgress(goals)
                  const goalProgressData = getGoalProgressData(goals)
                  
                  return (
                    <div className="space-y-4">


                      {/* Individual Goals with Progress Bars */}
                      {goals.length > 0 ? (
                        <div className="space-y-3">
                          {goals.map((goal, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-800 flex-1">{goal.title}</h4>
                                <div className="flex items-center gap-2 ml-4">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getProgressStatusColor(goal.status)}`}>
                                    {goal.status.replace('-', ' ').toUpperCase()}
                                  </span>
                                  <span className="text-sm font-bold" style={{ color: goal.color }}>
                                    {goal.percentage}%
                                  </span>
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-500 ease-out"
                                  style={{ 
                                    width: `${goal.percentage}%`,
                                    backgroundColor: goal.color
                                  }}
                                ></div>
                              </div>
                              
                              {/* Progress Description */}
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Progress Status</span>
                                <span>
                                  {goal.percentage === 0 ? 'Not Started' :
                                   goal.percentage < 50 ? 'Just Started' :
                                   goal.percentage < 80 ? 'Making Progress' :
                                   goal.percentage < 100 ? 'Almost There' :
                                   'Completed'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                          {selectedPerformance.goals || 'No goals specified'}
                        </p>
                      )}

                      {/* Progress Pie Chart */}
                      {goals.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-3">Goal Distribution</h4>
                          <div className="flex items-center justify-between">
                            <div className="w-32 h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={goalProgressData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={50}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {goalProgressData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 ml-4">
                              <div className="space-y-2">
                                {goalProgressData.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                      ></div>
                                      <span className="text-sm text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* KPI Results */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">KPI Results</h4>
                {selectedPerformance.kpiConfigId && (
                  <p className="text-sm text-gray-700 mb-2">Template: <strong>{(kpis.find(k => k.id === selectedPerformance.kpiConfigId) || {}).name || 'N/A'}</strong></p>
                )}

                <div className="flex items-center gap-3 mb-3">

                  {computingKpi && <span className="text-sm text-gray-500">Computing...</span>}
                  {computedKpiResults.length > 0 && <span className="text-sm text-gray-500">(Auto-computed)</span>}
                </div>

                {(() => {
                  const computed = computedKpiResults || []
                  if (computed.length > 0) {
                    return (
                      <div className="space-y-2">
                        {computed.map((k, i) => {
                          const displayPct = computeKpiDisplayPercentage(k.name, k.value, k.percentage)
                          return (
                            <div key={`computed-${i}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                              <div>
                                <div className="font-medium text-gray-800">{k.name} {k.raw ? (<span className="text-xs text-gray-500">({k.raw.present || k.raw.completed || 0}/{k.raw.total || 0})</span>) : null}</div>
                                <div className="text-xs text-gray-500">{k.value} {k.achieved !== null ? (k.achieved ? '• Target Met' : '• Target Not Met') : ''}</div>
                              </div>
                              <div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getKpiBadgeColor(displayPct)}`}>
                                  {displayPct !== null ? `${displayPct}%` : '—'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }

                  const kpiItems = parseKpis(selectedPerformance.kpiResults)
                  return (
                    <div>
                      {kpiItems.length > 0 ? (
                        <div className="space-y-2">
                          {kpiItems.map((k, i) => {
                            const displayPct = computeKpiDisplayPercentage(k.name, k.value, k.percentage)
                            return (
                              <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                <div>
                                  <div className="font-medium text-gray-800">{k.name}</div>
                                  <div className="text-xs text-gray-500">{k.value}</div>
                                </div>
                                <div>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getKpiBadgeColor(displayPct)}`}>
                                    {displayPct !== null ? `${displayPct}%` : '—'}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">{selectedPerformance.kpiResults || 'No KPI results recorded'}</p>
                      )}
                    </div>
                  )
                })()}
              </div>



              {/* Achievements & Feedback */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Achievements & Feedback</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Achievements</label>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">
                  {selectedPerformance.achievements || 'No achievements recorded'}
                </p>
                    </div>
              </div>
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">
                  {selectedPerformance.feedback || 'No feedback provided'}
                </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Evaluation */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Manager Evaluation</h4>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm">
                  {selectedPerformance.managerEvaluation || 'No manager evaluation recorded'}
                </p>
                </div>
                {selectedPerformance.areasForImprovement && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Areas for Improvement</label>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">
                        {selectedPerformance.areasForImprovement}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating History */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-800">Rating History</h4>
                  <span className="text-sm text-gray-500 font-medium">{ratingHistory.length} records</span>
                </div>
                {ratingHistory.length > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height={150}>
                        <RechartsLineChart data={ratingHistory.map(r => ({ date: formatDate(r.reviewDate), rating: r.rating || 0 }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[1, 5]} allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1">
                      {ratingHistory.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                          <div>
                            <div className="font-medium text-gray-800">{formatDate(r.reviewDate)}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex">{getRatingStars(r.rating || 0)}</div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(r.rating || 0)}`}>{r.rating || 0}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">No rating history available</p>
                )}
              </div>

              {/* Promotion History */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-800">Promotion History</h4>
                  <span className="text-sm text-gray-500 font-medium">{promotions.length} records</span>
                </div>

                {promotions.length > 0 ? (
                  <div className="space-y-2">
                    {promotions.map((p) => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{p.toPosition} <span className="text-xs text-gray-500">({formatDate(p.effectiveDate)})</span></div>
                          <div className="text-xs text-gray-500">From: {p.fromPosition || '—'}</div>
                          {p.notes && <div className="text-xs text-gray-600 mt-1">{p.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">No promotion history recorded</p>
                )}

                {/* Promotion modal */}
                {showPromotionModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowPromotionModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">{editingPromotion ? 'Edit Promotion' : 'Add Promotion'}</h3>
                        <button onClick={() => setShowPromotionModal(false)} className="text-gray-500"><X size={20} /></button>
                      </div>
                      <form onSubmit={handlePromotionSubmit} className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Effective Date</label>
                          <input type="date" value={promotionFormData.effectiveDate} onChange={(e) => setPromotionFormData({ ...promotionFormData, effectiveDate: e.target.value })} className="w-full px-3 py-2 border rounded" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">From Position</label>
                            <input value={promotionFormData.fromPosition} onChange={(e) => setPromotionFormData({ ...promotionFormData, fromPosition: e.target.value })} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">To Position</label>
                            <input value={promotionFormData.toPosition} onChange={(e) => setPromotionFormData({ ...promotionFormData, toPosition: e.target.value })} className="w-full px-3 py-2 border rounded" required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Notes</label>
                          <textarea value={promotionFormData.notes} onChange={(e) => setPromotionFormData({ ...promotionFormData, notes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={4} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowPromotionModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingPromotion ? 'Save' : 'Add'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>

              {/* Compensation Recommendations */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-800">Compensation Recommendations</h4>
                  <span className="text-sm text-gray-500 font-medium">{compensations.length} records</span>
                </div>

                {compensations.length > 0 ? (
                  <div className="space-y-2">
                    {compensations.map((c) => (
                      <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{c.status} <span className="text-xs text-gray-500">({formatDate(c.effectiveDate)})</span></div>
                          <div className="text-xs text-gray-500">{c.recommendedPercentage ? `${c.recommendedPercentage}%` : '—'} • {c.recommendedAmount ? `₹${c.recommendedAmount}` : '—'}</div>
                          {c.notes && <div className="text-xs text-gray-600 mt-1">{c.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">No compensation recommendations recorded</p>
                )}

                {/* Compensation modal */}
                {showCompensationModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowCompensationModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">{editingCompensation ? 'Edit Recommendation' : 'Add Compensation Recommendation'}</h3>
                        <button onClick={() => setShowCompensationModal(false)} className="text-gray-500"><X size={20} /></button>
                      </div>
                      <form onSubmit={handleCompensationSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Recommended %</label>
                            <input type="number" step="0.1" value={compensationFormData.recommendedPercentage} onChange={(e) => setCompensationFormData({ ...compensationFormData, recommendedPercentage: e.target.value })} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Recommended Amount</label>
                            <input type="number" step="0.01" value={compensationFormData.recommendedAmount} onChange={(e) => setCompensationFormData({ ...compensationFormData, recommendedAmount: e.target.value })} className="w-full px-3 py-2 border rounded" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Effective Date</label>
                          <input type="date" value={compensationFormData.effectiveDate} onChange={(e) => setCompensationFormData({ ...compensationFormData, effectiveDate: e.target.value })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Status</label>
                          <select value={compensationFormData.status} onChange={(e) => setCompensationFormData({ ...compensationFormData, status: e.target.value })} className="w-full px-3 py-2 border rounded">
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Notes</label>
                          <textarea value={compensationFormData.notes} onChange={(e) => setCompensationFormData({ ...compensationFormData, notes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3}></textarea>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowCompensationModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingCompensation ? 'Save' : 'Add'}</button>
                        </div>
                      </form>
                    </div>
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
        </div>
      )}
    </div>
  )
}

export default Performance



