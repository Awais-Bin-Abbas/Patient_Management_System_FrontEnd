// src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAuthenticated } from '../utils/auth'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()
  const tokenExists = isAuthenticated()

  // 1. If we are loading AND have no cached user, show the loader
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Authenticating...</p>
        </div>
      </div>
    )
  }

  // 2. Not Logged In
  // If we aren't loading and have no user, OR if the token is definitively invalid/missing
  if (!user || !tokenExists) {
    // If we are still loading in the background, wait a bit
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Checking session...</p>
          </div>
        </div>
      )
    }
    return <Navigate to="/login" replace />
  }

  // 3. Role Authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // 4. Authorized
  return children
}

export default ProtectedRoute