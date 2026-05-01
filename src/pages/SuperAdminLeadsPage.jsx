// src/pages/SuperAdminLeadsPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import axiosInstance from '../api/axiosInstance'
import { useSuperAdmin } from '../context/SuperAdminContext'

const SuperAdminLeadsPage = () => {
  const { selectHospital }              = useSuperAdmin()
  const navigate                        = useNavigate()
  const [leads, setLeads]               = useState([])
  const [hospitals, setHospitals]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchLeads = () => {
    setLoading(true)
    axiosInstance.get('/api/superadmin/leads/')
      .then(res => setLeads(res.data))
      .catch(() => setError('Failed to load leads.'))
      .finally(() => setLoading(false))
  }

  const fetchHospitals = () => {
    axiosInstance.get('/api/superadmin/hospitals/')
      .then(res => setHospitals(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchLeads()
    fetchHospitals()
  }, [])

  // ─── Delete Lead ──────────────────────────────────────────────────────────

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete lead for "${lead.patient_name}"?`)) return
    try {
      await axiosInstance.delete(`/api/superadmin/leads/${lead.id}/delete/`)
      setLeads(prev => prev.filter(l => l.id !== lead.id))
    } catch {
      setError('Failed to delete lead.')
    }
  }

  // ─── Manage Hospital ──────────────────────────────────────────────────────

  const handleManageHospital = (lead) => {
    selectHospital({ id: lead.hospital_id, name: lead.hospital_name })
    navigate('/leads')
  }

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filtered = leads.filter(l => {
    const matchesHospital = hospitalFilter ? String(l.hospital_id) === hospitalFilter : true
    const matchesStatus   = statusFilter   ? l.status === statusFilter               : true
    return matchesHospital && matchesStatus
  })

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'patient_name', label: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
            {row.patient_name?.[0]}
          </div>
          <span className="text-sm font-medium text-gray-700">{row.patient_name}</span>
        </div>
      )
    },
    {
      key: 'hospital_name', label: 'Hospital',
      render: (row) => (
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
          {row.hospital_name}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge status={row.status} />
    },
    {
      key: 'criteria_name', label: 'Criteria',
      render: (row) => (
        <span className="text-xs text-gray-500">{row.criteria_name || '—'}</span>
      )
    },
    {
      key: 'assigned_to_username', label: 'Assigned To',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.assigned_to_username || 'Unassigned'}
        </span>
      )
    },
    {
      key: 'lead_date', label: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.lead_date).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleManageHospital(row)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage →
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-xs text-red-400 hover:text-red-600 font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ]

  return (
    <Layout title="Global Leads">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">All Leads</h3>
            <p className="text-sm text-gray-500">
              View and manage leads across all hospitals
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 flex-wrap">
          <label className="text-xs font-medium text-gray-500">Hospital:</label>
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

          <label className="text-xs font-medium text-gray-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="appointed">Appointed</option>
            <option value="rejected">Rejected</option>
          </select>

          {(hospitalFilter || statusFilter) && (
            <button
              onClick={() => { setHospitalFilter(''); setStatusFilter('') }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {loading ? 'Loading...' : `${filtered.length} leads found`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No leads found."
          />
        </div>

      </div>
    </Layout>
  )
}

export default SuperAdminLeadsPage