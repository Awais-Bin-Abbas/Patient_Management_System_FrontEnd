// src/pages/HospitalPage.jsx

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import axiosInstance from '../api/axiosInstance'

import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const HospitalPage = () => {
  const { user }             = useAuth()
  const { selectedHospital } = useSuperAdmin()
  const isSuperAdmin         = user?.role === 'SuperAdmin'
  const isAdmin              = user?.role === 'Admin'
  const [hospitals, setHospitals]   = useState([])
  const [stats, setStats]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    name: '', address: '', contact_info: ''
  })

  // ─── Fetch Hospitals ──────────────────────────────────────────────────────

  const fetchHospitals = () => {
    setLoading(true)
    axiosInstance.get('/api/hospital/list/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [res.data]
        setHospitals(data)
      })
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false))
  }

  const fetchStats = () => {
    axiosInstance.get('/api/hospital/stats/')
      .then(res => setStats(res.data))
      .catch(() => setStats([]))
  }

  useEffect(() => { 
    if (isSuperAdmin && !selectedHospital) {
      setHospitals([])
      setStats([])
      setLoading(false)
      return
    }
    fetchHospitals() 
    fetchStats()
  }, [selectedHospital, isSuperAdmin])

  // ─── Create Hospital ──────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editMode) {
        await axiosInstance.patch(`/api/hospital/${editingId}/update/`, form)
      } else {
        await axiosInstance.post('/api/hospital/create/', form)
      }
      setShowModal(false)
      resetForm()
      fetchHospitals()
      fetchStats()
    } catch (err) {
      setError(
        err.response?.data?.name?.[0] ||
        err.response?.data?.contact_info?.[0] ||
        err.response?.data?.error ||
        `Failed to ${editMode ? 'update' : 'create'} hospital.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', address: '', contact_info: '' })
    setEditMode(false)
    setEditingId(null)
    setError('')
  }

  const handleEdit = (hospital) => {
    setForm({
      name: hospital.name,
      address: hospital.address,
      contact_info: hospital.contact_info
    })
    setEditMode(true)
    setEditingId(hospital.id)
    setShowModal(true)
  }

  // ─── Deactivate Hospital ──────────────────────────────────────────────────

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate hospital "${name}"?`)) return
    try {
      await axiosInstance.delete(`/api/hospital/${id}/delete/`)
      fetchHospitals()
      fetchStats()
    } catch {
      alert('Failed to deactivate hospital.')
    }
  }

  // ─── Restore Hospital ─────────────────────────────────────────────────────

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restore hospital "${name}"?`)) return
    try {
      await axiosInstance.patch(`/api/hospital/${id}/restore/`)
      fetchHospitals()
      fetchStats()
    } catch {
      alert('Failed to restore hospital.')
    }
  }

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name', label: 'Hospital',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold">
            🏥
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{row.name}</p>
            <p className="text-xs text-gray-400">{row.slug}</p>
          </div>
        </div>
      )
    },
    {
      key: 'address', label: 'Address',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.address}</span>
      )
    },
    {
      key: 'contact_info', label: 'Contact',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.contact_info}</span>
      )
    },
    {
      key: 'is_active', label: 'Status',
      render: (row) => (
        <Badge status={row.is_active ? 'active' : 'inactive'} />
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
            <button
              onClick={() => handleRestore(row.id, row.name)}
              className="text-xs text-green-600 hover:text-green-800 font-medium"
            >
              Restore
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <Layout title={isSuperAdmin ? `Hospital Profile — ${selectedHospital?.name || 'Select'}` : 'Hospital Profile'}>
      <div className="space-y-6">

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hospitals.length > 0 ? (
          <div className="space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />
              <div className="px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center text-4xl">
                    🏥
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{hospitals[0].name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Hospital ID: <span className="font-mono text-blue-600">{hospitals[0].id}</span>
                    </p>
                    <div className="mt-3">
                      <Badge status={hospitals[0].is_active ? 'active' : 'inactive'} />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleEdit(hospitals[0])}
                    icon="✏️"
                  >
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-gray-50 pt-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</label>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                        {hospitals[0].address || 'No address provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Information</label>
                      <p className="text-sm text-gray-700 mt-1">
                        {hospitals[0].contact_info || 'No contact info provided'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <p className="text-xs font-medium text-blue-600">Total Patients</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">
                        {stats[0]?.total_patients || 0}
                      </p>
                    </div>
                    <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
                      <p className="text-xs font-medium text-teal-600">Appointed Leads</p>
                      <p className="text-3xl font-bold text-teal-900 mt-1">
                        {stats[0]?.total_leads || 0}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-600">Total Staff</p>
                      <p className="text-3xl font-bold text-indigo-900 mt-1">
                        {stats[0]?.total_staff || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info / Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Facility Status</h3>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500 flex-grow">
                  Deactivating your hospital will hide it from new registrations and search results. 
                  Existing patient records and leads will remain preserved.
                </p>
                {hospitals[0].is_active ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleDeactivate(hospitals[0].id, hospitals[0].name)}
                  >
                    Deactivate Facility
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleRestore(hospitals[0].id, hospitals[0].name)}
                  >
                    Restore Facility
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">No hospital profile found. Please contact support.</p>
          </div>
        )}

      </div>

      {/* Update Hospital Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title="Update Hospital Profile"
        size="md"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hospital Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. City General Hospital"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full hospital address"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
              placeholder="e.g. 03001234567"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => { setShowModal(false); resetForm() }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Update Profile
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

export default HospitalPage