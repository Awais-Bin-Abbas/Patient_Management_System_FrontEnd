// src/pages/ConditionWeightsPage.jsx

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'

const WEIGHT_LABELS = [
  { min: 40, max: 50, label: 'Critical', color: 'text-red-600 bg-red-50' },
  { min: 30, max: 39, label: 'High',     color: 'text-orange-600 bg-orange-50' },
  { min: 15, max: 29, label: 'Medium',   color: 'text-yellow-600 bg-yellow-50' },
  { min: 0,  max: 14, label: 'Low',      color: 'text-gray-500 bg-gray-50' },
]

const getWeightLabel = (weight) => {
  const match = WEIGHT_LABELS.find(l => weight >= l.min && weight <= l.max)
  return match || WEIGHT_LABELS[3]
}

const ConditionWeightsPage = () => {
  const [priorities, setPriorities]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [form, setForm]               = useState({ condition_name: '', weight: 25 })

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(priorities)

  const fetchPriorities = () => {
    setLoading(true)
    axiosInstance.get('/api/lead/priorities/')
      .then(res => setPriorities(res.data))
      .catch(() => setPriorities([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPriorities() }, [])

  const openCreate = () => {
    setEditingItem(null)
    setForm({ condition_name: '', weight: 25 })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ condition_name: item.condition_name, weight: item.weight })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editingItem) {
        await axiosInstance.patch(`/api/lead/priorities/${editingItem.id}/update/`, form)
      } else {
        await axiosInstance.post('/api/lead/priorities/create/', form)
      }
      setShowModal(false)
      fetchPriorities()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.condition_name?.[0] || 'Failed to save.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete priority for "${item.condition_name}"?`)) return
    try {
      await axiosInstance.delete(`/api/lead/priorities/${item.id}/delete/`)
      setPriorities(prev => prev.filter(p => p.id !== item.id))
    } catch {
      alert('Failed to delete.')
    }
  }

  return (
    <Layout title="Condition Priority Weights">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Condition Priority Weights</h3>
            <p className="text-sm text-gray-500">
              Set how urgently each medical condition should be prioritized in lead scoring (0–50 points).
            </p>
          </div>
          <Button onClick={openCreate} icon="➕">Add Condition</Button>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Weight Scale</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WEIGHT_LABELS.map(l => (
              <div key={l.label} className={`rounded-lg px-3 py-2 ${l.color}`}>
                <p className="text-xs font-bold">{l.label}</p>
                <p className="text-[10px] mt-0.5">Weight {l.min}–{l.max}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Conditions not listed here will receive a default weight of 25 (Medium).
          </p>
        </div>

        {/* Condition List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : priorities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-4xl mb-2">⚕️</p>
            <p className="text-sm text-gray-400">No condition weights configured yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add conditions to customize lead priority scoring.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {paginated.map(item => {
                const label = getWeightLabel(item.weight)
                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                        🩺
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.condition_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-24 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(item.weight / 50) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{item.weight}/50</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${label.color}`}>
                            {label.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? `Edit — ${editingItem.condition_name}` : 'Add Condition Priority'}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Condition Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.condition_name}
              onChange={(e) => setForm({ ...form, condition_name: e.target.value })}
              placeholder="e.g. Heart Disease, Diabetes, Cancer..."
              disabled={!!editingItem}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">
                Priority Weight: <strong>{form.weight}</strong>/50
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getWeightLabel(form.weight).color}`}>
                {getWeightLabel(form.weight).label}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0 — Low</span>
              <span>25 — Medium</span>
              <span>50 — Critical</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              {editingItem ? 'Save Changes' : 'Add Condition'}
            </Button>
          </div>
        </form>
      </Modal>

    </Layout>
  )
}

export default ConditionWeightsPage