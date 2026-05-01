// src/pages/PatientDetailPage.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Loader from '../components/Loader'
import axiosInstance from '../api/axiosInstance'

const PatientDetailPage = () => {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [patient, setPatient]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    name: '', severity: 'mild', diagnosed_on: '', notes: ''
  })
  const [editForm, setEditForm]     = useState({
    first_name: '', last_name: '', dob: '',
    email: '', contact_info: '', is_chronic: false
  })

  // ─── Fetch Patient ────────────────────────────────────────────────────────

  const fetchPatient = () => {
    setLoading(true)
    axiosInstance.get(`/api/patient/${id}/`)
      .then(res => {
        setPatient(res.data)
        setEditForm({
          first_name:   res.data.first_name,
          last_name:    res.data.last_name,
          dob:          res.data.dob,
          email:        res.data.email,
          contact_info: res.data.contact_info,
          is_chronic:   res.data.is_chronic
        })
      })
      .catch(() => navigate('/patients'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPatient()
  }, [id])

  // ─── Add Condition ────────────────────────────────────────────────────────

  const handleAddCondition = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axiosInstance.post(`/api/patient/${id}/conditions/add/`, form)
      setShowModal(false)
      setForm({ name: '', severity: 'mild', diagnosed_on: '', notes: '' })
      fetchPatient()
    } catch (err) {
      setError(
        err.response?.data?.severity?.[0] ||
        err.response?.data?.error ||
        'Failed to add condition.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Remove Condition ─────────────────────────────────────────────────────

  const handleRemoveCondition = async (conditionId) => {
    if (!window.confirm('Remove this condition?')) return
    try {
      await axiosInstance.delete(
        `/api/patient/${id}/conditions/${conditionId}/remove/`
      )
      fetchPatient()
    } catch {
      alert('Failed to remove condition.')
    }
  }

  // ─── Update Patient ───────────────────────────────────────────────────────

  const handleUpdatePatient = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axiosInstance.patch(`/api/patient/${id}/update/`, editForm)
      setShowEditModal(false)
      fetchPatient()
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.error ||
        'Failed to update patient.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Severity Colors ──────────────────────────────────────────────────────

  const severityColors = {
    mild:     'bg-green-50 text-green-700 border border-green-200',
    moderate: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    severe:   'bg-red-50 text-red-700 border border-red-200',
  }

  if (loading) {
    return (
      <Layout title="Patient Detail">
        <Loader text="Loading patient..." />
      </Layout>
    )
  }

  if (!patient) return null

  return (
    <Layout title="Patient Detail">
      <div className="space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Patients
        </button>

        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 text-xl font-bold">
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {patient.first_name} {patient.last_name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {patient.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={patient.is_chronic ? 'converted' : 'pending'} />
                  {patient.is_chronic && (
                    <span className="text-xs text-orange-500 font-medium">
                      Chronic Patient
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEditModal(true)}
              icon="✏️"
            >
              Edit Patient
            </Button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Age',          value: `${patient.age} years`,  icon: '🎂' },
              { label: 'Date of Birth', value: patient.dob,            icon: '📅' },
              { label: 'Contact',      value: patient.contact_info,    icon: '📞' },
              { label: 'Conditions',   value: patient.conditions?.length ?? 0, icon: '🩺' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{item.icon}</span>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

        </div>

        {/* Conditions Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Medical Conditions
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {patient.conditions?.length || 0} conditions recorded
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon="➕"
            >
              Add Condition
            </Button>
          </div>

          {/* Conditions List */}
          {patient.conditions?.length > 0 ? (
            <div className="space-y-3">
              {patient.conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="flex items-start justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {cond.name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${severityColors[cond.severity]}`}>
                        {cond.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>📅 Diagnosed: {cond.diagnosed_on}</span>
                      {cond.notes && (
                        <span>📝 {cond.notes}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium ml-4 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-5xl mb-3">🩺</p>
              <p className="text-sm font-medium text-gray-500">
                No conditions recorded yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click Add Condition to record a medical condition
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Add Condition Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError('') }}
        title="Add Medical Condition"
        size="md"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAddCondition} className="space-y-4">

          {/* Condition Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Condition Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. diabetes, hypertension"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Severity <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['mild', 'moderate', 'severe'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, severity: s })}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    form.severity === s
                      ? severityColors[s] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosed On */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Diagnosed On <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={form.diagnosed_on}
              onChange={(e) => setForm({ ...form, diagnosed_on: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this condition..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Severity Warning */}
          {form.severity === 'severe' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
              ⚠️ Adding a severe condition will automatically mark this patient as chronic.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => { setShowModal(false); setError('') }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Condition
            </Button>
          </div>

        </form>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setError('') }}
        title="Edit Patient Details"
        size="md"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePatient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input
                required
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                required
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              required
              value={editForm.dob}
              onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Info</label>
            <input
              required
              value={editForm.contact_info}
              onChange={(e) => setEditForm({ ...editForm, contact_info: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="edit_is_chronic"
              checked={editForm.is_chronic}
              onChange={(e) => setEditForm({ ...editForm, is_chronic: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="edit_is_chronic" className="text-sm text-gray-700">Mark as Chronic Patient</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Update Patient</Button>
          </div>
        </form>
      </Modal>

    </Layout>
  )
}

export default PatientDetailPage