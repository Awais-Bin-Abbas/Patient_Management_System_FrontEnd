// src/pages/MFASetupPage.jsx

import { useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'

const MFASetupPage = () => {
  const { user, setUser }     = useAuth()

  const [step, setStep]       = useState(
    user?.mfa_enabled ? 'enabled' : 'start'
  )
  const [secret, setSecret]   = useState('')
  const [otpUri, setOtpUri]   = useState('')
  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // ─── Step 1 — Enable MFA ──────────────────────────────────────────────────

  const handleEnable = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosInstance.post('/api/auth/mfa/enable/')
      setSecret(res.data.secret)
      setOtpUri(res.data.totp_uri)
      setStep('scan')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to enable MFA. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2 — Verify OTP ──────────────────────────────────────────────────

  const handleVerify = async (e) => {
    e.preventDefault()
    setVerifying(true)
    setError('')
    try {
      await axiosInstance.post('/api/auth/mfa/verify/', { otp })
      setSuccess('MFA enabled successfully!')
      setStep('enabled')
      setUser({ ...user, mfa_enabled: true })
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Invalid OTP. Please try again.'
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Layout title="MFA Setup">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Step — Start */}
        {step === 'start' && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-xl font-bold text-gray-800">
                Two-Factor Authentication
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                Protect your account with an extra layer of security
                using Google Authenticator.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700 space-y-1">
              <p className="font-semibold mb-2">Before you start:</p>
              <p>1. Install Google Authenticator on your phone</p>
              <p>2. Click Enable MFA below</p>
              <p>3. Scan the QR code with your app</p>
              <p>4. Enter the 6-digit code to verify</p>
            </div>

            <Button
              fullWidth
              onClick={handleEnable}
              loading={loading}
              icon="🔐"
            >
              Enable MFA
            </Button>
          </div>
        )}

        {/* Step — Scan */}
        {step === 'scan' && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📱</div>
              <h2 className="text-xl font-bold text-gray-800">
                Scan QR Code
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Open Google Authenticator and scan the code below
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpUri)}`}
                alt="MFA QR Code"
                className="rounded-xl border-4 border-gray-100 shadow"
                width={200}
                height={200}
              />
            </div>

            {/* Manual Secret */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-2">
                Can not scan? Enter this code manually in your app:
              </p>
              <p className="font-mono text-sm font-bold text-gray-800 tracking-widest text-center bg-white rounded-lg p-3 border border-gray-200 break-all">
                {secret}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {/* Verify Form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-3xl tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                fullWidth
                loading={verifying}
                icon="✅"
              >
                Verify & Activate MFA
              </Button>
            </form>
          </div>
        )}

        {/* Step — Enabled */}
        {step === 'enabled' && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              MFA is Active
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Your account is protected with two-factor authentication.
              You will need your authenticator app every time you log in.
            </p>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
                {success}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-yellow-800 mb-1">
                ⚠️ Important
              </p>
              <p className="text-xs text-yellow-700">
                Keep your authenticator app safe. If you lose access to it
                you will not be able to log in. Contact your admin for help.
              </p>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default MFASetupPage