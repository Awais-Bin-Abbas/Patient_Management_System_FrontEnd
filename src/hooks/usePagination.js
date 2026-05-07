// src/hooks/usePagination.js

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const usePagination = (data = [], options = {}) => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SuperAdmin'

  // options can be a number (pageSize) or an object
  const config = typeof options === 'number' ? { pageSize: options } : options
  
  const pageSize    = config.pageSize ?? (isSuperAdmin ? 20 : 10)
  const isServerSide = config.isServerSide ?? false
  const serverTotal = config.totalItems ?? 0

  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 whenever data source changes (unless it's just a page update)
  useEffect(() => {
    if (!isServerSide) {
      setCurrentPage(1)
    }
  }, [data.length, isServerSide])

  const totalItems = isServerSide ? serverTotal : data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const paginated = useMemo(() => {
    if (isServerSide) return data // Data is already sliced by the server
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, currentPage, pageSize, isServerSide])

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      if (config.onPageChange) config.onPageChange(page)
    }
  }

  return {
    paginated,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    setCurrentPage // Allow manual control if needed
  }
}

export default usePagination