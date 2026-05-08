// src/pages/DashboardPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import Button from '../components/Button'
import Table from '../components/Table'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const DashboardPage = () => {
  const { user }                          = useAuth()
  const { selectedHospital, clearHospital } = useSuperAdmin()
  const navigate                          = useNavigate()
  const isSuperAdmin                      = user?.role === 'SuperAdmin'

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [seedCount, setSeedCount] = useState(50)
  const [seedResult, setSeedResult] = useState(null)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedError, setSeedError] = useState('')

  const handleSeedPatients = async () => {
    setSeedError('')
    setSeedResult(null)
    const count = Number(seedCount)

    if (Number.isNaN(count) || count < 1 || count > 500) {
      setSeedError('Count must be a number between 1 and 500.')
      return
    }

    setSeedLoading(true)
    try {
      const response = await axiosInstance.post('/api/superadmin/seed-patients/', { count })
      setSeedResult(response.data)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        `Status ${err.response?.status}: ${JSON.stringify(err.response?.data)}` ||
        'Failed to seed patients.'
      setSeedError(msg)
    } finally {
      setSeedLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    setData(null)

    let url = '/api/reports/dashboard/'

    if (isSuperAdmin && selectedHospital) {
      // SuperAdmin with a selected hospital — fetch that hospital's dashboard
      url = `/api/superadmin/hospitals/${selectedHospital.id}/dashboard/`
    } else if (isSuperAdmin && !selectedHospital) {
      // SuperAdmin with no hospital selected — fetch global stats
      url = '/api/superadmin/stats/'
    }

    axiosInstance.get(url)
      .then(res => setData(res.data))
      .catch((err) => {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          `Status ${err.response?.status}: ${JSON.stringify(err.response?.data)}` ||
          'Failed to load dashboard data.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [isSuperAdmin, selectedHospital])

  // ─── SuperAdmin Global Dashboard (no hospital selected) ───────────────────

  if (isSuperAdmin && !selectedHospital) {
    return (
      <Layout title="Global Dashboard">
        {loading && <Loader text="Loading global stats..." />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {data && (
          <div className="space-y-6">

            {/* Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-teal-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold">Welcome, {user?.username} 👋</h2>
              <p className="text-blue-100 text-sm mt-1">
                Super Admin — Global Overview across all hospitals
              </p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Hospitals"
                value={data.total_hospitals ?? 0}
                subtitle={`${data.active_hospitals ?? 0} active`}
                icon="🏥"
                color="blue"
              />
              <StatCard
                title="Total Patients"
                value={data.total_patients ?? 0}
                subtitle="Across all hospitals"
                icon="👤"
                color="orange"
              />
              <StatCard
                title="Total Leads"
                value={data.total_leads ?? 0}
                subtitle="Across all hospitals"
                icon="🎯"
                color="purple"
              />
              <StatCard
                title="Conversion Rate"
                value={data.appointment_rate ?? '0%'}
                subtitle="Appointed leads"
                icon="📈"
                color="green"
              />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Staff</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data.total_staff ?? 0}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Appointed Leads</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data.converted_leads ?? 0}</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
            </div>

            {/* Seed Patients */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Seed Patients</h3>
                  <p className="text-sm text-gray-500">
                    Generate new patient records across active hospitals.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex flex-col text-sm text-gray-700">
                    <span className="mb-1">Count</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={seedCount}
                      onChange={(e) => setSeedCount(e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <Button
                    variant="success"
                    onClick={handleSeedPatients}
                    loading={seedLoading}
                  >
                    Seed Patients
                  </Button>
                </div>
              </div>

              {seedError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  {seedError}
                </div>
              )}

              {seedResult && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Seed result</p>
                    <p>Created: <strong>{seedResult.created}</strong></p>
                    <p>Skipped: <strong>{seedResult.skipped}</strong></p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Patients by Hospital</h4>
                    <Table
                      columns={[
                        { key: 'hospital', label: 'Hospital' },
                        { key: 'total_patients', label: 'Total Patients' },
                      ]}
                      data={seedResult.distribution || []}
                      emptyMessage="No hospital distribution available."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">Select a hospital to manage</p>
                <p className="text-xs text-blue-500 mt-0.5">
                  View patients, leads, staff, and reports for a specific hospital
                </p>
              </div>
              <Button onClick={() => navigate('/hospitals')} icon="🏥">
                View Hospitals
              </Button>
            </div>

          </div>
        )}
      </Layout>
    )
  }

  // ─── Normal Dashboard (Admin, Doctor, SuperAdmin with hospital selected) ──

  return (
    <Layout title="Dashboard">

      {/* SuperAdmin hospital context banner */}
      {isSuperAdmin && selectedHospital && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-teal-600">🏥</span>
            <span className="text-sm font-medium text-teal-800">
              Managing: <strong>{selectedHospital.name}</strong>
            </span>
          </div>
          <button
            onClick={() => { clearHospital(); navigate('/hospitals') }}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium"
          >
            ← Switch Hospital
          </button>
        </div>
      )}

      {loading && <Loader text="Loading dashboard..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          <p className="font-semibold mb-1">Dashboard Error:</p>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">

          {/* Welcome Banner */}
          <div className="bg-blue-700 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold">
              Welcome back, {user?.username}! 👋
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {data.hospital} — Here is your summary for today
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Patients"
              value={data.total_patients ?? 0}
              subtitle="Registered in your hospital"
              icon="👤"
              color="blue"
            />
            <StatCard
              title="Chronic Patients"
              value={data.chronic_patients ?? 0}
              subtitle="Marked as chronic"
              icon="🏥"
              color="orange"
            />
            <StatCard
              title="Total Leads"
              value={data.total_leads ?? 0}
              subtitle="Generated leads"
              icon="🎯"
              color="purple"
            />
            <StatCard
              title="Appointment Rate"
              value={data.appointment_rate ?? '0%'}
              subtitle="Leads appointed"
              icon="📈"
              color="green"
            />
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Leads by Status */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Status</h3>
              {data.leads_by_status?.length > 0 ? (
                <div className="space-y-3">
                  {data.leads_by_status.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">🎯</p>
                  <p className="text-sm text-gray-400">No leads yet</p>
                </div>
              )}
            </div>

            {/* Patients by Condition */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Conditions</h3>
              {data.patients_by_condition?.length > 0 ? (
                <div className="space-y-3">
                  {data.patients_by_condition.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <span className="text-sm text-gray-600 capitalize">
                          {item.conditions__name || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">🩺</p>
                  <p className="text-sm text-gray-400">No condition data yet</p>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Leads This Month</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{data.leads_this_month ?? 0}</p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Appointed Leads</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{data.converted_leads ?? 0}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Chronic Ratio</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {data.total_patients > 0
                      ? `${Math.round((data.chronic_patients / data.total_patients) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>

        </div>
      )}

    </Layout>
  )
}

export default DashboardPage