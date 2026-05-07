// src/pages/SuperAdminHospitalsPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'
import { useSuperAdmin } from '../context/SuperAdminContext'

const SuperAdminHospitalsPage = () => {
  const navigate                      = useNavigate()
  const { selectHospital }            = useSuperAdmin()
  const [hospitals, setHospitals]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [form, setForm]               = useState({
    name: '', address: '', contact_info: '', slug: ''
  })

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(hospitals)

  const fetchHospitals = () => {
    setLoading(true)
    axiosInstance.get('/api/superadmin/hospitals/')
      .then(res => setHospitals(res.data))
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHospitals() }, [])

  const handleSelectHospital = (hospital) => {
    console.log('Selecting hospital:', hospital)  // ← add this
    selectHospital(hospital)
    navigate('/dashboard')
  }
  
  const handleToggle = async (e, hospital) => {
    e.stopPropagation()
    if (!window.confirm(`${hospital.is_active ? 'Deactivate' : 'Activate'} "${hospital.name}"?`)) return
    try {
      await axiosInstance.patch(`/api/superadmin/hospitals/${hospital.id}/toggle/`)
      fetchHospitals()
    } catch {
      alert('Failed to toggle hospital status.')
    }
  }

  const handleDelete = async (e, hospital) => {
    e.stopPropagation()
    if (!window.confirm(
      `⚠️ Permanently delete "${hospital.name}"?\n\nThis will erase all patients, leads, staff, and reports for this hospital. This cannot be undone.`
    )) return
    try {
      await axiosInstance.delete(`/api/superadmin/hospitals/${hospital.id}/delete/`)
      fetchHospitals()
    } catch {
      alert('Failed to delete hospital.')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axiosInstance.post('/api/superadmin/hospitals/create/', form)
      setShowModal(false)
      setForm({ name: '', address: '', contact_info: '', slug: '' })
      fetchHospitals()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create hospital.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="All Hospitals">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Hospitals</h3>
            <p className="text-sm text-gray-500">
              Select a hospital to manage it, or create a new one
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} icon="➕">
            New Hospital
          </Button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-2">🏥</p>
            <p className="text-sm text-gray-400">No hospitals found</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map(hospital => (
                <div
                  key={hospital.id}
                  onClick={() => handleSelectHospital(hospital)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  {/* Hospital Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm">
                        🏥
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                          {hospital.name}
                        </h4>
                        <p className="text-xs text-gray-400">{hospital.address}</p>
                      </div>
                    </div>
                    <Badge status={hospital.is_active ? 'active' : 'inactive'} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-800">{hospital.total_patients}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Patients</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-600">{hospital.total_leads}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Leads</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-teal-600">{hospital.total_staff}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Staff</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-blue-600 font-medium group-hover:underline">
                      Manage Hospital →
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleToggle(e, hospital)}
                        className={`text-xs font-medium transition-colors ${
                          hospital.is_active
                            ? 'text-orange-400 hover:text-orange-600'
                            : 'text-green-500 hover:text-green-700'
                        }`}
                      >
                        {hospital.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, hospital)}
                        className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        )}

      </div>

      {/* Create Hospital Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Hospital"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hospital Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Info</label>
            <input
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Slug (unique identifier)</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="e.g. city-general-hospital"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Hospital</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

export default SuperAdminHospitalsPage