import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'

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

const StaffLeadsPage = () => {
  const [leads, setLeads]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [serverTotal, setServerTotal] = useState(0)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchLeads = useCallback((page = 1) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    params.append('page', page)
    if (search) params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)

    axiosInstance.get(`/api/lead/list/?${params.toString()}`)
      .then(res => {
        if (res.data.results) {
          setLeads(res.data.results)
          setServerTotal(res.data.count)
        } else {
          setLeads(Array.isArray(res.data) ? res.data : [])
          setServerTotal(Array.isArray(res.data) ? res.data.length : 0)
        }
      })
      .catch(() => setError('Failed to load leads. You may not have permission to view this data.'))
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(leads, {
    isServerSide: true,
    totalItems: serverTotal
  })

  useEffect(() => {
    fetchLeads(currentPage)
  }, [fetchLeads, currentPage])

  const columns = [
    {
      key: 'patient_name', label: 'Patient',
      render: (row) => (
        <span className="text-sm font-medium text-gray-800">{row.patient_name || '—'}</span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge status={row.status} />
    },
    {
      key: 'priority_score', label: 'Priority',
      render: (row) => <PriorityDot score={row.priority_score ?? 0} />
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
        <span className="text-xs text-gray-500">{row.assigned_to_username || 'Unassigned'}</span>
      )
    },
    {
      key: 'lead_date', label: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-400">
          {row.lead_date ? new Date(row.lead_date).toLocaleDateString() : '—'}
        </span>
      )
    },
  ]

  return (
    <Layout title="Leads">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search patient, criteria, assignee..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); goToPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); goToPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); goToPage(1) }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Clear filters
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {loading ? 'Loading...' : `${totalItems} lead${totalItems !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={paginated}
            loading={loading}
            emptyMessage="No leads found."
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
    </Layout>
  )
}

export default StaffLeadsPage
