import { useState } from 'react'
import { User, Mail, Shield, Edit2, Save, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleSave = () => {
    // In a real app, this would update the user in localStorage
    setIsEditing(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-gray-900 to-black relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <User size={48} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 pb-6 px-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="text-gray-600 bg-gray-100 px-2 py-1 rounded"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-800">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user?.role === 'admin' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {user?.role === 'admin' ? (
                <span className="flex items-center gap-1">
                  <Shield size={14} />
                  Administrator
                </span>
              ) : (
                'Member'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Mail size={20} className="text-red-600" />
          Account Information
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Email</span>
            <span className="text-gray-800 font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Role</span>
            <span className="text-gray-800 font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-600">Account Status</span>
            <span className="text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Profile
