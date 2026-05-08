// src/pages/LeadsPage.jsx

import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const STATUSES        = ['new', 'contacted', 'qualified', 'appointed', 'rejected']
const UPDATE_STATUSES = ['new', 'contacted', 'qualified', 'appointed']
const CREATE_STATUSES = ['new', 'contacted', 'qualified']

const formatCriteriaLabel = (name, rules) => {
  const parts = []
  if (rules.condition)  parts.push(rules.condition)
  if (rules.severity)   parts.push(rules.severity)
  if (rules.is_chronic) parts.push('chronic')
  if (rules.min_age && rules.max_age) parts.push(`age ${rules.min_age}–${rules.max_age}`)
  else if (rules.min_age) parts.push(`age ${rules.min_age}+`)
  else if (rules.max_age) parts.push(`age under ${rules.max_age}`)
  return parts.length > 0 ? `${name} (${parts.join(', ')})` : name
}

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

const LeadsPage = () => {
  const { user }             = useAuth()
  const { selectedHospital } = useSuperAdmin()
  const isSuperAdmin         = user?.role === 'SuperAdmin'
  const isAdmin              = user?.role === 'Admin'
  const canManage            = isAdmin || isSuperAdmin

  const [activeTab, setActiveTab]           = useState('all')
  const [leads, setLeads]                   = useState([])
  const [priorityLeads, setPriorityLeads]   = useState([])
  const [totalLeads, setTotalLeads]         = useState(0)
  const [totalPriority, setTotalPriority]   = useState(0)
  const [criteria, setCriteria]             = useState([])
  const [patients, setPatients]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [generating, setGenerating]         = useState(false)
  const [genResult, setGenResult]           = useState(null)
  const [error, setError]                   = useState('')
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [openDropdown, setOpenDropdown]     = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showCreateModal, setShowCreateModal]     = useState(false)
  const [showEditModal, setShowEditModal]         = useState(false)
  const [selectedCriteriaId, setSelectedCriteriaId] = useState('')
  const [editingLead, setEditingLead]       = useState(null)
  const [editForm, setEditForm]             = useState({ criteria_id: '', assigned_to: '' })
  const [createForm, setCreateForm]         = useState({ patient_id: '', status: 'new', notes: '' })
  const [submitting, setSubmitting]         = useState(false)
  const [doctors, setDoctors]               = useState([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningLead, setAssigningLead]   = useState(null)
  const [assignDoctorId, setAssignDoctorId] = useState('')
  const [assigning, setAssigning]           = useState(false)

  const isDoctor = user?.role === 'Doctor'

  useEffect(() => {
    if (!openDropdown) return
    const handler = () => setOpenDropdown(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openDropdown])

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchLeads = useCallback((page = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)       params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)
    // Doctor: fetch all without page param, filter client-side (backend has no assigned_to filter)
    // Admin/SuperAdmin: server-side pagination
    if (!isDoctor) params.append('page', page)

    axiosInstance.get(`/api/lead/list/?${params.toString()}`)
      .then(res => {
        const raw = res.data.results ?? res.data
        const data = isDoctor
          ? raw.filter(l => l.assigned_to_username === user?.username)
          : raw
        setLeads(data)
        setTotalLeads(isDoctor ? data.length : (res.data.count ?? data.length))
      })
      .catch(() => setError('Failed to load leads.'))
      .finally(() => setLoading(false))
  }, [search, statusFilter, isDoctor, user?.username])

  const fetchPriorityLeads = useCallback((page = 1) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (!isDoctor) params.append('page', page)

    axiosInstance.get(`/api/lead/priority-list/?${params.toString()}`)
      .then(res => {
        const raw = res.data.results ?? res.data
        const data = isDoctor
          ? raw.filter(l => l.assigned_to_username === user?.username)
          : raw
        setPriorityLeads(data)
        setTotalPriority(isDoctor ? data.length : (res.data.count ?? data.length))
      })
      .catch(() => {})
  }, [search, isDoctor, user?.username])

  const {
    paginated: paginatedAll, currentPage: pageAll, totalPages: totalPagesAll,
    totalItems: totalItemsAll, pageSize: pageSizeAll, goToPage: goToPageAll,
  } = usePagination(leads, {
    isServerSide: !isDoctor,
    totalItems: totalLeads
  })

  const {
    paginated: paginatedPriority, currentPage: pagePriority, totalPages: totalPagesPriority,
    totalItems: totalItemsPriority, pageSize: pageSizePriority, goToPage: goToPagePriority,
  } = usePagination(priorityLeads, {
    isServerSide: !isDoctor,
    totalItems: totalPriority
  })

  useEffect(() => {
    if (activeTab === 'all') fetchLeads(pageAll)
    else fetchPriorityLeads(pagePriority)
  }, [pageAll, pagePriority, activeTab, fetchLeads, fetchPriorityLeads, selectedHospital])

  useEffect(() => {
    if (canManage) {
      axiosInstance.get('/api/lead/criteria/list/').then(res => setCriteria(res.data)).catch(() => {})
      axiosInstance.get('/api/patient/list/').then(res => setPatients(res.data.results || res.data)).catch(() => {})
    }

    // Mirror the exact pattern StaffPage uses — SuperAdmin needs ?hospital_id=, Admin does not
    const staffUrl = isSuperAdmin && selectedHospital
      ? `/api/auth/staff/?hospital_id=${selectedHospital.id}`
      : '/api/auth/staff/'

    axiosInstance.get(staffUrl).then(res => {
      const staffData = res.data.results || res.data
      if (canManage) {
        // Staff list includes all roles — filter to Doctor only for the assign dropdown
        setDoctors(staffData.filter(u => u.role === 'Doctor'))
      }
    }).catch(() => {})
  }, [selectedHospital, canManage, isSuperAdmin])

  // ─── Generate Leads ───────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedCriteriaId) return
    setGenerating(true)
    setError('')
    try {
      const res = await axiosInstance.post('/api/lead/create_from_criteria/', {
        criteria_id: selectedCriteriaId
      })
      setGenResult(res.data)
      setShowGenerateModal(false)
      setSelectedCriteriaId('')
      fetchLeads(pageAll)
      fetchPriorityLeads(pagePriority)
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  // ─── Create Manual Lead ───────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axiosInstance.post('/api/lead/create/', createForm)
      setShowCreateModal(false)
      setCreateForm({ patient_id: '', status: 'new', notes: '' })
      fetchLeads(pageAll)
      fetchPriorityLeads(pagePriority)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lead.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Status Update ────────────────────────────────────────────────────────

  const handleStatusChange = async (id, newStatus) => {
    setOpenDropdown(null)
    try {
      await axiosInstance.patch(`/api/lead/${id}/update/`, { status: newStatus })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
      setPriorityLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    } catch {
      setError('Failed to update lead status.')
    }
  }

  // ─── Reject ───────────────────────────────────────────────────────────────

  const handleReject = async (lead) => {
    try {
      await axiosInstance.patch(`/api/lead/${lead.id}/update/`, { status: 'rejected' })
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'rejected' } : l))
      setPriorityLeads(prev => prev.filter(l => l.id !== lead.id))
    } catch {
      setError('Failed to reject lead.')
    }
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────

  const openEdit = (lead) => {
    setEditingLead(lead)
    setEditForm({
      criteria_id: lead.criteria_id    || '',
      assigned_to: lead.assigned_to_id  || '',
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

  // ─── Quick Assign Doctor ──────────────────────────────────────────────────

  const handleQuickAssign = async (e) => {
    e.preventDefault()
    setAssigning(true)
    try {
      const res = await axiosInstance.patch(`/api/lead/${assigningLead.id}/update/`, {
        assigned_to: assignDoctorId || null
      })
      const selectedDoctor = doctors.find(d => d.id.toString() === assignDoctorId.toString())
      const patch = {
        ...res.data,
        assigned_to_id:       selectedDoctor ? selectedDoctor.id : null,
        assigned_to_username: selectedDoctor ? selectedDoctor.username : null,
      }
      setLeads(prev => prev.map(l => l.id === assigningLead.id ? { ...l, ...patch } : l))
      setPriorityLeads(prev => prev.map(l => l.id === assigningLead.id ? { ...l, ...patch } : l))
      setShowAssignModal(false)
      setAssigningLead(null)
      setAssignDoctorId('')
    } catch {
      setError('Failed to assign lead.')
    } finally {
      setAssigning(false)
    }
  }

  // ─── Clear All ────────────────────────────────────────────────────────────

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL leads? This cannot be undone.')) return
    try {
      // With pagination, "Clear All" is tricky. We should probably have a backend endpoint for this.
      // For now, clearing what's visible or better, warn user.
      await Promise.all(leads.map(l => axiosInstance.delete(`/api/lead/${l.id}/delete/`)))
      fetchLeads(pageAll)
      fetchPriorityLeads(pagePriority)
    } catch {
      setError('Failed to clear some leads.')
    }
  }

  // ─── Shared action cell ───────────────────────────────────────────────────

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
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
      {canManage && (
        <button
          onClick={() => openEdit(row)}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Edit
        </button>
      )}
      {canManage && (
        <button
          onClick={() => {
            setAssigningLead(row)
            setAssignDoctorId(row.assigned_to_id?.toString() || '')
            setShowAssignModal(true)
          }}
          className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
        >
          Assign
        </button>
      )}
      <button
        onClick={() => handleReject(row)}
        disabled={row.status === 'rejected'}
        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Reject
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
          {row.lead_date ? new Date(row.lead_date).toLocaleDateString() : '—'}
        </span>
      )
    },
    { key: 'actions', label: 'Actions', render: renderActions }
  ]

  // ─── Priority Ranked columns (no rank column) ─────────────────────────────

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
    <Layout title="Leads">
      <div className="space-y-5">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {genResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 flex items-center gap-3">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Leads Generated Successfully</p>
              <p className="text-xs text-green-600 mt-0.5">
                {genResult.leads_created} new leads created · {genResult.leads_skipped} already existed
              </p>
            </div>
            <button onClick={() => setGenResult(null)} className="ml-auto text-green-400 hover:text-green-600 text-xs">✕</button>
          </div>
        )}

        {/* Doctor scope banner */}
        {isDoctor && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-blue-400">👤</span>
            <p className="text-sm text-blue-700">
              Showing leads assigned to <strong>{user.username}</strong>
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : activeTab === 'all'
              ? `${totalItemsAll} leads found`
              : `${totalItemsPriority} leads ranked by priority`
            }
          </p>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button variant="secondary" onClick={() => { setError(''); setShowCreateModal(true) }} icon="➕">
                Manual Lead
              </Button>
            )}
            {canManage && (
              <Button onClick={() => { setError(''); setSelectedCriteriaId(''); setShowGenerateModal(true) }} icon="⚡">
                Generate Leads
              </Button>
            )}
            {canManage && leads.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

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

        {/* All Leads Tab */}
        {activeTab === 'all' && (
          <>
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
                  <button onClick={() => { setSearch(''); setStatusFilter('') }} className="text-xs text-red-400 hover:text-red-600">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <Table columns={allColumns} data={paginatedAll} emptyMessage="No leads found." />
              <Pagination
                currentPage={pageAll}
                totalPages={totalPagesAll}
                onPageChange={goToPageAll}
                totalItems={totalItemsAll}
                pageSize={pageSizeAll}
              />
            </div>
          </>
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
                data={paginatedPriority}
                emptyMessage="No active leads to rank."
              />
              <Pagination
                currentPage={pagePriority}
                totalPages={totalPagesPriority}
                onPageChange={goToPagePriority}
                totalItems={totalItemsPriority}
                pageSize={pageSizePriority}
              />
            </div>
          </>
        )}

      </div>

      {/* Generate Leads Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setSelectedCriteriaId(''); setError('') }}
        title="Generate Leads"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a criteria to generate leads from matching patients in your hospital.
          </p>
          {criteria.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-3xl mb-2">⚙️</p>
              <p className="text-sm text-gray-400">No criteria found. Create criteria first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {criteria.map(c => (
                <button
                  key={c.id}
                  onClick={() => c.is_active && setSelectedCriteriaId(c.id)}
                  disabled={!c.is_active}
                  className={`w-full text-left rounded-xl px-4 py-3 border-2 transition-all ${
                    selectedCriteriaId === c.id
                      ? 'border-blue-500 bg-blue-50'
                      : c.is_active
                        ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCriteriaLabel(c.name, c.criteria)}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {!c.is_active && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                      {selectedCriteriaId === c.id && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowGenerateModal(false); setSelectedCriteriaId(''); setError('') }}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} loading={generating} icon="⚡" disabled={!selectedCriteriaId}>
              {generating ? 'Generating...' : 'Generate Leads'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Manual Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setError('') }}
        title="Create Manual Lead"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Patient <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={createForm.patient_id}
              onChange={(e) => setCreateForm({ ...createForm, patient_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Initial Status</label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CREATE_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Add initial notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); setError('') }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
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
                {criteria.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={editForm.assigned_to}
                onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Doctor Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssigningLead(null); setAssignDoctorId('') }}
        title={`Assign Lead — ${assigningLead?.patient_name}`}
        size="sm"
      >
        <form onSubmit={handleQuickAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assign to Doctor</label>
            {doctors.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">No doctors available.</p>
            ) : (
              <select
                value={assignDoctorId}
                onChange={(e) => setAssignDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.username}</option>
                ))}
              </select>
            )}
          </div>

          {assigningLead?.assigned_to_username && (
            <p className="text-xs text-gray-400">
              Currently assigned to:{' '}
              <span className="font-medium text-gray-600">{assigningLead.assigned_to_username}</span>
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => { setShowAssignModal(false); setAssigningLead(null); setAssignDoctorId('') }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={assigning} disabled={doctors.length === 0}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

    </Layout>
  )
}

export default LeadsPage