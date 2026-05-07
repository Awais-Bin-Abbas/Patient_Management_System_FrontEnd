import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import Loader from '../components/Loader'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import axiosInstance from '../api/axiosInstance'

const StaffReportsPage = () => {
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [reportData, setReportData] = useState(null)
  const [activeId, setActiveId]   = useState(null)
  const [error, setError]         = useState('')

  const { paginated, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(history)

  const fetchHistory = useCallback(() => {
    axiosInstance.get('/api/reports/history/')
      .then(res => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load reports. You may not have permission to view this data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleViewReport = async (id) => {
    setReportData(null)
    setError('')
    setActiveId(id)
    try {
      const res = await axiosInstance.get(`/api/reports/${id}/result/`)
      setReportData(res.data.data)
    } catch {
      setError('Could not load report data.')
    }
  }

  return (
    <Layout title="Reports">
      <div className="space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-blue-500 text-sm">🔒</span>
          <p className="text-xs text-blue-600">
            You can view existing reports. Report generation and deletion are restricted to administrators.
          </p>
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-800">Report Results</h3>
              <span className="text-xs text-gray-400">— {reportData.hospital}</span>
              <button
                onClick={() => { setReportData(null); setActiveId(null) }}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >
                ✕ Close
              </button>
            </div>

            {/* Patient Stats */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">👤 Patient Statistics</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Total Patients',   value: reportData.patients?.total },
                  { label: 'Chronic Patients', value: reportData.patients?.chronic },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{item.value ?? 0}</p>
                  </div>
                ))}
              </div>

              {reportData.patients?.by_condition?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Patients by Condition
                  </p>
                  <div className="space-y-2">
                    {reportData.patients.by_condition.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-teal-400" />
                          <span className="text-sm text-gray-600 capitalize">
                            {item.conditions__name || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.patients?.by_severity?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Patients by Severity
                  </p>
                  <div className="space-y-2">
                    {reportData.patients.by_severity.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <span className="text-sm text-gray-600 capitalize">
                            {item.conditions__severity || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lead Stats */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">🎯 Lead Statistics</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Total Leads',     value: reportData.leads?.total },
                  { label: 'This Month',       value: reportData.leads?.this_month },
                  { label: 'Appointed',        value: reportData.leads?.appointed },
                  { label: 'Appointment Rate', value: reportData.leads?.appointment_rate },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{item.value ?? 0}</p>
                  </div>
                ))}
              </div>

              {reportData.leads?.by_status?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Leads by Status
                  </p>
                  <div className="space-y-2">
                    {reportData.leads.by_status.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Badge status={item.status} />
                        <span className="text-sm font-semibold text-gray-800">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report History */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Report History</h3>

          {loading ? (
            <Loader />
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm text-gray-400">No reports available yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map((report) => (
                <div
                  key={report.id}
                  className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
                    activeId === report.id
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge status={report.status} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Report #{report.id}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.created_at).toLocaleString()}
                        {report.completed_at && (
                          <span className="ml-2 text-green-500">
                            Completed {new Date(report.completed_at).toLocaleTimeString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {report.status === 'complete' && (
                    <button
                      onClick={() => handleViewReport(report.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {activeId === report.id ? 'Viewing' : 'View Results'}
                    </button>
                  )}
                </div>
              ))}

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

      </div>
    </Layout>
  )
}

export default StaffReportsPage
