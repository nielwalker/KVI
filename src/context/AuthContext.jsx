/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Dummy accounts stored in localStorage
const getStoredUsers = () => {
  const stored = localStorage.getItem('kusgan_users')
  if (stored) {
    return JSON.parse(stored)
  }
  // Default dummy accounts
  return [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@kusgan.com',
      password: 'admin123',
      role: 'admin',
      canCreateAnnouncement: true,
      canCreatePlan: true,
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john@kusgan.com',
      password: 'john123',
      role: 'member',
      canCreateAnnouncement: false,
      canCreatePlan: false,
    },
    {
      id: 3,
      name: 'Jane Smith',
      email: 'jane@kusgan.com',
      password: 'jane123',
      role: 'member',
      canCreateAnnouncement: false,
      canCreatePlan: false,
    },
  ]
}

const getStoredCurrentUser = () => {
  const stored = localStorage.getItem('kusgan_current_user')
  return stored ? JSON.parse(stored) : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredCurrentUser)
  const [users, setUsers] = useState(getStoredUsers)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize users in localStorage if not present
    if (!localStorage.getItem('kusgan_users')) {
      localStorage.setItem('kusgan_users', JSON.stringify(getStoredUsers()))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Persist current user to localStorage
    if (user) {
      localStorage.setItem('kusgan_current_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('kusgan_current_user')
    }
  }, [user])

  useEffect(() => {
    // Persist users to localStorage
    localStorage.setItem('kusgan_users', JSON.stringify(users))
  }, [users])

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password)
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      return { success: true, user: userWithoutPassword }
    }
    return { success: false, message: 'Invalid email or password' }
  }

  const register = (name, email, password) => {
    const exists = users.find(u => u.email === email)
    if (exists) {
      return { success: false, message: 'Email already registered' }
    }
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role: 'member',
      canCreateAnnouncement: false,
      canCreatePlan: false,
    }
    setUsers([...users, newUser])
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    return { success: true, user: userWithoutPassword }
  }

  const logout = () => {
    setUser(null)
  }

  const updateMemberPermission = (memberId, permission, value) => {
    const updatedUsers = users.map(u => {
      if (u.id === memberId) {
        return { ...u, [permission]: value }
      }
      return u
    })
    setUsers(updatedUsers)
    // Update current user if they're the one being modified
    if (user && user.id === memberId) {
      setUser({ ...user, [permission]: value })
    }
  }

  const getAllMembers = () => {
    return users.map(({ password, ...u }) => u)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      loading,
      updateMemberPermission,
      getAllMembers,
      users: users.map(({ password, ...u }) => u)
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
