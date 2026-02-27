import { useState } from 'react'
import { Users, Search, Shield, Mail, Calendar, Trash2, X, SlidersHorizontal, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'

function Members() {
  const { user, getAllMembers, users, setUsers } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showSearch, setShowSearch] = useState(true)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const membersPerPage = 9

  const allMembers = getAllMembers()
  
  const filteredMembers = allMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const indexOfLastMember = currentPage * membersPerPage
  const indexOfFirstMember = indexOfLastMember - membersPerPage
  const currentMembers = filteredMembers.slice(indexOfFirstMember, indexOfLastMember)
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage)

  const isAdmin = user?.role === 'admin'

  const getRoleBadge = (role) => {
    return role === 'admin' 
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === currentMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(currentMembers.map(m => m.id))
    }
  }

  const handleSelectMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const handleBulkDelete = () => {
    const updatedUsers = users.filter(u => !selectedMembers.includes(u.id))
    setUsers(updatedUsers)
    setSelectedMembers([])
    setShowDeleteConfirm(false)
  }

  const handleViewMember = (memberId) => {
    navigate(`/members/${memberId}`)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Members</h2>
          <p className="text-sm text-gray-500">View all team members</p>
        </div>
        {isAdmin && selectedMembers.length > 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Delete Selected ({selectedMembers.length})
          </button>
        )}
      </div>

      {/* Toggleable Search */}
      {showSearch && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="relative">
            <Search className="absolute-1/2 -translate-y- left-3 top1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      )}

      {/* Search Toggle Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showSearch ? <X size={18} /> : <SlidersHorizontal size={18} />}
          {showSearch ? 'Hide Search' : 'Show Search'}
        </button>
      </div>

      {/* Select All Checkbox */}
      {isAdmin && currentMembers.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={selectedMembers.length === currentMembers.length && currentMembers.length > 0}
            onChange={handleSelectAll}
            className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-600">Select All</span>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMembers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          currentMembers.map((member, index) => (
            <div
              key={member.id}
              className={`bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in relative ${
                isAdmin && selectedMembers.includes(member.id) ? 'ring-2 ring-red-500' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Checkbox */}
              {isAdmin && (
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleSelectMember(member.id)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Member Card - Clickable for admin to view details */}
              <div 
                className={isAdmin ? 'cursor-pointer' : ''}
                onClick={() => isAdmin && handleViewMember(member.id)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-lg truncate">{member.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(member.role)}`}>
                      {member.role === 'admin' ? 'Administrator' : 'Member'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>Joined {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Permissions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.canCreateAnnouncement && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        Can Create Announcements
                      </span>
                    )}
                    {member.canCreatePlan && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        Can Create Plans
                      </span>
                    )}
                    {!member.canCreateAnnouncement && !member.canCreatePlan && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded">
                        No special permissions
                      </span>
                    )}
                  </div>
                </div>

                {/* View Details Hint for Admin */}
                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <ArrowLeft size={14} className="rotate-45" />
                      Click to view details
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination - Removed chevron icons, using text */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''}? 
              This will permanently remove them from the system.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Members
