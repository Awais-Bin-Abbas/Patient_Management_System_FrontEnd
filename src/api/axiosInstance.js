// src/api/axiosInstance.js

import axios from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens
} from '../utils/auth'

// Base URL from .env — falls back to 127.0.0.1 (NOT localhost — IPv6 issues on Windows)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'

// Create configured Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // If a hospital is selected (for SuperAdmin flow), attach it to headers
    // Skip this for auth endpoints to avoid preflight/context issues
    const isAuthRequest = config.url?.includes('/api/auth/')
    const savedHospital = localStorage.getItem('selected_hospital')

    if (!isAuthRequest && savedHospital) {
      try {
        const hospital = JSON.parse(savedHospital)
        if (hospital?.id) {
          config.headers['X-Hospital-Id'] = hospital.id
        }
      } catch (e) {
        // Silently ignore parse errors
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Never try to refresh for login or refresh endpoints themselves
    const skipRefresh =
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/token/refresh')

    if (error.response?.status === 401) {
      console.warn('[axiosInstance] 401 received for:', originalRequest.url, '| skipRefresh:', skipRefresh, '| _retry:', !!originalRequest._retry)
    }

    if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
      // If already refreshing, queue this request to retry after refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')

        // Use raw axios for refresh to avoid interceptor loop
        const response = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken
        })

        const newAccessToken = response.data.access
        saveTokens(newAccessToken, refreshToken)

        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        console.error('[axiosInstance] Token refresh failed — clearing session. Original request:', originalRequest.url)
        processQueue(refreshError, null)
        clearTokens()
        localStorage.removeItem('selected_hospital')
        
        // ONLY redirect if we aren't already on the login page to avoid infinite reload loop
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance