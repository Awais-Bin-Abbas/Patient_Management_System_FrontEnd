import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'

const StaffPatientsPage = () => {
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [serverTotal, setServerTotal] = useState(0)
  const [search, setSearch]     = useState('')

  const fetchPatients = useCallback((page = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.append('page', page)
    if (search) params.append('search', search)
    axiosInstance.get(`/api/patient/list/?${params.toString()}`)
      .then(res => {
        if (res.data.results) {
          setPatients(res.data.results)
          setServerTotal(res.data.count)
        } else {
          setPatients(res.data)
          setServerTotal(res.data.length)
        }
      })
      .catch(() => {
        setPatients([])
        setServerTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search])

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(patients, {
    isServerSide: true,
    totalItems: serverTotal
  })

  useEffect(() => {
    fetchPatients(currentPage)
  }, [fetchPatients, currentPage])

  const columns = [
    {
      key: 'name', label: 'Patient Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <span className="text-sm font-medium text-gray-800">
            {row.first_name} {row.last_name}
          </span>
        </div>
      )
    },
    {
      key: 'is_chronic', label: 'Patient Type',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.is_chronic
            ? 'bg-orange-100 text-orange-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {row.is_chronic ? 'Chronic' : 'Non-Chronic'}
        </span>
      )
    },
    {
      key: 'actions', label: '',
      render: (row) => (
        <button
          onClick={() => navigate(`/staff/patients/${row.id}`)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          View Conditions →
        </button>
      )
    },
  ]

  return (
    <Layout title="Patients">
      <div className="space-y-4">

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {loading ? 'Loading...' : `${totalItems} patient${totalItems !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={paginated}
            loading={loading}
            emptyMessage="No patients found."
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

export default StaffPatientsPage
