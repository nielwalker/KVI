import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layout/Layout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Announcement from './pages/Announcement'
import Profile from './pages/Profile'
import Members from './pages/Members'
import MemberDetail from './pages/MemberDetail'
import Report from './pages/Report'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route - Redirects to dashboard if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="announcement" element={<Announcement />} />
        <Route path="report" element={<Report />} />
        <Route path="profile" element={<Profile />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
