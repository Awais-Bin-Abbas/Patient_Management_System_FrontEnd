// src/pages/LoginPage.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const { login }   = useAuth()
  const navigate     = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp]           = useState('')
  const [showOtp, setShowOtp]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userData = await login(
        username,
        password,
        showOtp ? otp : null
      )

      // Use React Router navigation instead of window.location.href
      // Full page reloads during state updates freeze the browser
      if (!userData.hospital && (userData.role === 'Admin' || userData.role === 'Doctor' || userData.role === 'Staff')) {
        navigate('/no-hospital', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }

    } catch (err) {
      const msg    = err.response?.data?.error || ''
      const status = err.response?.status

      if (status === 403 && msg.includes('OTP')) {
        setShowOtp(true)
        setError('Please enter the OTP from your authenticator app.')
      } else {
        setError(msg || 'Invalid credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4">
            <span className="text-white font-bold text-lg">PSS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Patient Scheduling System
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* OTP Field — shown only when MFA is required */}
            {showOtp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authenticator OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-xl font-mono"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Open Google Authenticator and enter the current 6-digit code
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          {/* Forgot Password */}
          <div className="text-center mt-6">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

        </div>

        {/* API URL indicator for debugging */}
        <p className="text-center text-xs text-gray-400 mt-4">
          {process.env.REACT_APP_API_URL}
        </p>

      </div>
    </div>
  )
}

export default LoginPage