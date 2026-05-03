// src/components/Sidebar.jsx

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSuperAdmin } from '../context/SuperAdminContext'

const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/dashboard', roles: ['SuperAdmin', 'Admin', 'Doctor', 'Staff'] },
  { label: 'Patients',      path: '/patients',  roles: ['SuperAdmin', 'Admin', 'Doctor'] },
  { label: 'Leads',         path: '/leads',     roles: ['SuperAdmin', 'Admin', 'Doctor'] },
  { label: 'Lead Criteria', path: '/criteria',  roles: ['SuperAdmin', 'Admin'] },
  { label: 'Reports',       path: '/reports',   roles: ['SuperAdmin', 'Admin'] },
  { label: 'Hospital',      path: '/hospital',  roles: ['SuperAdmin', 'Admin'] },
  { label: 'Staff',         path: '/staff',     roles: ['SuperAdmin', 'Admin'] },
]

const SUPERADMIN_ITEMS = [
  { label: 'All Hospitals', path: '/hospitals' },
  { label: 'All Leads',     path: '/global-leads' },
  { label: 'All Patients',  path: '/global-patients' },
  { label: 'All Criteria',  path: '/global-criteria' },
  { label: 'All Reports',   path: '/global-reports' },
  { label: 'Manage Users',  path: '/manage-users' },
]

const HOSPITAL_MGMT_ITEMS = [
  { label: 'Patients',      path: '/patients' },
  { label: 'Leads',         path: '/leads' },
  { label: 'Lead Criteria', path: '/criteria' },
  { label: 'Reports',       path: '/reports' },
  { label: 'Hospital',      path: '/hospital' },
  { label: 'Staff',         path: '/staff' },
]

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`

const Sidebar = () => {
  const { user, logout }                    = useAuth()
  const { selectedHospital, clearHospital } = useSuperAdmin()
  const navigate                            = useNavigate()
  const role                                = user?.role

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  const handleClearHospital = () => {
    clearHospital()
    navigate('/hospitals')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-gray-100 flex flex-col z-10">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-blue-600">PSS</span>
        <span className="text-lg font-semibold text-gray-700"> Portal</span>
      </div>

      {/* Hospital context indicator (SuperAdmin only) */}
      {role === 'SuperAdmin' && selectedHospital && (
        <div className="mx-4 mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-xs text-blue-500 font-medium">Managing hospital</p>
              <p className="text-sm text-blue-700 font-semibold truncate">{selectedHospital.name}</p>
            </div>
            <button
              onClick={handleClearHospital}
              title="Back to all hospitals"
              className="flex-shrink-0 text-xs text-blue-400 hover:text-red-500 transition-colors mt-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map(item => (
            <li key={item.path}>
              <NavLink to={item.path} className={linkClass}>{item.label}</NavLink>
            </li>
          ))}
        </ul>

        {/* Hospital management pages — shown when SuperAdmin has a hospital selected */}
        {role === 'SuperAdmin' && selectedHospital && (
          <>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {selectedHospital.name}
            </p>
            <ul className="space-y-1">
              {HOSPITAL_MGMT_ITEMS.map(item => (
                <li key={item.path}>
                  <NavLink to={item.path} className={linkClass}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Global SuperAdmin pages */}
        {role === 'SuperAdmin' && (
          <>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Super Admin
            </p>
            <ul className="space-y-1">
              {SUPERADMIN_ITEMS.map(item => (
                <li key={item.path}>
                  <NavLink to={item.path} className={linkClass}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* MFA Setup — above sign out */}
      <div className="px-3 pb-2 border-t border-gray-100 pt-3">
        <NavLink to="/mfa-setup" className={linkClass}>
          🔐 MFA Setup
        </NavLink>
      </div>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.username}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
        <button
          onClick={logout}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>

    </aside>
  )
}

export default Sidebar