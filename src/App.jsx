// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SuperAdminProvider } from './context/SuperAdminContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth Pages
import LoginPage          from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import MFASetupPage       from './pages/MFASetupPage'
import NoHospitalPage     from './pages/NoHospitalPage'

// App Pages
import DashboardPage      from './pages/DashboardPage'
import PatientsPage       from './pages/PatientsPage'
import PatientDetailPage  from './pages/PatientDetailPage'
import LeadsPage          from './pages/LeadsPage'
import LeadCriteriaPage   from './pages/LeadCriteriaPage'
import ReportsPage        from './pages/ReportsPage'
import HospitalPage       from './pages/HospitalPage'
import StaffPage          from './pages/StaffPage'

// SuperAdmin Pages
import SuperAdminHospitalsPage from './pages/SuperAdminHospitalsPage'
import SuperAdminLeadsPage     from './pages/SuperAdminLeadsPage'
import ManageUsersPage         from './pages/ManageUsersPage'
import SuperAdminReportsPage   from './pages/SuperAdminReportsPage'
import SuperAdminCriteriaPage  from './pages/SuperAdminCriteriaPage'
import SuperAdminPatientsPage from './pages/SuperAdminPatientsPage'
import DoctorReportsPage        from './pages/DoctorReportsPage'
import StaffPatientsPage        from './pages/StaffPatientsPage'
import StaffPatientDetailPage   from './pages/StaffPatientDetailPage'
import StaffLeadsPage           from './pages/StaffLeadsPage'
import StaffReportsPage         from './pages/StaffReportsPage'
import StaffCriteriaPage        from './pages/StaffCriteriaPage'


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SuperAdminProvider>
          <Routes>

            {/* Public Routes */}
            <Route path="/login"                      element={<LoginPage />} />
            <Route path="/forgot-password"            element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

            {/* Onboarding */}
            <Route path="/no-hospital" element={
              <ProtectedRoute>
                <NoHospitalPage />
              </ProtectedRoute>
            } />
            <Route path="/mfa-setup" element={
              <ProtectedRoute>
                <MFASetupPage />
              </ProtectedRoute>
            } />

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard — all roles */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            {/* SuperAdmin — Hospitals page */}
            <Route path="/hospitals" element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <SuperAdminHospitalsPage />
              </ProtectedRoute>
            } />

            {/* Patients */}
            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Doctor']}>
                <PatientsPage />
              </ProtectedRoute>
            } />
            <Route path="/patients/:id" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Doctor']}>
                <PatientDetailPage />
              </ProtectedRoute>
            } />

            {/* Leads */}
            <Route path="/leads" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Doctor']}>
                <LeadsPage />
              </ProtectedRoute>
            } />

            {/* Doctor — My Reports */}
            <Route path="/my-reports" element={
              <ProtectedRoute allowedRoles={['Doctor']}>
                <DoctorReportsPage />
              </ProtectedRoute>
            } />

            {/* Admin + SuperAdmin only */}
            <Route path="/criteria" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
                <LeadCriteriaPage />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/hospital" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
                <HospitalPage />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
                <StaffPage />
              </ProtectedRoute>
            } />

            {/* SuperAdmin Global Management */}
            <Route path="/manage-users" element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <ManageUsersPage />
              </ProtectedRoute>
            } />
            <Route path="/global-reports" element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <SuperAdminReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/global-leads" element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <SuperAdminLeadsPage />
              </ProtectedRoute>
            } />
            <Route path="/global-criteria" element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <SuperAdminCriteriaPage />
              </ProtectedRoute>
            } />

            <Route path="/global-patients" element={
              <ProtectedRoute allowedRoles={['SuperAdmin']}>
                <SuperAdminPatientsPage />
              </ProtectedRoute>
            } />

            {/* Staff — restricted read-only pages */}
            <Route path="/staff/patients" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffPatientsPage />
              </ProtectedRoute>
            } />
            <Route path="/staff/patients/:id" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffPatientDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/staff/leads" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffLeadsPage />
              </ProtectedRoute>
            } />
            <Route path="/staff/reports" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/staff/criteria" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffCriteriaPage />
              </ProtectedRoute>
            } />

            {/* Catch all — must be LAST */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </SuperAdminProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App