import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Bell, TrendingUp, Leaf, Droplets, Wind, Flame, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

// Local storage helper for announcements
const getStoredAnnouncements = () => {
  const stored = localStorage.getItem('kusgan_announcements')
  return stored ? JSON.parse(stored) : []
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [animatedStats, setAnimatedStats] = useState(false)
  const [announcements, setAnnouncements] = useState(getStoredAnnouncements)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimatedStats(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Calculate category counts
  const categoryCounts = {
    environmental: announcements.filter(a => a.category === 'environmental').length,
    'relief operation': announcements.filter(a => a.category === 'relief operation').length,
    'fire response': announcements.filter(a => a.category === 'fire response').length,
    notes: announcements.filter(a => a.category === 'notes').length,
  }

  const totalAnnouncements = announcements.length

  const categories = [
    { 
      icon: Leaf, 
      label: 'Environmental', 
      value: categoryCounts.environmental, 
      color: 'bg-green-100 text-green-600',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-500',
      emoji: '🌱'
    },
    { 
      icon: Activity, 
      label: 'Relief Operation', 
      value: categoryCounts['relief operation'], 
      color: 'bg-blue-100 text-blue-600',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-500',
      emoji: '🚑'
    },
    { 
      icon: Flame, 
      label: 'Fire Response', 
      value: categoryCounts['fire response'], 
      color: 'bg-orange-100 text-orange-600',
      borderColor: 'border-orange-200',
      iconBg: 'bg-orange-500',
      emoji: '🔥'
    },
    { 
      icon: FileText, 
      label: 'Notes', 
      value: categoryCounts.notes, 
      color: 'bg-purple-100 text-purple-600',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-500',
      emoji: '📝'
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name || 'Volunteer'}!
          </h2>
          <p className="text-gray-300">
            KUSGAN Volunteer Inc. - Community Service under Cares Department
          </p>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="px-3 py-1 bg-red-600/30 text-red-400 rounded-full text-sm">
              {user?.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
            {user?.canCreateAnnouncement && (
              <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-sm">
                Can Create Announcements
              </span>
            )}
            {user?.canCreatePlan && (
              <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">
                Can Create Plans
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category Stats Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Announcements by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-md p-6 border-t-4 ${category.borderColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                animatedStats ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
              onClick={() => navigate('/announcement')}
            >
              <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-4 transition-transform hover:scale-110`}>
                <span className="text-2xl">{category.emoji}</span>
              </div>
              <p className="text-gray-500 text-sm">{category.label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{category.value}</p>
              <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                <span>announcements</span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Recent Announcements */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell size={20} className="text-red-500" />
          Recent Announcements
        </h3>
        <div className="space-y-4">
          {announcements.slice(0, 5).map((announcement, index) => (
            <div 
              key={announcement.id} 
              className={`flex items-start gap-4 p-4 bg-gray-50 rounded-lg transition-all hover:bg-gray-100 hover:shadow-md cursor-pointer ${
                animatedStats ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${(index + 4) * 0.1}s` }}
              onClick={() => navigate('/announcement')}
            >
              <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                announcement.priority === 'high' ? 'bg-red-500' :
                announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 font-medium truncate">{announcement.title}</p>
                <p className="text-sm text-gray-500 mt-1">{announcement.date}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                announcement.category === 'environmental' ? 'bg-green-100 text-green-700' :
                announcement.category === 'relief operation' ? 'bg-blue-100 text-blue-700' :
                announcement.category === 'fire response' ? 'bg-orange-100 text-orange-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {announcement.category}
              </span>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-gray-500 text-center py-4">No announcements yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
