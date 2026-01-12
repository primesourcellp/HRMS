import { useState, useEffect } from 'react'
import { Users, Search, UserCheck } from 'lucide-react'
import api from '../services/api'

const MyTeams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showMembersModal, setShowMembersModal] = useState(false)

  const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    if (!currentUserId) {
      setError('User ID not found. Please log in again.')
      setLoading(false)
      return
    }
    loadMyTeams()
  }, [currentUserId])

  const loadMyTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      const allTeams = await api.getTeams()
      
      // Filter teams where current user is a member
      const myTeams = allTeams.filter(team => {
        if (!team.members || !Array.isArray(team.members)) return false
        return team.members.some(member => 
          member.employeeId === currentUserId || 
          parseInt(member.employeeId) === currentUserId
        )
      })
      
      setTeams(myTeams)
    } catch (error) {
      console.error('Error loading teams:', error)
      setError(error.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMembers = (team) => {
    setSelectedTeam(team)
    setShowMembersModal(true)
  }

  const getMyRoleInTeam = (team) => {
    if (!team.members || !Array.isArray(team.members)) return null
    const myMembership = team.members.find(member => 
      member.employeeId === currentUserId || 
      parseInt(member.employeeId) === currentUserId
    )
    return myMembership ? myMembership.role : null
  }

  const getEmployeeName = (employeeId) => {
    // Try to find in team members first
    if (selectedTeam && selectedTeam.members) {
      const member = selectedTeam.members.find(m => 
        m.employeeId === employeeId || parseInt(m.employeeId) === employeeId
      )
      if (member && member.employeeName) {
        return member.employeeName
      }
    }
    return `Employee ${employeeId}`
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Teams</h1>
      </div>

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
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No teams match your search' : 'You are not a member of any teams yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">My Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.map((team) => {
                  const myRole = getMyRoleInTeam(team)
                  return (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{team.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          myRole === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                          myRole === 'HR_ADMIN' ? 'bg-purple-100 text-purple-800' :
                          myRole === 'FINANCE' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {myRole || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {team.members ? team.members.length : 0} member(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewMembers(team)}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Members
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member) => {
                      const isMe = member.employeeId === currentUserId || parseInt(member.employeeId) === currentUserId
                      return (
                        <tr key={member.id} className={`hover:bg-gray-50 ${isMe ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.employeeName || getEmployeeName(member.employeeId)}
                            {isMe && <span className="ml-2 text-blue-600 font-semibold">(You)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.employeeEmail || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              (member.employeeRole || member.role) === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                              (member.employeeRole || member.role) === 'HR_ADMIN' ? 'bg-purple-100 text-purple-800' :
                              (member.employeeRole || member.role) === 'FINANCE' ? 'bg-green-100 text-green-800' :
                              (member.employeeRole || member.role) === 'EMPLOYEE' ? 'bg-gray-100 text-gray-800' :
                              (member.employeeRole || member.role) === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.employeeRole || member.role || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.assignedDate ? new Date(member.assignedDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No members in this team
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTeams

