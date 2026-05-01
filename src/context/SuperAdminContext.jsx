import { createContext, useContext, useState } from 'react'

const SuperAdminContext = createContext(null)

export const SuperAdminProvider = ({ children }) => {
  const [selectedHospital, setSelectedHospital] = useState(() => {
    // Rehydrate from localStorage on page load
    try {
      const saved = localStorage.getItem('selected_hospital')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const selectHospital = (hospital) => {
    setSelectedHospital(hospital)
    localStorage.setItem('selected_hospital', JSON.stringify(hospital))
  }

  const clearHospital = () => {
    setSelectedHospital(null)
    localStorage.removeItem('selected_hospital')
  }

  return (
    <SuperAdminContext.Provider value={{ selectedHospital, selectHospital, clearHospital }}>
      {children}
    </SuperAdminContext.Provider>
  )
}

export const useSuperAdmin = () => useContext(SuperAdminContext)