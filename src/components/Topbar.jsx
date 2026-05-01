import { useAuth } from '../context/AuthContext'
import Badge from './Badge'

const Topbar = ({ title }) => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        <Badge status={user?.role} />
        <span className="text-sm font-medium text-gray-700">{user?.username}</span>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Sign out
        </button>
      </div>
    </header>
  )
}

export default Topbar