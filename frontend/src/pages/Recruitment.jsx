import { useState, useEffect } from 'react'
import { Briefcase, Plus, Users, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Recruitment = () => {
  const [jobPostings, setJobPostings] = useState([])
  const [applicants, setApplicants] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showApplicantModal, setShowApplicantModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('jobs')
  const [jobFormData, setJobFormData] = useState({
    title: '',
    department: '',
    position: '',
    jobType: 'FULL_TIME',
    experienceRequired: '',
    description: '',
    requirements: '',
    closingDate: '',
    noOfVacancies: 1,
    status: 'OPEN'
  })
  const [applicantFormData, setApplicantFormData] = useState({
    jobPostingId: '',
    name: '',
    email: '',
    phone: '',
    coverLetter: ''
  })
  const [resumeFile, setResumeFile] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsData] = await Promise.all([
        api.getJobPostings()
      ])
      setJobPostings(jobsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadApplicants = async (jobId) => {
    try {
      const data = await api.getApplicants(jobId)
      setApplicants(data)
    } catch (error) {
      console.error('Error loading applicants:', error)
    }
  }

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createJobPosting({
        ...jobFormData,
        postedBy: parseInt(localStorage.getItem('userId'))
      })
      await loadData()
      setShowJobModal(false)
      resetJobForm()
      alert('Job posting created successfully')
    } catch (error) {
      alert('Error creating job posting: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!resumeFile) {
      alert('Please upload your resume')
      return
    }
    setLoading(true)
    try {
      // In a real app, you'd upload the resume file first
      await api.createApplicant({
        ...applicantFormData,
        resumePath: 'uploaded/resume.pdf' // This would be the actual path after upload
      })
      setShowApplicantModal(false)
      resetApplicantForm()
      alert('Application submitted successfully')
    } catch (error) {
      alert('Error submitting application: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateApplicantStatus = async (applicantId, status) => {
    setLoading(true)
    try {
      await api.updateApplicantStatus(applicantId, status, '')
      await loadApplicants(selectedJob.id)
      alert('Applicant status updated')
    } catch (error) {
      alert('Error updating status: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetJobForm = () => {
    setJobFormData({
      title: '',
      department: '',
      position: '',
      jobType: 'FULL_TIME',
      experienceRequired: '',
      description: '',
      requirements: '',
      closingDate: '',
      noOfVacancies: 1,
      status: 'OPEN'
    })
  }

  const resetApplicantForm = () => {
    setApplicantFormData({
      jobPostingId: '',
      name: '',
      email: '',
      phone: '',
      coverLetter: ''
    })
    setResumeFile(null)
  }

  return (
<<<<<<< HEAD
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Recruitment & Onboarding</h2>
            <p className="text-gray-600 font-medium">Manage job postings and applicant tracking</p>
          </div>
          <button
            onClick={() => setShowJobModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
=======
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">Recruitment & Onboarding</h2>
            <p className="text-sm md:text-base text-gray-600 font-medium">Manage job postings and applicant tracking</p>
          </div>
          <button
            onClick={() => setShowJobModal(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base"
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
          >
            <Plus size={20} />
            Post Job
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'jobs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          Job Postings
        </button>
        <button
          onClick={() => setActiveTab('applicants')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'applicants' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          Applicants
        </button>
      </div>

      {/* Job Postings */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobPostings.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.department} • {job.position}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{job.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase size={16} />
                  <span>{job.jobType}</span>
                </div>
                {job.experienceRequired && (
                  <div className="text-sm text-gray-600">
                    Experience: {job.experienceRequired}
                  </div>
                )}
                {job.closingDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>Closes: {format(new Date(job.closingDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedJob(job)
                    loadApplicants(job.id)
                    setActiveTab('applicants')
                  }}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Applicants
                </button>
                <button
                  onClick={() => {
                    setApplicantFormData({ ...applicantFormData, jobPostingId: job.id })
                    setShowApplicantModal(true)
                  }}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applicants */}
      {activeTab === 'applicants' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {selectedJob && (
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold">Applicants for: {selectedJob.title}</h3>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{applicant.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{applicant.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{applicant.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        applicant.status === 'SELECTED' ? 'bg-green-100 text-green-800' :
                        applicant.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        applicant.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {applicant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {new Date(applicant.appliedDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateApplicantStatus(applicant.id, 'SHORTLISTED')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleUpdateApplicantStatus(applicant.id, 'SELECTED')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleUpdateApplicantStatus(applicant.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create Job Posting</h3>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={jobFormData.department}
                    onChange={(e) => setJobFormData({ ...jobFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={jobFormData.position}
                    onChange={(e) => setJobFormData({ ...jobFormData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={jobFormData.jobType}
                    onChange={(e) => setJobFormData({ ...jobFormData, jobType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Required</label>
                  <input
                    type="text"
                    value={jobFormData.experienceRequired}
                    onChange={(e) => setJobFormData({ ...jobFormData, experienceRequired: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 2-5 years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. of Vacancies</label>
                  <input
                    type="number"
                    value={jobFormData.noOfVacancies}
                    onChange={(e) => setJobFormData({ ...jobFormData, noOfVacancies: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                  <input
                    type="date"
                    value={jobFormData.closingDate}
                    onChange={(e) => setJobFormData({ ...jobFormData, closingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea
                  value={jobFormData.requirements}
                  onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplicantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Apply for Position</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={applicantFormData.name}
                    onChange={(e) => setApplicantFormData({ ...applicantFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={applicantFormData.email}
                    onChange={(e) => setApplicantFormData({ ...applicantFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={applicantFormData.phone}
                    onChange={(e) => setApplicantFormData({ ...applicantFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <textarea
                  value={applicantFormData.coverLetter}
                  onChange={(e) => setApplicantFormData({ ...applicantFormData, coverLetter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowApplicantModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recruitment

