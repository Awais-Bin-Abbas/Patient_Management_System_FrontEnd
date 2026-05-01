// src/pages/SuperAdminCriteriaPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import axiosInstance from '../api/axiosInstance'
import { useSuperAdmin } from '../context/SuperAdminContext'

const SuperAdminCriteriaPage = () => {
  const { selectHospital }            = useSuperAdmin()
  const navigate                      = useNavigate()
  const [criteria, setCriteria]       = useState([])
  const [hospitals, setHospitals]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [form, setForm]               = useState({
    name: '', hospital_id: '', criteria: '{}'
  })

  const fetchCriteria = () => {
    setLoading(true)
    axiosInstance.get('/api/superadmin/criteria/')
      .then(res => setCriteria(res.data))
      .catch(() => setError('Failed to load criteria.'))
      .finally(() => setLoading(false))
  }

  const fetchHospitals = () => {
    axiosInstance.get('/api/superadmin/hospitals/')
      .then(res => setHospitals(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchCriteria()
    fetchHospitals()
  }, [])

  // ─── Delete Single Criteria ───────────────────────────────────────────────

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete criteria "${item.name}"?`)) return
    try {
      await axiosInstance.delete(`/api/superadmin/criteria/${item.id}/delete/`)
      setCriteria(prev => prev.filter(c => c.id !== item.id))
    } catch {
      setError('Failed to delete criteria.')
    }
  }

  // ─── Clear All Criteria ───────────────────────────────────────────────────

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL criteria across ALL hospitals? This cannot be undone.')) return
    try {
      await axiosInstance.delete('/api/superadmin/criteria/clear/')
      setCriteria([])
    } catch {
      setError('Failed to clear all criteria.')
    }
  }

  // ─── Manage Hospital ──────────────────────────────────────────────────────

  const handleManageHospital = (item) => {
    selectHospital({ id: item.hospital_id, name: item.hospital_name })
    navigate('/criteria')
  }

  // ─── Create Criteria ──────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      // Validate JSON
      JSON.parse(form.criteria)
    } catch {
      setError('Criteria must be valid JSON.')
      setSubmitting(false)
      return
    }
    try {
      await axiosInstance.post('/api/superadmin/criteria/create/', {
        ...form,
        criteria: JSON.parse(form.criteria)
      })
      setShowModal(false)
      setForm({ name: '', hospital_id: '', criteria: '{}' })
      fetchCriteria()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create criteria.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filtered = hospitalFilter
    ? criteria.filter(c => String(c.hospital_id) === hospitalFilter)
    : criteria

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name', label: 'Criteria Name',
      render: (row) => (
        <p className="text-sm font-medium text-gray-800">{row.name}</p>
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
      key: 'is_active', label: 'Status',
      render: (row) => (
        <Badge status={row.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'criteria', label: 'Rules',
      render: (row) => (
        <span className="text-xs text-gray-400 font-mono">
          {JSON.stringify(row.criteria).slice(0, 40)}
          {JSON.stringify(row.criteria).length > 40 ? '...' : ''}
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
    <Layout title="Global Lead Criteria">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">All Lead Criteria</h3>
            <p className="text-sm text-gray-500">
              View and manage lead criteria across all hospitals
            </p>
          </div>
          <div className="flex items-center gap-3">
            {criteria.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                🗑️ Clear All
              </button>
            )}
            <Button onClick={() => { setError(''); setShowModal(true) }} icon="➕">
              New Criteria
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

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
            {loading ? 'Loading...' : `${filtered.length} criteria found`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No lead criteria found."
          />
        </div>

      </div>

      {/* Create Criteria Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Lead Criteria"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Criteria Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Chronic Patients Over 50"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hospital <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={form.hospital_id}
              onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Hospital --</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Criteria Rules (JSON)
            </label>
            <textarea
              required
              rows={5}
              value={form.criteria}
              onChange={(e) => setForm({ ...form, criteria: e.target.value })}
              placeholder={`{\n  "is_chronic": true,\n  "min_age": 50\n}`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Supported keys: is_chronic, condition, severity, min_age, max_age
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Criteria</Button>
          </div>
        </form>
      </Modal>

    </Layout>
  )
}

export default SuperAdminCriteriaPage