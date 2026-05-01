// src/pages/ReportsPage.jsx

import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Loader from '../components/Loader'
import axiosInstance from '../api/axiosInstance'

import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const ReportsPage = () => {
  const { user }             = useAuth()
  const { selectedHospital } = useSuperAdmin()
  const isSuperAdmin         = user?.role === 'SuperAdmin'
  const isAdmin              = user?.role === 'Admin'
  const [history, setHistory]             = useState([])
  const [hospitalStats, setHospitalStats] = useState([])
  const [loading, setLoading]             = useState(true)
  const [generating, setGenerating]       = useState(false)
  const [polling, setPolling]             = useState(false)
  const [reportData, setReportData]       = useState(null)
  const [activeId, setActiveId]           = useState(null)
  const [error, setError]                 = useState('')
  const intervalRef                       = useRef(null)

  // ─── Fetch History ────────────────────────────────────────────────────────

  const fetchHistory = useCallback(() => {
    axiosInstance.get('/api/reports/history/')
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchHospitalStats = useCallback(() => {
    axiosInstance.get('/api/hospital/stats/')
      .then(res => setHospitalStats(res.data))
      .catch(() => setHospitalStats([]))
  }, [])

  useEffect(() => {
    if (isSuperAdmin && !selectedHospital) {
      setHistory([])
      setLoading(false)
      return
    }
    fetchHistory()
    if (isAdmin || isSuperAdmin) fetchHospitalStats()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchHistory, fetchHospitalStats, isAdmin, isSuperAdmin, selectedHospital])

  // ─── Trigger Report ───────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setReportData(null)

    try {
      const res = await axiosInstance.post('/api/reports/generate/')

      if (res.data.status === 'complete') {
        setReportData(res.data.data)
        setGenerating(false)
        fetchHistory()
        return
      }

      const reportId = res.data.report_id
      setActiveId(reportId)
      fetchHistory()

      setPolling(true)
      intervalRef.current = setInterval(async () => {
        try {
          const statusRes = await axiosInstance.get(
            `/api/reports/${reportId}/status/`
          )

          if (statusRes.data.status === 'complete') {
            clearInterval(intervalRef.current)
            setPolling(false)
            const resultRes = await axiosInstance.get(
              `/api/reports/${reportId}/result/`
            )
            setReportData(resultRes.data.data)
            fetchHistory()

          } else if (statusRes.data.status === 'failed') {
            clearInterval(intervalRef.current)
            setPolling(false)
            setError('Report generation failed. Please try again.')
          }
        } catch {
          clearInterval(intervalRef.current)
          setPolling(false)
        }
      }, 3000)

    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to start report generation.'
      )
    } finally {
      setGenerating(false)
    }
  }

  // ─── View Existing Report ─────────────────────────────────────────────────

  const handleViewReport = async (id) => {
    setReportData(null)
    setError('')
    setActiveId(id)
    try {
      const res = await axiosInstance.get(`/api/reports/${id}/result/`)
      setReportData(res.data.data)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Could not load report data.'
      )
    }
  }

  // ─── Clear All Reports ────────────────────────────────────────────────────

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL reports? This cannot be undone.')) return
    try {
      await axiosInstance.delete('/api/reports/clear/')
      setHistory([])
      setReportData(null)
      setActiveId(null)
    } catch {
      setError('Failed to clear reports.')
    }
  }

  // ─── Delete Single Report ─────────────────────────────────────────────────

  const handleDeleteReport = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Report #${id}?`)) return
    try {
      await axiosInstance.delete(`/api/reports/${id}/delete/`)
      setHistory(prev => prev.filter(r => r.id !== id))
      if (activeId === id) {
        setReportData(null)
        setActiveId(null)
      }
    } catch {
      setError('Failed to delete report.')
    }
  }

  return (
    <Layout title="Reports & Analytics">
      <div className="space-y-6">

        {/* Global Hospital Stats (Admin/SuperAdmin Only) - Hide if a specific hospital is selected */}
        {(isAdmin || isSuperAdmin) && !selectedHospital && hospitalStats.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              🌐 {isSuperAdmin ? 'Global Network Performance' : 'Hospital Overview'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitalStats.map(stat => (
                <div key={stat.hospital_id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.hospital_name}</span>
                    <Badge status={stat.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xl font-bold text-gray-800">{stat.total_patients}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Patients</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-600">{stat.total_leads}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Leads</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                {isSuperAdmin ? `Generate Report — ${selectedHospital?.name || 'Select Hospital'}` : 'Generate New Report'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isSuperAdmin 
                  ? `Generates a full analytics report for ${selectedHospital?.name || 'the selected hospital'}.`
                  : 'Generates a full analytics report for your hospital including patient and lead statistics.'}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              loading={generating}
              icon="📋"
            >
              {generating ? 'Starting...' : 'Generate Report'}
            </Button>
          </div>

          {/* Polling Indicator */}
          {polling && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  Generating report...
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  Checking status every 3 seconds. This may take a moment.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="space-y-4">

            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-800">
                Report Results
              </h3>
              <span className="text-xs text-gray-400">
                — {reportData.hospital}
              </span>
            </div>

            {/* Patient Stats */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                👤 Patient Statistics
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Total Patients', value: reportData.patients?.total },
                  { label: 'Chronic Patients', value: reportData.patients?.chronic },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {item.value ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* By Condition */}
              {reportData.patients?.by_condition?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Patients by Condition
                  </p>
                  <div className="space-y-2">
                    {reportData.patients.by_condition.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-teal-400" />
                          <span className="text-sm text-gray-600 capitalize">
                            {item.conditions__name || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Severity */}
              {reportData.patients?.by_severity?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Patients by Severity
                  </p>
                  <div className="space-y-2">
                    {reportData.patients.by_severity.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <span className="text-sm text-gray-600 capitalize">
                            {item.conditions__severity || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lead Stats */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                🎯 Lead Statistics
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Total Leads',    value: reportData.leads?.total },
                  { label: 'This Month',      value: reportData.leads?.this_month },
                  { label: 'Converted',       value: reportData.leads?.converted },
                  { label: 'Conversion Rate', value: reportData.leads?.conversion_rate },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {item.value ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* By Status */}
              {reportData.leads?.by_status?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Leads by Status
                  </p>
                  <div className="space-y-2">
                    {reportData.leads.by_status.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Badge status={item.status} />
                        <span className="text-sm font-semibold text-gray-800">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Report History */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Report History
            </h3>
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                🗑️ Clear All
              </button>
            )}
          </div>

          {loading ? (
            <Loader />
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm text-gray-400">
                No reports generated yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((report) => (
                <div
                  key={report.id}
                  className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
                    activeId === report.id
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge status={report.status} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Report #{report.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.created_at).toLocaleString()}
                        {report.completed_at && (
                          <span className="ml-2 text-green-500">
                            Completed {new Date(report.completed_at).toLocaleTimeString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {report.status === 'complete' && (
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {activeId === report.id ? 'Viewing' : 'View Results'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default ReportsPage