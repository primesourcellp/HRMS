import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, X, Save, Search, UserPlus, UserMinus } from 'lucide-react'
import api from '../services/api'

const TeamManagement = () => {
  const [teams, setTeams] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    members: []
  })
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState([])

  const userRole = localStorage.getItem('userRole')
  const currentUserId = localStorage.getItem('userId')
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  useEffect(() => {
    if (!isSuperAdmin) {
      setError('Access denied. This page is only for Super Administrators.')
      setLoading(false)
      return
    }
    loadData()
  }, [isSuperAdmin])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [teamsData, employeesData] = await Promise.all([
        api.getTeams(),
        api.getEmployees()
      ])
      setTeams(Array.isArray(teamsData) ? teamsData : [])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team)
      setTeamFormData({
        name: team.name || '',
        description: team.description || '',
        members: team.members || []
      })
    } else {
      setEditingTeam(null)
      setTeamFormData({
        name: '',
        description: '',
        members: []
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTeam(null)
    setTeamFormData({
      name: '',
      description: '',
      members: []
    })
  }

  const handleAddMember = () => {
    setTeamFormData({
      ...teamFormData,
      members: [...teamFormData.members, { employeeId: '' }]
    })
  }

  const handleRemoveMember = (index) => {
    const newMembers = teamFormData.members.filter((_, i) => i !== index)
    setTeamFormData({
      ...teamFormData,
      members: newMembers
    })
  }

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...teamFormData.members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setTeamFormData({
      ...teamFormData,
      members: newMembers
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      // Validate
      if (!teamFormData.name.trim()) {
        throw new Error('Team name is required')
      }

      // Validate members
      const memberIds = teamFormData.members.map(m => m.employeeId).filter(Boolean)
      if (new Set(memberIds).size !== memberIds.length) {
        throw new Error('Duplicate employees in team members')
      }

      const teamData = {
        name: teamFormData.name.trim(),
        description: teamFormData.description.trim(),
        createdBy: parseInt(currentUserId),
        members: teamFormData.members
          .filter(m => m.employeeId)
          .map(m => {
            // Get the employee's actual role from the employees list
            const employee = employees.find(emp => emp.id === parseInt(m.employeeId))
            return {
              employeeId: parseInt(m.employeeId),
              role: employee?.role || 'EMPLOYEE' // Use employee's actual role
            }
          })
      }

      if (editingTeam) {
        await api.updateTeam(editingTeam.id, teamData)
        setSuccessMessage('Team updated successfully!')
      } else {
        await api.createTeam(teamData)
        setSuccessMessage('Team created successfully!')
      }

      await loadData()
      handleCloseModal()
      
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setError(error.message || 'Failed to save team')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return
    }

    try {
      setLoading(true)
      await api.deleteTeam(id)
      setSuccessMessage('Team deleted successfully!')
      await loadData()
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setError(error.message || 'Failed to delete team')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMembers = async (team) => {
    try {
      setLoading(true)
      const members = await api.getTeamMembers(team.id)
      setSelectedTeam({ ...team, members })
      
      // Get available employees (not already in team)
      const memberIds = members.map(m => m.employeeId)
      const available = employees.filter(emp => !memberIds.includes(emp.id))
      setAvailableEmployees(available)
      
      setShowMembersModal(true)
    } catch (error) {
      setError(error.message || 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMemberToTeam = async (employeeId) => {
    try {
      setLoading(true)
      // Get the employee's actual role from the employees list
      const employee = employees.find(emp => emp.id === parseInt(employeeId))
      const employeeRole = employee?.role || 'EMPLOYEE'
      
      await api.addTeamMember(selectedTeam.id, {
        employeeId: parseInt(employeeId),
        role: employeeRole // Use employee's actual role
      })
      setSuccessMessage('Team member added successfully!')
      await handleViewMembers(selectedTeam)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setError(error.message || 'Failed to add team member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMemberFromTeam = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return
    }

    try {
      setLoading(true)
      await api.removeTeamMember(selectedTeam.id, parseInt(employeeId))
      setSuccessMessage('Team member removed successfully!')
      await handleViewMembers(selectedTeam)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setError(error.message || 'Failed to remove team member')
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId || emp.employeeId === employeeId)
    return employee ? employee.name : `Employee ${employeeId}`
  }

  const filteredTeams = teams.filter(team => {
    const searchLower = searchTerm.toLowerCase()
    return (
      team.name?.toLowerCase().includes(searchLower) ||
      team.description?.toLowerCase().includes(searchLower) ||
      (team.members && team.members.some(m => 
        getEmployeeName(m.employeeId).toLowerCase().includes(searchLower)
      ))
    )
  })

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to Super Administrators.</p>
        </div>
      </div>
    )
  }

  if (loading && teams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search teams by name, description, or member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No teams match your search' : 'No teams found. Create your first team!'}
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{team.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{team.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {team.members ? team.members.length : 0} member(s)
                        <button
                          onClick={() => handleViewMembers(team)}
                          className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.createdDate ? new Date(team.createdDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(team)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Users size={24} className="text-blue-600" />
                {editingTeam ? 'Edit Team' : 'Create Team'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name *</label>
                <input
                  type="text"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Enter team description"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Team Members</label>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <UserPlus size={16} />
                    Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {teamFormData.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={member.employeeId}
                        onChange={(e) => handleMemberChange(index, 'employeeId', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees
                          .filter(emp => {
                            // Don't show employees already added to the team
                            const existingIds = teamFormData.members
                              .map(m => m.employeeId)
                              .filter(id => id && id !== member.employeeId)
                            return !existingIds.includes(emp.id?.toString()) && !existingIds.includes(emp.id)
                          })
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role || 'EMPLOYEE'})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <UserMinus size={18} />
                      </button>
                    </div>
                  ))}
                  {teamFormData.members.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No members added yet. Click "Add Member" to add team members.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {loading ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showMembersModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <Users size={24} className="text-blue-600" />
                {selectedTeam.name} - Team Members
              </h3>
              <button
                onClick={() => {
                  setShowMembersModal(false)
                  setSelectedTeam(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Add New Member</h4>
                <div className="flex gap-3">
                  <select
                    id="newMemberEmployee"
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Employee</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role || 'EMPLOYEE'})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const employeeSelect = document.getElementById('newMemberEmployee')
                      if (employeeSelect.value) {
                        handleAddMemberToTeam(employeeSelect.value)
                        employeeSelect.value = ''
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
                  >
                    <UserPlus size={18} />
                    Add Member
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTeam.members && selectedTeam.members.length > 0 ? (
                      selectedTeam.members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.employeeName || getEmployeeName(member.employeeId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.employeeEmail || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              member.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                              member.role === 'HR_ADMIN' ? 'bg-purple-100 text-purple-800' :
                              member.role === 'FINANCE' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.assignedDate ? new Date(member.assignedDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveMemberFromTeam(member.employeeId)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove"
                            >
                              <UserMinus size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No members in this team
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamManagement

