import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layout/Layout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Attendance from './pages/Attendance'
import AttendanceManagement from './pages/AttendanceManagement'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import EditAccount from './pages/EditAccount'
import Members from './pages/Members'
import CreateMember from './pages/CreateMember'
import MemberDetail from './pages/MemberDetail'
import Donations from './pages/Donations'
import Report from './pages/Report'
import AchievementsManagement from './pages/AchievementsManagement'
import Login from './pages/Login'
import Landing from './pages/Landing'
import NewsArticle from './pages/NewsArticle'
import Recruitment from './pages/Recruitment'
import OrganizationStructure from './pages/OrganizationStructure'
import WhoWeAre from './pages/WhoWeAre'
import Settings from './pages/Settings'
import CategoryManagement from './pages/CategoryManagement'
import CommitteeManagement from './pages/CommitteeManagement'
import ChatbotWidget from './components/ChatbotWidget'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmProvider'
import './index.css'

function AuthPendingState({ title = 'Loading your session...' }) {
  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{ background: 'linear-gradient(135deg, #0b1f5a 0%, #1e40af 55%, #2563eb 100%)' }}
    >
      <div className="relative mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow-400/15 blur-3xl" />
        <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-8 shadow-[0_24px_70px_rgba(8,47,73,0.26)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_14px_32px_rgba(15,23,42,0.18)] backdrop-blur-md">
              <img src="/kvi.png" alt="KUSGAN logo" className="h-10 w-10 object-contain" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-yellow-200/90">KUSGAN</p>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-yellow-300" aria-hidden="true" />
              <p className="text-sm text-white/75">Preparing your workspace…</p>
            </div>

            <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-xs text-white/60">This usually takes a few seconds.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, authResolved, loading } = useAuth()

  if (!authResolved && !user) return <AuthPendingState />
  if (user && !user.role) return <AuthPendingState title="Loading account access..." />
  if (user && loading) return <AuthPendingState title="Loading your data..." />

  if (!user) {
    return <Navigate to="/landing" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { user, authResolved, loading } = useAuth()

  if (!authResolved && !user) return <AuthPendingState title="Checking admin access..." />
  if (user && !user.role) return <AuthPendingState title="Loading account access..." />
  if (user && loading) return <AuthPendingState title="Loading your data..." />

  if (!user) {
    return <Navigate to="/landing" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function MemberRoute({ children }) {
  const { user, authResolved, loading } = useAuth()

  if (!authResolved && !user) return <AuthPendingState title="Checking member access..." />
  if (user && !user.role) return <AuthPendingState title="Loading account access..." />
  if (user && loading) return <AuthPendingState title="Loading your data..." />

  if (!user) {
    return <Navigate to="/landing" replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/attendance-management" replace />
  }

  return children
}

// Public Route - Redirects to dashboard if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (user?.role && !loading) {
    return <Navigate to="/" replace />
  }

  return children
}

function ChatbotGate() {
  const { user } = useAuth()
  if (user?.role === 'admin') return null
  return <ChatbotWidget />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/recruitment" element={<PublicRoute><Recruitment /></PublicRoute>} />
      <Route path="/news/:id" element={<NewsArticle />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/organization/board" element={<OrganizationStructure mode="board" />} />
      <Route path="/organization/kusgan" element={<OrganizationStructure mode="kusgan" />} />
      <Route path="/who-we-are/overview" element={<WhoWeAre mode="overview" />} />
      <Route path="/who-we-are/mission-vision" element={<WhoWeAre mode="mission-vision" />} />
      <Route path="/who-we-are/news" element={<WhoWeAre mode="news" />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="attendance" element={<MemberRoute><Attendance /></MemberRoute>} />
        <Route path="attendance-management" element={<AdminRoute><AttendanceManagement /></AdminRoute>} />
        <Route path="events" element={<Calendar listOnly />} />
        <Route path="report" element={<AdminRoute><Report /></AdminRoute>} />
        <Route path="achievements" element={<AdminRoute><AchievementsManagement /></AdminRoute>} />
        <Route path="category-management" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
        <Route path="committee-management" element={<AdminRoute><CommitteeManagement /></AdminRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="account/edit" element={<EditAccount />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="settings" element={<Settings />} />
        <Route path="members" element={<AdminRoute><Members /></AdminRoute>} />
        <Route path="members/create" element={<AdminRoute><CreateMember /></AdminRoute>} />
        <Route path="members/:id" element={<AdminRoute><MemberDetail /></AdminRoute>} />
        <Route path="donations" element={<AdminRoute><Donations /></AdminRoute>} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Router>
          <AppRoutes />
          <ChatbotGate />
        </Router>
      </ConfirmProvider>
    </AuthProvider>
  )
}

export default App
