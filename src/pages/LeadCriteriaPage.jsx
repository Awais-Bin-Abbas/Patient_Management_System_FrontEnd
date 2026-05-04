// src/pages/LeadCriteriaPage.jsx

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const LeadCriteriaPage = () => {
  const { user }             = useAuth()
  const { selectedHospital } = useSuperAdmin()
  const isSuperAdmin         = user?.role === 'SuperAdmin'
  const isAdmin              = user?.role === 'Admin'

  const [criteria, setCriteria]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    name:       '',
    condition:  '',
    severity:   '',
    is_chronic: '',
    min_age:    '',
    max_age:    '',
  })

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(criteria)

  // ─── Fetch Criteria ───────────────────────────────────────────────────────

  const fetchCriteria = () => {
    setLoading(true)
    axiosInstance.get('/api/lead/criteria/list/')
      .then(res => setCriteria(res.data))
      .catch(() => setCriteria([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isSuperAdmin && !selectedHospital) {
      setCriteria([])
      setLoading(false)
      return
    }
    fetchCriteria()
  }, [selectedHospital, isSuperAdmin])

  // ─── Build Criteria JSON ──────────────────────────────────────────────────

  const buildCriteriaJson = () => {
    const obj = {}
    if (form.condition)          obj.condition  = form.condition
    if (form.severity)           obj.severity   = form.severity
    if (form.is_chronic !== '')  obj.is_chronic = form.is_chronic === 'true'
    if (form.min_age)            obj.min_age    = parseInt(form.min_age)
    if (form.max_age)            obj.max_age    = parseInt(form.max_age)
    return obj
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const criteriaJson = buildCriteriaJson()
    if (Object.keys(criteriaJson).length === 0) {
      setError('Please fill at least one criteria field.')
      setSubmitting(false)
      return
    }

    try {
      const payload = { name: form.name, criteria: criteriaJson, is_active: true }
      if (editMode) {
        await axiosInstance.patch(`/api/lead/criteria/${editingId}/update/`, payload)
      } else {
        await axiosInstance.post('/api/lead/criteria/create/', payload)
      }
      setShowModal(false)
      resetForm()
      fetchCriteria()
    } catch (err) {
      setError(
        err.response?.data?.criteria?.[0] ||
        err.response?.data?.error ||
        `Failed to ${editMode ? 'update' : 'create'} criteria.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', condition: '', severity: '', is_chronic: '', min_age: '', max_age: '' })
    setEditMode(false)
    setEditingId(null)
    setError('')
  }

  const handleEdit = (c) => {
    setForm({
      name:       c.name,
      condition:  c.criteria.condition || '',
      severity:   c.criteria.severity || '',
      is_chronic: c.criteria.is_chronic === undefined ? '' : String(c.criteria.is_chronic),
      min_age:    c.criteria.min_age || '',
      max_age:    c.criteria.max_age || '',
    })
    setEditMode(true)
    setEditingId(c.id)
    setShowModal(true)
  }

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate criteria "${name}"?`)) return
    try {
      await axiosInstance.delete(`/api/lead/criteria/${id}/delete/`)
      fetchCriteria()
    } catch {
      alert('Failed to deactivate criteria.')
    }
  }

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name', label: 'Criteria Name',
      render: (row) => (
        <span className="text-sm font-medium text-gray-800">{row.name}</span>
      )
    },
    {
      key: 'criteria', label: 'Rules',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(row.criteria || {}).map(([k, v]) => (
            <span key={k} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
              {k}: {String(v)}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'is_active', label: 'Status',
      render: (row) => <Badge status={row.is_active ? 'active' : 'inactive'} />
    },
    {
      key: 'created_at', label: 'Created',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleEdit(row)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          {row.is_active ? (
            <button
              onClick={() => handleDeactivate(row.id, row.name)}
              className="text-xs text-red-400 hover:text-red-600 font-medium"
            >
              Deactivate
            </button>
          ) : (
            <span className="text-xs text-gray-400">Inactive</span>
          )}
        </div>
      )
    }
  ]

  return (
    <Layout title="Lead Criteria">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {isSuperAdmin
                ? `Lead Criteria — ${selectedHospital?.name || 'Select Hospital'}`
                : 'Lead Criteria'
              }
            </h3>
            <p className="text-sm text-gray-500">
              {isSuperAdmin
                ? 'Managing rules for the selected facility'
                : `${criteria.length} criteria rules`
              }
            </p>
          </div>
          {(isAdmin || isSuperAdmin) && (
            <Button
              onClick={() => { resetForm(); setShowModal(true) }}
              icon="➕"
              disabled={isSuperAdmin && !selectedHospital}
            >
              Create Criteria
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={paginated}
            loading={loading}
            emptyMessage="No criteria yet. Create one to start generating leads."
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title={editMode ? 'Update Lead Criteria' : 'Create Lead Criteria'}
        size="md"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-xs text-yellow-700 mb-4">
          Fill at least one criteria field below. Leave fields empty to skip them.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Criteria Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Diabetic Seniors"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
              <input
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                placeholder="e.g. diabetes"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Age</label>
              <input
                type="number" min="0" max="120"
                value={form.min_age}
                onChange={(e) => setForm({ ...form, min_age: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Age</label>
              <input
                type="number" min="0" max="120"
                value={form.max_age}
                onChange={(e) => setForm({ ...form, max_age: e.target.value })}
                placeholder="e.g. 80"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Chronic Status</label>
            <select
              value={form.is_chronic}
              onChange={(e) => setForm({ ...form, is_chronic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="true">Chronic Patients Only</option>
              <option value="false">Non-Chronic Only</option>
            </select>
          </div>

          {Object.keys(buildCriteriaJson()).length > 0 && (
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Criteria Preview:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(buildCriteriaJson()).map(([k, v]) => (
                  <span key={k} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm() }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editMode ? 'Update Criteria' : 'Create Criteria'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

export default LeadCriteriaPage