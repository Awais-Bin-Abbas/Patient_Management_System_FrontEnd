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
    // Skip only for pure auth operations — NOT for user-listing endpoints under /api/auth/
    const SKIP_HOSPITAL_HEADER = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/token/',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/mfa/',
    ]
    const isAuthRequest = SKIP_HOSPITAL_HEADER.some(ep => config.url?.includes(ep))
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
        // Save new refresh token too — backends with ROTATE_REFRESH_TOKENS blacklist the old one
        const newRefreshToken = response.data.refresh || refreshToken
        saveTokens(newAccessToken, newRefreshToken)

        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        // await the retry so isRefreshing stays true until it completes,
        // preventing concurrent requests from starting a second refresh cycle
        return await axiosInstance(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        localStorage.removeItem('selected_hospital')
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