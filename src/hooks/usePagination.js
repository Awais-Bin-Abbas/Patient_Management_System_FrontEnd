// src/hooks/usePagination.js

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const usePagination = (data = [], overridePageSize = null) => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SuperAdmin'

  const pageSize    = overridePageSize ?? (isSuperAdmin ? 20 : 10)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 whenever data changes (e.g. after filter)
  useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  const totalPages  = Math.max(1, Math.ceil(data.length / pageSize))
  const paginated   = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, currentPage, pageSize])

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  return {
    paginated,
    currentPage,
    totalPages,
    totalItems: data.length,
    pageSize,
    goToPage,
  }
}

export default usePagination