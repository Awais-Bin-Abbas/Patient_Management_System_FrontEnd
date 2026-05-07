import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'

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

const getPriorityLabel = (score) => {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

const DoctorReportsPage = () => {
  const { user } = useAuth()

  const [leads, setLeads]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    axiosInstance.get('/api/lead/list/')
      .then(res => setLeads(res.data.results || res.data))
      .catch(() => setError('Failed to load leads.'))
      .finally(() => setLoading(false))
  }, [])

  const myLeads = leads.filter(l => l.assigned_to_username === user?.username)

  // ─── Stats ────────────────────────────────────────────────────────────────

  const total      = myLeads.length
  const active     = myLeads.filter(l => l.status !== 'rejected').length
  const appointed  = myLeads.filter(l => l.status === 'appointed').length
  const appointmentRate = active > 0 ? Math.round((appointed / active) * 100) : 0

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = myLeads.filter(l => l.status === s).length
    return acc
  }, {})

  const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  myLeads.forEach(l => {
    priorityCounts[getPriorityLabel(l.priority_score ?? 0)]++
  })

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filtered = myLeads.filter(l => {
    const matchesSearch = search
      ? l.patient_name?.toLowerCase().includes(search.toLowerCase())
      : true
    const matchesStatus = statusFilter ? l.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filtered)

  // ─── Table columns ────────────────────────────────────────────────────────

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
      key: 'lead_date', label: 'Lead Date',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.lead_date ? new Date(row.lead_date).toLocaleDateString() : '—'}
        </span>
      )
    },
  ]

  return (
    <Layout title="My Reports">
      <div className="space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Header */}
        <div>
          <p className="text-sm text-gray-500">
            Leads assigned to <span className="font-semibold text-gray-700">{user?.username}</span>
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            title="Total Assigned"
            value={loading ? '—' : total}
            icon="📋"
            color="blue"
            subtitle="all time"
          />
          <StatCard
            title="Active Leads"
            value={loading ? '—' : active}
            icon="🔄"
            color="orange"
            subtitle="excluding rejected"
          />
          <StatCard
            title="Appointed"
            value={loading ? '—' : appointed}
            icon="✅"
            color="green"
            subtitle="successfully scheduled"
          />
          <StatCard
            title="Appointment Rate"
            value={loading ? '—' : `${appointmentRate}%`}
            icon="📈"
            color="purple"
            subtitle="of active leads"
          />
        </div>

        {/* Status & Priority breakdown */}
        {!loading && total > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* By Status */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Status</h3>
              <div className="space-y-2.5">
                {STATUSES.map(s => {
                  const count = byStatus[s]
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs capitalize text-gray-600">{s}</span>
                        <span className="text-xs font-semibold text-gray-700">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* By Priority */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Priority</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Critical', dotClass: 'bg-red-500', textClass: 'text-red-600' },
                  { label: 'High',     dotClass: 'bg-orange-400', textClass: 'text-orange-600' },
                  { label: 'Medium',   dotClass: 'bg-yellow-400', textClass: 'text-yellow-600' },
                  { label: 'Low',      dotClass: 'bg-gray-300', textClass: 'text-gray-400' },
                ].map(({ label, dotClass, textClass }) => {
                  const count = priorityCounts[label]
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
                          <span className={`text-xs font-medium ${textClass}`}>{label}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dotClass} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Leads table */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              />
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
              {(search || statusFilter) && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter('') }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Clear filters
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {loading ? 'Loading...' : `${filtered.length} lead${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <Table
              columns={columns}
              data={paginated}
              loading={loading}
              emptyMessage="No leads assigned to you yet."
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        </div>

      </div>
    </Layout>
  )
}

export default DoctorReportsPage
