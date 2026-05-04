// src/pages/PatientsPage.jsx

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const PatientsPage = () => {
  const { user }                       = useAuth()
  const { selectedHospital }           = useSuperAdmin()
  const navigate                       = useNavigate()
  const isSuperAdmin                   = user?.role === 'SuperAdmin'
  const isAdmin                        = user?.role === 'Admin'
  const canManage                      = isAdmin || isSuperAdmin

  const [patients, setPatients]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState({
    condition: '', is_chronic: '', severity: ''
  })
  const [showModal, setShowModal]   = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    first_name:   '',
    last_name:    '',
    dob:          '',
    email:        '',
    contact_info: '',
    is_chronic:   false
  })

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(patients)

  // ─── Fetch Patients ───────────────────────────────────────────────────────

  const fetchPatients = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)             params.append('search', search)
    if (filter.condition)   params.append('condition', filter.condition)
    if (filter.is_chronic)  params.append('is_chronic', filter.is_chronic)
    if (filter.severity)    params.append('severity', filter.severity)

    const baseUrl = `/api/patient/list/`

    axiosInstance.get(`${baseUrl}?${params.toString()}`)
      .then(res => setPatients(res.data))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false))
  }, [search, filter])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients, selectedHospital])

  // ─── Create / Update Patient ──────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editMode) {
        await axiosInstance.patch(`/api/patient/${editingId}/update/`, form)
      } else {
        const payload = isSuperAdmin && selectedHospital
          ? { ...form, hospital_id: selectedHospital.id }
          : form
        await axiosInstance.post('/api/patient/create/', payload)
      }
      setShowModal(false)
      resetForm()
      fetchPatients()
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.error ||
        `Failed to ${editMode ? 'update' : 'create'} patient.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      first_name: '', last_name: '', dob: '',
      email: '', contact_info: '', is_chronic: false
    })
    setEditMode(false)
    setEditingId(null)
    setError('')
  }

  const handleEdit = (p) => {
    setForm({
      first_name:   p.first_name,
      last_name:    p.last_name,
      dob:          p.dob,
      email:        p.email,
      contact_info: p.contact_info,
      is_chronic:   p.is_chronic
    })
    setEditMode(true)
    setEditingId(p.id)
    setShowModal(true)
  }

  // ─── Delete Patient ───────────────────────────────────────────────────────

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete patient ${name}?`)) return
    try {
      await axiosInstance.delete(`/api/patient/${id}/delete/`)
      fetchPatients()
    } catch {
      alert('Failed to delete patient.')
    }
  }

  // ─── Reset Filters ────────────────────────────────────────────────────────

  const resetFilters = () => {
    setSearch('')
    setFilter({ condition: '', is_chronic: '', severity: '' })
  }

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name', label: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'age', label: 'Age',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.age} yrs</span>
      )
    },
    {
      key: 'contact_info', label: 'Contact',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.contact_info}</span>
      )
    },
    {
      key: 'is_chronic', label: 'Status',
      render: (row) => (
        <Badge status={row.is_chronic ? 'converted' : 'pending'} />
      )
    },
    {
      key: 'condition_count', label: 'Conditions',
      render: (row) => (
        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
          {row.condition_count ?? 0}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/patients/${row.id}`)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            View
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Edit
          </button>
          {canManage && (
            <button
              onClick={() => handleDelete(row.id, `${row.first_name} ${row.last_name}`)}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <Layout title={isSuperAdmin ? `Patients — ${selectedHospital?.name || 'Select'}` : 'Patients'}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${patients.length} patients found`}
          </p>
          <Button onClick={() => { resetForm(); setShowModal(true) }} icon="➕">
            Add Patient
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="🔍 Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Filter by condition..."
              value={filter.condition}
              onChange={(e) => setFilter({ ...filter, condition: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter.is_chronic}
              onChange={(e) => setFilter({ ...filter, is_chronic: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Patients</option>
              <option value="true">Chronic Only</option>
              <option value="false">Non-Chronic</option>
            </select>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          {(search || filter.condition || filter.is_chronic || filter.severity) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Active filters:</span>
              {search && (
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  search: {search}
                </span>
              )}
              {filter.condition && (
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  condition: {filter.condition}
                </span>
              )}
              {filter.is_chronic && (
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  {filter.is_chronic === 'true' ? 'chronic' : 'non-chronic'}
                </span>
              )}
              {filter.severity && (
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  severity: {filter.severity}
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-red-400 hover:text-red-600 ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={paginated}
            loading={loading}
            emptyMessage="No patients found. Create one to get started."
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

      {/* Create / Edit Patient Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title={editMode ? 'Update Patient' : 'Add New Patient'}
        size="md"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john.doe@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contact Info <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              placeholder="03001234567"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="is_chronic"
              checked={form.is_chronic}
              onChange={(e) => setForm({ ...form, is_chronic: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="is_chronic" className="text-sm text-gray-700">
              Mark as Chronic Patient
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm() }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editMode ? 'Update Patient' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

export default PatientsPage