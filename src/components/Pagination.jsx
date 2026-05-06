// src/components/Pagination.jsx

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i)
    } else if (
      i === currentPage - delta - 1 ||
      i === currentPage + delta + 1
    ) {
      pages.push('...')
    }
  }

  // Deduplicate ellipsis
  const deduplicated = pages.filter((p, i) => !(p === '...' && pages[i - 1] === '...'))

  const start = (currentPage - 1) * pageSize + 1
  const end   = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Showing <span className="font-medium text-gray-600">{start}–{end}</span> of{' '}
        <span className="font-medium text-gray-600">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        {deduplicated.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}

export default Pagination