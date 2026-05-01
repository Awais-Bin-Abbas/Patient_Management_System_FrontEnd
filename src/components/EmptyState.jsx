// src/components/EmptyState.jsx

const EmptyState = ({ message = 'No data found', icon = '📭', action = null }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-gray-500 font-sans text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState