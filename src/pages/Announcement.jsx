import { useState, useEffect } from 'react'
import { Bell, Plus, Search, X, Clock, User, Trash2, SlidersHorizontal, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'

// Local storage helper for announcements
const getStoredAnnouncements = () => {
  const stored = localStorage.getItem('kusgan_announcements')
  return stored ? JSON.parse(stored) : [
    {
      id: 1,
      title: 'Welcome to KUSGAN Volunteer Inc.',
      content: 'Welcome to our community service platform under the Cares Department. Together we make a difference!',
      date: dayjs().format('YYYY-MM-DD'),
      author: 'Admin',
      authorId: 1,
      priority: 'high',
      category: 'environmental',
      visibility: 'public',
    },
  ]
}

function Announcement() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [announcements, setAnnouncements] = useState(getStoredAnnouncements)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showSearch, setShowSearch] = useState(true)
  const [selectedAnnouncements, setSelectedAnnouncements] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'environmental',
    visibility: 'public',
  })

  const canCreateAnnouncement = user?.canCreateAnnouncement || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    localStorage.setItem('kusgan_announcements', JSON.stringify(announcements))
  }, [announcements])

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = filterPriority === 'all' || a.priority === filterPriority
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory
    // Check visibility - show if public OR if user is the author
    const isVisible = a.visibility === 'public' || a.authorId === user?.id || user?.role === 'admin'
    return matchesSearch && matchesPriority && matchesCategory && isVisible
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.content) return

    const newAnnouncement = {
      id: Date.now(),
      ...formData,
      date: dayjs().format('YYYY-MM-DD'),
      author: user.name,
      authorId: user.id,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setFormData({ title: '', content: '', priority: 'medium', category: 'environmental', visibility: 'public' })
    setShowForm(false)
  }

  const deleteAnnouncement = (id) => {
    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  const handleSelectAll = () => {
    if (selectedAnnouncements.length === filteredAnnouncements.length) {
      setSelectedAnnouncements([])
    } else {
      setSelectedAnnouncements(filteredAnnouncements.map(a => a.id))
    }
  }

  const handleSelectAnnouncement = (id) => {
    if (selectedAnnouncements.includes(id)) {
      setSelectedAnnouncements(selectedAnnouncements.filter(i => i !== id))
    } else {
      setSelectedAnnouncements([...selectedAnnouncements, id])
    }
  }

  const handleBulkDelete = () => {
    setAnnouncements(announcements.filter(a => !selectedAnnouncements.includes(a.id)))
    setSelectedAnnouncements([])
    setShowDeleteConfirm(false)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'environmental': return 'bg-green-100 text-green-700 border-green-200'
      case 'relief operation': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'fire response': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'notes': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'environmental': return '🌱'
      case 'relief operation': return '🚑'
      case 'fire response': return '🔥'
      case 'notes': return '📝'
      default: return '📌'
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
          <p className="text-sm text-gray-500">Stay updated with latest news</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && selectedAnnouncements.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Delete Selected ({selectedAnnouncements.length})
            </button>
          )}
          {canCreateAnnouncement && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Plus size={18} />
              New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Create New Announcement</h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Content"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex gap-2">
                {['high', 'medium', 'low'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      formData.priority === p
                        ? p === 'high' ? 'bg-red-600 text-white'
                          : p === 'medium' ? 'bg-yellow-500 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex gap-2 flex-wrap">
                {['environmental', 'relief operation', 'fire response', 'notes'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: c })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      formData.category === c
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(c)} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'public' })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.visibility === 'public'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🌍 Anyone can see
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'private' })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.visibility === 'private'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔒 Only me
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                type="submit" 
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggleable Search and Filter */}
      {showSearch && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex gap-2">
              {['all', 'high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    filterPriority === p
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'environmental', 'relief operation', 'fire response', 'notes'].map(c => (
                <button
                  key={c}
                  onClick={() => setFilterCategory(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    filterCategory === c
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c === 'all' ? 'All' : `${getCategoryIcon(c)} ${c}`}
                </button>
              ))}
            </div>
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
      {isAdmin && filteredAnnouncements.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={selectedAnnouncements.length === filteredAnnouncements.length && filteredAnnouncements.length > 0}
            onChange={handleSelectAll}
            className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-600">Select All</span>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No announcements found</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in relative ${
                isAdmin && selectedAnnouncements.includes(announcement.id) ? 'ring-2 ring-red-500' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Checkbox for Admin */}
              {isAdmin && (
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={selectedAnnouncements.includes(announcement.id)}
                    onChange={() => handleSelectAnnouncement(announcement.id)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    announcement.priority === 'high' ? 'bg-red-100' :
                    announcement.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Bell 
                      size={20} 
                      className={
                        announcement.priority === 'high' ? 'text-red-600' :
                        announcement.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      } 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-lg">{announcement.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(announcement.category)}`}>
                        {getCategoryIcon(announcement.category)} {announcement.category}
                      </span>
                      {announcement.visibility === 'private' && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                          🔒 Private
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{announcement.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {announcement.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {announcement.author}
                      </span>
                    </div>
                  </div>
                </div>
                {(user?.role === 'admin' || user?.id === announcement.authorId) && (
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
              Are you sure you want to delete {selectedAnnouncements.length} announcement{selectedAnnouncements.length > 1 ? 's' : ''}? 
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

export default Announcement
