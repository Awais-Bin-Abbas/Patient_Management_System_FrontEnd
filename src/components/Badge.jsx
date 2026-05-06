const Badge = ({ status }) => {
  const colors = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-orange-100 text-orange-700',
    complete: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    Admin: 'bg-blue-100 text-blue-700',
    Doctor: 'bg-teal-100 text-teal-700',
    Staff: 'bg-indigo-100 text-indigo-700',
  }

  return (
    <span className={`${colors[status] || 'bg-gray-100 text-gray-600'} px-2.5 py-0.5 rounded-full text-xs font-medium capitalize`}>
      {status === 'converted' ? 'Appointed' : status}
    </span>
  )
}

export default Badge