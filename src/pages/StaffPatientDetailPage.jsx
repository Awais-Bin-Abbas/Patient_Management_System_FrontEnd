import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import axiosInstance from '../api/axiosInstance'

const SEVERITY_STYLES = {
  mild:     'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe:   'bg-red-100 text-red-700',
}

const StaffPatientDetailPage = () => {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    setLoading(true)
    axiosInstance.get(`/api/patient/${id}/`)
      .then(res => setPatient(res.data))
      .catch(() => setError('Failed to load patient details.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <Layout title="Patient Details">
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  if (error || !patient) return (
    <Layout title="Patient Details">
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
        {error || 'Patient not found.'}
      </div>
    </Layout>
  )

  const conditions = patient.conditions || []

  return (
    <Layout title="Patient Details">
      <div className="space-y-5 max-w-2xl">

        <button
          onClick={() => navigate('/staff/patients')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Patients
        </button>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-blue-500 text-sm">🔒</span>
          <p className="text-xs text-blue-600">
            Contact information and personal details are restricted for privacy.
          </p>
        </div>

        {/* Patient header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-lg font-bold flex-shrink-0">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {patient.first_name} {patient.last_name}
              </h2>
              <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                patient.is_chronic
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {patient.is_chronic ? 'Chronic Patient' : 'Non-Chronic Patient'}
              </span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Medical Conditions
            </h3>
            <span className="text-xs text-gray-400">
              {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {conditions.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <p className="text-3xl mb-2">🩺</p>
              <p className="text-sm text-gray-400">No conditions recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conditions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{c.name}</p>
                    {c.diagnosed_on && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Diagnosed: {new Date(c.diagnosed_on).toLocaleDateString()}
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-xs text-gray-500 mt-1">{c.notes}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ml-3 ${
                    SEVERITY_STYLES[c.severity] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.severity || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default StaffPatientDetailPage
