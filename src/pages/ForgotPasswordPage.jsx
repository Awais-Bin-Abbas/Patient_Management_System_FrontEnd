// src/pages/ForgotPasswordPage.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'

const ForgotPasswordPage = () => {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password/', { email })
      setSuccessMsg(res.data.message || '')
      setSuccess(true)
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.error ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4">
            <span className="text-white font-bold text-lg">PSS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we will send a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Check Your Email!
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                We sent a password reset link to:
              </p>
              <p className="text-sm font-medium text-blue-600 mb-4">{email}</p>
              {successMsg && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">
                  {successMsg}
                </p>
              )}
              <p className="text-xs text-gray-400 mb-6">
                The link expires in 1 hour. Check your spam folder if
                you do not see it.
              </p>
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="Enter your registered email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage