import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'

const StaffCriteriaPage = () => {
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(criteria)

  useEffect(() => {
    axiosInstance.get('/api/lead/criteria/list/')
      .then(res => setCriteria(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load criteria. You may not have permission to view this data.'))
      .finally(() => setLoading(false))
  }, [])

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
  ]

  return (
    <Layout title="Lead Criteria">
      <div className="space-y-5">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${criteria.length} criteria rule${criteria.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={paginated}
            loading={loading}
            emptyMessage="No criteria rules found."
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
    </Layout>
  )
}

export default StaffCriteriaPage
