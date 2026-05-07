import { createContext, useContext, useState, useEffect } from 'react'
import {
  saveTokens,
  clearTokens,
  isAuthenticated,
  getUser,
  getAccessToken,
  getRefreshToken
} from '../utils/auth'
import axiosInstance from '../api/axiosInstance'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => getUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (isAuthenticated()) {
        // Access token present and valid — fetch fresh profile
        try {
          const res = await axiosInstance.get('/api/auth/profile/')
          setUser(res.data)
          localStorage.setItem('user_data', JSON.stringify(res.data))
        } catch {
          clearTokens()
          setUser(null)
        } finally {
          setLoading(false)
        }
        return
      }

      // Access token missing or expired — try the refresh token before signing out
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        setLoading(false)
        return
      }

      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'
        const res = await axios.post(`${baseUrl}/api/auth/token/refresh/`, {
          refresh: refreshToken
        })
        const newAccess  = res.data.access
        const newRefresh = res.data.refresh || refreshToken
        saveTokens(newAccess, newRefresh)

        // Fetch profile with the new access token
        const profile = await axiosInstance.get('/api/auth/profile/')
        setUser(profile.data)
        localStorage.setItem('user_data', JSON.stringify(profile.data))
      } catch {
        clearTokens()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const login = async (username, password, otp = null) => {
    setLoading(true)
    try {
      const payload = { username, password }
      if (otp) payload.otp = otp

      localStorage.removeItem('selected_hospital')

      const baseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'
      const response = await axios.post(`${baseUrl}/api/auth/login/`, payload)
      
      console.log('Login response data:', response.data)
      const { access, refresh, user: userData } = response.data

      console.log('Saving tokens...', { access: !!access, refresh: !!refresh })
      saveTokens(access, refresh, userData)
      
      const savedAccess = localStorage.getItem('access_token')
      console.log('Immediate verification - access_token in localStorage:', savedAccess ? 'present' : 'missing')
      
      setUser(userData)
      return userData
    } catch (err) {
      console.error('Login error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const refresh = getRefreshToken()
      if (refresh) {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'
        await axios.post(`${baseUrl}/api/auth/logout/`, { refresh }, {
          headers: { Authorization: `Bearer ${getAccessToken()}` }
        })
      }
    } catch {
      // Continue even if API fails
    } finally {
      clearTokens()
      setUser(null)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)