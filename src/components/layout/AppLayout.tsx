import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-xl font-bold text-white">NodePad</Link>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/dashboard"
              className={`transition-colors ${location.pathname === '/dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Workspaces
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
