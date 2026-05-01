// src/utils/auth.js

import { jwtDecode } from 'jwt-decode'

export const saveTokens = (access, refresh, user = null) => {
  console.log('localStorage.setItem access_token:', access ? 'present' : 'missing')
  localStorage.setItem('access_token', access)
  console.log('localStorage.setItem refresh_token:', refresh ? 'present' : 'missing')
  localStorage.setItem('refresh_token', refresh)
  if (user) {
    console.log('localStorage.setItem user_data:', user)
    localStorage.setItem('user_data', JSON.stringify(user))
  }
}

export const getAccessToken  = () => localStorage.getItem('access_token')
export const getRefreshToken = () => localStorage.getItem('refresh_token')

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('selected_hospital')
  localStorage.removeItem('user_data')
}

export const getUser = () => {
  const saved = localStorage.getItem('user_data')
  if (saved) {
    try { return JSON.parse(saved) }
    catch { return null }
  }
  const token = getAccessToken()
  if (!token) return null
  try { return jwtDecode(token) }
  catch { return null }
}

export const isAuthenticated = () => {
  const token = getAccessToken()
  if (!token) return false
  try {
    const decoded = jwtDecode(token)
    return decoded.exp * 1000 > Date.now()
  } catch { return false }
}

export const getUserRole = () => getUser()?.role || null
export const isAdmin     = () => getUserRole() === 'Admin'
export const isDoctor    = () => getUserRole() === 'Doctor'