import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const NoHospitalPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/hospitals/public/');
        setHospitals(response.data);
      } catch (err) {
        setError('Error fetching hospitals: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const handleAssign = async () => {
    if (!selectedHospital) return;
    setAssigning(true);
    setError(null);
    try {
      await axiosInstance.patch('/api/auth/profile/assign-hospital/', {
        hospital_id: selectedHospital
      });
      // Force reload to let AuthContext fetch updated profile and redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign hospital');
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        {loading ? (
          <div className="text-center text-gray-500">Loading hospitals...</div>
        ) : error ? (
          <div className="text-red-500 text-center mb-4">{error}</div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">🏥</p>
            <p className="text-sm font-medium text-gray-600">
              No hospitals found in the system.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              An admin needs to create a hospital first.
            </p>
            <a
              href="http://127.0.0.1:8000/admin"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-500 underline mt-3 inline-block"
            >
              Open Django Admin
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl mb-3">🏥</p>
              <h2 className="text-lg font-bold text-gray-800">Welcome to PSS!</h2>
              <p className="text-sm text-gray-500 mt-1">
                You need to join a hospital to continue.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Hospital
              </label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>-- Choose a hospital --</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} - {h.address}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssign}
              disabled={!selectedHospital || assigning}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {assigning ? 'Assigning...' : 'Join Hospital'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoHospitalPage;