// src/pages/StaffPage.jsx

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'



const StaffPage = () => {
  const { user }             = useAuth()
  const { selectedHospital } = useSuperAdmin()
  const isSuperAdmin         = user?.role === 'SuperAdmin'
  const isAdmin              = user?.role === 'Admin'

  const [staff, setStaff]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    username: '', email: '', password: '', role: 'Doctor'
  })

  console.log('StaffPage - isSuperAdmin:', isSuperAdmin)
  console.log('StaffPage - selectedHospital:', selectedHospital)

  // ─── Fetch Staff ──────────────────────────────────────────────────────────

  const fetchStaff = () => {
    if (isSuperAdmin && !selectedHospital) {
      setStaff([])
      setLoading(false)
      return
    }

    setLoading(true)
    const url = isSuperAdmin 
      ? `/api/auth/staff/?hospital_id=${selectedHospital.id}` 
      : '/api/auth/staff/'

    axiosInstance.get(url)
      .then(res => setStaff(res.data))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStaff() }, [selectedHospital, isSuperAdmin])

  // ─── Create Staff ─────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = { ...form }
    if (isSuperAdmin && selectedHospital) {
      payload.hospital_id = selectedHospital.id
    }

    try {
      await axiosInstance.post('/api/auth/staff/', payload)
      setShowModal(false)
      setForm({ username: '', email: '', password: '', role: 'Doctor' })
      fetchStaff()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff member.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Deactivate Staff ─────────────────────────────────────────────────────

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your hospital?`)) return
    try {
      await axiosInstance.delete(`/api/auth/staff/${id}/`)
      fetchStaff()
    } catch {
      alert('Failed to remove staff member.')
    }
  }

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'username', label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold uppercase">
            {row.username.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{row.username}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role', label: 'Role',
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          row.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
          row.role === 'Doctor' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {row.role}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <Badge status={row.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.is_active && (
            <button
              onClick={() => handleDeactivate(row.id, row.username)}
              className="text-xs text-red-400 hover:text-red-600 font-medium"
            >
              Remove
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    
    <Layout title="Staff Management">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {isSuperAdmin ? `Staff — ${selectedHospital?.name || 'Select Hospital'}` : 'Hospital Staff'}
            </h3>
            <p className="text-sm text-gray-500">
              {isSuperAdmin 
                ? 'Managing staff for the selected facility' 
                : 'Manage clinicians and administrative users assigned to your facility'}
            </p>
          </div>
          {(isAdmin || isSuperAdmin) && (
            <Button 
              onClick={() => setShowModal(true)} 
              icon="➕"
              disabled={isSuperAdmin && !selectedHospital}
            >
              Add Staff Member
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            data={staff}
            loading={loading}
            emptyMessage="No staff members found."
          />
        </div>

      </div>

      {/* Create Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Staff Member"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="User">User</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Temporary Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Member</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

export default StaffPage
