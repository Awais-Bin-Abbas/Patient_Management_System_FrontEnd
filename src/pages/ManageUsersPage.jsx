// src/pages/ManageUsersPage.jsx

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import axiosInstance from '../api/axiosInstance'

const ROLES = ['Admin', 'Doctor', 'User']

const ManageUsersPage = () => {
  const [users, setUsers]           = useState([])
  const [hospitals, setHospitals]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal]     = useState(false)
  const [selectedUser, setSelectedUser]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [roleChanging, setRoleChanging] = useState(null) // tracks which user's role is being changed
  const [error, setError]           = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')

  const [createForm, setCreateForm] = useState({
    username: '', email: '', password: '', role: 'Doctor', hospital_id: ''
  })

  const [editForm, setEditForm] = useState({
    username: '', email: '', role: '', hospital_id: ''
  })

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchUsers = () => {
    setLoading(true)
    const params = hospitalFilter ? `?hospital_id=${hospitalFilter}` : ''
    axiosInstance.get(`/api/superadmin/users/${params}`)
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  const fetchHospitals = () => {
    axiosInstance.get('/api/superadmin/hospitals/')
      .then(res => setHospitals(res.data))
      .catch(() => setHospitals([]))
  }

  useEffect(() => { fetchHospitals() }, [])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalFilter])

  // ─── Inline Role Change ───────────────────────────────────────────────────

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return
    if (!window.confirm(`Change ${user.username}'s role from "${user.role}" to "${newRole}"?`)) return

    setRoleChanging(user.id)
    try {
      await axiosInstance.patch(`/api/superadmin/users/${user.id}/edit/`, {
        username:    user.username,
        email:       user.email,
        role:        newRole,
        hospital_id: user.hospital_id,
      })
      // Update locally without refetching
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: newRole } : u
      ))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role.')
    } finally {
      setRoleChanging(null)
    }
  }

  // ─── Create User ──────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axiosInstance.post('/api/superadmin/users/create/', createForm)
      setShowCreateModal(false)
      setCreateForm({ username: '', email: '', password: '', role: 'Doctor', hospital_id: '' })
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Edit User ────────────────────────────────────────────────────────────

  const handleEdit = (user) => {
    setSelectedUser(user)
    setEditForm({
      username:    user.username,
      email:       user.email,
      role:        user.role,
      hospital_id: user.hospital_id || ''
    })
    setError('')
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axiosInstance.patch(`/api/superadmin/users/${selectedUser.id}/edit/`, editForm)
      setShowEditModal(false)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete User ──────────────────────────────────────────────────────────

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete "${user.username}"? This cannot be undone.`)) return
    try {
      await axiosInstance.delete(`/api/superadmin/users/${user.id}/delete/`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.')
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
        <div className="flex items-center gap-2">
          <select
            value={row.role}
            disabled={roleChanging === row.id}
            onChange={(e) => handleRoleChange(row, e.target.value)}
            className={`px-2 py-1 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              row.role === 'Admin'  ? 'bg-purple-50 border-purple-200 text-purple-700' :
              row.role === 'Doctor' ? 'bg-blue-50 border-blue-200 text-blue-700' :
              'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {roleChanging === row.id && (
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )
    },
    {
      key: 'hospital_name', label: 'Hospital',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.hospital_name}</span>
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
    <Layout title="Manage Users">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">All Users</h3>
            <p className="text-sm text-gray-500">
              Manage Admins and Doctors across all hospitals. Change roles directly from the table.
            </p>
          </div>
          <Button onClick={() => { setError(''); setShowCreateModal(true) }} icon="➕">
            Create User
          </Button>
        </div>

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
            {loading ? 'Loading...' : `${users.length} users found`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            data={users}
            loading={loading}
            emptyMessage="No users found."
          />
        </div>

      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input
              required
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              required
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assign to Hospital <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={createForm.hospital_id}
              onChange={(e) => setCreateForm({ ...createForm, hospital_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Hospital --</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit User — ${selectedUser?.username}`}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input
              required
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assign to Hospital</label>
            <select
              value={editForm.hospital_id}
              onChange={(e) => setEditForm({ ...editForm, hospital_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Hospital --</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

    </Layout>
  )
}

export default ManageUsersPage