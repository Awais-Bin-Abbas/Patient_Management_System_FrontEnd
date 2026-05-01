// src/pages/LeadsPage.jsx

import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Button from '../components/Button'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const STATUSES        = ['new', 'contacted', 'qualified', 'appointed', 'rejected']
const UPDATE_STATUSES = ['new', 'contacted', 'qualified', 'appointed']

const LeadsPage = () => {
  const { user }             = useAuth()
  const { selectedHospital } = useSuperAdmin()
  const isSuperAdmin         = user?.role === 'SuperAdmin'
  const isAdmin              = user?.role === 'Admin'
  const canManage            = isAdmin || isSuperAdmin

  const [leads, setLeads]               = useState([])
  const [criteria, setCriteria]         = useState([])
  const [staff, setStaff]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLead, setEditingLead]   = useState(null)
  const [editForm, setEditForm]         = useState({ criteria_id: '', assigned_to_id: '' })
  const [submitting, setSubmitting]     = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return
    const handler = () => setOpenDropdown(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openDropdown])

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchLeads = useCallback(() => {
    setLoading(true)
    setError('')
    axiosInstance.get('/api/lead/list/')
      .then(res => setLeads(res.data))
      .catch(() => setError('Failed to load leads.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchLeads()
    axiosInstance.get('/api/lead/criteria/list/').then(res => setCriteria(res.data)).catch(() => {})
    axiosInstance.get('/api/auth/staff/').then(res => setStaff(res.data)).catch(() => {})
  }, [fetchLeads, selectedHospital])

  // ─── Status Update via dropdown ───────────────────────────────────────────

  const handleStatusChange = async (id, newStatus) => {
    setOpenDropdown(null)
    try {
      await axiosInstance.patch(`/api/lead/${id}/update/`, { status: newStatus })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    } catch {
      setError('Failed to update lead status.')
    }
  }

  // ─── Reject ───────────────────────────────────────────────────────────────

  const handleReject = async (lead) => {
    if (!window.confirm(`Reject lead for "${lead.patient_name}"?`)) return
    try {
      await axiosInstance.patch(`/api/lead/${lead.id}/update/`, { status: 'rejected' })
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'rejected' } : l))
    } catch {
      setError('Failed to reject lead.')
    }
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────

  const openEdit = (lead) => {
    setEditingLead(lead)
    setEditForm({
      criteria_id:    lead.criteria_id    || '',
      assigned_to_id: lead.assigned_to_id || '',
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await axiosInstance.patch(`/api/lead/${editingLead.id}/update/`, editForm)
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...res.data } : l))
      setShowEditModal(false)
    } catch {
      setError('Failed to update lead.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Clear All ────────────────────────────────────────────────────────────

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL leads? This cannot be undone.')) return
    try {
      await Promise.all(leads.map(l => axiosInstance.delete(`/api/lead/${l.id}/delete/`)))
      setLeads([])
    } catch {
      setError('Failed to clear all leads.')
    }
  }

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filtered = leads.filter(l => {
    const matchesSearch = search
      ? l.patient_name?.toLowerCase().includes(search.toLowerCase())
      : true
    const matchesStatus = statusFilter ? l.status === statusFilter : true
    return matchesSearch && matchesStatus
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
        <span className="text-xs text-gray-500">{row.assigned_to_username || 'Unassigned'}</span>
      )
    },
    {
      key: 'lead_date', label: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.lead_date ? new Date(row.lead_date).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">

          {/* Update dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setOpenDropdown(openDropdown === row.id ? null : row.id)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
            >
              Update
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdown === row.id && (
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px] py-1">
                {UPDATE_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(row.id, s)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 capitalize transition-colors ${
                      row.status === s ? 'font-semibold text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={() => openEdit(row)}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Edit
          </button>

          {/* Reject button */}
          <button
            onClick={() => handleReject(row)}
            disabled={row.status === 'rejected'}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reject
          </button>

        </div>
      )
    }
  ]

  return (
    <Layout title={isSuperAdmin ? `Leads — ${selectedHospital?.name || 'Select Hospital'}` : 'Leads'}>
      <div className="space-y-5">

        {/* SuperAdmin hospital banner */}
        {isSuperAdmin && selectedHospital && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
            <p className="text-sm text-teal-800">
              Viewing leads for <strong>{selectedHospital.name}</strong>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${filtered.length} leads found`}
          </p>
          {leads.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              Clear All Leads
            </button>
          )}
        </div>

        {/* Filters */}
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
          </div>
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

      {/* Edit Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit Lead — ${editingLead?.patient_name}`}
          size="sm"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Criteria</label>
              <select
                value={editForm.criteria_id}
                onChange={(e) => setEditForm({ ...editForm, criteria_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Criteria</option>
                {criteria.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={editForm.assigned_to_id}
                onChange={(e) => setEditForm({ ...editForm, assigned_to_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.username}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </Layout>
  )
}

export default LeadsPage
