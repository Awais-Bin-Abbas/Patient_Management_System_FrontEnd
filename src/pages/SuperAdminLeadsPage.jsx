// src/pages/SuperAdminLeadsPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import axiosInstance from '../api/axiosInstance'
import { useSuperAdmin } from '../context/SuperAdminContext'

const STATUSES = ['new', 'contacted', 'qualified', 'appointed', 'rejected']

const PriorityDot = ({ score }) => {
  if (score >= 75) return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[10px] text-red-600 font-semibold">Critical</span>
    </div>
  )
  if (score >= 50) return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
      <span className="text-[10px] text-orange-600 font-semibold">High</span>
    </div>
  )
  if (score >= 25) return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
      <span className="text-[10px] text-yellow-600 font-semibold">Medium</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
      <span className="text-[10px] text-gray-400 font-semibold">Low</span>
    </div>
  )
}

const SuperAdminLeadsPage = () => {
  const { selectHospital }              = useSuperAdmin()
  const navigate                        = useNavigate()
  const [activeTab, setActiveTab]       = useState('all')
  const [leads, setLeads]               = useState([])
  const [hospitals, setHospitals]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]             = useState('')

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

  // ─── Clear All ────────────────────────────────────────────────────────────

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL leads globally? This cannot be undone.')) return
    try {
      await axiosInstance.delete('/api/superadmin/leads/clear/')
      setLeads([])
    } catch {
      setError('Failed to clear all leads.')
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
    const matchesSearch   = search         ? l.patient_name?.toLowerCase().includes(search.toLowerCase()) : true
    return matchesHospital && matchesStatus && matchesSearch
  })

  // Priority tab: exclude rejected and appointed, sort by priority_score desc
  const priorityFiltered = leads
    .filter(l => {
      const notDone       = !['rejected', 'appointed'].includes(l.status)
      const matchHospital = hospitalFilter ? String(l.hospital_id) === hospitalFilter : true
      const matchSearch   = search ? l.patient_name?.toLowerCase().includes(search.toLowerCase()) : true
      return notDone && matchHospital && matchSearch
    })
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))

  // ─── Shared action cell ───────────────────────────────────────────────────

  const renderActions = (row) => (
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

  // ─── All Leads columns ────────────────────────────────────────────────────

  const allColumns = [
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
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'priority', label: 'Priority',
      render: (row) => <PriorityDot score={row.priority_score ?? 0} />
    },
    {
      key: 'criteria_name', label: 'Criteria',
      render: (row) => <span className="text-xs text-gray-500">{row.criteria_name || '—'}</span>
    },
    {
      key: 'assigned_to_username', label: 'Assigned To',
      render: (row) => <span className="text-xs text-gray-500">{row.assigned_to_username || 'Unassigned'}</span>
    },
    {
      key: 'lead_date', label: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.lead_date).toLocaleDateString()}
        </span>
      )
    },
    { key: 'actions', label: 'Actions', render: renderActions }
  ]

  // ─── Priority Ranked columns ──────────────────────────────────────────────

  const priorityColumns = [
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
      key: 'priority', label: 'Priority',
      render: (row) => <PriorityDot score={row.priority_score ?? 0} />
    },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'criteria_name', label: 'Criteria',
      render: (row) => <span className="text-xs text-gray-500">{row.criteria_name || '—'}</span>
    },
    {
      key: 'assigned_to_username', label: 'Assigned To',
      render: (row) => <span className="text-xs text-gray-500">{row.assigned_to_username || 'Unassigned'}</span>
    },
    { key: 'actions', label: 'Actions', render: renderActions }
  ]

  return (
    <Layout title="Global Leads">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">All Leads</h3>
            <p className="text-sm text-gray-500">View and manage leads across all hospitals</p>
          </div>
          {leads.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Leads
          </button>
          <button
            onClick={() => setActiveTab('priority')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'priority'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Priority Ranked
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          />
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

          {activeTab === 'all' && (
            <>
              <label className="text-xs font-medium text-gray-500">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </>
          )}

          {(hospitalFilter || statusFilter || search) && (
            <button
              onClick={() => { setHospitalFilter(''); setStatusFilter(''); setSearch('') }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {loading ? 'Loading...' : activeTab === 'all'
              ? `${filtered.length} leads found`
              : `${priorityFiltered.length} leads ranked`
            }
          </span>
        </div>

        {/* All Leads Tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <Table
              columns={allColumns}
              data={filtered}
              loading={loading}
              emptyMessage="No leads found."
            />
          </div>
        )}

        {/* Priority Ranked Tab */}
        {activeTab === 'priority' && (
          <>
            {/* Dot legend */}
            <div className="flex items-center gap-5 flex-wrap">
              {[
                { label: 'Critical', dotClass: 'bg-red-500 animate-pulse' },
                { label: 'High',     dotClass: 'bg-orange-400' },
                { label: 'Medium',   dotClass: 'bg-yellow-400' },
                { label: 'Low',      dotClass: 'bg-gray-300' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.dotClass}`} />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <Table
                columns={priorityColumns}
                data={priorityFiltered}
                loading={loading}
                emptyMessage="No active leads to rank."
              />
            </div>
          </>
        )}

      </div>
    </Layout>
  )
}

export default SuperAdminLeadsPage