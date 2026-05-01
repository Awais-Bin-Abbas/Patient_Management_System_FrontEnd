// src/pages/SuperAdminReportsPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import Loader from '../components/Loader'
import axiosInstance from '../api/axiosInstance'
import { useSuperAdmin } from '../context/SuperAdminContext'

const SuperAdminReportsPage = () => {
  const { selectHospital }                  = useSuperAdmin()
  const navigate                            = useNavigate()
  const [reports, setReports]               = useState([])
  const [hospitals, setHospitals]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')

  const fetchReports = () => {
    setLoading(true)
    axiosInstance.get('/api/superadmin/reports/')
      .then(res => setReports(res.data))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false))
  }

  const fetchHospitals = () => {
    axiosInstance.get('/api/superadmin/hospitals/')
      .then(res => setHospitals(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchReports()
    fetchHospitals()
  }, [])

  // ─── View Report Results ──────────────────────────────────────────────────

  const handleViewResults = (report) => {
    selectHospital({ id: report.hospital_id, name: report.hospital_name })
    navigate('/reports')
  }

  // ─── Delete Single Report ─────────────────────────────────────────────────

  const handleDelete = async (report) => {
    if (!window.confirm(`Delete Report #${report.id} for ${report.hospital_name}?`)) return
    try {
      await axiosInstance.delete(`/api/superadmin/reports/${report.id}/delete/`)
      setReports(prev => prev.filter(r => r.id !== report.id))
    } catch {
      setError('Failed to delete report.')
    }
  }

  // ─── Clear All Reports ────────────────────────────────────────────────────

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL reports across ALL hospitals? This cannot be undone.')) return
    try {
      await axiosInstance.delete('/api/superadmin/reports/clear/')
      setReports([])
    } catch {
      setError('Failed to clear all reports.')
    }
  }

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filtered = hospitalFilter
    ? reports.filter(r => String(r.hospital_id) === hospitalFilter)
    : reports

  return (
    <Layout title="Global Reports">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">All Hospital Reports</h3>
            <p className="text-sm text-gray-500">
              View and manage reports across all hospitals
            </p>
          </div>
          {reports.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              🗑️ Clear All Reports
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Filter by hospital:</label>
          <select
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Hospitals</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          {hospitalFilter && (
            <button
              onClick={() => setHospitalFilter('')}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {loading ? 'Loading...' : `${filtered.length} reports found`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          {loading ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge status={report.status} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">
                          Report #{report.id}
                        </p>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {report.hospital_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
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
                        onClick={() => handleViewResults(report)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Results →
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(report)}
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

export default SuperAdminReportsPage