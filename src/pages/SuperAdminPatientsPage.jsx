// src/pages/SuperAdminPatientsPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import axiosInstance from '../api/axiosInstance'
import { useSuperAdmin } from '../context/SuperAdminContext'

const PAGE_SIZE = 20

const SuperAdminPatientsPage = () => {
  const { selectHospital }            = useSuperAdmin()
  const navigate                      = useNavigate()
  const [patients, setPatients]       = useState([])
  const [hospitals, setHospitals]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [search, setSearch]           = useState('')
  const [chronicFilter, setChronicFilter]   = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [totalItems, setTotalItems]   = useState(0)

  const fetchPatients = (page) => {
    setLoading(true)
    const params = new URLSearchParams({ page })
    if (search)        params.append('search',      search)
    if (hospitalFilter) params.append('hospital_id', hospitalFilter)
    if (chronicFilter !== '') params.append('is_chronic', chronicFilter)

    axiosInstance.get(`/api/superadmin/all-patients/?${params}`)
      .then(res => {
        const data = res.data
        if (data.results !== undefined) {
          setPatients(data.results)
          setTotalPages(data.total_pages ?? Math.ceil((data.count ?? 0) / PAGE_SIZE))
          setTotalItems(data.count ?? data.total_items ?? data.results.length)
        } else {
          // plain array fallback (non-paginated API)
          setPatients(Array.isArray(data) ? data : [])
          setTotalPages(1)
          setTotalItems(Array.isArray(data) ? data.length : 0)
        }
      })
      .catch(() => setError('Failed to load patients.'))
      .finally(() => setLoading(false))
  }

  const fetchHospitals = () => {
    axiosInstance.get('/api/superadmin/hospitals/')
      .then(res => setHospitals(res.data))
      .catch(() => {})
  }

  // Re-fetch when page changes
  useEffect(() => {
    fetchPatients(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  // Reset to page 1 and re-fetch when filters change
  useEffect(() => {
    if (currentPage === 1) {
      fetchPatients(1)
    } else {
      setCurrentPage(1) // triggers the above effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, hospitalFilter, chronicFilter])

  useEffect(() => {
    fetchHospitals()
  }, [])

  // ─── Manage Hospital ──────────────────────────────────────────────────────

  const handleManageHospital = (patient) => {
    selectHospital({ id: patient.hospital_id, name: patient.hospital_name })
    navigate('/patients')
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
      key: 'hospital_name', label: 'Hospital',
      render: (row) => (
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
          {row.hospital_name}
        </span>
      )
    },
    {
      key: 'age', label: 'Age',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.age ?? '—'} yrs</span>
      )
    },
    {
      key: 'contact_info', label: 'Contact',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.contact_info || '—'}</span>
      )
    },
    {
      key: 'is_chronic', label: 'Status',
      render: (row) => (
        <Badge status={row.is_chronic ? 'chronic' : 'pending'} />
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
        <button
          onClick={() => handleManageHospital(row)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Manage →
        </button>
      )
    }
  ]

  return (
    <Layout title="Global Patients">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">All Patients</h3>
            <p className="text-sm text-gray-500">View patients across all hospitals</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          />
          <label className="text-xs font-medium text-gray-500">Hospital:</label>
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
          <label className="text-xs font-medium text-gray-500">Status:</label>
          <select
            value={chronicFilter}
            onChange={(e) => setChronicFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Patients</option>
            <option value="true">Chronic Only</option>
            <option value="false">Non-Chronic</option>
          </select>
          {(hospitalFilter || chronicFilter || search) && (
            <button
              onClick={() => { setHospitalFilter(''); setChronicFilter(''); setSearch('') }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {loading ? 'Loading...' : `${totalItems} patients found`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <Table
            columns={columns}
            data={patients}
            loading={loading}
            emptyMessage="No patients found."
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
          />
        </div>

      </div>
    </Layout>
  )
}

export default SuperAdminPatientsPage
